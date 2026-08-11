const sharp = require('sharp');

module.exports = {
    name: "filter",
    aliases: ["effect"],
    category: "media",
    execute: async (sock, m, args) => {
        const filterType = (args[0] || 'grayscale').toLowerCase();
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg = quoted?.imageMessage || m.message?.imageMessage;

        if (!imgMsg) return sock.sendMessage(m.key.remoteJid, { text: "❌ Reply to an image!\n*Available filters:* grayscale, blur, sepia, invert" }, { quoted: m });

        try {
            const buffer = await sock.downloadMediaMessage({ message: quoted || m.message });
            let image = sharp(buffer);

            if (filterType === 'grayscale' || filterType === 'grey') image = image.grayscale();
            else if (filterType === 'blur') image = image.blur(10);
            else if (filterType === 'invert') image = image.negate();
            else if (filterType === 'sepia') image = image.tint({ r: 112, g: 66, b: 20 });
            else return sock.sendMessage(m.key.remoteJid, { text: "❌ Unknown filter! Use: grayscale, blur, invert, sepia" }, { quoted: m });

            const processedBuffer = await image.toBuffer();
            await sock.sendMessage(m.key.remoteJid, { image: processedBuffer, caption: `🎨 Applied filter: *${filterType}*` }, { quoted: m });
        } catch (err) {
            console.error("Filter Error:", err);
            sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to process image filter." }, { quoted: m });
        }
    }
};