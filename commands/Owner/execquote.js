const { sendDailyQuote } = require('../../utils/quoteScheduler');

module.exports = {
    name: "execquote",
    aliases: ["sendquote", "testquote"],
    category: "owner",
    execute: async (sock, m, args, { isOwner }) => {
        if (!isOwner) return;
        await sock.sendMessage(m.key.remoteJid, { text: "🚀 Triggering manual quote broadcast..." }, { quoted: m });
        await sendDailyQuote();
    }
};