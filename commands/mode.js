// commands/mode.js
const config = require("../config");

module.exports = {
    name: "mode",
    alias: ["workmode", "setmode"],
    category: "owner",
    description: "Switch bot mode between public and private",

    async execute(sock, m, args) {
        // 1. Setup local variables
        const from = m.key.remoteJid;
        const prefix = config.PREFIX || "!";

        // 2. Safely verify owner status internally
        const isGroup = from.endsWith('@g.us');
        const senderJid = isGroup ? (m.key.participant || from) : from;
        const senderNumber = senderJid.replace(/[^0-9]/g, '');
        const isFromMe = m.key.fromMe;

        const ownerList = (config.OWNERS || []).map(num => String(num).replace(/[^0-9]/g, ''));
        if (config.OWNER_NUMBER) {
            ownerList.push(String(config.OWNER_NUMBER).replace(/[^0-9]/g, ''));
        }

        const isOwner = isFromMe || ownerList.includes(senderNumber) || senderJid.includes("100399675609189");

        // 3. Guard check: Restrict to owners
        if (!isOwner) {
            await sock.sendMessage(from, {
                text: "❌ Only bot owners can change the bot mode."
            }, { quoted: m });
            return;
        }

        const newMode = args[0]?.toLowerCase();

        // 4. Handle mode change
        if (newMode === "public" || newMode === "private") {
            config.MODE = newMode;

            const modeEmoji = config.MODE === "private" ? "🔒" : "🌐";
            const modeDesc = config.MODE === "private"
                ? "Bot will now only respond to owners."
                : "Bot will now respond to everyone.";

            await sock.sendMessage(from, {
                text: `✅ *Bot Mode Updated!*\n\nStatus: *${config.MODE.toUpperCase()}* ${modeEmoji}\n${modeDesc}`
            }, { quoted: m });
        } else {
            // 5. Show current status & help
            await sock.sendMessage(from, {
                text: `⚙️ *Current Mode:* *${(config.MODE || "private").toUpperCase()}*\n\n*Usage:*\n• \`${prefix}mode public\` - Enable Public Mode\n• \`${prefix}mode private\` - Enable Private Mode`
            }, { quoted: m });
        }
    }
};