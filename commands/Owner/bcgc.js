module.exports = {
    name: "bcgc",
    aliases: ["broadcastgc"],
    category: "owner",
    type: "owner",
    description: "Broadcasts a message to all active groups",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = args.join(" ");

        if (!text) {
            return await sock.sendMessage(jid, { text: "❌ Provide text to broadcast to groups." }, { quoted: m });
        }

        const groups = Object.keys(await sock.groupFetchAllParticipating());
        await sock.sendMessage(jid, { text: `📢 *Broadcasting message to ${groups.length} group(s)...*` }, { quoted: m });

        for (let groupJid of groups) {
            try {
                await sock.sendMessage(groupJid, { text: `📢 *NAVYA OFFICIAL BROADCAST*\n\n${text}` });
            } catch (err) {
                console.error(`Failed to send broadcast to ${groupJid}:`, err.message);
            }
        }

        await sock.sendMessage(jid, { text: "✅ *Group broadcast completed!*" }, { quoted: m });
    }
};