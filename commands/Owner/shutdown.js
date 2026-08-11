module.exports = {
    name: "shutdown",
    aliases: ["stopbot", "off"],
    category: "owner",
    type: "owner",
    description: "Turns off the bot process",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { text: "🛑 *Shutting down Navya... Goodnight!*" }, { quoted: m });
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
};