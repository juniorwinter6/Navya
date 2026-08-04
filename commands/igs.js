const axios = require("axios");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "igs",
    aliases: ["igpost", "igsticker"],
    category: "downloader",
    desc: "Converts Instagram post media directly into WhatsApp stickers via heavy-duty parsing engines.",

    async execute(sock, m, args) {
        try {
            const from = m.key.remoteJid;

            // ==========================================
            // 1. VALIDATE INPUT LINK
            // ==========================================
            if (!args || args.length === 0) {
                return await sock.sendMessage(from, {
                    text: `💡 *Usage:* \`!igs <Instagram Post/Reel URL>\`\n\n` +
                        `*Example:*\n\`!igs https://www.instagram.com/p/C_xYz7vS2_x/\``
                }, { quoted: m });
            }

            const url = args[0].trim();
            if (!url.includes("instagram.com")) {
                return await sock.sendMessage(from, {
                    text: "❌ Invalid URL. Please provide a valid Instagram Post, Reel, or IGTV link."
                }, { quoted: m });
            }

            await sock.sendMessage(from, { text: "⏳ Querying operational delivery clusters... Processing stickers now." }, { quoted: m });

            // ==========================================
            // 2. UPDATED HIGH-AVAILABILITY EXTRACTION MATRIX
            // ==========================================
            let mediaUrls = [];

            // --- CLUSTER ENG 1: Modern Vreden Media Scraper ---
            try {
                const res1 = await axios.get(`https://api.vreden.web.id/api/instagram?url=${encodeURIComponent(url)}`, { timeout: 10000 });
                if (res1.data?.result && res1.data.result.length > 0) {
                    mediaUrls = res1.data.result.map(item => typeof item === "string" ? item : item.url || item.downloadUrl).filter(Boolean);
                } else if (res1.data?.result?.url) {
                    // Handle single asset objects cleanly
                    mediaUrls = [res1.data.result.url];
                }
            } catch (err) {
                console.log("Vreden extraction dropped, shifting to Cluster 2...");
            }

            // --- CLUSTER ENG 2: Shizumi Dedicated Bypass Engine ---
            if (mediaUrls.length === 0) {
                try {
                    const res2 = await axios.get(`https://api.shizumiaika.xyz/api/downloader/instagram?url=${encodeURIComponent(url)}`, { timeout: 10000 });
                    if (res2.data?.result?.media) {
                        mediaUrls = res2.data.result.media.filter(Boolean);
                    } else if (res2.data?.result && res2.data.result.length > 0) {
                        mediaUrls = res2.data.result.map(item => typeof item === "string" ? item : item.url).filter(Boolean);
                    }
                } catch (err) {
                    console.log("Shizumi extraction dropped, running structural fallbacks...");
                }
            }

            // --- CLUSTER ENG 3: Legacy Token Core Scraper ---
            if (mediaUrls.length === 0) {
                try {
                    const res3 = await axios.get(`https://api.botcahx.eu.org/api/dowloader/igdownder?url=${url}&apikey=Anya-V2`, { timeout: 8000 });
                    if (res3.data?.result) {
                        mediaUrls = res3.data.result.map(item => typeof item === "string" ? item : item.url).filter(Boolean);
                    }
                } catch (err) {
                    console.log("All primary extraction blocks exhausted.");
                }
            }

            // ==========================================
            // 3. INTEGRITY SANITATION CHECK
            // ==========================================
            if (mediaUrls.length === 0) {
                return await sock.sendMessage(from, {
                    text: "❌ Instagram extraction blocked. All active session pools are dropping connection handles for this URL link.\n\n" +
                        "• Ensure the account is **public**.\n" +
                        "• Double-check if the source post hasn't been archived or removed by the author."
                }, { quoted: m });
            }

            // Process a max of 3 items to optimize server performance limits
            const finalMediaList = mediaUrls.slice(0, 3);

            // ==========================================
            // 4. LOCAL FFMPEG WEBPC TRANSCODING PIPELINE
            // ==========================================
            for (let i = 0; i < finalMediaList.length; i++) {
                const mediaUrl = finalMediaList[i];
                const isVideo = mediaUrl.includes(".mp4") || mediaUrl.includes("video") || mediaUrl.includes("cdninstagram") || mediaUrl.includes("_v_");

                // Save temp file handles natively into the current operating subfolder directory
                const inputPath = path.join(__dirname, `tmp_in_${Date.now()}_${i}`);
                const outputPath = path.join(__dirname, `tmp_out_${Date.now()}_${i}.webp`);

                try {
                    const response = await axios({
                        method: "get",
                        url: mediaUrl,
                        responseType: "stream"
                    });

                    const writer = fs.createWriteStream(inputPath);
                    response.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on("finish", resolve);
                        writer.on("error", reject);
                    });

                    // Execute atomic hardware FFmpeg transcoding matrices
                    if (isVideo) {
                        await new Promise((resolve, reject) => {
                            exec(`ffmpeg -i "${inputPath}" -vcodec libwebp -filter_complex "scale='min(512,iw)':-1,fps=10,crop=512:512" -loop 0 -preset default -an -vsync 0 -s 512x512 "${outputPath}"`, (error) => {
                                if (error) reject(error);
                                else resolve();
                            });
                        });
                    } else {
                        await new Promise((resolve, reject) => {
                            exec(`ffmpeg -i "${inputPath}" -vcodec libwebp -vf "scale='max(in_w,in_h)':-1,scale=512:512:force_original_aspect_ratio=decrease,fps=10,pad=512:512:(512-iw)/2:(512-ih)/2:color=white@0" "${outputPath}"`, (error) => {
                                if (error) reject(error);
                                else resolve();
                            });
                        });
                    }

                    if (fs.existsSync(outputPath)) {
                        await sock.sendMessage(from, {
                            sticker: fs.readFileSync(outputPath)
                        }, { quoted: m });
                    }

                } catch (procErr) {
                    console.error(`Transcoding matrix exception at slide index [${i}]:`, procErr);
                } finally {
                    // Safe cleanup of local assets
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                }
            }

        } catch (err) {
            console.error("IG POST STICKER CRITICAL ERROR:", err);
            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ An internal exception occurred while formatting the output stickers."
            }, { quoted: m });
        }
    }
};