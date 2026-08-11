module.exports = {
    name: "join",
    aliases: ["joingroup"],
    category: "owner",
    type: "owner",
    description: "Joins a group via invite link",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const link = args[0];

        if (!link || !link.includes("chat.whatsapp.com/")) {
            return await sock.sendMessage(jid, { text: "❌ Provide a valid WhatsApp group link." }, { quoted: m });
        }

        const code = link.split("chat.whatsapp.com/")[1].trim();

        try {
            const res = await sock.groupAcceptInvite(code);
            await sock.sendMessage(jid, { text: `✅ *Successfully joined group!* JID: \`${res}\`` }, { quoted: m });
        } catch (err) {
            console.error("Join Error:", err.message);
            await sock.sendMessage(jid, { text: "❌ Failed to join group. Link may be invalid or expired." }, { quoted: m });
        }
    }
};