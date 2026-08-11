const axios = require('axios');

module.exports = {
    name: "meme",
    aliases: ["memegen"],
    category: "media",
    execute: async (sock, m, args) => {
        const text = args.join(" ").split("|");
        const topText = encodeURIComponent(text[0]?.trim() || "_");
        const bottomText = encodeURIComponent(text[1]?.trim() || "_");

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg = quoted?.imageMessage || m.message?.imageMessage;

        if (!imgMsg) return sock.sendMessage(m.key.remoteJid, { text: "❌ Reply to an image with text!\n*Format:* !meme Top Text | Bottom Text" }, { quoted: m });

        try {
            const memeUrl = `https://api.memegen.link/images/custom/${topText}/${bottomText}.png?background=https://i.imgur.com/8N3K7L0.png`;
            await sock.sendMessage(m.key.remoteJid, { image: { url: memeUrl }, caption: "✨ Meme Generated!" }, { quoted: m });
        } catch (err) {
            console.error("Meme Error:", err);
            sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to generate meme." }, { quoted: m });
        }
    }
};