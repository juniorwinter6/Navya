const ytdlp = require('yt-dlp-exec');
const yts = require('yt-search');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');

module.exports = {
    name: 'play',
    aliases: ['song', 'yta', 'ytmp3', 'music', 'audio', 'downloadsong'],
    category: 'downloader',
    description: 'Search and download audio from YouTube with thumbnail preview',
    async execute(arg1, arg2, arg3) {
        let sock = null;
        let msg = null;
        let args = [];

        // Parameter matching for Baileys command structure
        if (arg1?.sendMessage) {
            sock = arg1;
            msg = arg2;
            args = arg3;
        } else if (arg1?.key) {
            msg = arg1;
            args = arg2;
            sock = arg3?.sock || arg3?.client || global.sock;
        } else {
            msg = arg1 || arg2;
            sock = arg3?.sock || arg3?.client || global.sock;
            args = arg2;
        }

        const chatId = msg?.key?.remoteJid || msg?.from || msg?.chat;

        const sendReply = async (text) => {
            if (sock && typeof sock.sendMessage === 'function' && chatId) {
                return await sock.sendMessage(chatId, { text }, { quoted: msg });
            } else if (typeof msg?.reply === 'function') {
                return await msg.reply(text);
            }
            console.log(`[Play Cmd Output]: ${text}`);
        };

        // Parse search query
        let query = '';
        if (Array.isArray(args) && args.length > 0) {
            query = args.join(' ').trim();
        } else if (typeof args === 'string' && args.trim().length > 0) {
            query = args.trim();
        }

        if (!query) {
            const rawText =
                msg?.body ||
                msg?.text ||
                msg?.message?.conversation ||
                msg?.message?.extendedTextMessage?.text ||
                '';

            if (rawText) {
                query = rawText.replace(/^\.\w+|^\!\w+|^\/\w+/i, '').trim();
            }
        }

        if (!query) {
            return await sendReply('Please provide a song name or YouTube link.');
        }

        let videoUrl = query;
        let songDetails = {
            title: 'Audio Track',
            author: 'Unknown Artist',
            timestamp: '',
            thumbnail: ''
        };

        try {
            await sendReply(`🔍 Searching for: *${query}*`);

            // Helper to extract YouTube Video ID from any standard link
            const extractVideoId = (url) => {
                const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                return match ? match[1] : null;
            };

            const videoId = extractVideoId(query);

            if (videoId) {
                // If query is a direct YouTube link, fetch metadata via videoId
                const videoData = await yts({ videoId: videoId });
                if (videoData) {
                    videoUrl = videoData.url;
                    songDetails = {
                        title: videoData.title,
                        author: videoData.author?.name || 'Unknown Artist',
                        timestamp: videoData.timestamp || '',
                        thumbnail: videoData.thumbnail || videoData.image || ''
                    };
                }
            } else {
                // Perform text search if query is a song title
                const searchResults = await yts(query);
                if (!searchResults || !searchResults.videos.length) {
                    return await sendReply('❌ No results found for your search.');
                }
                const firstVideo = searchResults.videos[0];
                videoUrl = firstVideo.url;
                songDetails = {
                    title: firstVideo.title,
                    author: firstVideo.author?.name || 'Unknown Artist',
                    timestamp: firstVideo.timestamp || '',
                    thumbnail: firstVideo.thumbnail || firstVideo.image || ''
                };
            }

            const formattedTitle = songDetails.author !== 'Unknown Artist'
                ? `${songDetails.title} - ${songDetails.author}`
                : songDetails.title;

            await sendReply(`🎵 Downloading & processing: *${formattedTitle}*...`);

            const tempFilename = `temp_${Date.now()}`;
            const tempPath = path.join(__dirname, `${tempFilename}.mp3`);

            // Download audio using yt-dlp binary
            await ytdlp(videoUrl, {
                extractAudio: true,
                audioFormat: 'mp3',
                output: tempPath,
                ffmpegLocation: ffmpegPath,
                noPlaylist: true,
                quiet: true
            });

            if (!fs.existsSync(tempPath)) {
                throw new Error('Failed to create audio file.');
            }

            const audioBuffer = fs.readFileSync(tempPath);

            // Clean up temp audio file
            fs.unlinkSync(tempPath);

            // Download YouTube thumbnail image into a buffer
            let thumbnailBuffer = null;
            if (songDetails.thumbnail) {
                try {
                    const thumbRes = await axios.get(songDetails.thumbnail, {
                        responseType: 'arraybuffer',
                        timeout: 10000
                    });
                    thumbnailBuffer = Buffer.from(thumbRes.data);
                } catch (thumbErr) {
                    console.warn('[Thumbnail Fetch Warning]:', thumbErr.message);
                }
            }

            // Dispatch Thumbnail Image & Audio
            const statusCaption = `🎶 *Sending audio:* "${formattedTitle}"${songDetails.timestamp ? ` [${songDetails.timestamp}]` : ''}`;

            if (sock && typeof sock.sendMessage === 'function' && chatId) {
                // 1. Send YouTube Thumbnail Image with track metadata caption
                if (thumbnailBuffer) {
                    await sock.sendMessage(chatId, {
                        image: thumbnailBuffer,
                        caption: statusCaption
                    }, { quoted: msg });
                } else {
                    await sendReply(statusCaption);
                }

                // 2. Send Audio File
                await sock.sendMessage(chatId, {
                    audio: audioBuffer,
                    mimetype: 'audio/mp4',
                    fileName: `${songDetails.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`,
                    ptt: false
                }, { quoted: msg });

            } else if (typeof msg?.reply === 'function') {
                await msg.reply(statusCaption);
                await msg.reply({
                    files: [{ attachment: audioBuffer, name: `${songDetails.title}.mp3` }]
                });
            }

        } catch (error) {
            console.error('Song command error:', error);
            await sendReply(`❌ Failed to process song: ${error.message}`);
        }
    }
};
