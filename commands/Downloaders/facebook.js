const axios = require("axios");
const config = require("../../config");

// Safely require ruhend-scraper if installed
let ruhendFb = null;
try {
    ruhendFb = require("ruhend-scraper").fbdown;
} catch (e) {
    console.log("[FB INIT] ruhend-scraper module not found for facebook. Relying on API endpoints.");
}

module.exports = {
    name: "facebook",
    aliases: ["fb", "fbdl", "facebookdl", "fbreel", "fbreels"],
    category: "downloader",
    desc: "Downloads Facebook videos and reels in high quality with bulletproof fallback APIs.",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;

        try {
            const url = args[0]?.trim();
            const prefix = config?.prefix || ".";
            const botName = config?.botName || config?.BOT_NAME || "Navya";

            // ==========================================
            // 1. VALIDATE INPUT LINK
            // ==========================================
            if (!url || (!url.includes("facebook.com") && !url.includes("fb.watch") && !url.includes("fb.gg"))) {
                return await sock.sendMessage(from, {
                    text: `💡 *Usage:* \`${prefix}facebook <Facebook Video/Reel URL>\`\n\n*Example:*\n\`${prefix}facebook https://www.facebook.com/reel/123456789/\``
                }, { quoted: m });
            }

            await sock.sendMessage(from, { react: { text: "📥", key: m.key } });
            await sock.sendMessage(from, { text: "⏳ Fetching Facebook video... Please wait." }, { quoted: m });

            let videoUrl = null;
            let videoTitle = "Facebook Video";

            // ==========================================
            // 2. EXTRACTION MATRIX
            // ==========================================

            // --- ENGINE 0: ruhend-scraper (Local package) ---
            if (ruhendFb) {
                try {
                    console.log("[FB DOWNLOADER] Trying Engine 0 (ruhend-scraper)...");
                    const res0 = await ruhendFb(url);
                    if (res0) {
                        videoUrl = res0.hd || res0.sd || res0.url || res0.downloadUrl;
                        if (res0.title) videoTitle = res0.title;
                    }
                } catch (err0) {
                    console.log("[FB DOWNLOADER] Engine 0 failed:", err0.message);
                }
            }

            // --- ENGINE 1: Shizumi API ---
            if (!videoUrl) {
                try {
                    console.log("[FB DOWNLOADER] Trying Engine 1 (Shizumi API)...");
                    const res1 = await axios.get(`https://api.shizumiaika.xyz/api/downloader/facebook?url=${encodeURIComponent(url)}`, { timeout: 12000 });
                    const result1 = res1.data?.result;

                    if (result1) {
                        videoUrl = result1.hd || result1.sd || result1.video || (Array.isArray(result1) ? result1[0]?.url : result1.url);
                        if (result1.title) videoTitle = result1.title;
                    }
                } catch (err1) {
                    console.log("[FB DOWNLOADER] Engine 1 failed:", err1.message);
                }
            }

            // --- ENGINE 2: Siputzx API ---
            if (!videoUrl) {
                try {
                    console.log("[FB DOWNLOADER] Trying Engine 2 (Siputzx API)...");
                    const res2 = await axios.get(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`, { timeout: 12000 });
                    const result2 = res2.data?.data || res2.data;

                    if (result2) {
                        videoUrl = result2.hd || result2.sd || result2.urls?.[0]?.hd || result2.urls?.[0]?.sd;
                    }
                } catch (err2) {
                    console.log("[FB DOWNLOADER] Engine 2 failed:", err2.message);
                }
            }

            // --- ENGINE 3: Browser-Header Bypass Engine (FB-Watch/Snapsave) ---
            if (!videoUrl) {
                try {
                    console.log("[FB DOWNLOADER] Trying Engine 3 (Browser Header Form)...");
                    const res3 = await axios.post("https://getmyfb.com/process",
                        new URLSearchParams({
                            id: url,
                            locale: "en"
                        }), {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
                            "X-Requested-With": "XMLHttpRequest",
                            "Origin": "https://getmyfb.com",
                            "Referer": "https://getmyfb.com/"
                        },
                        timeout: 12000
                    }
                    );

                    const html = res3.data?.html || "";
                    const matches = html.match(/href="(https:\/\/[^"]+)"/g);
                    if (matches && matches.length > 0) {
                        const cleanLinks = matches
                            .map(m => m.replace(/^href="|"$'/g, "").replace(/&amp;/g, "&"))
                            .filter(l => l.includes("fbcdn.net") || l.includes("video"));

                        if (cleanLinks.length > 0) {
                            videoUrl = cleanLinks[0];
                        }
                    }
                } catch (err3) {
                    console.log("[FB DOWNLOADER] Engine 3 failed:", err3.message);
                }
            }

            // ==========================================
            // 3. SEND VIDEO TO CHAT
            // ==========================================
            if (!videoUrl) {
                return await sock.sendMessage(from, {
                    text: "❌ Unable to extract this Facebook video.\n\n" +
                        "• Ensure the post/reel is from a **public** page or group.\n" +
                        "• Private videos or age-restricted posts cannot be downloaded."
                }, { quoted: m });
            }

            console.log("[FB DOWNLOADER] ✅ SUCCESS! Sending video URL:", videoUrl);

            await sock.sendMessage(from, {
                video: { url: videoUrl },
                mimetype: "video/mp4",
                caption: `📹 *${videoTitle}*\n\nDownloaded by ${botName}`
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: "✅", key: m.key } });

        } catch (err) {
            console.error("[FB DOWNLOADER CRITICAL ERROR]:", err);
            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ An internal exception occurred while downloading the Facebook video."
            }, { quoted: m });
        }
    }
};