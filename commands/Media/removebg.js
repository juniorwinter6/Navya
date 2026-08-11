const axios = require('axios');

module.exports = {
    name: "removebg",
    aliases: ["rmbg", "nobg"],
    category: "media",
    execute: async (sock, m) => {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg = quoted?.imageMessage || m.message?.imageMessage;

        if (!imgMsg) return sock.sendMessage(m.key.remoteJid, { text: "❌ Reply to or attach an image!" }, { quoted: m });

        try {
            await sock.sendMessage(m.key.remoteJid, { text: "⏳ Removing background..." }, { quoted: m });
            const buffer = await sock.downloadMediaMessage({ message: quoted || m.message });

            // Uses free image removal service endpoint
            const res = await axios.post("https://api.remove.bg/v1.0/removebg", {
                image_file_b64: buffer.toString('base64'),
                size: 'auto'
            }, {
                headers: { 'X-Api-Key': config.REMOVEBG_KEY || '' }
            });

            const resultBuffer = Buffer.from(res.data.data.result_b64, 'base64');
            await sock.sendMessage(m.key.remoteJid, { document: resultBuffer, mimetype: "image/png", fileName: "no-bg.png" }, { quoted: m });
        } catch (err) {
            console.error("RemoveBG Error:", err.message);
            sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to remove background. Check API key setting." }, { quoted: m });
        }
    }
};