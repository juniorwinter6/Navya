require("dotenv").config(); // Loaded at the very top so process.env is ready

const path = require('path');
const fs = require("fs-extra");
const express = require("express");
const pino = require("pino");
const QRCode = require("qrcode-terminal");
const { GoogleGenAI } = require("@google/genai");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} = require("@whiskeysockets/baileys");

// Custom Utilities & Schedulers
const { startQuoteScheduler } = require('./utils/quoteScheduler');
const { scanIncomingMedia } = require('./utils/nsfwScanner');
//const pairRouter = require("./server");
const config = require('./config');

// Keep track of the scheduler state outside the connection listener
let isSchedulerRunning = false;

// Config Globals
global.PREFIX = config.PREFIX;
global.OWNERS = config.OWNERS;

// Initialize Gemini SDK safely
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Global anti-spam storage cache (In-Memory for rolling windows)
global.spamTrackingMap = new Map();

const deletedMessages = {};
// Express HTTP Health Check Server for Koyeb


// ======================
// WEB SERVER SETUP (Serves Pairing UI + Health Check)

// ======================
// HELPERS
// ======================
function loadJSON(pathStr, fallback = {}) {
    try {
        if (!fs.existsSync(pathStr)) return fallback;
        return JSON.parse(fs.readFileSync(pathStr, "utf8"));
    } catch {
        return fallback;
    }
}

function saveJSON(pathStr, data) {
    try {
        fs.writeFileSync(pathStr, JSON.stringify(data, null, 2));
    } catch (err) {
        console.log(`Error saving JSON to ${pathStr}:`, err);
    }
}

function getSender(m) {
    const rawId = m.key.participant || m.key.remoteJid || "";
    return rawId.split("@")[0].split(":")[0];
}

// ======================
// START BOT
// ======================
// =================================
// 🌐 1. EXPRESS HEALTH CHECK SERVER
// =================================
const app = express();
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
    res.status(200).send("NAVYA BOT is running smoothly!");
});

