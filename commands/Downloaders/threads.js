const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "threads",
    aliases: ["threadsdl", "thread"],
    category: "downloader",
    desc: "Downloads media content from Instagram Threads links.",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;

        try {
            const url = args[0]?.trim();
            const prefix = config?.prefix || ".";

            if (!url || !url.includes("threads.net")) {
                return await sock.sendMessage(from, {
                    text: `💡 *Usage:* \`${prefix}threads <Threads Post Link>\``
                }, { quoted: m });
            }

            await sock.sendMessage(from, { text: "📥 Downloading Threads post..." }, { quoted: m });

            const res = await axios.get(`https://api.shizumiaika.xyz/api/downloader/threads?url=${encodeURIComponent(url)}`, { timeout: 15000 });
            const mediaList = res.data?.result?.media || res.data?.result || [];

            if (!mediaList || mediaList.length === 0) {
                return await sock.sendMessage(from, { text: "❌ No downloadable media found in this Threads post." }, { quoted: m });
            }

            for (let item of mediaList) {
                const mediaUrl = typeof item === "string" ? item : item.url;
                const isVideo = mediaUrl.includes(".mp4") || item.type === "video";

                if (isVideo) {
                    await sock.sendMessage(from, { video: { url: mediaUrl }, mimetype: "video/mp4" }, { quoted: m });
                } else {
                    await sock.sendMessage(from, { image: { url: mediaUrl } }, { quoted: m });
                }
            }

        } catch (err) {
            console.error("[THREADS ERROR]:", err);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to fetch Threads media." }, { quoted: m });
        }
    }
};