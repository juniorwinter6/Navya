const axios = require("axios")
const config = require("../config")

// prevent duplicate processing
const processedMessages = new Set()

module.exports = {

    name: "pinterest",
    aliases: ["pin", "pindl"],

    async execute(sock, m, args) {

        try {

            // ======================
            // DUPLICATE CHECK
            // ======================
            if (processedMessages.has(m.key.id)) {
                return
            }

            processedMessages.add(m.key.id)

            setTimeout(() => {
                processedMessages.delete(m.key.id)
            }, 5 * 60 * 1000)

            const from = m.key.remoteJid

            const text = args.join(" ")

            // ======================
            // NO URL
            // ======================
            if (!text) {

                return sock.sendMessage(from, {

                    text:
                        `📌 Pinterest Downloader

Usage:
${config.prefix}pinterest <Pinterest URL>

Example:
${config.prefix}pinterest https://pin.it/xxxxx`

                }, { quoted: m })
            }

            // ======================
            // URL DETECTION
            // ======================
            let urlMatch =
                text.match(/https?:\/\/[^\s]*pinterest[^\s]*/i)

            if (!urlMatch) {

                urlMatch =
                    text.match(/https?:\/\/pin\.it\/[^\s]+/i)
            }

            if (!urlMatch) {

                return sock.sendMessage(from, {

                    text:
                        "❌ Invalid Pinterest URL."

                }, { quoted: m })
            }

            const pinterestUrl = urlMatch[0]

            // ======================
            // REACTION
            // ======================
            await sock.sendMessage(from, {

                react: {
                    text: "📥",
                    key: m.key
                }

            })

            // ======================
            // API REQUEST
            // ======================
            const apiUrl =
                `https://api.nexray.web.id/downloader/pinterest?url=${encodeURIComponent(pinterestUrl)}`

            const response = await axios.get(apiUrl, {

                timeout: 30000,

                headers: {
                    "User-Agent":
                        "Mozilla/5.0"
                }
            })

            // ======================
            // VALIDATE
            // ======================
            if (
                !response.data ||
                !response.data.status ||
                !response.data.result
            ) {

                return sock.sendMessage(from, {

                    text:
                        "❌ Failed to fetch Pinterest content."

                }, { quoted: m })
            }

            const pinData =
                response.data.result

            const isVideo =
                !!pinData.video

            const mediaUrl =
                pinData.video ||
                pinData.image ||
                pinData.url

            const title =
                pinData.title ||
                "Pinterest Pin"

            const author =
                pinData.author ||
                "Unknown"

            // ======================
            // NO MEDIA
            // ======================
            if (!mediaUrl) {

                return sock.sendMessage(from, {

                    text:
                        "❌ No media found."

                }, { quoted: m })
            }

            // ======================
            // CAPTION
            // ======================
            let caption =
                `📌 ${title}

👤 Author: ${author}

Downloaded by ${config.botName}`

            // ======================
            // SEND VIDEO
            // ======================
            if (isVideo) {

                const videoResponse =
                    await axios.get(mediaUrl, {

                        responseType:
                            "arraybuffer",

                        timeout: 120000,

                        headers: {
                            "User-Agent":
                                "Mozilla/5.0"
                        }
                    })

                const videoBuffer =
                    Buffer.from(
                        videoResponse.data
                    )

                await sock.sendMessage(from, {

                    video: videoBuffer,

                    caption

                }, { quoted: m })

            }

            // ======================
            // SEND IMAGE
            // ======================
            else {

                await sock.sendMessage(from, {

                    image: {
                        url: mediaUrl
                    },

                    caption

                }, { quoted: m })
            }

        } catch (err) {

            console.log(
                "PINTEREST ERROR:",
                err
            )

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    text:
                        "❌ Pinterest download failed."
                },
                { quoted: m }
            )
        }
    }
}