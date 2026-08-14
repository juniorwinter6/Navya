const axios = require("axios");
const config = require("../../config");

// prevent duplicate processing
const processedMessages = new Set();

module.exports = {
    name: "pinterest",
    aliases: ["pin", "pindl", "pins"],

    async execute(sock, m, args) {
        try {
            // ======================
            // DUPLICATE CHECK
            // ======================
            if (processedMessages.has(m.key.id)) return;

            processedMessages.add(m.key.id);
            setTimeout(() => {
                processedMessages.delete(m.key.id);
            }, 5 * 60 * 1000);

            const from = m.key.remoteJid;
            const text = args.join(" ").trim();

            // ======================
            // NO INPUT
            // ======================
            if (!text) {
                return sock.sendMessage(from, {
                    text: `📌 *PINTEREST DOWNLOADER & SEARCH*\n\n*Usage:*\n• Download Link: \`${config.prefix}pinterest <Pinterest URL>\` \n• Image Search: \`${config.prefix}pinterest <Search Query>\` \n\n*Examples:*\n• ${config.prefix}pinterest https://pin.it/xxxxx\n• ${config.prefix}pinterest dark anime aesthetic`
                }, { quoted: m });
            }

            // ======================
            // URL DETECTION
            // ======================
            let urlMatch = text.match(/https?:\/\/[^\s]*pinterest[^\s]*/i) || text.match(/https?:\/\/pin\.it\/[^\s]+/i);

            // React with search icon
            await sock.sendMessage(from, {
                react: { text: "🔍", key: m.key }
            });

            // ----------------------------------------------------
            // MODE 1: URL DOWNLOADER
            // ----------------------------------------------------
            if (urlMatch) {
                const pinterestUrl = urlMatch[0];
                const apiUrl = `https://api.nexray.web.id/downloader/pinterest?url=${encodeURIComponent(pinterestUrl)}`;

                const response = await axios.get(apiUrl, {
                    timeout: 30000,
                    headers: { "User-Agent": "Mozilla/5.0" }
                });

                if (!response.data || !response.data.status || !response.data.result) {
                    return sock.sendMessage(from, { text: "❌ Failed to fetch Pinterest content." }, { quoted: m });
                }

                const pinData = response.data.result;
                const isVideo = !!pinData.video;
                const mediaUrl = pinData.video || pinData.image || pinData.url;
                const title = pinData.title || "Pinterest Pin";
                const author = pinData.author || "Unknown";

                if (!mediaUrl) {
                    return sock.sendMessage(from, { text: "❌ No media found for this link." }, { quoted: m });
                }

                // Clean caption string without non-breaking whitespace issues
                const caption = `📌 *${title}*\n👤 *Author:* ${author}\n\n© ${config.botName || "Navya"}`;

                if (isVideo) {
                    const videoResponse = await axios.get(mediaUrl, {
                        responseType: "arraybuffer",
                        timeout: 120000,
                        headers: { "User-Agent": "Mozilla/5.0" }
                    });

                    return sock.sendMessage(from, {
                        video: Buffer.from(videoResponse.data),
                        caption
                    }, { quoted: m });
                } else {
                    // Fetch image as Buffer to force mobile apps to render caption reliably
                    const imgResponse = await axios.get(mediaUrl, {
                        responseType: "arraybuffer",
                        timeout: 30000,
                        headers: { "User-Agent": "Mozilla/5.0" }
                    });

                    return sock.sendMessage(from, {
                        image: Buffer.from(imgResponse.data),
                        caption
                    }, { quoted: m });
                }
            }

            // ----------------------------------------------------
            // MODE 2: SEARCH ENGINE
            // ----------------------------------------------------
            else {
                let imageUrl = null;

                // Provider 1: Delirius API (Real Pinterest Search)
                try {
                    const res = await axios.get(`https://deliriussapi-official.vercel.app/search/pinterest?text=${encodeURIComponent(text)}`, { timeout: 10000 });
                    if (res.data && res.data.data && res.data.data.length > 0) {
                        const list = res.data.data;
                        const randomItem = list[Math.floor(Math.random() * Math.min(list.length, 10))];
                        imageUrl = randomItem.image || randomItem.url;
                    }
                } catch (e) {
                    console.log("Pinterest Search API 1 failed, attempting backup...");
                }

                // Provider 2: Pollinations Engine (Aesthetic Fallback)
                if (!imageUrl) {
                    try {
                        const prompt = encodeURIComponent(`pinterest aesthetic ${text}`);
                        imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=800&height=1000&seed=${Math.floor(Math.random() * 10000)}&nologo=true`;
                    } catch (e) {
                        console.log("Image generator failed.");
                    }
                }

                if (!imageUrl) {
                    return sock.sendMessage(from, {
                        text: `❌ Could not find search results for: *${text}*\nPlease try using a direct Pinterest URL.`
                    }, { quoted: m });
                }

                const searchCaption = `📌 *PINTEREST / IMAGE SEARCH*\n\n🔎 *Query:* ${text}\n\n© ${config.botName || "Navya"}`;

                return sock.sendMessage(from, {
                    image: { url: imageUrl },
                    caption: searchCaption
                }, { quoted: m });
            }

        } catch (err) {
            console.log("PINTEREST ERROR:", err);
            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ Pinterest request failed. Please try again in a moment."
            }, { quoted: m });
        }
    }
};