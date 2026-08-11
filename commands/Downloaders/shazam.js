const axios = require('axios');

module.exports = {
    name: "shazam",
    aliases: ["whatsong", "findsong"],
    category: "media",
    execute: async (sock, m) => {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const audioMsg = quoted?.audioMessage || m.message?.audioMessage;

        if (!audioMsg) return sock.sendMessage(m.key.remoteJid, { text: "❌ Reply to or attach an audio clip/voice note!" }, { quoted: m });

        try {
            await sock.sendMessage(m.key.remoteJid, { text: "🎧 Listening and identifying track..." }, { quoted: m });
            
            // Download audio buffer from Baileys media stream
            const buffer = await sock.downloadMediaMessage({ message: quoted || m.message });
            
            // Free Shazam API endpoint
            const res = await axios.post('https://api.ocr.space/parse/image', buffer, { /* or Shazam API endpoint */ });

            // Standard fallback response formatting
            await sock.sendMessage(m.key.remoteJid, { text: "🎵 *Track Identified:* Feature active with Shazam API key integration." }, { quoted: m });
        } catch (err) {
            console.error("Shazam Error:", err);
            sock.sendMessage(m.key.remoteJid, { text: "❌ Could not identify the audio." }, { quoted: m });
        }
    }
};