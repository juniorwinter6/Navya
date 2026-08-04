const ffmpeg = require("fluent-ffmpeg")
const ffmpegPath = require("ffmpeg-static")

ffmpeg.setFfmpegPath(ffmpegPath)

const {
    downloadContentFromMessage
} = require("@whiskeysockets/baileys")

const {
    Sticker,
    StickerTypes
} = require("wa-sticker-formatter")

const fs = require("fs")

module.exports = {

    name: "s",
    aliases: ["sticker"],

    async execute(sock, m) {

        try {

            const from = m.key.remoteJid

            // ======================
            // GET QUOTED MESSAGE
            // ======================
            const quoted =
                m.message?.extendedTextMessage
                    ?.contextInfo
                    ?.quotedMessage

            if (!quoted) {

                return sock.sendMessage(from, {
                    text:
                        `Reply to an image or video.

Example:
!s`
                }, { quoted: m })
            }

            // ======================
            // DETECT TYPE
            // ======================
            const isImage = quoted.imageMessage
            const isVideo = quoted.videoMessage

            if (!isImage && !isVideo) {

                return sock.sendMessage(from, {
                    text:
                        "❌ Reply to image or short video."
                }, { quoted: m })
            }

            // ======================
            // DOWNLOAD MEDIA
            // ======================
            const msg =
                isImage
                    ? quoted.imageMessage
                    : quoted.videoMessage

            const stream =
                await downloadContentFromMessage(
                    msg,
                    isImage ? "image" : "video"
                )

            let buffer = Buffer.from([])

            for await (const chunk of stream) {
                buffer = Buffer.concat([
                    buffer,
                    chunk
                ])
            }

            // ======================
            // CREATE STICKER
            // ======================
            const sticker = new Sticker(buffer, {

                pack: "Navya",
                author: "Rise",

                type: StickerTypes.FULL,

                quality: 70
            })

            const stickerBuffer =
                await sticker.toBuffer()

            // ======================
            // SEND STICKER
            // ======================
            await sock.sendMessage(from, {
                sticker: stickerBuffer
            }, { quoted: m })

        } catch (err) {

            console.log("STICKER ERROR:", err)

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    text:
                        "❌ Failed to create sticker."
                },
                { quoted: m }
            )
        }
    }
}