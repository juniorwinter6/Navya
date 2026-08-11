module.exports = {
    name: "leave",
    aliases: ["leavegc"],
    category: "owner",
    type: "owner",
    description: "Leaves the current or target group",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');

        if (!isGroup) {
            return await sock.sendMessage(jid, { text: "❌ This command can only be used inside a group." }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: "👋 *Goodbye everyone! Leaving group...*" });
        await sock.groupLeave(jid);
    }
};