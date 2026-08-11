module.exports = {
    name: "aivoice",
    aliases: ["character", "aitts"],
    category: "ai",
    type: "ai",
    description: "Generates text-to-speech voice notes with custom character accents",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = args.join(" ");

        if (!text) {
            return await sock.sendMessage(jid, {
                text: "❌ Please provide text to convert to voice.\n\n*Example:* `.aivoice Hello human, system initialization complete.`"
            }, { quoted: m });
        }

        try {
            // High-pitched AI robotic/anime voice TTS endpoint
            const voiceUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en-AU&client=tw-ob`;

            await sock.sendMessage(jid, {
                audio: { url: voiceUrl },
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: m });

        } catch (err) {
            console.error("AIVoice Error:", err);
            await sock.sendMessage(jid, { text: "❌ Failed to generate AI voice." }, { quoted: m });
        }
    }
};