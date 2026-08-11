const os = require("os")

module.exports = {
    name: "alive",

    async execute(sock, m) {

        try {

            const from = m.key.remoteJid

            // ======================
            // USER INFO (BLUE TAG)
            // ======================
            const senderJid = m.key.participant || m.key.remoteJid

            const senderNumber = senderJid.split("@")[0]
            const mention = [senderJid]

            // ======================
            // BOT STATS
            // ======================
            const uptime = process.uptime()
            const hours = Math.floor(uptime / 3600)
            const minutes = Math.floor((uptime % 3600) / 60)
            const seconds = Math.floor(uptime % 60)

            const memory = (process.memoryUsage().rss / 1024 / 1024).toFixed(2)

            // ======================
            // MESSAGE
            // ======================
            const text = `
╭━━『  *NAVYA*  』━━╮

👋 Hello @${senderNumber}

⚡ Status: ONLINE ✅
⏱ Uptime: ${hours}h ${minutes}m ${seconds}s
🧠 RAM: ${memory} MB
💻 Platform: ${os.platform()}

💡 *Navya* is running perfectly

╰━━━━━━━━━━━━━━╯
            `.trim()

            await sock.sendMessage(from, {
                text,
                mentions: mention
            }, { quoted: m })

        } catch (err) {

            console.log("ALIVE ERROR:", err)

            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ Alive command failed"
            })
        }
    }
}