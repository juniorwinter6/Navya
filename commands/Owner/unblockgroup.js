module.exports = {
    name: "unblockgroup",
    aliases: ["unbanggc", "enablegc"],
    category: "owner",
    type: "owner",
    description: "Re-enables bot commands in the current group",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!global.blockedGroups) global.blockedGroups = [];

        if (!global.blockedGroups.includes(jid)) {
            return await sock.sendMessage(jid, { text: "⚠️ This group is not currently blocked." }, { quoted: m });
        }

        global.blockedGroups = global.blockedGroups.filter(id => id !== jid);
        await sock.sendMessage(jid, { text: "✅ *Bot commands re-enabled for this group!*" }, { quoted: m });
    }
};