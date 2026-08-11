module.exports = {
    name: "setprefix",
    aliases: ["prefix", "changeprefix"],
    category: "owner",
    type: "owner",
    description: "Changes the bot prefix",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const newPrefix = args[0];

        if (!newPrefix) {
            return await sock.sendMessage(jid, {
                text: "❌ Please specify a new prefix.\n\n*Example:* `.setprefix !`"
            }, { quoted: m });
        }

        global.prefix = newPrefix; // Assumes your index.js reads global.prefix

        await sock.sendMessage(jid, {
            text: `✅ *Prefix changed successfully!* New prefix is now: \`${newPrefix}\``
        }, { quoted: m });
    }
};