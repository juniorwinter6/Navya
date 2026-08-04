const fs = require("fs")

const DB = "./lib/chatbot.json"

module.exports = {
    name: "chatbot",

    async execute(sock, m, args) {

        const from = m.key.remoteJid

        let data = {}
        if (fs.existsSync(DB)) {
            data = JSON.parse(fs.readFileSync(DB))
        }

        if (!data[from]) {
            data[from] = { enabled: false }
        }

        const option = args[0]?.toLowerCase()

        if (!option) {
            return sock.sendMessage(from, {
                text: `🤖 Chatbot Settings

Status: ${data[from].enabled ? "ON" : "OFF"}

Use:
.chatbot on
.chatbot off`
            })
        }

        if (option === "on") {
            data[from].enabled = true
        }

        if (option === "off") {
            data[from].enabled = false
        }

        fs.writeFileSync(DB, JSON.stringify(data, null, 2))

        return sock.sendMessage(from, {
            text: `🤖 Chatbot is now ${data[from].enabled ? "ON" : "OFF"}`
        })
    }
}