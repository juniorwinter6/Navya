// commands/chatbot.js
const config = require("../config");

module.exports = {
    name: "chatbot",
    alias: ["aichat", "groupai"],
    category: "owner",
    description: "Toggle automatic AI interaction in WhatsApp groups",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;
        const prefix = config.PREFIX || ".";

        // Check if caller is owner
        const isGroup = from.endsWith('@g.us');
        const senderJid = isGroup ? (m.key.participant || from) : from;
        const senderNumber = senderJid.replace(/[^0-9]/g, '');
        const isFromMe = m.key.fromMe;

        const ownerList = (config.OWNERS || []).map(num => String(num).replace(/[^0-9]/g, ''));
        if (config.OWNER_NUMBER) {
            ownerList.push(String(config.OWNER_NUMBER).replace(/[^0-9]/g, ''));
        }

        const isOwner = isFromMe || ownerList.includes(senderNumber);

        if (!isOwner) {
            await sock.sendMessage(from, { text: "❌ Only bot owners can toggle Group Chatbot status." }, { quoted: m });
            return;
        }

        const option = args[0]?.toLowerCase();

        if (option === "on" || option === "enable") {
            config.CHATBOT = true;
            await sock.sendMessage(from, {
                text: "🤖 *Group AI Chatbot is now ENABLED!*\nBot will now reply to group messages like Gemini."
            }, { quoted: m });
        } else if (option === "off" || option === "disable") {
            config.CHATBOT = false;
            await sock.sendMessage(from, {
                text: "🤖 *Group AI Chatbot is now DISABLED!*"
            }, { quoted: m });
        } else {
            const status = config.CHATBOT ? "ENABLED 🟢" : "DISABLED 🔴";
            await sock.sendMessage(from, {
                text: `🤖 *Group Chatbot Status:* *${status}*\n\n*Usage:*\n• \`${prefix}chatbot on\` - Enable AI in groups\n• \`${prefix}chatbot off\` - Disable AI in groups`
            }, { quoted: m });
        }
    }
};