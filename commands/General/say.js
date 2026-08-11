module.exports = {
    name: "say",
    aliases: ["tts", "speak"],
    description: "Converts text to speech in an Indian accent and sends it as a voice note",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        if (!args.length) {
            return await sock.sendMessage(jid, {
                text: "❌ Please provide text for me to say.\n\n*Example:* `.say Hello from Navya`"
            }, { quoted: m });
        }

        const textToSay = args.join(" ");

        if (textToSay.length > 200) {
            return await sock.sendMessage(jid, {
                text: "❌ Text is too long! Please keep it under 200 characters."
            }, { quoted: m });
        }

        try {
            // Google Translate TTS Endpoint with Indian accent (tl=en-IN)
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textToSay)}&tl=en-GB&client=tw-ob`;

            await sock.sendMessage(jid, {
                audio: { url: ttsUrl },
                mimetype: 'audio/mpeg',
                ptt: true // Sends as a WhatsApp Voice Note
            }, { quoted: m });

        } catch (err) {
            console.error("TTS Command Error:", err);
            await sock.sendMessage(jid, {
                text: "❌ Failed to generate voice note."
            }, { quoted: m });
        }
    }
};