const axios = require("axios")

module.exports = {

    name: "lyrics",
    aliases: ["lyric"],

    async execute(sock, m, args) {

        try {

            const from = m.key.remoteJid

            const query = args.join(" ")

            if (!query) {

                return sock.sendMessage(from, {
                    text:
                        `🎵 Usage:
!lyrics <song name>

Example:
!lyrics love me like you do`
                }, { quoted: m })
            }

            // ======================
            // STEP 1: SEARCH SONG
            // ======================
            const search = await axios.get(
                `https://api.lyrics.ovh/suggest/${query}`
            ).catch(() => null)

            let song = search?.data?.data?.[0]

            if (!song) {

                return sock.sendMessage(from, {
                    text: "❌ No lyrics found."
                }, { quoted: m })
            }

            const title = song.title
            const artist = song.artist.name

            // ======================
            // STEP 2: GET LYRICS
            // ======================
            const lyricsRes = await axios.get(
                `https://api.lyrics.ovh/v1/${artist}/${title}`
            ).catch(() => null)

            const lyrics =
                lyricsRes?.data?.lyrics ||
                "❌ Lyrics not available."

            // ======================
            // SEND RESULT
            // ======================
            await sock.sendMessage(from, {

                text:
                    `╭━━〔 🎵 𝐋𝐘𝐑𝐈𝐂𝐒 〕━━╮

🎤 Title: ${title}
👤 Artist: ${artist}

━━━━━━━━━━━━━━
📜 Lyrics:
${lyrics}

╰━━━━━━━━━━━━━━╯`

            }, { quoted: m })

        } catch (err) {

            console.log("LYRICS ERROR:", err)

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    text: "❌ Failed to fetch lyrics."
                },
                { quoted: m }
            )
        }
    }
}