// ==========================================
// AUTO-INSTALL DEPENDENCIES & BINARIES ON HOST
// ==========================================
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const nodeModulesPath = path.join(__dirname, "node_modules");
const ffmpegBinaryPath = process.platform === "win32"
    ? path.join(nodeModulesPath, "ffmpeg-static", "ffmpeg.exe")
    : path.join(nodeModulesPath, "ffmpeg-static", "ffmpeg");

const needsModules = !fs.existsSync(nodeModulesPath) || !fs.existsSync(path.join(nodeModulesPath, "dotenv"));
const needsFfmpeg = !fs.existsSync(ffmpegBinaryPath);

if (needsModules || needsFfmpeg) {
    console.log("📦 Missing node_modules or FFmpeg binary detected. Initializing installation...");
    try {
        // Runs npm install to fetch everything in package.json and rebuild binary targets
        execSync("npm install --force", { stdio: "inherit", cwd: __dirname });
        console.log("✅ All dependencies & binaries installed successfully!");
    } catch (err) {
        console.error("❌ Failed to auto-install dependencies:", err.message);
    }
}
// ==========================================
// YOUR EXISTING index.js CODE STARTS BELOW
// ==========================================

require("dotenv").config(); // Loaded at the very top so process.env is ready

//const path = require('path');
//const fs = require("fs-extra");
const express = require("express");
const pino = require("pino");
const QRCode = require("qrcode-terminal");
const { GoogleGenAI } = require("@google/genai");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");

// Custom Utilities & Schedulers
const { startQuoteScheduler } = require('./utils/quoteScheduler');
const { scanIncomingMedia } = require('./utils/nsfwScanner');
const { startAutoCleaner } = require('./utils/autoCleaner');
//const pairRouter = require("./server");
const config = require('./config');

const ytsCmd = require('./commands/Downloaders/yts'); // Adjust this path if yts.js is in a different folder
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


/// =================================
// 🔑 AUTOMATIC LID RESOLVER
// =================================
const ownerLidCache = new Set();

