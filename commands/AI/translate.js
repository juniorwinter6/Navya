const axios = require('axios');

// Map common full language names to ISO 639-1 language codes
const LANG_MAP = {
    spanish: 'es', hindi: 'hi', chinese: 'zh', french: 'fr',
    german: 'de', italian: 'it', japanese: 'ja', korean: 'ko',
    portuguese: 'pt', russian: 'ru', arabic: 'ar', turkish: 'tr',
    dutch: 'nl', polish: 'pl', swahili: 'sw', yoruba: 'yo',
    igbo: 'ig', hausa: 'ha', afrikaans: 'af', bengali: 'bn',
    indonesian: 'id', thai: 'th', vietnamese: 'vi', greek: 'el',
    hebrew: 'he', latin: 'la', ukrainian: 'uk', urdu: 'ur'
};

module.exports = {
    name: "translate",
    aliases: ["tr", "trans"],
    category: "ai",
    type: "ai",
    description: "Translates text to target language by code or full name (e.g. .tr spanish hello)",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        let targetLang = "en";
        let textStartIndex = 0;

        if (args.length > 0) {
            const firstArg = args[0].toLowerCase();

            // 1. Check if first argument is a mapped language name (e.g., "spanish")
            if (LANG_MAP[firstArg]) {
                targetLang = LANG_MAP[firstArg];
                textStartIndex = 1;
            }
            // 2. Check if first argument is a 2 or 3-letter language code (e.g., "es", "zh")
            else if (firstArg.length >= 2 && firstArg.length <= 3) {
                targetLang = firstArg;
                textStartIndex = 1;
            }
        }

        const quotedText = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
            m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;

        const rawText = args.slice(textStartIndex).join(" ").trim() || quotedText;

        if (!rawText) {
            return await sock.sendMessage(jid, {
                text: "❌ Reply to a message or provide text.\n\n" +
                    "*Usage Examples:*\n" +
                    "• `.tr spanish hello friend`\n" +
                    "• `.tr hindi how are you`\n" +
                    "• `.tr chinese good morning`\n" +
                    "• Reply to any message with `.tr french` or `.tr es`"
            }, { quoted: m });
        }

        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(rawText)}`;
            const res = await axios.get(url);
            const translatedText = res.data[0].map(item => item[0]).join('');

            await sock.sendMessage(jid, {
                text: `🌐 *Translation (${targetLang.toUpperCase()}):*\n\n${translatedText}`
            }, { quoted: m });

        } catch (err) {
            console.error("Translate Error:", err);
            await sock.sendMessage(jid, { text: "❌ Translation failed." }, { quoted: m });
        }
    }
};