const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Health check server active on port ${PORT}`);
});

// Fallback error handler for local EADDRINUSE conflicts
server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.log(`⚠️ Port ${PORT} is currently in use. Trying port 8081...`);
        app.listen(8081, "0.0.0.0", () => {
            console.log(`🌐 Health check server active on fallback port 8081`);
        });
    } else {
        console.error("Server error:", err);
    }
});


// =================================
// 🔐 2. SESSION RESTORER HELPER
// =================================
async function initSession() {
    const sessionDir = path.join(__dirname, "session");

    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    const credsPath = path.join(sessionDir, "creds.json");

    // Only restore if creds.json doesn't exist and SESSION_ID is available
    if (!fs.existsSync(credsPath) && process.env.SESSION_ID) {
        try {
            console.log("🔐 Restoring WhatsApp session from SESSION_ID...");

            let base64Data = process.env.SESSION_ID;
            if (base64Data.includes("~")) {
                base64Data = base64Data.split("~")[1];
            }

            const sessionData = Buffer.from(base64Data, "base64").toString("utf-8");
            fs.writeFileSync(credsPath, sessionData);
            console.log("✅ Session restored successfully!");
        } catch (err) {
            console.error("❌ Failed to restore session from SESSION_ID:", err.message);
        }
    }
}


// =================================
// 🚀 3. START BOT
// =================================
async function startBot() {
    // Reconstruct creds.json BEFORE Baileys loads the auth state
    await initSession();

    const sessionDir = path.join(__dirname, "session");
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    let version = [2, 3000, 1015901307];
    try {
        const { version: latestVersion } = await fetchLatestBaileysVersion();
        version = latestVersion;
    } catch (e) { }

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu("Chrome"),
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        syncFullHistory: false
    });

    sock.ev.on("creds.update", saveCreds);

    // Only prompt for pairing code if STILL not registered (i.e. SESSION_ID was missing or invalid)
    if (!sock.authState.creds.registered) {
        const phoneNumber = "2348115336615";

        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

                console.log("\n=================================");
                console.log(`📱 WHATSAPP PAIRING CODE: ${formattedCode}`);
                console.log("=================================\n");
            } catch (err) {
                console.error("❌ Error requesting pairing code:", err.message);
            }
        }, 3000);
    }

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("✅ NAVYA CONNECTED SUCCESSFULLY!");

            if (!isSchedulerRunning) {
                startQuoteScheduler(sock);
                isSchedulerRunning = true;
            }
        }

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`❌ CONNECTION CLOSED (Reason Code: ${statusCode || 'Unknown'})`);

            if (shouldReconnect) {
                setTimeout(() => startBot(), 3000);
            } else {
                isSchedulerRunning = false;
                console.log("⚠️ Session logged out permanently. Delete the /session folder or clear SESSION_ID to pair again.");
            }
        }
    });



    // ======================
    // ANTICALL SYSTEM
    // ======================
    const activeCalls = new Set();

    sock.ev.on("call", async (calls) => {
        try {
            const db = loadJSON("./lib/anticall.json");

            for (const call of calls) {
                const caller = call.from;
                if (activeCalls.has(caller)) return;

                activeCalls.add(caller);
                setTimeout(() => activeCalls.delete(caller), 10000);

                try {
                    await sock.rejectCall(call.id, caller);
                } catch { }

                db[caller] = db[caller] || { warns: 0 };
                db[caller].warns++;

                if (db[caller].warns < 2) {
                    await sock.sendMessage(caller, {
                        text: `╭━━〔 🚫 𝐍𝐀𝐕𝐘𝐀 𝐀𝐍𝐓𝐈𝐂𝐀𝐋𝐋 〕━━╮\n\n⚠️ Do not call me!\n\n📛 Warning:\n${db[caller].warns}/2\n\n🚷 Repeated calls will lead to automatic block.\n\n╰━━━━━━━━━━━━━━╯`
                    });
                } else {
                    await sock.sendMessage(caller, { text: "🚫 Blocked for calling bot" });
                    await sock.updateBlockStatus(caller, "block");
                    delete db[caller];
                }
                saveJSON("./lib/anticall.json", db);
            }
        } catch (err) {
            console.log("ANTICALL ERROR:", err);
        }
    });

    // ================================================================
    // UNIFIED MESSAGE HANDLER
    // ================================================================
    // UNIFIED MESSAGE HANDLER
    // ================================================================
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        try {
            if (type !== "notify") return;
            if (!messages || !Array.isArray(messages) || messages.length === 0) return;

            const m = messages[0];
            if (!m || !m.message) return;

            const from = m.key.remoteJid;
            const isGroup = from.endsWith('@g.us');

            // ========================================================
            // 📊 AUTOMATED CHAT ANALYTICS TRACKER
            // ========================================================



            // ========================================================
            // 🔥 AUTOMATED ANTIPORN FILTER (IMAGES, VIDEOS, STICKERS)
            // ========================================================
            if (!m.key.fromMe) {
                try {
                    const { scanIncomingMedia } = require('./utils/nsfwScanner');
                    await scanIncomingMedia(sock, m);
                } catch (scanErr) {
                    console.error("❌ AntiPorn scanner invocation crash:", scanErr);
                }
            }

            // ========================================================
            // 1. EXTRACT TEXT IMMEDIATELY (Fixes the ReferenceError)
            // ========================================================
            const messageType = Object.keys(m.message)[0];
            let text = "";
            if (messageType === "conversation") {
                text = m.message.conversation;
            } else if (messageType === "extendedTextMessage") {
                text = m.message.extendedTextMessage?.text;
            } else if (messageType === "imageMessage") {
                text = m.message.imageMessage?.caption;
            } else if (messageType === "videoMessage") {
                text = m.message.videoMessage?.caption;
            }
            text = (text || "").trim();

            // ========================================================
            // 2. PERSISTENT MENU SELECTION INTERCEPTOR
            // ========================================================
            if (global.videoCache && global.videoCache[from]) {
                if (text === "1" || text === "2") {
                    const session = global.videoCache[from];
                    const isDocumentMode = (text === "2");

                    const originalArgs = session.args;
                    const originalMsg = session.message;

                    try {
                        const videoCommand = require("./commands/videodl.js");
                        await videoCommand.execute(sock, originalMsg, originalArgs, {
                            isDocumentMode,
                            bypassMenuCreation: true
                        });
                    } catch (cmdErr) {
                        console.error("Error executing video via text reply selection:", cmdErr);
                    }
                    return; // Stop here!
                }
            }

            if (!text) return; // Now it is safe to return if no text exists

            // ==========================================================
            // 3. VARIABLE PARSING & LOOP BYPASS
            // ==========================================================
            const sender = m.key.participant || m.key.remoteJid || "";
            const cleanSenderNumber = sender.split("@")[0].split(":")[0];
            const isOwner = global.OWNERS.includes(cleanSenderNumber);
            const isCommand = text.startsWith(global.PREFIX || "!");

            // If the message is from the bot number itself
            if (m.key.fromMe) {
                // Allow the message only if it explicitly begins with your command prefix
                if (!text.startsWith(global.PREFIX || "!")) {
                    return; // Blocks regular bot replies from triggering commands
                }
            }

            // ... (Rest of your command execution handler continues below here)


            // ========================================================
            // 🔄 INTERACTIVE TEXT MENU SELECTION GATE
            // ========================================================
            // ========================================================
            // 🔄 FIXED ROUTER: Routes to song.js or videodl.js
            // ========================================================
            if (global.videoCache && global.videoCache[from]) {
                const cleanInput = text.trim();
                if (cleanInput === "1" || cleanInput === "2") {
                    const session = global.videoCache[from];
                    const isDocumentMode = (cleanInput === "2");

                    // 1. Get the original command text
                    const msgText = (session.message.message.extendedTextMessage?.text ||
                        session.message.message.conversation || "").toLowerCase();

                    // 2. Logic: If the user original command was a "song" command, use song.js
                    const isSongTrigger = msgText.includes(".song") || msgText.includes(".play") || msgText.includes(".music");
                    const cmdFile = isSongTrigger ? "song.js" : "videodl.js";

                    console.log(`[ROUTER] Original Trigger: "${msgText}"`);
                    console.log(`[ROUTER] Routing to: ${cmdFile}`);

                    try {
                        // Load the correct file dynamically
                        const commandModule = require(`./commands/${cmdFile}`);

                        // Execute the command
                        await commandModule.execute(sock, session.message, session.args, {
                            isDocumentMode,
                            bypassMenuCreation: true
                        });

                        // CLEAR CACHE after successful execution to prevent duplicate triggers
                        delete global.videoCache[from];

                    } catch (cmdErr) {
                        console.error(`[ROUTER] Execution Error:`, cmdErr);
                    }
                    return;
                }
            }
            // ------------------------------------------
            // ANTIDELETE INTERCEPTION INTERFACE
            // ------------------------------------------
            const protocolType = m.message?.protocolMessage?.type;
            if (protocolType === 0) {
                const antiDeleteDB = loadJSON("./lib/antidelete.json");
                if (antiDeleteDB[from]) {
                    const deletedKey = m.message.protocolMessage.key.id;
                    const historicalData = deletedMessages[deletedKey];

                    if (historicalData) {
                        const rawSender = historicalData.sender.split("@")[0];
                        await sock.sendMessage(
                            global.OWNERS[0] + "@s.whatsapp.net",
                            {
                                text: `🚫 DELETED MESSAGE\n\n👤 User: ${rawSender}\n💬 Message: ${historicalData.text}\n🏷 Chat: ${from}`
                            }
                        );
                    }
                }
                return;
            }

            // Save to temporary memory log for antidelete fallback monitoring
            if (messageType === "conversation" || messageType === "extendedTextMessage") {
                deletedMessages[m.key.id] = { text, sender };
            }

            // ------------------------------------------
            // BANNED USER CHECK
            // ------------------------------------------
            const bannedDB = loadJSON("./lib/banned.json");
            if (isCommand && bannedDB[cleanSenderNumber]) {
                await sock.sendMessage(from, {
                    text: "🚫 You are banned from using bot commands."
                }, { quoted: m });
                return;
            }
            // ------------------------------------------
            // KEYWORD FLAG SYSTEM
            // ------------------------------------------
            const flagText = text.toLowerCase();

            // 1. Extract the sender's actual WhatsApp JID safely


            // 2. Extract just the clean phone number (remove @s.whatsapp.net)
            const senderNumber = sender.split('@')[0].split(':')[0];

            // 3. For WhatsApp mentions to work, the text MUST be formatted as @phoneNumber
            const styledUser = `@${senderNumber}`;

            const flagCategories = [
                { words: ["gay", "lesbian", "transgender"], reply: `🚫 Gay Detected!\n\n${styledUser} is a full blooded gay.` },
                { words: ["trump", "america", "americans"], reply: `🚫 Gay Detected!\n\n${styledUser}, Trump, America, Americans, USA are full blooded gay.` },
                { words: ["france", "macron", "israel", "netanyahu", "usa"], reply: `🚫 Gay Detected!\n\n${styledUser}, France, Macron, Israel, Netanyahu, USA are full blooded gay.` }
            ];

            let flagged = false;
            for (const category of flagCategories) {
                if (category.words.some(word => flagText.includes(word))) {
                    await sock.sendMessage(from, {
                        text: category.reply,
                        mentions: [sender] // The text '@phone' matches this JID link perfectly!
                    }, { quoted: m });
                    flagged = true;
                    break;
                }
            }
            if (flagged) return;

            // ========================================================
            // 🛡️ UNIFIED ANTI-SPAM & LINK PROTECTION SYSTEM
            // ========================================================
            if (isGroup) {
                const configPath = './lib/antispam_config.json';
                let antiSpamSettings = loadJSON(configPath, {});

                if (antiSpamSettings[from] === "on") {
                    const currentTime = Date.now();
                    const userKey = `${from}_${cleanSenderNumber}`;

                    // --- Part A: Anti-Link Protection ---
                    if (antiSpamSettings.antilink && antiSpamSettings.antilink[from] === "on") {
                        const containsLink = /chat\.whatsapp\.com\/[a-zA-Z0-9]{22}/i.test(text) ||
                            /https?:\/\/[^\s]+/i.test(text) ||
                            /www\.[^\s]+/i.test(text);

                        if (containsLink) {
                            const groupData = await sock.groupMetadata(from).catch(() => null);
                            const members = groupData?.participants || [];
                            const senderObject = members.find(p => p.id.includes(cleanSenderNumber));
                            const senderIsAdmin = senderObject?.admin === "admin" || senderObject?.admin === "superadmin";

                            if (!senderIsAdmin) {
                                await sock.sendMessage(from, { delete: m.key }).catch(() => null);
                                await sock.sendMessage(from, {
                                    text: `❌ *Link Protection:* @${cleanSenderNumber}, links are not allowed here!`,
                                    mentions: [sender]
                                }).catch(() => null);
                                return;
                            }
                        }
                    }

                    // --- Part B: Rolling Window Flood/Spam Protection ---
                    if (!global.spamTrackingMap.has(userKey)) {
                        global.spamTrackingMap.set(userKey, []);
                    }

                    let timestamps = global.spamTrackingMap.get(userKey);

                    // Filter out timestamps older than 5 seconds (5000ms)
                    timestamps = timestamps.filter(time => currentTime - time < 5000);

                    // Add current message timestamp
                    timestamps.push(currentTime);
                    global.spamTrackingMap.set(userKey, timestamps);

                    // If user sends more than 4 messages within 5 seconds, flag as spam
                    if (timestamps.length > 4) {
                        const groupData = await sock.groupMetadata(from).catch(() => null);
                        const members = groupData?.participants || [];
                        const botIdClean = sock.user.id.split("@")[0].split(":")[0];

                        const botObject = members.find(p => p.id.includes(botIdClean));
                        const targetObject = members.find(p => p.id.includes(cleanSenderNumber));

                        const botIsAdmin = botObject?.admin === "admin" || botObject?.admin === "superadmin";
                        const targetIsAdmin = targetObject?.admin === "admin" || targetObject?.admin === "superadmin";

                        // Instantly delete the spam payload
                        await sock.sendMessage(from, { delete: m.key }).catch(() => null);

                        if (timestamps.length === 5) {
                            await sock.sendMessage(from, {
                                text: `⚠️ *Anti-Spam:* @${cleanSenderNumber}, Nigga, you are sending messages too fast! Slow down or i will kick your ass.`,
                                mentions: [sender]
                            }).catch(() => null);
                        }

                        if (timestamps.length >= 7) {
                            if (!targetIsAdmin && botIsAdmin) {
                                await sock.sendMessage(from, {
                                    text: `⚡ *Anti-Spam:* @${cleanSenderNumber} has been kicked for spamming, they are gay!`,
                                    mentions: [sender]
                                });
                                await sock.groupParticipantsUpdate(from, [sender], "remove").catch(() => null);
                                global.spamTrackingMap.delete(userKey);
                                return;
                            }
                        }
                        return; // Halt logic execution pipeline for this message event
                    }
                }
            }

            // ------------------------------------------
            // COMMAND HANDLER
            // ------------------------------------------
            if (isCommand) {
                const parts = text.split(/\s+/);
                const cmd = parts[0].slice(PREFIX.length).toLowerCase();
                const args = parts.slice(1);

                const commandsPath = "./commands";
                if (fs.existsSync(commandsPath)) {
                    const files = fs.readdirSync(commandsPath);

                    for (const file of files) {
                        if (file.endsWith(".js")) {
                            try {
                                const filePath = `${commandsPath}/${file}`;
                                delete require.cache[require.resolve(filePath)];
                                const cmdFile = require(filePath);

                                if (cmdFile.name === cmd || (cmdFile.aliases && cmdFile.aliases.includes(cmd))) {
                                    await cmdFile.execute(sock, m, args);
                                    return;
                                }
                            } catch (cmdErr) {
                                console.error(`Error executing command ${file}:`, cmdErr);
                            }
                        }
                    }
                }
            }

            // ------------------------------------------
            // ANTIBADWORDS & ADDITIONAL SECURITY LOGIC
            // ------------------------------------------
            if (isGroup && !isOwner) {
                const antibadDB = loadJSON("./lib/antibadwords.json");
                const badwords = loadJSON("./lib/badwords.json", []);

                if (antibadDB[from]?.enabled) {
                    const lowerText = text.toLowerCase();
                    if (badwords.some(w => lowerText.includes(w))) {
                        await sock.sendMessage(from, { delete: m.key }).catch(() => null);

                        antibadDB[from].warns = antibadDB[from].warns || {};
                        antibadDB[from].warns[sender] = (antibadDB[from].warns[sender] || 0) + 1;

                        await sock.sendMessage(from, {
                            text: `⚠️ Bad word detected!\nWarn: ${antibadDB[from].warns[sender]}`,
                            mentions: [sender]
                        }, { quoted: m });

                        saveJSON("./lib/antibadwords.json", antibadDB);
                        return;
                    }
                }
            }

            // ------------------------------------------
            // 🌟 NAVYA AI CHATBOT SYSTEM
            // ------------------------------------------
            const myBotId = sock.user?.id ? sock.user.id.split("@")[0].split(":")[0] : null;
            const isMentioned = myBotId ? text.includes(`@${myBotId}`) : false;

            if (!isCommand && (isMentioned || !isGroup)) {
                try {
                    const cleanPrompt = myBotId ? text.replace(new RegExp(`@${myBotId}`, 'g'), '').trim() : text;
                    await sock.sendPresenceUpdate('composing', from);

                    const aiResponse = await ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: cleanPrompt,
                    });

                    await sock.sendMessage(from, { text: aiResponse.text || "..." }, { quoted: m });
                } catch (aiErr) {
                    console.error("Gemini AI Error:", aiErr);
                }
            }

        } catch (err) {
            console.error("🚨 CRITICAL LOOP ERROR:", err);
        }
    });


}

startBot();