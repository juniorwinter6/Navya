module.exports = {
    name: "runtime",
    aliases: ["uptime"],
    description: "Shows how long the bot has been online",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        const uptimeSeconds = process.uptime();
        const days = Math.floor(uptimeSeconds / (3600 * 24));
        const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        await sock.sendMessage(jid, { text: `⏳ *Navya Uptime:* ${uptimeString}` }, { quoted: m });
    }
};