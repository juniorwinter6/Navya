module.exports = {
    name: "blockgroup",
    aliases: ["banggc", "disablegc"],
    category: "owner",
    type: "owner",
    description: "Disables bot commands in the current group",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!global.blockedGroups) global.blockedGroups = [];

        if (global.blockedGroups.includes(jid)) {
            return await sock.sendMessage(jid, { text: "⚠️ This group is already blocked." }, { quoted: m });
        }

        global.blockedGroups.push(jid);
        await sock.sendMessage(jid, { text: "🚫 *Bot commands have been disabled for this group.*" }, { quoted: m });
    }
};