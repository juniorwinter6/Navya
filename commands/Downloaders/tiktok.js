const axios = require('axios');

module.exports = {
    name: "tiktok",
    aliases: ["tt"],
    category: "downloader",
    execute: async (sock, m, args) => {
        const url = args[0];
        if (!url || !url.includes("tiktok.com")) {
            return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a valid TikTok link!" }, { quoted: m });
        }

        try {
            await sock.sendMessage(m.key.remoteJid, { text: "📥 Fetching TikTok video..." }, { quoted: m });
            const res = await axios.get(`https://api.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            const data = res.data?.data;

            if (!data?.play) return sock.sendMessage(m.key.remoteJid, { text: "❌ Unable to process this video link." }, { quoted: m });

            await sock.sendMessage(m.key.remoteJid, {
                video: { url: data.play },
                caption: `🎬 *${data.title || "TikTok Video"}*\n👤 *Author:* ${data.author?.nickname || "Unknown"}`
            }, { quoted: m });
        } catch (err) {
            console.error("TikTok Downloader Error:", err);
            sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download TikTok video." }, { quoted: m });
        }
    }
};