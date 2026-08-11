const fs = require("fs");
const path = require("path");

// Country Code Dictionary mapping prefixes to Country Names and Flags
const countryCodes = {
    "1": "🇺🇸/🇨🇦 United States / Canada",
    "7": "🇷🇺 Russia",
    "20": "🇪🇬 Egypt",
    "27": "🇿🇦 South Africa",
    "33": "🇫🇷 France",
    "34": "🇪🇸 Spain",
    "39": "🇮🇹 Italy",
    "44": "🇬🇧 United Kingdom",
    "49": "🇩🇪 Germany",
    "52": "🇲🇽 Mexico",
    "55": "🇧🇷 Brazil",
    "60": "🇲🇾 Malaysia",
    "61": "🇦🇺 Australia",
    "62": "🇮🇩 Indonesia",
    "63": "🇵🇭 Philippines",
    "91": "🇮🇳 India",
    "212": "🇲🇦 Morocco",
    "218": "🇱🇾 Libya",
    "233": "🇬🇭 Ghana",
    "234": "🇳🇬 Nigeria",
    "254": "🇰🇪 Kenya",
    "255": "🇹🇿 Tanzania",
    "256": "🇺🇬 Uganda",
    "260": "🇿🇲 Zambia",
    "263": "🇿🇼 Zimbabwe",
    "359": "🇧🇬 Bulgaria"
};

// Helper function to extract country based on phone string starting digits
function getCountryFromNumber(numStr) {
    if (countryCodes[numStr.substring(0, 3)]) return countryCodes[numStr.substring(0, 3)];
    if (countryCodes[numStr.substring(0, 2)]) return countryCodes[numStr.substring(0, 2)];
    if (countryCodes[numStr.substring(0, 1)]) return countryCodes[numStr.substring(0, 1)];
    return "🌐 Unknown Location";
}

module.exports = {
    name: "cast",
    aliases: ["profile", "userinfo"],
    category: "owner",
    desc: "Global owner-only profile caster. Implements fallback for local file asset buffering.",

    async execute(sock, m, args) {
        try {
            const from = m.key.remoteJid;

            // ==========================================
            // OWNER ONLY SECURITY LOCK
            // ==========================================
            const OWNER_LID = "100399675609189@lid";
            const senderJid = m.key.participant || m.key.remoteJid || "";

            if (senderJid !== OWNER_LID) {
                return;
            }

            let target = null;

            // ==========================================
            // 1. PRIORITY INPUT ARGS PROCESSING
            // ==========================================
            if (args && args.length > 0) {
                let rawInput = args.join("").replace(/\D/g, "");
                if (rawInput && rawInput.length >= 7) {
                    target = `${rawInput}@s.whatsapp.net`;
                }
            }

            // ==========================================
            // 2. FALLBACK TO REPLIES OR MENTIONS
            // ==========================================
            const context = m.message?.extendedTextMessage?.contextInfo || {};
            if (!target) {
                target =
                    context.mentionedJid?.[0] ||
                    context.participant ||
                    m.key.participant ||
                    m.key.remoteJid;
            }

            // ==========================================
            // DEEP LID-TO-PHONE RESOLUTION ENGINE
            // ==========================================
            let role = "👤 User / Global Contact";
            let cachedName = null;

            if (from.endsWith("@g.us")) {
                try {
                    const metadata = await sock.groupMetadata(from);

                    let participant = metadata.participants.find(p =>
                        p.id === target ||
                        p.lid === target ||
                        (context.mentionedJid && context.mentionedJid.includes(p.id))
                    );

                    if (participant) {
                        target = participant.id;
                        cachedName = participant.notify || participant.name;

                        if (participant.admin === "admin") role = "🛡️ Admin";
                        if (participant.admin === "superadmin") role = "👑 Owner";
                        if (participant.admin === null) role = "👤 Member";
                    }
                } catch (err) {
                    console.log("Group tracking link metadata skipped.");
                }
            }

            // Isolate clean numeric phone digits from the resolved target JID string
            const number = target.split("@")[0].split(":")[0].replace(/\D/g, "");

            // Safety Check: Avoid raw multi-device LID breaks outside group layouts
            if (target.endsWith("@lid") && number.length > 12) {
                return await sock.sendMessage(from, {
                    text: "❌ Cannot look up raw multi-device LID strings in DMs. Please reply to their actual message or use their real phone number string instead!"
                }, { quoted: m });
            }

            const cleanTargetJid = `${number}@s.whatsapp.net`;

            // ==========================================
            // COUNTRY DETECTOR ENGINE
            // ==========================================
            const userCountry = getCountryFromNumber(number);

            // ==========================================
            // STABILIZED PROFILE PIC ENGINE (LOCAL FILE BUFFERS)
            // ==========================================
            let pp = null;
            let isLocalBuffer = false;
            const localAssetPath = "./assets/menu.jpg";

            try {
                // Try requesting full resolution image first
                pp = await sock.profilePictureUrl(cleanTargetJid, "image");
            } catch (err) {
                try {
                    // Try preview fallback if full resolution fails
                    pp = await sock.profilePictureUrl(cleanTargetJid, "preview");
                } catch (fallbackErr) {
                    pp = null;
                }
            }

            // If profile picture fetch failed or returned invalid data, load local asset buffer
            if (!pp || typeof pp !== "string" || !pp.startsWith("http")) {
                if (fs.existsSync(localAssetPath)) {
                    pp = fs.readFileSync(localAssetPath);
                    isLocalBuffer = true;
                } else {
                    // Safety protection if local asset file is missing from your folders
                    pp = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&q=80";
                    isLocalBuffer = false;
                }
            }

            // Create the proper media object interface depending on data destination source
            const imagePayload = isLocalBuffer ? pp : { url: pp };

            // ==========================================
            // RESOLVE USER DISPLAY NAME
            // ==========================================
            let username = `@${number}`;

            if (cachedName) {
                const cleanCached = cachedName.replace(/[+\s]/g, "");
                if (cleanCached === number) {
                    username = `@${number}`;
                } else {
                    username = `${cachedName} (@${number})`;
                }
            } else if (context.participant && context.participant.includes(number)) {
                if (context.participantName) {
                    const cleanContextName = context.participantName.replace(/[+\s]/g, "");
                    if (cleanContextName === number) {
                        username = `@${number}`;
                    } else {
                        username = `${context.participantName} (@${number})`;
                    }
                }
            }

            // ==========================================
            // UI BUILD CANVAS
            // ==========================================
            const text = `╭━━〔 📣 NAVYA CAST 〕━━╮

👤 Name   : ${username}
📱 Number : +${number}
🌍 Country: ${userCountry}
🏷️ Role   : ${role}

⚡ Status : Global Query Complete

╰━━━━━━━━━━━━━━━━━━╯`;

            // ==========================================
            // TRANSMIT DATA BUFFER
            // ==========================================
            await sock.sendMessage(from, {
                image: imagePayload, // Dynamically routes raw Buffer payload or { url: link }
                caption: text,
                mentions: [cleanTargetJid]
            }, { quoted: m });

        } catch (err) {
            console.error("GLOBAL CAST ERROR:", err);
            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ An error occurred while parsing this global profile request."
            }, { quoted: m });
        }
    }
};