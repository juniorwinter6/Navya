/**
 * YouTube Search & Interactive Reply Downloader
 */

const yts = require('yt-search');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const APIs = require('../../utils/api');
const { toAudio } = require('../../utils/converter');

// Use global memory store so it works across all command handlers
global.ytsSessions = global.ytsSessions || new Map();

module.exports = {
    name: "yts",
    aliases: ["ytsearch"],
    category: "media",

    execute: async (sock, m, args) => {
        const query = args.join(" ").trim();
        if (!query) {
            return sock.sendMessage(m.key.remoteJid, { 
                text: "❌ Please provide a search term!\n*Example:* .yts Wizkid Essence" 
            }, { quoted: m });
        }

        try {
            const results = await yts(query);
            const videos = results.videos.slice(0, 10);

            if (!videos.length) {
                return sock.sendMessage(m.key.remoteJid, { text: "❌ No YouTube results found." }, { quoted: m });
            }

            let caption = `🔍 *YOUTUBE SEARCH RESULTS*\n\n`;
            videos.forEach((v, index) => {
                caption += `*${index + 1}.* ${v.title}\n`;
                caption += `⏱️ *Duration:* ${v.timestamp} | 👁️ *Views:* ${v.views.toLocaleString()}\n\n`;
            });
            caption += `👉 *Reply to this message with a number (1-${videos.length}) to download audio.*`;

            // Send search result image + menu
            const sentMsg = await sock.sendMessage(m.key.remoteJid, { 
                image: { url: videos[0].thumbnail }, 
                caption 
            }, { quoted: m });

            const msgId = sentMsg?.key?.id;
            if (msgId) {
                global.ytsSessions.set(msgId, {
                    videos,
                    chatId: m.key.remoteJid
                });
                console.log(`[YTS] Active session created for Message ID: ${msgId}`);

                // Auto cleanup after 5 minutes
                setTimeout(() => {
                    if (global.ytsSessions.has(msgId)) {
                        global.ytsSessions.delete(msgId);
                        console.log(`[YTS] Expired session for Message ID: ${msgId}`);
                    }
                }, 5 * 60 * 1000);
            }

        } catch (err) {
            console.error("YTS Error:", err);
            sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to fetch search results." }, { quoted: m });
        }
    },

    handleYtsReply: async (sock, m, session, selectedIndex) => {
        const chatId = m.key.remoteJid;
        const video = session.videos[selectedIndex];

        if (!video) {
            return sock.sendMessage(chatId, { text: "❌ Invalid selection number." }, { quoted: m });
        }

        await sock.sendMessage(chatId, {
            image: { url: video.thumbnail || 'https://i.imgur.com/8N3K7L0.png' },
            caption: `🎵 Downloading: *${video.title}*\n⏱ Duration: ${video.timestamp}`
        }, { quoted: m });

        try {
            let audioBuffer;
            let downloadSuccess = false;

            const apiMethods = [
                { name: 'EliteProTech', method: () => APIs.getEliteProTechDownloadByUrl(video.url) },
                { name: 'Yupra', method: () => APIs.getYupraDownloadByUrl(video.url) },
                { name: 'Okatsu', method: () => APIs.getOkatsuDownloadByUrl(video.url) },
                { name: 'Izumi', method: () => APIs.getIzumiDownloadByUrl(video.url) }
            ];

            for (const apiMethod of apiMethods) {
                try {
                    const audioData = await apiMethod.method();
                    const audioUrl = audioData?.download || audioData?.dl || audioData?.url;

                    if (!audioUrl) continue;

                    const response = await axios.get(audioUrl, {
                        responseType: 'arraybuffer',
                        timeout: 90000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });

                    audioBuffer = Buffer.from(response.data);
                    if (audioBuffer && audioBuffer.length > 0) {
                        downloadSuccess = true;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!downloadSuccess || !audioBuffer) {
                throw new Error("Failed to download audio from all available sources.");
            }

            const asciiSig = audioBuffer.toString('ascii', 4, 8);
            let ext = asciiSig === 'ftyp' ? 'm4a' : 'mp3';
            let finalBuffer = audioBuffer;

            if (ext !== 'mp3') {
                finalBuffer = await toAudio(audioBuffer, ext);
            }

            const cleanTitle = (video.title || 'song').replace(/[^\w\s-]/g, '').trim();

            await sock.sendMessage(chatId, {
                audio: finalBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${cleanTitle}.mp3`,
                ptt: false
            }, { quoted: m });

        } catch (err) {
            console.error("YTS Reply Download Error:", err);
            sock.sendMessage(chatId, { text: "❌ Download failed. Content may be restricted." }, { quoted: m });
        }
    }
};