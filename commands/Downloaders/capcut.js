const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "capcut",
    aliases: ["capcutdl", "cc"],
    category: "downloader",
    desc: "Downloads clean CapCut template videos without watermarks.",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;

        try {
            const url = args[0]?.trim();
            const prefix = config?.prefix || ".";
            const botName = config?.botName || config?.BOT_NAME || "Navya";

            if (!url || !url.includes("capcut.com")) {
                return await sock.sendMessage(from, {
                    text: `💡 *Usage:* \`${prefix}capcut <CapCut Template Link>\``
                }, { quoted: m });
            }

            await sock.sendMessage(from, { text: "🎬 Processing CapCut video..." }, { quoted: m });

            const res = await axios.get(`https://api.shizumiaika.xyz/api/downloader/capcut?url=${encodeURIComponent(url)}`, { timeout: 15000 });
            const result = res.data?.result || res.data;

            const videoUrl = result?.video || result?.original_video_url || result?.download;
            const title = result?.title || "CapCut Template";

            if (!videoUrl) {
                return await sock.sendMessage(from, { text: "❌ Could not extract video from this CapCut link." }, { quoted: m });
            }

            await sock.sendMessage(from, {
                video: { url: videoUrl },
                mimetype: "video/mp4",
                caption: `🎬 *${title}*\n\nDownloaded by ${botName}`
            }, { quoted: m });

        } catch (err) {
            console.error("[CAPCUT ERROR]:", err);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download CapCut video." }, { quoted: m });
        }
    }
};