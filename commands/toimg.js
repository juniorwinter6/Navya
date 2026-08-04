const {
    downloadContentFromMessage
} = require("@whiskeysockets/baileys")

const fs = require("fs")

module.exports = {

    name: "toimg",
    aliases: ["sticker2img"],

    async execute(sock, m) {

        try {

            const from = m.key.remoteJid

            // ======================
            // GET QUOTED STICKER
            // ======================
            const quoted =
                m.message?.extendedTextMessage
                    ?.contextInfo
                    ?.quotedMessage

            if (!quoted?.stickerMessage) {

                return sock.sendMessage(from, {
                    text:
                        `Reply to a sticker.

Example:
!toimg`
                }, { quoted: m })
            }

            // ======================
            // DOWNLOAD STICKER
            // ======================
            const stream =
                await downloadContentFromMessage(
                    quoted.stickerMessage,
                    "sticker"
                )

            let buffer = Buffer.from([])

            for await (const chunk of stream) {
                buffer = Buffer.concat([
                    buffer,
                    chunk
                ])
            }

            // ======================
            // SEND IMAGE
            // ======================
            await sock.sendMessage(from, {

                image: buffer,

                caption: "🖼️ Converted to image"

            }, { quoted: m })

        } catch (err) {

            console.log("TOIMG ERROR:", err)

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    text: "❌ Failed to convert sticker."
                },
                { quoted: m }
            )
        }
    }
}