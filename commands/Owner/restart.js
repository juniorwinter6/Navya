module.exports = {
    name: "restart",
    aliases: ["reboot"],
    category: "owner",
    type: "owner",
    description: "Restarts the bot process",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { text: "🔄 *Restarting bot process...*" }, { quoted: m });
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    }
};