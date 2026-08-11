const {
    Sticker,
    StickerTypes
} = require("wa-sticker-formatter")

const {
    downloadContentFromMessage
} = require("@whiskeysockets/baileys")

module.exports = {

    name: "take",
    aliases: ["steal"],

    async execute(sock, m, args) {

        try {

            const from = m.key.remoteJid

            // ======================
            // GET QUOTED
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
!take Navya|Rise`
                }, { quoted: m })
            }

            // ======================
            // PACKNAME & AUTHOR
            // ======================
            const text = args.join(" ")

            let pack = "NAVYA"
            let author = "Rise"

            if (text.includes("|")) {

                pack = text.split("|")[0]
                author = text.split("|")[1]
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
            // CREATE NEW STICKER
            // ======================
            const sticker = new Sticker(buffer, {

                pack,
                author,

                type: StickerTypes.FULL,

                quality: 70
            })

            const stickerBuffer =
                await sticker.toBuffer()

            // ======================
            // SEND
            // ======================
            await sock.sendMessage(from, {
                sticker: stickerBuffer
            }, { quoted: m })

        } catch (err) {

            console.log("TAKE ERROR:", err)

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    text:
                        "❌ Failed to take sticker."
                },
                { quoted: m }
            )
        }
    }
}