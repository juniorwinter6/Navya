module.exports = {
    name: "admins",
    aliases: ["listadmins", "tagadmins"],
    description: "Mentions all group admins",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: "❌ This command can only be used in groups." }, { quoted: m });
        }

        try {
            const groupMetadata = await sock.groupMetadata(jid);
            const admins = groupMetadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id);

            const customMessage = args.join(" ") || "Attention Admins!";

            let text = `🛡️ *GROUP ADMINS*\n📢 *Message:* ${customMessage}\n\n`;
            admins.forEach((admin, i) => {
                text += `${i + 1}. @${admin.split('@')[0]}\n`;
            });

            await sock.sendMessage(jid, {
                text: text.trim(),
                mentions: admins
            }, { quoted: m });

        } catch (err) {
            console.error("Admins Command Error:", err);
            await sock.sendMessage(jid, { text: "❌ Failed to fetch admins list." }, { quoted: m });
        }
    }
};