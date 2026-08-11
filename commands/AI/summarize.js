const axios = require('axios');

module.exports = {
    name: "summarize",
    aliases: ["sum", "tladr"],
    description: "Summarizes lengthy messages or articles into key points",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const quotedText = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
            m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;

        const textToSummarize = args.join(" ") || quotedText;

        if (!textToSummarize) {
            return await sock.sendMessage(jid, {
                text: "❌ Reply to a long message or provide text after `.summarize` to condense it."
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: "📝", key: m.key } });

        try {
            const prompt = `Summarize the following text concisely with bullet points:\n\n${textToSummarize}`;
            const res = await axios.get(`https://api.vyturex.com/ai?prompt=${encodeURIComponent(prompt)}`);

            await sock.sendMessage(jid, {
                text: `📌 *Summary:*\n\n${res.data?.response || res.data?.result}`
            }, { quoted: m });
        } catch (err) {
            console.error("Summarize Error:", err);
            await sock.sendMessage(jid, { text: "❌ Failed to summarize text." }, { quoted: m });
        }
    }
};