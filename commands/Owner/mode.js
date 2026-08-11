const fs = require('fs');
const path = require('path');

module.exports = {
    name: "mode",
    aliases: ["workmode", "setmode"],
    category: "owner",
    execute: async (sock, m, args, { isOwner }) => {
        if (!isOwner) return;

        const from = m.key.remoteJid;
        const modePath = path.join(__dirname, "../../lib/mode.json");
        
        let targetMode = args[0] ? args[0].toLowerCase() : "";

        // Read current saved mode
        let currentSettings = { mode: "public" };
        if (fs.existsSync(modePath)) {
            try {
                currentSettings = JSON.parse(fs.readFileSync(modePath, "utf-8"));
            } catch (e) {
                currentSettings = { mode: "public" };
            }
        }

        // Show status if no argument is provided
        if (!targetMode || (targetMode !== "public" && targetMode !== "private" && targetMode !== "self")) {
            await sock.sendMessage(from, {
                text: `⚙️ *Current Bot Mode:* \`${(currentSettings.mode || "public").toUpperCase()}\`\n\n*Usage:*\n• \`.mode public\` - Responds to everyone\n• \`.mode private\` - Responds ONLY to Owners/SUDO`
            }, { quoted: m });
            return;
        }

        // Normalize "self" alias to "private"
        if (targetMode === "self") targetMode = "private";

        // Update settings and save to disk
        currentSettings.mode = targetMode;
        fs.writeFileSync(modePath, JSON.stringify(currentSettings, null, 2));

        await sock.sendMessage(from, {
            text: `✅ Bot mode has been permanently set to *${targetMode.toUpperCase()}* mode!`
        }, { quoted: m });
    }
};