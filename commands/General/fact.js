const axios = require("axios")

module.exports = {

    name: "fact",
    aliases: ["facts", "randomfact"],

    async execute(sock, m) {

        try {

            const from = m.key.remoteJid

            // ======================
            // FETCH FACT
            // ======================
            const res = await axios.get(
                "https://uselessfacts.jsph.pl/random.json?language=en"
            )

            const fact = res.data.text

            // ======================
            // SEND MESSAGE
            // ======================
            await sock.sendMessage(from, {

                text:
                    `╭━━〔 📚 𝐅𝐀𝐂𝐓 𝐎𝐅 𝐓𝐇𝐄 𝐃𝐀𝐘 〕━━╮

💡 ${fact}

╰━━━━━━━━━━━━━━╯`

            }, { quoted: m })

        } catch (err) {

            console.log("FACT ERROR:", err)

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    text: "❌ Failed to fetch fact."
                },
                { quoted: m }
            )
        }
    }
}