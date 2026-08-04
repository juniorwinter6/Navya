const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const fs = require("fs")
const path = require("path")
const { exec } = require("child_process")

module.exports = {
    name: "sticker",
    aliases: ["s", "st"],

    async execute(sock, m, args) {
        try {
            const from = m.key.remoteJid

            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage

            if (!quoted) {
                return sock.sendMessage(from, {
                    text: "📌 Reply to an image or video to make a sticker."
                }, { quoted: m })
            }

            // Download media safely (FIXES bad decrypt issue)
            const buffer = await downloadMediaMessage(
                m,
                "buffer",
                {},
                {
                    logger: sock.logger,
                    reuploadRequest: sock.updateMediaMessage
                }
            )

            if (!buffer) {
                return sock.sendMessage(from, {
                    text: "❌ Failed to download media."
                }, { quoted: m })
            }

            const inputPath = path.join(__dirname, "../temp/input.jpg")
            const outputPath = path.join(__dirname, "../temp/output.webp")

            fs.writeFileSync(inputPath, buffer)

            // Convert to sticker (FFMPEG REQUIRED)
            await new Promise((resolve, reject) => {
                exec(
                    `ffmpeg -y -i ${inputPath} -vf "scale=512:512:force_original_aspect_ratio=decrease" ${outputPath}`,
                    (err) => {
                        if (err) reject(err)
                        else resolve()
                    }
                )
            })

            const stickerBuffer = fs.readFileSync(outputPath)

            await sock.sendMessage(from, {
                sticker: stickerBuffer
            }, { quoted: m })

            // cleanup
            fs.unlinkSync(inputPath)
            fs.unlinkSync(outputPath)

        } catch (err) {
            console.log("STICKER ERROR:", err)

            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ Sticker failed to process."
            })
        }
    }
}