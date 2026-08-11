const fs = require('fs');
const path = require('path');

module.exports = {
    name: "listsudo",
    aliases: ["getsudo", "sudolist"],
    category: "owner",
    execute: async (sock, m, args, { isOwner }) => {
        if (!isOwner) return;

        const from = m.key.remoteJid;
        const sudoPath = path.join(__dirname, "../../lib/sudo.json");
        let sudoList = [];

        if (fs.existsSync(sudoPath)) {
            try {
                sudoList = JSON.parse(fs.readFileSync(sudoPath, "utf-8"));
            } catch (e) {
                sudoList = [];
            }
        }

        if (!sudoList.length) {
            await sock.sendMessage(from, { text: "📋 *No SUDO users currently registered.*" }, { quoted: m });
            return;
        }

        let text = `👑 *SUDO USERS LIST* (${sudoList.length})\n\n`;
        const mentions = [];

        sudoList.forEach((num, index) => {
            text += `${index + 1}. @${num}\n`;
            mentions.push(`${num}@s.whatsapp.net`);
        });

        await sock.sendMessage(from, { text, mentions }, { quoted: m });
    }
};