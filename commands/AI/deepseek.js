const axios = require('axios');

module.exports = {
    name: "deepseek",
    aliases: ["think", "reason"],
    category: "ai",
    type: "ai",
    description: "Deep reasoning AI for complex problems and code",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const prompt = args.join(" ");

        if (!prompt) {
            return await sock.sendMessage(jid, {
                text: "❌ Please enter a topic or code problem.\n\n*Example:* `.deepseek Write a JS function to debounce API calls`"
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: "🔍", key: m.key } });

        try {
            const res = await axios.get(`https://api.vyturex.com/deepseek?prompt=${encodeURIComponent(prompt)}`);
            const reply = res.data?.response || res.data?.result || "No response generated.";

            await sock.sendMessage(jid, { text: `🧠 *DeepSeek Thinking Output:*\n\n${reply}` }, { quoted: m });
        } catch (err) {
            console.error("Deepseek Error:", err);
            await sock.sendMessage(jid, { text: "❌ DeepSeek service temporarily unavailable." }, { quoted: m });
        }
    }
};