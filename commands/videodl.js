const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const downloadFolder = path.join(__dirname, "..", "lib");
if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder, { recursive: true });
}

module.exports = {
    name: "video",
    aliases: ["ytv", "ytmp4", "downloadvideo", "ytvideo"],
    category: "downloader",
    desc: "Downloads YouTube videos keeping the selection cache alive for multi-format downloads.",

    async execute(sock, m, args, runtimeOptions = { isDocumentMode: false, bypassMenuCreation: false }) {
        const from = m.key.remoteJid;

        if (!args[0]) {
            return await sock.sendMessage(from, {
                text: "❌ *Please provide a search name or valid video link.*\n\n*Example:* `!video faded`"
            }, { quoted: m });
        }

        // ==========================================
        // PHASE 1: DISPATCH SELECTION MENU (NEW SEARCH)
        // ==========================================
        if (!runtimeOptions.bypassMenuCreation) {
            const menuText = `📥 *YouTube Downloader Menu*\n\n` +
                `🎯 *Target:* "${args.join(" ")}"\n\n` +
                `Please reply with your preferred format option:\n\n` +
                `*1.* 🎥 Standard Video Playback (Stream Format)\n` +
                `*2.* 📁 Document Attachment (Original Quality/Title)\n\n` +
                `💡 _You can select both options one after the other!_`;

            const sentMenu = await sock.sendMessage(from, { text: menuText }, { quoted: m });

            // Initialize or update the persistent cache context for this chat session
            global.videoCache = global.videoCache || {};
            global.videoCache[from] = {
                menuMessageId: sentMenu.key.id,
                message: m,
                args: args // Overwrites with the newest search text query terms
            };
            return;
        }

        // ==========================================
        // PHASE 2: PROCESSING DOWNLOAD TARGET
        // ==========================================
        let downloadTarget = args.join(" ").trim();
        const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\/.+$/i.test(downloadTarget);

        if (isUrl && downloadTarget.includes("?si=")) {
            downloadTarget = downloadTarget.split("?si=")[0];
        }

        if (!isUrl) {
            downloadTarget = `ytsearch1:${downloadTarget}`;
        }

        const uniqueId = Date.now();
        const baseOutputPattern = path.join(downloadFolder, `vid_${uniqueId}_%(title)s.%(ext)s`);

        await sock.sendMessage(from, {
            text: `⏳ *Fetching assets...*\n📦 Format: _${runtimeOptions.isDocumentMode ? "Document File" : "Standard Video"}_`
        }, { quoted: m });

        const command = `python -m yt_dlp -f "mp4" --no-warnings --restrict-filenames --max-filesize 50M -o "${baseOutputPattern}" "${downloadTarget}"`;

        exec(command, { maxBuffer: 1024 * 1024 * 10 }, async (error, stdout, stderr) => {
            if (error) {
                console.error("yt-dlp Error:", stderr);
                await sock.sendMessage(from, { text: "❌ Download failed. The video might be age-restricted or unavailable." }, { quoted: m });
                return;
            }

            try {
                // Find the file based on the uniqueId
                const files = fs.readdirSync(downloadFolder);
                const matchedFile = files.find(file => file.includes(`vid_${uniqueId}`));

                if (!matchedFile) {
                    throw new Error("File not found on disk");
                }

                const finalPath = path.join(downloadFolder, matchedFile);

                // Add a small delay to ensure the OS has finished writing the file
                await new Promise(resolve => setTimeout(resolve, 1000));

                const fileBuffer = fs.readFileSync(finalPath);

                if (runtimeOptions.isDocumentMode) {
                    await sock.sendMessage(from, {
                        document: fileBuffer,
                        mimetype: "video/mp4",
                        fileName: "video.mp4",
                        caption: "🎥 Downloaded via Navya Bot"
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(from, {
                        video: fileBuffer,
                        mimetype: "video/mp4",
                        caption: "🎥 Downloaded via Navya Bot"
                    }, { quoted: m });
                }

                // Cleanup
                if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);

            } catch (transmissionError) {
                console.error("Delivery issue:", transmissionError);
                await sock.sendMessage(from, { text: "❌ Error sending video. It might be too large." }, { quoted: m });
            }
        });
    }
};