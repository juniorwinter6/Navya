const ytdlp = require('yt-dlp-exec');
const yts = require('yt-search');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');

module.exports = {
    name: 'video',
    aliases: ['ytv', 'ytmp4', 'downloadvideo', 'ytvideo'],
    category: 'downloader',
    description: 'Search and download video from YouTube with thumbnail preview and document support',
    async execute(arg1, arg2, arg3, arg4) {
        let sock = null;
        let msg = null;
        let args = [];
        let runtimeOptions = { isDocumentMode: false, bypassMenuCreation: false };

        // Parameter matching for Baileys command structure & menu handlers
        if (arg1?.sendMessage) {
            sock = arg1;
            msg = arg2;
            args = arg3;
            if (arg4 && typeof arg4 === 'object') runtimeOptions = { ...runtimeOptions, ...arg4 };
        } else if (arg1?.key) {
            msg = arg1;
            args = arg2;
            sock = arg3?.sock || arg3?.client || global.sock;
            if (arg3 && typeof arg3 === 'object' && !arg3.sock && !arg3.client) {
                runtimeOptions = { ...runtimeOptions, ...arg3 };
            }
        } else {
            msg = arg1 || arg2;
            sock = arg3?.sock || arg3?.client || global.sock;
            args = arg2;
            if (arg3 && typeof arg3 === 'object') runtimeOptions = { ...runtimeOptions, ...arg3 };
        }

        const chatId = msg?.key?.remoteJid || msg?.from || msg?.chat;

        const sendReply = async (text) => {
            if (sock && typeof sock.sendMessage === 'function' && chatId) {
                return await sock.sendMessage(chatId, { text }, { quoted: msg });
            } else if (typeof msg?.reply === 'function') {
                return await msg.reply(text);
            }
            console.log(`[Video Cmd Output]: ${text}`);
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
            return await sendReply('❌ *Please provide a video name or valid YouTube link.*');
        }

        // ==========================================
        // PHASE 1: DISPATCH SELECTION MENU
        // ==========================================
        if (!runtimeOptions.bypassMenuCreation) {
            const menuText = `📥 *YouTube Video Downloader Menu*\n\n` +
                `🎯 *Target:* "${query}"\n\n` +
                `Please reply with your preferred format option:\n\n` +
                `*1.* 🎥 Standard Video Playback (Stream Format)\n` +
                `*2.* 📁 Document Attachment (Original File)\n\n` +
                `💡 _You can select both options one after the other!_`;

            const sentMenu = await sendReply(menuText);

            global.videoCache = global.videoCache || {};
            global.videoCache[chatId] = {
                menuMessageId: sentMenu?.key?.id,
                message: msg,
                args: Array.isArray(args) ? args : [query]
            };
            return;
        }

        // ==========================================
        // PHASE 2: PROCESSING DOWNLOAD TARGET
        // ==========================================
        let videoUrl = query;
        let videoDetails = {
            title: 'Video Track',
            author: 'Unknown Creator',
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
                const videoData = await yts({ videoId: videoId });
                if (videoData) {
                    videoUrl = videoData.url;
                    videoDetails = {
                        title: videoData.title,
                        author: videoData.author?.name || 'Unknown Creator',
                        timestamp: videoData.timestamp || '',
                        thumbnail: videoData.thumbnail || videoData.image || ''
                    };
                }
            } else {
                const searchResults = await yts(query);
                if (!searchResults || !searchResults.videos.length) {
                    return await sendReply('❌ No video results found for your search.');
                }
                const firstVideo = searchResults.videos[0];
                videoUrl = firstVideo.url;
                videoDetails = {
                    title: firstVideo.title,
                    author: firstVideo.author?.name || 'Unknown Creator',
                    timestamp: firstVideo.timestamp || '',
                    thumbnail: firstVideo.thumbnail || firstVideo.image || ''
                };
            }

            const formattedTitle = videoDetails.author !== 'Unknown Creator'
                ? `${videoDetails.title} - ${videoDetails.author}`
                : videoDetails.title;

            const modeLabel = runtimeOptions.isDocumentMode ? 'Document Attachment' : 'Standard Video';
            await sendReply(`🎥 Downloading & processing video (${modeLabel}): *${formattedTitle}*...`);

            const tempFilename = `temp_vid_${Date.now()}`;
            const tempPath = path.join(__dirname, `${tempFilename}.mp4`);

            // Force H.264 (avc1) video + AAC (mp4a) audio <=360p for mobile compatibility
            await ytdlp(videoUrl, {
                format: 'bestvideo[height<=360][vcodec^=avc1]+bestaudio[acodec^=mp4a]/best[height<=360][vcodec^=avc1]/best[height<=360]',
                output: tempPath,
                ffmpegLocation: ffmpegPath,
                noPlaylist: true,
                quiet: true
            });

            if (!fs.existsSync(tempPath)) {
                throw new Error('Failed to create video file.');
            }

            const videoBuffer = fs.readFileSync(tempPath);

            // Clean up temp file
            fs.unlinkSync(tempPath);

            // Download thumbnail image into a buffer
            let thumbnailBuffer = null;
            if (videoDetails.thumbnail) {
                try {
                    const thumbRes = await axios.get(videoDetails.thumbnail, {
                        responseType: 'arraybuffer',
                        timeout: 10000
                    });
                    thumbnailBuffer = Buffer.from(thumbRes.data);
                } catch (thumbErr) {
                    console.warn('[Thumbnail Fetch Warning]:', thumbErr.message);
                }
            }

            // Dispatch Thumbnail Image Preview & Video Payload
            const statusCaption = `🎥 *Sending video:* "${formattedTitle}"${videoDetails.timestamp ? ` [${videoDetails.timestamp}]` : ''}`;
            const sanitizeFilename = `${videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;

            if (sock && typeof sock.sendMessage === 'function' && chatId) {
                if (thumbnailBuffer) {
                    await sock.sendMessage(chatId, {
                        image: thumbnailBuffer,
                        caption: statusCaption
                    }, { quoted: msg });
                } else {
                    await sendReply(statusCaption);
                }

                if (runtimeOptions.isDocumentMode) {
                    await sock.sendMessage(chatId, {
                        document: videoBuffer,
                        mimetype: 'video/mp4',
                        fileName: sanitizeFilename,
                        caption: `📄 *Document File:* ${formattedTitle}`
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, {
                        video: videoBuffer,
                        mimetype: 'video/mp4',
                        caption: `🎥 ${formattedTitle}`
                    }, { quoted: msg });
                }

            } else if (typeof msg?.reply === 'function') {
                await msg.reply(statusCaption);
                await msg.reply({
                    files: [{ attachment: videoBuffer, name: sanitizeFilename }]
                });
            }

        } catch (error) {
            console.error('Video command error:', error);
            await sendReply(`❌ Failed to process video: ${error.message}`);
        }
    }
};