const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "soundcloud",
    aliases: ["sc", "scdl"],
    category: "downloader",
    desc: "Downloads audio tracks directly from SoundCloud links.",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;

        try {
            const url = args[0]?.trim();
            const prefix = config?.prefix || ".";
            const botName = config?.botName || config?.BOT_NAME || "Navya";

            if (!url || !url.includes("soundcloud.com")) {
                return await sock.sendMessage(from, {
                    text: `💡 *Usage:* \`${prefix}soundcloud <SoundCloud URL>\``
                }, { quoted: m });
            }

            await sock.sendMessage(from, { text: "🎵 Downloading SoundCloud audio..." }, { quoted: m });

            const res = await axios.get(`https://api.shizumiaika.xyz/api/downloader/soundcloud?url=${encodeURIComponent(url)}`, { timeout: 15000 });
            const result = res.data?.result || res.data;

            const downloadUrl = result?.download || result?.url || result?.link;
            const title = result?.title || "SoundCloud Track";

            if (!downloadUrl) {
                return await sock.sendMessage(from, { text: "❌ Could not extract audio from this SoundCloud track." }, { quoted: m });
            }

            await sock.sendMessage(from, {
                audio: { url: downloadUrl },
                mimetype: "audio/mp4",
                fileName: `${title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: title,
                        body: `Downloaded by ${botName}`,
                        mediaType: 1,
                        sourceUrl: url
                    }
                }
            }, { quoted: m });

        } catch (err) {
            console.error("[SOUNDCLOUD ERROR]:", err);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download SoundCloud track." }, { quoted: m });
        }
    }
};