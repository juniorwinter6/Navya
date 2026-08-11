if (!global.hfTokens) global.hfTokens = {};

module.exports = {
    name: "sethftoken",
    aliases: ["hftoken", "savehftoken"],
    category: "ai",
    description: "Saves your personal Hugging Face API token for AI commands",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const cleanSender = sender.replace(/[^0-9]/g, "");
        const inputToken = args[0]?.trim();

        if (!inputToken) {
            const hasExisting = !!global.hfTokens[cleanSender];
            return await sock.sendMessage(jid, {
                text: `🔑 *Hugging Face Token Manager*\n\n` +
                    `*Status:* ${hasExisting ? "Saved ✅" : "Not Set ❌"}\n\n` +
                    `*Usage:* \`.sethftoken hf_xxxxxxxxxxxxxxxxxxxxxxxx\`\n\n` +
                    `Get your free token at: https://huggingface.co/settings/tokens`
            }, { quoted: m });
        }

        if (!inputToken.startsWith("hf_")) {
            return await sock.sendMessage(jid, {
                text: "❌ *Invalid Token Format:* Hugging Face tokens usually start with `hf_`."
            }, { quoted: m });
        }

        // Save token to global memory map
        global.hfTokens[cleanSender] = inputToken;

        await sock.sendMessage(jid, {
            text: "✅ *Hugging Face Token Saved Successfully!*\n\nYou can now use `.imagine` to generate images."
        }, { quoted: m });
    }
};