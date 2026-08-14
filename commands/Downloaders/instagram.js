const { igdl } = require("ruhend-scraper");
const config = require("../../config");

// ======================
// PREVENT DUPLICATES
// ======================
const processedMessages = new Set();

module.exports = {
    name: "instagram",
    aliases: [
        "ig",
        "insta",
        "reels",
        "igdl"
    ],

    async execute(sock, m, args) {
        try {
            const from = m.key.remoteJid;

            // ======================
            // DUPLICATE CHECK
            // ======================
            if (processedMessages.has(m.key.id)) return;

            processedMessages.add(m.key.id);

            setTimeout(() => {
                processedMessages.delete(m.key.id);
            }, 5 * 60 * 1000);

            const text = args.join(" ");

            // Fetch bot name with fallbacks
            const botName = config.botName || config.BOT_NAME || "Navya";
            const prefix = config.prefix || ".";

            // ======================
            // NO URL
            // ======================
            if (!text) {
                return sock.sendMessage(
                    from,
                    {
                        text: `📥 *Instagram Downloader*\n\n*Usage:*\n${prefix}ig <Instagram URL>\n\n*Example:*\n${prefix}ig https://www.instagram.com/reel/xxxx/`
                    },
                    { quoted: m }
                );
            }

            // ======================
            // VALIDATE URL
            // ======================
            const instagramPatterns = [
                /https?:\/\/(?:www\.)?instagram\.com\//,
                /https?:\/\/(?:www\.)?instagr\.am\//
            ];

            const isValidUrl = instagramPatterns.some(pattern => pattern.test(text));

            if (!isValidUrl) {
                return sock.sendMessage(
                    from,
                    { text: "❌ Invalid Instagram URL." },
                    { quoted: m }
                );
            }

            // ======================
            // REACTION
            // ======================
            await sock.sendMessage(from, {
                react: {
                    text: "📥",
                    key: m.key
                }
            });

            // ======================
            // DOWNLOAD
            // ======================
            const downloadData = await igdl(text);

            console.log("IG RESPONSE:", JSON.stringify(downloadData, null, 2));

            // ======================
            // HANDLE ARRAY/OBJECT RESPONSE
            // ======================
            const rawMediaList = Array.isArray(downloadData)
                ? downloadData
                : downloadData?.data || downloadData?.result || [];

            if (!rawMediaList || rawMediaList.length === 0) {
                return sock.sendMessage(
                    from,
                    { text: "❌ No media found." },
                    { quoted: m }
                );
            }

            // Standardize media URLs into strings
            const mediaToDownload = rawMediaList
                .map(item => (typeof item === "object" ? item.url || item.link || item.downloadUrl : item))
                .filter(Boolean);

            if (mediaToDownload.length === 0) {
                return sock.sendMessage(
                    from,
                    { text: "❌ Could not extract valid media download link." },
                    { quoted: m }
                );
            }

            // ======================
            // SEND MEDIA
            // ======================
            for (let i = 0; i < mediaToDownload.length; i++) {
                try {
                    const mediaUrl = mediaToDownload[i];

                    console.log("SENDING:", mediaUrl);

                    // ======================
                    // DETECT VIDEO
                    // ======================
                    const isVideo =
                        mediaUrl.includes(".mp4") ||
                        /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) ||
                        text.includes("/reel/") ||
                        text.includes("/tv/");

                    const captionText = `Downloaded by ${botName}`;

                    // ======================
                    // SEND VIDEO
                    // ======================
                    if (isVideo) {
                        await sock.sendMessage(
                            from,
                            {
                                video: { url: mediaUrl },
                                mimetype: "video/mp4",
                                caption: captionText
                            },
                            { quoted: m }
                        );
                    }
                    // ======================
                    // SEND IMAGE
                    // ======================
                    else {
                        await sock.sendMessage(
                            from,
                            {
                                image: { url: mediaUrl },
                                caption: captionText
                            },
                            { quoted: m }
                        );
                    }

                    // ======================
                    // DELAY BETWEEN MEDIA
                    // ======================
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (mediaError) {
                    console.log("MEDIA ERROR:", mediaError);
                }
            }

        } catch (err) {
            console.log("INSTAGRAM ERROR:", err);

            await sock.sendMessage(
                m.key.remoteJid,
                { text: "❌ Instagram download failed." },
                { quoted: m }
            );
        }
    }
};