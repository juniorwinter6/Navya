const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');

module.exports = {
    name: "analyze",
    aliases: ["askimage", "ocr", "readimage"],
    description: "Analyzes an image and answers questions about it",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const context = m.message?.extendedTextMessage?.contextInfo;
        const imageMsg = m.message?.imageMessage || context?.quotedMessage?.imageMessage;

        if (!imageMsg) {
            return await sock.sendMessage(jid, { text: "❌ Please reply to or attach an image to analyze." }, { quoted: m });
        }

        const prompt = args.join(" ") || "Describe this image in detail and extract any text visible inside it.";
        await sock.sendMessage(jid, { react: { text: "👁️", key: m.key } });

        try {
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            const base64Image = buffer.toString('base64');

            // Free vision API processing
            const res = await axios.post('https://api.vyturex.com/vision', {
                image: base64Image,
                prompt: prompt
            });

            await sock.sendMessage(jid, {
                text: `👁️ *Vision Analysis:*\n\n${res.data?.response || res.data?.result || "Could not process image."}`
            }, { quoted: m });

        } catch (err) {
            console.error("Analyze Error:", err);
            await sock.sendMessage(jid, { text: "❌ Image analysis failed." }, { quoted: m });
        }
    }
};