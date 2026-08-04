const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const Tesseract = require('tesseract.js');

module.exports = {
    name: "extract",
    async execute(sock, msg, args) {
        const from = msg.key.remoteJid;

        // Check if the user replied to an image, or sent the command directly with an image
        const isImage = msg.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

        if (!isImage) {
            return await sock.sendMessage(from, {
                text: "❌ *Error:* Please reply to an image or send an image with the caption `!extract` so I can read it."
            }, { quoted: msg });
        }

        // Grab the actual target image message object
        const imageMessage = msg.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

        try {
            await sock.sendMessage(from, { text: "⏳ *Navya is reading the image...* Please hold on." }, { quoted: msg });

            // 1. Download the file streams out of WhatsApp's encrypted servers
            const stream = await downloadContentFromMessage(imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. Feed the buffer directly to Tesseract optical character recognition engine
            const { data: { text } } = await Tesseract.recognize(buffer, 'eng');

            if (!text || !text.trim()) {
                return await sock.sendMessage(from, {
                    text: "❌ *Failed:* I couldn't find any visible English characters in that image."
                }, { quoted: msg });
            }

            // 3. Output raw copyable formatted block text back to user
            await sock.sendMessage(from, {
                text: `📝 *Extracted Text Found:*\n\n\`\`\`${text.trim()}\`\`\``
            }, { quoted: msg });

        } catch (error) {
            console.error("OCR command failure:", error);
            await sock.sendMessage(from, { text: "❌ An internal error occurred while processing the image formatting." }, { quoted: msg });
        }
    }
};