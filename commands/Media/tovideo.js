const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "tovideo",
    aliases: ["togif", "tomp4"],
    category: "media",
    execute: async (sock, m) => {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const stickerMsg = quoted?.stickerMessage || m.message?.stickerMessage;

        if (!stickerMsg) return sock.sendMessage(m.key.remoteJid, { text: "❌ Reply to an animated sticker!" }, { quoted: m });

        try {
            const inputPath = path.join(__dirname, `../tmp/${Date.now()}.webp`);
            const outputPath = path.join(__dirname, `../tmp/${Date.now()}.mp4`);

            const buffer = await sock.downloadMediaMessage({ message: quoted || m.message });
            fs.writeFileSync(inputPath, buffer);

            ffmpeg(inputPath)
                .outputOptions(["-movflags faststart", "-pix_fmt yuv420p", "-vf scale=trunc(iw/2)*2:trunc(ih/2)*2"])
                .toFormat("mp4")
                .save(outputPath)
                .on("end", async () => {
                    await sock.sendMessage(m.key.remoteJid, { video: fs.readFileSync(outputPath) }, { quoted: m });
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                })
                .on("error", (err) => {
                    console.error("FFmpeg Error:", err);
                    sock.sendMessage(m.key.remoteJid, { text: "❌ Conversion failed." }, { quoted: m });
                });
        } catch (err) {
            console.error("tovideo Error:", err);
        }
    }
};