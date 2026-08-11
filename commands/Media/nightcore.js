const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "nightcore",
    category: "audio-effects",
    execute: async (sock, m) => {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const audioMsg = quoted?.audioMessage || m.message?.audioMessage;

        if (!audioMsg) return sock.sendMessage(m.key.remoteJid, { text: "❌ Reply to an audio clip!" }, { quoted: m });

        try {
            const inputPath = path.join(__dirname, `../tmp/${Date.now()}.mp3`);
            const outputPath = path.join(__dirname, `../tmp/${Date.now()}_nc.mp3`);

            const buffer = await sock.downloadMediaMessage({ message: quoted || m.message });
            fs.writeFileSync(inputPath, buffer);

            ffmpeg(inputPath)
                .audioFilters(["asetrate=44100*1.25", "atempo=1.06"])
                .save(outputPath)
                .on("end", async () => {
                    await sock.sendMessage(m.key.remoteJid, { audio: fs.readFileSync(outputPath), mimetype: 'audio/mp4', ptt: true }, { quoted: m });
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                });
        } catch (err) {
            console.error("Nightcore Error:", err);
        }
    }
};