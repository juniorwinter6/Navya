const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
    name: "ai",
    aliases: ["ask"],
    async execute(sock, m, args) {
        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        // Get the raw message text to check for the command trigger
        const messageText = m.message?.extendedTextMessage?.text || m.message?.conversation || "";

        // THE FIX: If it's a DM (not a group) and doesn't start with !ai or !ask, ignore it entirely
        if (!isGroup) {
            const hasPrefix = messageText.startsWith('!ai') || messageText.startsWith('!ask');
            if (!hasPrefix) return;
        }

        const prompt = args.join(" ");
        if (!prompt) return;

        try {
            await sock.sendPresenceUpdate('composing', from);

            // Using the fast, efficient flash model
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            await sock.sendMessage(from, { text: `🤖 *NAVYA AI*\n\n${text}` }, { quoted: m });
        } catch (err) {
            console.error("AI Error:", err);
            await sock.sendMessage(from, { text: "❌ Error: Could not connect to AI." }, { quoted: m });
        }
    }
};