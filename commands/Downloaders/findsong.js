const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const acrcloud = require("acrcloud");

// ==========================================
// CONFIGURATION (Fill in your ACRCloud Keys)
// ==========================================
const acr = new acrcloud({
    host: "identify-eu-west-1.acrcloud.com", // e.g. "identify-eu-west-1.acrcloud.com"
    access_key: "08991377515dc22727c982fc881523c9",
    access_secret: "iZB7YFzVakH2mLA2xEgTznI08PoPrKfA90NEI9Lw"
});

module.exports = {
    name: "findsong",
    aliases: ["find", "whatsong", "identify", "listen"],
    category: "downloader",
    desc: "Identifies a song from a quoted voice note, audio, or video clip.",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;

        try {
            // Check quoted or attached message
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const messageType = quoted ? Object.keys(quoted)[0] : Object.keys(m.message || {})[0];

            const isAudio = messageType?.includes("audioMessage");
            const isVideo = messageType?.includes("videoMessage");

            if (!isAudio && !isVideo) {
                return await sock.sendMessage(from, {
                    text: "❌ Please reply to or quote an **audio**, **voice note**, or **video** clip to identify the song."
                }, { quoted: m });
            }

            await sock.sendMessage(from, { text: "🔍 Listening and identifying the track..." }, { quoted: m });

            // Download media buffer directly using Baileys helper
            const targetMsg = quoted ? { message: quoted } : m;
            const mediaBuffer = await downloadMediaMessage(
                targetMsg,
                "buffer",
                {},
                { reuploadRequest: sock.updateMediaMessage }
            );

            if (!mediaBuffer || mediaBuffer.length === 0) {
                return await sock.sendMessage(from, {
                    text: "❌ Failed to download audio buffer from WhatsApp."
                }, { quoted: m });
            }

            // Identify using ACRCloud official fingerprinting
            const result = await acr.identify(mediaBuffer);

            if (
                result?.status?.code === 0 &&
                result?.metadata?.music &&
                result.metadata.music.length > 0
            ) {
                const track = result.metadata.music[0];
                const title = track.title || "Unknown Title";
                const artists = track.artists ? track.artists.map(a => a.name).join(", ") : "Unknown Artist";
                const album = track.album?.name || "N/A";
                const releaseDate = track.release_date || "N/A";

                let responseMsg = `🎵 *Song Identified!*\n\n` +
                    `📌 *Title:* ${title}\n` +
                    `👤 *Artist:* ${artists}\n` +
                    `💿 *Album:* ${album}\n` +
                    `📅 *Released:* ${releaseDate}`;

                return await sock.sendMessage(from, { text: responseMsg }, { quoted: m });
            } else {
                console.log("[SHAZAM ACR RESPONSE]", JSON.stringify(result, null, 2));
                return await sock.sendMessage(from, {
                    text: "❌ No matching song found. Try replying to a clearer 5–10 second clip of the audio."
                }, { quoted: m });
            }

        } catch (err) {
            console.error("[SHAZAM CRITICAL ERROR]", err);
            await sock.sendMessage(from, {
                text: "❌ An internal error occurred while processing the recognition request."
            }, { quoted: m });
        }
    }
};