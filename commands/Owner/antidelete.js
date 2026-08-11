const fs = require("fs")

module.exports = {

    name: "antidelete",

    async execute(sock, m, args) {

        try {

            const from = m.key.remoteJid

            // ======================
            // OWNER ONLY CHECK
            // ======================
            const sender =
                (m.key.participant || m.key.remoteJid)
                    .split("@")[0]

            if (!global.OWNERS.includes(sender)) {
                return sock.sendMessage(from, {
                    text: "❌ Owner only command."
                }, { quoted: m })
            }

            // ======================
            // LOAD DB
            // ======================
            const db = JSON.parse(
                fs.readFileSync("./lib/antidelete.json")
            )

            const option = args[0]

            // ======================
            // ON
            // ======================
            if (option === "on") {

                db[from] = true

                fs.writeFileSync(
                    "./lib/antidelete.json",
                    JSON.stringify(db, null, 2)
                )

                return sock.sendMessage(from, {
                    text: "✅ Antidelete enabled"
                }, { quoted: m })
            }

            // ======================
            // OFF
            // ======================
            if (option === "off") {

                db[from] = false

                fs.writeFileSync(
                    "./lib/antidelete.json",
                    JSON.stringify(db, null, 2)
                )

                return sock.sendMessage(from, {
                    text: "❌ Antidelete disabled"
                }, { quoted: m })
            }

            // ======================
            // HELP
            // ======================
            return sock.sendMessage(from, {
                text:
                    `Use:
!antidelete on
!antidelete off`
            }, { quoted: m })

        } catch (err) {

            console.log("ANTIDELETE CMD ERROR:", err)
        }
    }
}