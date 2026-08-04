const { EdgeTTS } = require('node-edge-tts');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require("../config");

module.exports = {
    name: "tts",

    async execute(sock, msg, args) {
        const from = msg.key.remoteJid;

        if (!args || args.length === 0) {
            const prefix = config.PREFIX || "!";
            return await sock.sendMessage(from, {
                text: `❌ *Missing Text!*\n\nUse: \`${prefix}tts [your text here]\`\nExample: \`${prefix}tts Hello Rise, how are you?\``
            }, { quoted: msg });
        }

        const textToSpeak = args.join(" ");

        try {
            // 1. Initialize EdgeTTS with the Indian Female Voice configuration
            const tts = new EdgeTTS({
                voice: 'en-IN-NeerjaNeural',
                lang: 'en-IN',
                outputFormat: 'audio-24khz-96kbitrate-mono-mp3'
            });

            // Create temporary paths for encoding
            const uniqueId = crypto.randomBytes(4).toString('hex');
            const tempInput = path.join(__dirname, `../temp_in_${uniqueId}.mp3`);
            const tempOutput = path.join(__dirname, `../temp_out_${uniqueId}.ogg`);

            // 2. Fetch the audio file using the correct method name (ttsPromise)
            await tts.ttsPromise(textToSpeak, tempInput);

            // Double check that the file was actually written to disk safely
            if (!fs.existsSync(tempInput)) {
                throw new Error("Failed to create initial audio asset stream.");
            }

            // 3. Convert it to WhatsApp mobile-compatible OGG/Opus audio structure
            ffmpeg(tempInput)
                .toFormat('ogg')
                .audioCodec('libopus')
                .audioChannels(1)
                .audioFrequency(16000)
                .on('error', (err) => {
                    console.error('FFmpeg Codec Error:', err);
                    if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                    if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
                })
                .on('end', async () => {
                    const finalBuffer = fs.readFileSync(tempOutput);

                    // 4. Send it off perfectly formatted as a native blue voice note
                    await sock.sendMessage(from, {
                        audio: finalBuffer,
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true
                    }, { quoted: msg });

                    // Clean up temporary files completely
                    fs.unlinkSync(tempInput);
                    fs.unlinkSync(tempOutput);
                })
                .save(tempOutput);

        } catch (error) {
            console.error("Free TTS Engine Error:", error);
            await sock.sendMessage(from, {
                text: "❌ An error occurred while generating the voice note."
            }, { quoted: msg });
        }
    }
};