async function getOwnerLids(sock, phoneNumbers = []) {
    for (const num of phoneNumbers) {
        if (!num) continue;
        const cleanNum = String(num).replace(/[^0-9]/g, "");
        if (!cleanNum) continue;

        const phoneJid = `${cleanNum}@s.whatsapp.net`;
        try {
            const results = await sock.onWhatsApp(phoneJid);
            if (Array.isArray(results) && results.length > 0) {
                const user = results[0];
                if (user && user.lid) {
                    // Extract numeric LID (e.g., 100399675609189)
                    const lidNum = user.lid.split('@')[0].split(':')[0];
                    ownerLidCache.add(lidNum);
                }
            }
        } catch (err) {
            console.error(`[LID RESOLVER] Failed to resolve LID for ${cleanNum}:`, err.message);
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

    if (!sock.authState.creds.registered) {
        let phoneNumber = config.BOT_NUMBER;

        if (!phoneNumber) {
            console.error("❌ ERROR: BOT_NUMBER is not set in config.js!");
            return;
        }

        phoneNumber = String(phoneNumber).replace(/[^0-9]/g, '');

        console.log(`\n🔍 Trying to generate pairing code for: ${phoneNumber}`);

        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

                console.log("\n=================================");
                console.log(`📱 WHATSAPP PAIRING CODE FOR ${phoneNumber}: ${formattedCode}`);
                console.log("=================================\n");
            } catch (err) {
                console.error("❌ Error requesting pairing code:", err.message);
            }
        }, 3000);
    }

    const { startQuoteScheduler, updateSchedulerSocket } = require('./utils/quoteScheduler');
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("✅ NAVYA CONNECTED SUCCESSFULLY!");

            // Auto-resolve owner and sudo LIDs on startup
            const ownerNumbers = [config.OWNER_NUMBER, ...(config.SUDO || [])];
            await getOwnerLids(sock, ownerNumbers);
            console.log(`[LID RESOLVER] Cached Owner LIDs:`, Array.from(ownerLidCache));

            // Always update the scheduler's socket reference to the fresh 'sock'
            updateSchedulerSocket(sock);

            // Start cron job only once on initial boot
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
                console.log("⚠️ Session logged out permanently.");
            }
        }
    });


    // ======================
    // ANTICALL SYSTEM
    // ======================
    // ANTICALL SYSTEM (Simple Reject & Text)
    // ======================
    const activeCalls = new Set();

    sock.ev.on("call", async (calls) => {
        if (!config.ANTICALL) return;

        for (const call of calls) {
            // Only process incoming call offers
            if (call.status !== "offer") continue;

            const rawCaller = call.from;
            if (!rawCaller) continue;

            // 1. Reject the incoming call immediately
            try {
                await sock.rejectCall(call.id, rawCaller);
            } catch (rejectErr) {
                console.error("Failed to reject call:", rejectErr);
            }

            // 2. Debounce to avoid sending multiple texts if calls burst
            if (activeCalls.has(rawCaller)) continue;
            activeCalls.add(rawCaller);
            setTimeout(() => activeCalls.delete(rawCaller), 5000);

            // 3. Send auto-reply text message
            try {
                const botName = config.BOT_NAME || "Navya";
                await sock.sendMessage(rawCaller, {
                    text: `⚠️ *FUCK YOU BITCH, DON'T CALL ME* 😡🖕🏻`
                });
                console.log(`📞 Auto-rejected call & sent notification to ${rawCaller}`);
            } catch (msgErr) {
                console.error("Failed to send anti-call text:", msgErr);
            }
        }
    });


    // ================================================================
    // GROUP PARTICIPANTS UPDATES (WELCOME & GOODBYE HANDLER)
    // ================================================================
    sock.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action } = update;

            // WELCOME EVENT
            if (action === 'add' && global.welcomeSettings && global.welcomeSettings[id]) {
                for (const user of participants) {
                    await sock.sendMessage(id, {
                        text: `✨ Welcome @${user.split('@')[0]} to the group! We're glad to have you here. 🎉`,
                        mentions: [user]
                    });
                }
            }

            // GOODBYE EVENT
            if (action === 'remove' && global.goodbyeSettings && global.goodbyeSettings[id]) {
                for (const user of participants) {
                    await sock.sendMessage(id, {
                        text: `👋 Goodbye @${user.split('@')[0]}. Sad to see you go!`,
                        mentions: [user]
                    });
                }
            }
        } catch (err) {
            console.error("Group Participants Update Error:", err);
        }
    });


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
            // 1. EXTRACT SENDER & UNIFIED OWNER CHECK FIRST
            // ========================================================
            const rawSender = m.sender || (isGroup ? m.key.participant : from) || "";
            const cleanSenderNumber = rawSender.split('@')[0].split(':')[0].replace(/[^0-9]/g, "");
            const isFromMe = m.key.fromMe;

            // Get owner numbers from config / env
            const rawOwners = (typeof config !== "undefined" && config.OWNERS)
                ? config.OWNERS
                : (global.OWNERS || []);

            const cleanedOwners = rawOwners.map(num => String(num).replace(/[^0-9]/g, ""));
            if (typeof config !== "undefined" && config.OWNER_NUMBER) {
                cleanedOwners.push(String(config.OWNER_NUMBER).replace(/[^0-9]/g, ""));
            }
            if (typeof config !== "undefined" && Array.isArray(config.SUDO)) {
                config.SUDO.forEach(num => cleanedOwners.push(String(num).replace(/[^0-9]/g, "")));
            }

            // 1. Load your dynamic sudo list from ./lib/sudo.json
            const sudoDB = loadJSON("./lib/sudo.json", []);

            // 2. DYNAMIC ZERO-CONFIG OWNER CHECK
            const isOwner =
                isFromMe === true ||
                cleanedOwners.includes(cleanSenderNumber) ||
                sudoDB.includes(cleanSenderNumber) ||
                (typeof ownerLidCache !== "undefined" && ownerLidCache.has(cleanSenderNumber));

            // ========================================================
            // ========================================================
            // 2. YTS SEARCH INTERACTIVE REPLIES
            // ========================================================
            const body = (m.message?.conversation || m.message?.extendedTextMessage?.text || "").trim();
            const quotedStanzaId = m.message?.extendedTextMessage?.contextInfo?.stanzaId;

            if (quotedStanzaId && global.ytsSessions && global.ytsSessions.has(quotedStanzaId)) {
                console.log(`[YTS Reply Detected] Replying to stanza ID: ${quotedStanzaId} with text: "${body}"`);

                const selectionNum = parseInt(body);

                if (!isNaN(selectionNum) && selectionNum > 0) {
                    const session = global.ytsSessions.get(quotedStanzaId);

                    if (selectionNum <= session.videos.length) {
                        // Remove session so it can't be triggered twice
                        global.ytsSessions.delete(quotedStanzaId);

                        // Call handler from loaded commands or require
                        const ytsModule = require('./commands/downloaders/yts'); // Adjust relative path if needed
                        await ytsModule.handleYtsReply(sock, m, session, selectionNum - 1);
                        return; // Stop execution here
                    } else {
                        await sock.sendMessage(from, { text: `❌ Invalid choice. Please select a number between 1 and ${session.videos.length}.` }, { quoted: m });
                        return;
                    }
                }
            }

            // ========================================================
            // 2. 🔒 PUBLIC / PRIVATE MODE GUARD (PERSISTENT)
            // ========================================================
            const modeDB = loadJSON("./lib/mode.json", { mode: "public" });
            const currentMode = modeDB.mode || (typeof config !== "undefined" ? config.MODE : "public");

            if (currentMode === "private" && !isOwner) {
                return; // Stop processing immediately for non-owners in private mode
            }
            // ========================================================
            // 3. 🔥 AUTOMATED ANTIPORN FILTER (IMAGES, VIDEOS, STICKERS)
            // ========================================================
            if (!isFromMe) {
                try {
                    const { scanIncomingMedia } = require('./utils/nsfwScanner');
                    await scanIncomingMedia(sock, m);
                } catch (scanErr) {
                    console.error("❌ AntiPorn scanner invocation crash:", scanErr);
                }
            }

            // ========================================================
            // 4. EXTRACT TEXT IMMEDIATELY
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
            // 5. PERSISTENT MENU SELECTION INTERCEPTOR
            // ========================================================
            if (global.videoCache && global.videoCache[from]) {
                if (text === "1" || text === "2") {
                    const session = global.videoCache[from];
                    const isDocumentMode = (text === "2");

                    const originalArgs = session.args;
                    const originalMsg = session.message;

                    try {
                        const videoCommand = require("./commands/Downloaders/videodl.js");
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

            if (!text) return; // Safe to return if no text exists

            // ==========================================================
            // 6. COMMAND PARSING & LOOP BYPASS
            // ==========================================================
            const isCommand = text.startsWith(global.PREFIX || config.PREFIX || "!");

            if (isFromMe && !isCommand) {
                return;
            }

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
            // ========================================================
            // 7. ANTIDELETE INTERCEPTION INTERFACE
            // ========================================================
            const protocolType = m.message?.protocolMessage?.type;
            if (protocolType === 0) {
                const antiDeleteDB = loadJSON("./lib/antidelete.json");
                if (antiDeleteDB[from]) {
                    const deletedKey = m.message.protocolMessage.key.id;
                    const historicalData = deletedMessages[deletedKey];

                    if (historicalData) {
                        const rawSender = historicalData.sender.split("@")[0];
                        const primaryOwnerNum = (config.OWNER_NUMBER || (global.OWNERS && global.OWNERS[0]) || "").replace(/[^0-9]/g, "");

                        if (primaryOwnerNum) {
                            await sock.sendMessage(
                                primaryOwnerNum + "@s.whatsapp.net",
                                {
                                    text: `🚫 *DELETED MESSAGE DETECTED*\n\n👤 *User:* @${rawSender}\n💬 *Message:* ${historicalData.text}\n🏷 *Chat:* ${from}`,
                                    mentions: [historicalData.sender]
                                }
                            ).catch(() => null);
                        }
                    }
                }
                return;
            }

            // Save to temporary memory log for antidelete fallback monitoring
            if (messageType === "conversation" || messageType === "extendedTextMessage") {
                deletedMessages[m.key.id] = { text, sender: rawSender };
            }

            // ========================================================
            // 8. BANNED USER CHECK
            // ========================================================
            const bannedDB = loadJSON("./lib/banned.json");
            if (isCommand && bannedDB[cleanSenderNumber]) {
                await sock.sendMessage(from, {
                    text: "🚫 You are banned from using bot commands."
                }, { quoted: m });
                return;
            }

            // ========================================================
            // 9. 🛡️ UNIFIED ANTI-SPAM & LINK PROTECTION SYSTEM
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

                            if (!senderIsAdmin && !isOwner) {
                                await sock.sendMessage(from, { delete: m.key }).catch(() => null);
                                await sock.sendMessage(from, {
                                    text: `❌ *Link Protection:* @${cleanSenderNumber}, links are not allowed here!`,
                                    mentions: [rawSender]
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

                    // Filter out timestamps older than 5 seconds
                    timestamps = timestamps.filter(time => currentTime - time < 5000);
                    timestamps.push(currentTime);
                    global.spamTrackingMap.set(userKey, timestamps);

                    // If user sends more than 4 messages within 5 seconds
                    if (timestamps.length > 4 && !isOwner) {
                        const groupData = await sock.groupMetadata(from).catch(() => null);
                        const members = groupData?.participants || [];
                        const botIdClean = sock.user?.id?.split("@")[0]?.split(":")[0] || "";

                        const botObject = members.find(p => p.id.includes(botIdClean));
                        const targetObject = members.find(p => p.id.includes(cleanSenderNumber));

                        const botIsAdmin = botObject?.admin === "admin" || botObject?.admin === "superadmin";
                        const targetIsAdmin = targetObject?.admin === "admin" || targetObject?.admin === "superadmin";

                        // Instantly delete spam message
                        await sock.sendMessage(from, { delete: m.key }).catch(() => null);

                        if (timestamps.length === 5) {
                            await sock.sendMessage(from, {
                                text: `⚠️ *Anti-Spam:* @${cleanSenderNumber}, you are sending messages too fast! Slow down.`,
                                mentions: [rawSender]
                            }).catch(() => null);
                        }

                        if (timestamps.length >= 7) {
                            if (!targetIsAdmin && botIsAdmin) {
                                await sock.sendMessage(from, {
                                    text: `⚡ *Anti-Spam:* @${cleanSenderNumber} has been kicked for spamming.`,
                                    mentions: [rawSender]
                                }).catch(() => null);
                                await sock.groupParticipantsUpdate(from, [rawSender], "remove").catch(() => null);
                                global.spamTrackingMap.delete(userKey);
                                return;
                            }
                        }
                        return;
                    }
                }
            }

            // ========================================================
            // 10. COMMAND HANDLER (IN-MEMORY CACHED LOOKUP)
            // ========================================================

            // 1. Map to store commands and aliases in RAM for ultra-fast lookup
            global.commands = global.commands || new Map();
            global.aliases = global.aliases || new Map();

            // 2. One-time command loader function (Runs on startup or command dispatch)
            const loadCommands = (dir = path.join(__dirname, "commands")) => {
                if (!fs.existsSync(dir)) return;
                const files = fs.readdirSync(dir);

                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory()) {
                        loadCommands(fullPath); // Recursively enter subfolders
                    } else if (file.toLowerCase().endsWith(".js")) {
                        try {
                            delete require.cache[require.resolve(fullPath)];
                            const cmdFile = require(fullPath);

                            if (cmdFile && cmdFile.name) {
                                const nameLower = cmdFile.name.toLowerCase();
                                global.commands.set(nameLower, cmdFile);

                                // Register all aliases safely in lowercase
                                if (Array.isArray(cmdFile.aliases)) {
                                    cmdFile.aliases.forEach(alias => {
                                        global.aliases.set(alias.toLowerCase(), nameLower);
                                    });
                                }
                            }
                        } catch (err) {
                            console.error(`❌ [COMMAND LOAD ERROR] Failed to load ${file}:`, err.message);
                        }
                    }
                }
            };

            // Ensure commands are loaded into memory
            if (global.commands.size === 0) {
                loadCommands();
                console.log(`✅ Loaded ${global.commands.size} commands into memory.`);
            }

            // 3. DISPATCHER FOR INCOMING COMMANDS
            if (isCommand) {
                const prefix = global.PREFIX || config.PREFIX || "!";
                const parts = text.split(/\s+/);
                const cmdInput = parts[0].slice(prefix.length).toLowerCase();
                const args = parts.slice(1);

                console.log(`[COMMAND RUN] Cmd: .${cmdInput} | Sender: ${cleanSenderNumber} | IsOwner: ${isOwner}`);

                // Resolve command by direct name or alias lookup
                const resolvedCmdName = global.commands.has(cmdInput)
                    ? cmdInput
                    : global.aliases.get(cmdInput);

                const cmdFile = global.commands.get(resolvedCmdName);

                if (cmdFile) {
                    try {
                        // 🔒 OWNER GUARD CHECK
                        const isOwnerCategory = (cmdFile.category && cmdFile.category.toLowerCase() === "owner");
                        if (isOwnerCategory && !isOwner) {
                            await sock.sendMessage(from, {
                                text: `❌ *Access Denied:* This command is restricted to the bot owner.\n\n*Your ID:* \`${cleanSenderNumber}\``
                            }, { quoted: m });
                            return;
                        }

                        // Execute command smoothly across Katabump, Koyeb, and Local PC
                        await cmdFile.execute(sock, m, args, { isOwner });

                    } catch (cmdErr) {
                        console.error(`❌ Error executing command [${cmdInput}]:`, cmdErr);
                        await sock.sendMessage(from, {
                            text: `❌ An error occurred executing .${cmdInput}: ${cmdErr.message || "Unknown error"}`
                        }, { quoted: m });
                    }
                } else {
                    // Optional: Log if command wasn't found
                    // console.log(`Command .${cmdInput} not found in memory.`);
                }
            }
            // ========================================================
            // 11. ANTIBADWORDS & ADDITIONAL SECURITY LOGIC
            // ========================================================
            if (isGroup && !isOwner) {
                const antibadDB = loadJSON("./lib/antibadwords.json");
                const badwords = loadJSON("./lib/badwords.json", []);

                if (antibadDB[from]?.enabled) {
                    const lowerText = text.toLowerCase();
                    if (badwords.some(w => lowerText.includes(w))) {
                        await sock.sendMessage(from, { delete: m.key }).catch(() => null);

                        antibadDB[from].warns = antibadDB[from].warns || {};
                        antibadDB[from].warns[rawSender] = (antibadDB[from].warns[rawSender] || 0) + 1;

                        await sock.sendMessage(from, {
                            text: `⚠️ Bad word detected!\nWarn: ${antibadDB[from].warns[rawSender]}`,
                            mentions: [rawSender]
                        }, { quoted: m });

                        saveJSON("./lib/antibadwords.json", antibadDB);
                        return;
                    }
                }
            }

        } catch (err) {
            console.error("🚨 CRITICAL LOOP ERROR:", err);
        }
    });
}

// Global LID cache to store resolved WhatsApp LIDs across events

/**
 * Resolves phone numbers to WhatsApp LIDs automatically on bot startup
 */
async function getOwnerLids(sock, phoneNumbers = []) {
    for (const num of phoneNumbers) {
        const cleanNum = String(num).replace(/[^0-9]/g, "");
        if (!cleanNum) continue;

        const phoneJid = `${cleanNum}@s.whatsapp.net`;
        try {
            const [result] = await sock.onWhatsApp(phoneJid);
            if (result && result.lid) {
                const lidNum = result.lid.split('@')[0].split(':')[0];
                ownerLidCache.add(lidNum);
                console.log(`[LID RESOLVER] Successfully cached LID for ${cleanNum}: ${lidNum}`);
            }
        } catch (err) {
            console.error(`[LID RESOLVER] Failed to resolve LID for ${cleanNum}:`, err.message);
        }
    }
}

// Initialize background maintenance & launch
startAutoCleaner(60);
startBot();        