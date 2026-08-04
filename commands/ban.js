const fs = require("fs")

function loadJSON(path, fallback = {}) {
    try {
        return JSON.parse(fs.readFileSync(path, "utf8"))
    } catch {
        return fallback
    }
}

function saveJSON(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

module.exports = {

    name: "ban",

    async execute(sock, m, args) {

        try {

            const from = m.key.remoteJid

            // ======================
            // OWNER ONLY (same pattern)
            // ======================
            const sender = (m.key.participant || m.key.remoteJid)
                .split("@")[0]
                .split(":")[0]

            if (!global.OWNERS.includes(sender)) {
                return sock.sendMessage(from, {
                    text: "❌ Owner only command."
                }, { quoted: m })
            }

            // ======================
            // TARGET
            // ======================
            const context =
                m.message?.extendedTextMessage?.contextInfo || {}

            let target =
                context.mentionedJid?.[0] ||
                context.participant

            if (!target && args[0]) {

                const number = args[0].replace(/[^0-9]/g, "")
                target = number + "@s.whatsapp.net"
            }

            if (!target) {
                return sock.sendMessage(from, {
                    text: "❌ Reply or tag a user to ban."
                }, { quoted: m })
            }

            // ======================
            // BAN USER
            // ======================
            const db = loadJSON("./lib/banned.json")

            const user = target.split("@")[0]

            db[user] = true

            saveJSON("./lib/banned.json", db)

            return sock.sendMessage(from, {
                text: `🚫 User banned from using bot.`,
                mentions: [target]
            }, { quoted: m })

        } catch (err) {

            console.log("BAN ERROR:", err)

            return sock.sendMessage(m.key.remoteJid, {
                text: "❌ Ban command failed."
            }, { quoted: m })
        }
    }
}