const fs = require('fs');
const path = require('path');
// '../' tells the bot to look outside the commands folder into the main folder
const statsFile = path.join(__dirname, '../chat_stats.json');

module.exports = {
    name: "stats",
    async execute(sock, msg, args) {
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        if (!isGroup) {
            return await sock.sendMessage(from, { text: "❌ This command can only be used inside group chats to display active user metrics!" }, { quoted: msg });
        }

        if (!fs.existsSync(statsFile)) {
            return await sock.sendMessage(from, { text: "📊 No message metrics data recorded yet. Start chatting!" }, { quoted: msg });
        }

        try {
            const stats = JSON.parse(fs.readFileSync(statsFile));
            const groupStats = stats[from];

            if (!groupStats || Object.keys(groupStats).length === 0) {
                return await sock.sendMessage(from, { text: "📊 No metrics collected for this group yet. Keep chatting to start tracking stats!" }, { quoted: msg });
            }

            // Sort data down tracking the top 5 highest chat members
            const sortedUsers = Object.entries(groupStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5);

            let messageBody = "📊 *TOP 5 ACTIVE CHAT LEADERS*\n\n";
            const mentionsArray = [];

            sortedUsers.forEach(([userJid, messageCount], index) => {
                const numericString = userJid.split('@')[0];
                mentionsArray.push(userJid);
                messageBody += `${index + 1}. @${numericString} — *${messageCount} messages*\n`;
            });

            await sock.sendMessage(from, {
                text: messageBody,
                mentions: mentionsArray
            }, { quoted: msg });

        } catch (error) {
            console.error("Stats processing error:", error);
            await sock.sendMessage(from, { text: "❌ Unable to calculate leader metrics score database arrays." }, { quoted: msg });
        }
    }
};