const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "tiktok",
    aliases: ["tt", "ttdl", "tiktokdl"],
    category: "downloader",
    desc: "Downloads TikTok videos or photo slideshows without watermark.",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;

        try {
            const url = args[0]?.trim();
            const prefix = config?.prefix || ".";
            const botName = config?.botName || config?.BOT_NAME || "Navya";

            // ==========================================
            // 1. VALIDATE INPUT LINK
            // ==========================================
            if (!url || (!url.includes("tiktok.com") && !url.includes("vt.tiktok.com"))) {
                return await sock.sendMessage(from, {
                    text: `💡 *Usage:* \`${prefix}tiktok <TikTok URL>\`\n\n*Example:*\n\`${prefix}tiktok https://vt.tiktok.com/ZS.../\``
                }, { quoted: m });
            }

            await sock.sendMessage(from, { text: "📥 Fetching TikTok content..." }, { quoted: m });

            let tiktokData = null;

            // ==========================================
            // 2. EXTRACTION MATRIX
            // ==========================================

            // --- ENGINE 1: TikWM Primary Scraper ---
            try {
                console.log("[TIKTOK] Querying TikWM API...");
                const res1 = await axios.post(
                    "https://www.tikwm.com/api/",
                    new URLSearchParams({ url: url, hd: "1" }),
                    {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
                        },
                        timeout: 10000
                    }
                );

                if (res1.data?.data) {
                    tiktokData = {
                        title: res1.data.data.title || "TikTok Content",
                        author: res1.data.data.author?.nickname || res1.data.data.author?.unique_id || "Unknown",
                        video: res1.data.data.play || res1.data.data.hdplay || res1.data.data.wmplay,
                        images: res1.data.data.images || null,
                        music: res1.data.data.music
                    };
                }
            } catch (err1) {
                console.log("[TIKTOK] Engine 1 (TikWM) failed:", err1.message);
            }

            // --- ENGINE 2: Fallback Scraper (Vreden) ---
            if (!tiktokData || (!tiktokData.video && !tiktokData.images)) {
                try {
                    console.log("[TIKTOK] Trying Fallback Engine 2 (Vreden)...");
                    const res2 = await axios.get(`https://api.vreden.web.id/api/tiktok?url=${encodeURIComponent(url)}`, { timeout: 10000 });
                    const result2 = res2.data?.result;

                    if (result2) {
                        tiktokData = {
                            title: result2.title || "TikTok Content",
                            author: result2.author?.nickname || "Unknown",
                            video: result2.video || result2.nowatermark || result2.play,
                            images: result2.images || null
                        };
                    }
                } catch (err2) {
                    console.log("[TIKTOK] Engine 2 (Vreden) failed:", err2.message);
                }
            }

            // ==========================================
            // 3. SEND MEDIA CONTENT
            // ==========================================
            if (!tiktokData || (!tiktokData.video && !tiktokData.images)) {
                return await sock.sendMessage(from, {
                    text: "❌ Could not download TikTok media. Please check if the video link is public and valid."
                }, { quoted: m });
            }

            const captionText = `🎬 *${tiktokData.title}*\n👤 *Author:* ${tiktokData.author}\n\nDownloaded by ${botName}`;

            // Case A: Send Video
            if (tiktokData.video) {
                return await sock.sendMessage(from, {
                    video: { url: tiktokData.video },
                    mimetype: "video/mp4",
                    caption: captionText
                }, { quoted: m });
            }

            // Case B: Send Image Slideshow (Carousel)
            if (tiktokData.images && tiktokData.images.length > 0) {
                await sock.sendMessage(from, { text: `📸 *TikTok Photo Post* (${tiktokData.images.length} images)\nSending slides...` }, { quoted: m });

                for (let i = 0; i < tiktokData.images.length; i++) {
                    await sock.sendMessage(from, {
                        image: { url: tiktokData.images[i] },
                        caption: `Slide [${i + 1}/${tiktokData.images.length}] • ${botName}`
                    }, { quoted: m });

                    // Brief delay between images
                    await new Promise(r => setTimeout(r, 800));
                }
            }

        } catch (err) {
            console.error("[TIKTOK CRITICAL ERROR]:", err);
            await sock.sendMessage(from, {
                text: "❌ An error occurred while processing the TikTok video."
            }, { quoted: m });
        }
    }
};