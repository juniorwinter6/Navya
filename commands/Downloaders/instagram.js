const { igdl } = require("ruhend-scraper")

const config = require("../../config")

// ======================
// PREVENT DUPLICATES
// ======================
const processedMessages = new Set()

module.exports = {

    name: "instagram",

    aliases: [
        "ig",
        "insta",
        "reels",
        "igdl"
    ],

    async execute(sock, m, args) {

        try {

            const from =
                m.key.remoteJid

            // ======================
            // DUPLICATE CHECK
            // ======================
            if (
                processedMessages.has(
                    m.key.id
                )
            ) return

            processedMessages.add(
                m.key.id
            )

            setTimeout(() => {

                processedMessages.delete(
                    m.key.id
                )

            }, 5 * 60 * 1000)

            const text =
                args.join(" ")

            // ======================
            // NO URL
            // ======================
            if (!text) {

                return sock.sendMessage(
                    from,
                    {
                        text:
                            `📥 Instagram Downloader

Usage:
${config.prefix}ig <Instagram URL>

Example:
${config.prefix}ig https://www.instagram.com/reel/xxxx/`
                    },
                    { quoted: m }
                )
            }

            // ======================
            // VALIDATE URL
            // ======================
            const instagramPatterns = [

                /https?:\/\/(?:www\.)?instagram\.com\//,

                /https?:\/\/(?:www\.)?instagr\.am\//
            ]

            const isValidUrl =
                instagramPatterns.some(
                    pattern =>
                        pattern.test(text)
                )

            if (!isValidUrl) {

                return sock.sendMessage(
                    from,
                    {
                        text:
                            "❌ Invalid Instagram URL."
                    },
                    { quoted: m }
                )
            }

            // ======================
            // REACTION
            // ======================
            await sock.sendMessage(
                from,
                {
                    react: {
                        text: "📥",
                        key: m.key
                    }
                }
            )

            // ======================
            // DOWNLOAD
            // ======================
            const downloadData =
                await igdl(text)

            console.log(
                "IG RESPONSE:",
                JSON.stringify(
                    downloadData,
                    null,
                    2
                )
            )

            // ======================
            // HANDLE ARRAY RESPONSE
            // ======================
            const mediaToDownload =

                Array.isArray(downloadData)

                    ? downloadData

                    : downloadData.data ||

                    downloadData.result ||

                    []

            // ======================
            // NO MEDIA
            // ======================
            if (
                !mediaToDownload ||
                mediaToDownload.length === 0
            ) {

                return sock.sendMessage(
                    from,
                    {
                        text:
                            "❌ No media found."
                    },
                    { quoted: m }
                )
            }

            // ======================
            // SEND MEDIA
            // ======================
            for (
                let i = 0;
                i < mediaToDownload.length;
                i++
            ) {

                try {

                    const mediaUrl =
                        mediaToDownload[i]

                    console.log(
                        "SENDING:",
                        mediaUrl
                    )

                    // ======================
                    // DETECT VIDEO
                    // ======================
                    const isVideo =

                        mediaUrl.includes(".mp4")

                        ||

                        /\.(mp4|mov|avi|mkv|webm)$/i
                            .test(mediaUrl)

                        ||

                        text.includes("/reel/")

                        ||

                        text.includes("/tv/")

                    // ======================
                    // SEND VIDEO
                    // ======================
                    if (isVideo) {

                        await sock.sendMessage(
                            from,
                            {
                                video: {
                                    url: mediaUrl
                                },

                                mimetype:
                                    "video/mp4",

                                caption:
                                    `DOWNLOADED BY ${config.botName}`
                            },
                            { quoted: m }
                        )
                    }

                    // ======================
                    // SEND IMAGE
                    // ======================
                    else {

                        await sock.sendMessage(
                            from,
                            {
                                image: {
                                    url: mediaUrl
                                },

                                caption:
                                    `Downloaded by ${config.botName}`
                            },
                            { quoted: m }
                        )
                    }

                    // ======================
                    // DELAY
                    // ======================
                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                1000
                            )
                    )

                } catch (mediaError) {

                    console.log(
                        "MEDIA ERROR:",
                        mediaError
                    )
                }
            }

        } catch (err) {

            console.log(
                "INSTAGRAM ERROR:",
                err
            )

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    text:
                        "❌ Instagram download failed."
                },
                { quoted: m }
            )
        }
    }
}