const axios = require("axios");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Safely require ruhend-scraper if installed
let ruhendIgdl = null;
try {
    ruhendIgdl = require("ruhend-scraper").igdl;
} catch (e) {
    console.log("[IGS INIT] ruhend-scraper module not found. Will rely on API endpoints.");
}

module.exports = {
    name: "igs",
    aliases: ["igpost", "igsticker"],
    category: "downloader",
    desc: "Converts Instagram post media directly into WhatsApp stickers with multi-carousel support.",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;

        try {
            console.log("\n=================== [IGS PROCESS START] ===================");

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

            if (!url.includes("instagram.com") && !url.includes("instagr.am")) {
                return await sock.sendMessage(from, {
                    text: "❌ Invalid URL. Please provide a valid Instagram Post, Reel, or IGTV link."
                }, { quoted: m });
            }

            await sock.sendMessage(from, { text: "⏳ Processing Instagram carousel stickers... Please wait." }, { quoted: m });

            // ==========================================
            // 2. EXTRACTION MATRIX
            // ==========================================
            let mediaUrls = [];

            // --- ENGINE 0: ruhend-scraper ---
            if (ruhendIgdl) {
                try {
                    const res0 = await ruhendIgdl(url);
                    const list0 = Array.isArray(res0) ? res0 : res0?.data || res0?.result || [];
                    mediaUrls = list0.map(item => typeof item === "object" ? item.url || item.link || item.downloadUrl : item).filter(Boolean);
                } catch (err0) {
                    console.log("[IGS] Engine 0 (ruhend) skipped.");
                }
            }

            // --- ENGINE 1: Vreden API ---
            if (mediaUrls.length === 0) {
                try {
                    const res1 = await axios.get(`https://api.vreden.web.id/api/instagram?url=${encodeURIComponent(url)}`, { timeout: 12000 });
                    if (res1.data?.result && Array.isArray(res1.data.result) && res1.data.result.length > 0) {
                        mediaUrls = res1.data.result.map(item => typeof item === "string" ? item : item.url || item.downloadUrl).filter(Boolean);
                    } else if (res1.data?.result?.url) {
                        mediaUrls = [res1.data.result.url];
                    }
                } catch (err1) {
                    console.log("[IGS] Engine 1 (Vreden) skipped.");
                }
            }

            // --- ENGINE 2: Shizumi API ---
            if (mediaUrls.length === 0) {
                try {
                    const res2 = await axios.get(`https://api.shizumiaika.xyz/api/downloader/instagram?url=${encodeURIComponent(url)}`, { timeout: 12000 });
                    if (res2.data?.result?.media) {
                        mediaUrls = res2.data.result.media.filter(Boolean);
                    } else if (res2.data?.result && Array.isArray(res2.data.result)) {
                        mediaUrls = res2.data.result.map(item => typeof item === "string" ? item : item.url).filter(Boolean);
                    }
                } catch (err2) {
                    console.log("[IGS] Engine 2 (Shizumi) skipped.");
                }
            }

            if (mediaUrls.length === 0) {
                return await sock.sendMessage(from, {
                    text: "❌ Instagram extraction blocked or link expired. Ensure the account is **public**."
                }, { quoted: m });
            }

            // Cap at 12 items to support full carousel posts safely
            const finalMediaList = mediaUrls.slice(0, 12);
            console.log(`[IGS] Extracted ${finalMediaList.length} total items to process.`);

            // ==========================================
            // 3. TRANSCODING & CONVERSION PIPELINE
            // ==========================================
            for (let i = 0; i < finalMediaList.length; i++) {
                const mediaUrl = finalMediaList[i];
                const isVideo = mediaUrl.includes(".mp4") ||
                    mediaUrl.includes("video") ||
                    mediaUrl.includes("_v_") ||
                    url.includes("/reel/");

                const fileExt = isVideo ? ".mp4" : ".jpg";
                const inputPath = path.join(__dirname, `tmp_in_${Date.now()}_${i}${fileExt}`);
                const outputPath = path.join(__dirname, `tmp_out_${Date.now()}_${i}.webp`);

                try {
                    // Stream Download
                    const response = await axios({
                        method: "get",
                        url: mediaUrl,
                        responseType: "stream",
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
                        }
                    });

                    const writer = fs.createWriteStream(inputPath);
                    response.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on("finish", resolve);
                        writer.on("error", reject);
                    });

                    // WHATSAPP OPTIMIZED FFMPEG COMMANDS
                    let ffmpegCmd = "";
                    if (isVideo) {
                        ffmpegCmd = `ffmpeg -y -i "${inputPath}" -t 6 -vcodec libwebp -filter_complex "scale=512:512:force_original_aspect_ratio=decrease,fps=10,pad=512:512:(512-iw)/2:(512-ih)/2:color=0x00000000" -q:v 40 -loop 0 -preset default -an -vsync 0 "${outputPath}"`;
                    } else {
                        ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vcodec libwebp -filter_complex "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(512-iw)/2:(512-ih)/2:color=0x00000000" -q:v 60 "${outputPath}"`;
                    }

                    await new Promise((resolve, reject) => {
                        exec(ffmpegCmd, (error) => {
                            if (error) reject(error);
                            else resolve();
                        });
                    });

                    // File size optimization check (WhatsApp limit ~1MB)
                    if (fs.existsSync(outputPath)) {
                        const outStats = fs.statSync(outputPath);

                        if (outStats.size > 950 * 1024 && isVideo) {
                            const compressedPath = path.join(__dirname, `tmp_opt_${Date.now()}_${i}.webp`);
                            const reCompressCmd = `ffmpeg -y -i "${inputPath}" -t 4 -vcodec libwebp -filter_complex "scale=320:320:force_original_aspect_ratio=decrease,fps=8,pad=320:320:(320-iw)/2:(320-ih)/2:color=0x00000000" -q:v 25 -loop 0 -preset default -an -vsync 0 "${compressedPath}"`;

                            await new Promise((resolve) => {
                                exec(reCompressCmd, () => resolve());
                            });

                            if (fs.existsSync(compressedPath)) {
                                fs.renameSync(compressedPath, outputPath);
                            }
                        }

                        // Send WebP as Sticker
                        await sock.sendMessage(from, {
                            sticker: fs.readFileSync(outputPath)
                        }, { quoted: m });

                        // Short delay (800ms) to ensure smooth sending without socket congestion
                        await new Promise(resolve => setTimeout(resolve, 800));
                    }

                } catch (procErr) {
                    console.error(`[IGS] Error processing slide [${i + 1}]:`, procErr.message);
                } finally {
                    // Cleanup local temp files after each slide
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                }
            }

        } catch (err) {
            console.error("[IGS] Critical Error:", err);
            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ An internal exception occurred while formatting the output stickers."
            }, { quoted: m });
        }
    }
};