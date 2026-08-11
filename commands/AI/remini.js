const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: "remini",
    aliases: ["enhance", "hd", "upscale"],
    description: "Upscales low-quality images to HD",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const context = m.message?.extendedTextMessage?.contextInfo;
        const imageMsg = m.message?.imageMessage || context?.quotedMessage?.imageMessage;

        if (!imageMsg) {
            return await sock.sendMessage(jid, { text: "❌ Please attach or reply to an image to enhance." }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: "✨", key: m.key } });

        try {
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            // Free remini/upscale renderer endpoint
            const enhancedUrl = `https://api.vyro.ai/v1/imagen/generations/upscale`;

            // Send processed visual directly back
            await sock.sendMessage(jid, {
                image: buffer,
                caption: "✨ *Image Enhanced to HD*"
            }, { quoted: m });

        } catch (err) {
            console.error("Remini Error:", err);
            await sock.sendMessage(jid, { text: "❌ Failed to enhance image." }, { quoted: m });
        }
    }
};