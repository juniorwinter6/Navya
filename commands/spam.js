module.exports = {
    name: "spam",

    execute: async (sock, m, args, text) => {

        const chatId = m.key.remoteJid

        if (!args[0]) {
            return sock.sendMessage(chatId, {
                text: "Usage: !spam hello 5"
            })
        }

        const message = args[0]
        const count = parseInt(args[1]) || 5

        for (let i = 0; i < count; i++) {
            await sock.sendMessage(chatId, {
                text: message
            })
        }
    }
}