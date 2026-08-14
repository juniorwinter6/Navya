const axios = require('axios');

module.exports = {
    name: "x",
    aliases: ["twitter", "twdl"],
    category: "downloader",
    execute: async (sock, m, args) => {
        const url = args[0];
        if (!url || (!url.includes("twitter.com") && !url.includes("x.com"))) {
            return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a valid Twitter/X post link!" }, { quoted: m });
        }

        try {
            await sock.sendMessage(m.key.remoteJid, { text: "📥 Downloading Twitter video..." }, { quoted: m });
            const res = await axios.get(`https://api.vxtwitter.com/${url.replace(/https?:\/\/(x|twitter)\.com\//, '')}`);
            const media = res.data?.media_extended?.[0];

            if (!media || media.type !== "video") {
                return sock.sendMessage(m.key.remoteJid, { text: "❌ No downloadable video found in this post." }, { quoted: m });
            }

            await sock.sendMessage(m.key.remoteJid, {
                video: { url: media.url },
                caption: `🐦 *Twitter/X Video*\n📝 ${res.data.text || ""}`
            }, { quoted: m });
        } catch (err) {
            console.error("Twitter DL Error:", err);
            sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download Twitter media." }, { quoted: m });
        }
    }
};