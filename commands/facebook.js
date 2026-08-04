const axios = require("axios")
const https = require("https")

module.exports = {

    name: "facebook",
    aliases: ["fb"],

    async execute(sock, m, args) {

        try {

            const from = m.key.remoteJid
            const url = args[0]

            // ======================
            // VALIDATION
            // ======================
            if (!url || !url.includes("facebook.com")) {
                return sock.sendMessage(from, {
                    text: "❌ Please send a valid Facebook link\n\nExample: !fb <link>"
                }, { quoted: m })
            }

            // ======================
            // LOADING MESSAGE
            // ======================
            await sock.sendMessage(from, {
                text: "📥 Downloading Facebook video..."
            }, { quoted: m })

            // ======================
            // API
            // ======================
            const api = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`

            // ======================
            // REQUEST (SSL FIXED)
            // ======================
            const res = await axios.get(api, {
                timeout: 30000,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            })

            const data = res.data

            // ======================
            // CHECK RESPONSE
            // ======================
            if (!data || !data.video) {
                return sock.sendMessage(from, {
                    text: "❌ Failed to fetch Facebook video."
                }, { quoted: m })
            }

            const videoUrl = data.video

            // ======================
            // SEND VIDEO
            // ======================
            await sock.sendMessage(from, {
                video: { url: videoUrl },
                caption: `🎬 Facebook Video Downloaded`
            }, { quoted: m })

        } catch (err) {

            console.log("FB ERROR:", err)

            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ Facebook download failed. Try again later."
            }, { quoted: m })
        }
    }
}