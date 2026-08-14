const axios = require("axios");
const yts = require("yt-search");
const ytDlp = require("yt-dlp-exec");
const fs = require("fs");
const path = require("path");
const config = require("../../config");

module.exports = {
    name: "spotify",
    aliases: ["spot", "spotdl", "sp"],
    category: "downloader",
    desc: "Downloads Spotify tracks using auto-managed yt-dlp.",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;

        try {
            const rawUrl = args[0]?.trim();
            const prefix = config?.prefix || ".";
            const botName = config?.botName || config?.BOT_NAME || "Navya";

            if (!rawUrl || !rawUrl.includes("spotify.com/track")) {
                return await sock.sendMessage(from, {
                    text: `💡 *Usage:* \`${prefix}spotify <Spotify Track URL>\`\n\n*Example:*\n\`${prefix}spotify https://open.spotify.com/track/7w5Je2ouh5Zxp5nfaGitvy\``
                }, { quoted: m });
            }

            const cleanUrl = rawUrl.split("?")[0];

            await sock.sendMessage(from, { react: { text: "🎧", key: m.key } });
            await sock.sendMessage(from, { text: "⏳ Extracting Spotify metadata..." }, { quoted: m });

            // ==========================================
            // 1. FETCH SPOTIFY METADATA
            // ==========================================
            let trackTitle = "";
            let thumbnail = null;

            try {
                const embedRes = await axios.get(`https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`, { timeout: 10000 });
                trackTitle = embedRes.data?.title || "";
                thumbnail = embedRes.data?.thumbnail_url || null;
            } catch (errMeta) {
                console.log("[SPOTIFY] oEmbed lookup failed:", errMeta.message);
            }

            if (!trackTitle) {
                return await sock.sendMessage(from, {
                    text: "❌ Could not retrieve track info from Spotify. Make sure the link is public."
                }, { quoted: m });
            }

            console.log(`[SPOTIFY] Track Found: "${trackTitle}". Locating audio match...`);

            // ==========================================
            // 2. SEARCH MATCHING YOUTUBE VIDEO
            // ==========================================
            const searchResult = await yts(trackTitle);
            const video = searchResult?.videos?.[0];

            if (!video || !video.url) {
                return await sock.sendMessage(from, {
                    text: `❌ Audio stream for "*${trackTitle}*" could not be matched.`
                }, { quoted: m });
            }

            await sock.sendMessage(from, { text: `📥 Downloading audio for *${trackTitle}*...` }, { quoted: m });

            // ==========================================
            // 3. DOWNLOAD AUDIO VIA YT-DLP-EXEC
            // ==========================================
            const tempFilePath = path.join(__dirname, `spot_tmp_${Date.now()}.mp3`);

            try {
                await ytDlp(video.url, {
                    extractAudio: true,
                    audioFormat: "mp3",
                    output: tempFilePath,
                    noCheckCertificates: true,
                    noWarnings: true,
                    preferFreeFormats: true
                });

                if (fs.existsSync(tempFilePath)) {
                    const audioBuffer = fs.readFileSync(tempFilePath);

                    await sock.sendMessage(from, {
                        document: audioBuffer,
                        mimetype: "audio/mpeg",
                        fileName: `${trackTitle.replace(/[^a-zA-Z0-9 ]/g, "")}.mp3`,
                        caption: `🎵 *${trackTitle}*\nDownloaded via ${botName}`
                    }, { quoted: m });

                    await sock.sendMessage(from, { react: { text: "✅", key: m.key } });

                    // Cleanup temp file
                    fs.unlinkSync(tempFilePath);
                    return;
                }
            } catch (errYt) {
                console.error("[SPOTIFY] yt-dlp-exec error:", errYt.message || errYt);
            }

            // Cleanup if failed
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

            return await sock.sendMessage(from, {
                text: "❌ Failed to render the audio stream for this track."
            }, { quoted: m });

        } catch (err) {
            console.error("[SPOTIFY CRITICAL ERROR]:", err);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download Spotify track." }, { quoted: m });
        }
    }
};