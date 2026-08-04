module.exports = {
    name: "welcome",

    execute: async (sock, m, args) => {

        const chatId = m.key.remoteJid

        if (!chatId.endsWith("@g.us")) return

        // simple welcome test message
        await sock.sendMessage(chatId, {
            text: "👋 Welcome feature is active!"
        })
    }
}