require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { exec } = require('child_process');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const jsonPath = "./lib/antiporn.json";

async function scanIncomingMedia(sock, m) {
    try {
        // 1. RESTART BACKLOG GUARD
        let rawTimestamp = m.messageTimestamp;
        if (rawTimestamp) {
            if (typeof rawTimestamp === 'object' && rawTimestamp.low) {
                rawTimestamp = rawTimestamp.low;
            }
            const messageTimestampMs = Number(rawTimestamp) * 1000;
            const currentTime = Date.now();

            if (!isNaN(messageTimestampMs) && (currentTime - messageTimestampMs > 30000)) {
                return;
            }
        }

        const from = m.key.remoteJid;

        if (!fs.existsSync(jsonPath)) return;
        const db = JSON.parse(fs.readFileSync(jsonPath, 'utf8') || '{}');

        if (!db[from] || !db[from].enabled) return;

        // 2. UNBOX WRAPPERS (Handles view-once/ephemeral)
        let messageType = Object.keys(m.message || {})[0];
        if (messageType === 'ephemeralMessage' || messageType === 'viewOnceMessage' || messageType === 'viewOnceMessageV2') {
            m.message = m.message[messageType].message;
            messageType = Object.keys(m.message || {})[0];
        }

        // Expanded allowed media types to include video Message types
        const isImage = messageType === 'imageMessage';
        const isSticker = messageType === 'stickerMessage';
        const isVideo = messageType === 'videoMessage';

        if (!isImage && !isSticker && !isVideo) return;

        console.log(`🔍 [ANTIPORN] Scanning incoming ${messageType.replace('Message', '')} via Sightengine...`);

        // 3. HARDENED MEDIA DOWNLOAD
        let buffer;
        let tempVideoPath = '';
        let tempFramePath = '';

        try {
            // Download the media element safely
            buffer = await downloadMediaMessage(m, 'buffer', {}, {
                options: { timeout: 15000 } // Extended slightly to support heavy videos
            });

            if (!buffer || buffer.length === 0) throw new Error("Empty buffer returned");

            // 🎥 SPECIAL INTERCEPT: If it's a video, snapshot the first frame
            if (isVideo) {
                const messageId = m.key.id || Date.now();
                tempVideoPath = path.join(__dirname, `temp_${messageId}.mp4`);
                tempFramePath = path.join(__dirname, `temp_${messageId}.jpg`);

                // Write the raw downloaded video buffer to a temporary file
                fs.writeFileSync(tempVideoPath, buffer);

                // Extract frame at the 1-second mark using your system's ffmpeg
                await new Promise((resolve, reject) => {
                    exec(`ffmpeg -i "${tempVideoPath}" -ss 00:00:01 -vframes 1 "${tempFramePath}" -y`, (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });

                // Read the freshly generated screenshot picture back into our scanning buffer
                if (fs.existsSync(tempFramePath)) {
                    buffer = fs.readFileSync(tempFramePath);
                } else {
                    throw new Error("FFmpeg failed to output frame file.");
                }

                // Instantly wipe temporary assets to clean disk environment
                if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
                if (fs.existsSync(tempFramePath)) fs.unlinkSync(tempFramePath);
            }

        } catch (downloadError) {
            console.error("⚠️ [ANTIPORN] Caught error processing media payload. Bot saved from crash!", downloadError.message);
            // Dynamic cleanup fail-safe
            if (tempVideoPath && fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
            if (tempFramePath && fs.existsSync(tempFramePath)) fs.unlinkSync(tempFramePath);
            return;
        }

        // 4. SIGHTENGINE API CALL
        const form = new FormData();
        // Sightengine reads stickers (webp) and video frames (jpg) flawlessly through this unified layout
        form.append('media', buffer, { filename: 'media.jpg' });
        form.append('models', 'nudity-2.0');
        form.append('api_user', process.env.SIGHTENGINE_USER);
        form.append('api_secret', process.env.SIGHTENGINE_SECRET);

        const response = await axios.post('https://api.sightengine.com/1.0/check.json', form, {
            headers: form.getHeaders(),
        });

        if (response.data.status !== 'success') {
            console.error("❌ [ANTIPORN] Sightengine API error response:", response.data.error);
            return;
        }

        const nudityData = response.data.nudity || {};

        console.log(`📊 [SIGHTENGINE SCORES] Explicit: ${nudityData.explicit || 0} | Activity: ${nudityData.sexual_activity || 0} | Display: ${nudityData.sexual_display || 0} | Erotica: ${nudityData.erotica || 0}`);

        const isExplicit = (nudityData.explicit || 0) > 0.50;
        const isSexualActivity = (nudityData.sexual_activity || 0) > 0.50;
        const isSexualDisplay = (nudityData.sexual_display || 0) > 0.50;
        const isErotica = (nudityData.erotica || 0) > 0.50;

        let classification = "SAFE";
        if (isExplicit || isSexualActivity || isSexualDisplay || isErotica) {
            classification = "NSFW";
        }

        // Action Execution Loop
        if (classification === "NSFW") {
            console.log(`🚨 [ANTIPORN] Explicit content confirmed by Sightengine. Wiping message in: ${from}`);

            await sock.sendMessage(from, { delete: m.key });

            const sender = m.key.participant || m.key.remoteJid;
            if (!db[from].warns) db[from].warns = {};

            db[from].warns[sender] = (db[from].warns[sender] || 0) + 1;
            fs.writeFileSync(jsonPath, JSON.stringify(db, null, 2));

            const totalWarns = db[from].warns[sender];

            if (totalWarns >= 3) {
                await sock.sendMessage(from, {
                    text: `🚨 *ANTIPORN CRITICAL ENFORCEMENT* 🚨\n\n@${sender.split('@')[0]} has reached ${totalWarns}/3 warnings for sending explicit adult content and is being removed from the group.`,
                    mentions: [sender]
                });

                delete db[from].warns[sender];
                fs.writeFileSync(jsonPath, JSON.stringify(db, null, 2));

                console.log(`🥾 [ANTIPORN] Kicking user ${sender} from group ${from}`);
                await sock.groupParticipantsUpdate(from, [sender], "remove");
            } else {
                await sock.sendMessage(from, {
                    text: `⚠️ *🚨 ANTIPORN SYSTEM ALERT 🚨*\n\n@${sender.split('@')[0]}, your media was automatically deleted because it contained explicit adult content.\n\n*Warnings:* ${totalWarns}/3\n_(You will be automatically removed from the group on the 3rd warning)_`,
                    mentions: [sender]
                });
            }
        } else {
            console.log("✅ [ANTIPORN] Media passed verification cleanly.");
        }

    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.error("⚠️ [ANTIPORN] Sightengine free tier rate limit hit. Skipping scan.");
        } else {
            console.error("❌ [ANTIPORN SERVICE ERROR]:", error.message || error);
        }
    }
}

// Global safety capture to handle internal stream crashes from node modules safely
process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.toString().includes('ECONNRESET')) {
        console.error('⚠️ [CRITICAL ANTI-CRASH]: Suppressed an unhandled socket disconnection event.');
    } else {
        console.error('Unhandled Rejection:', reason);
    }
});

module.exports = { scanIncomingMedia };