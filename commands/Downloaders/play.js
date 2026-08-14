/**
 * Song Downloader - Download audio from YouTube
 * Features: 429 Rate-Limit Prevention, Auto-Document (>16MB), Socket Retry, Input Sanitization
 */

const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const APIs = require('../../utils/api');
const { toAudio } = require('../../utils/converter');

const MAX_AUDIO_SIZE = 16 * 1024 * 1024; // 16 MB
const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

/**
 * Helper to safely send messages with retries if the socket dropped during download
 */
async function safeSendMessage(sock, chatId, content, options = {}, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await sock.sendMessage(chatId, content, options);
        } catch (err) {
            const isConnClosed = err?.message?.includes('Connection Closed') || err?.output?.statusCode === 428;
            if (isConnClosed && attempt < retries) {
                console.log(`[Song DL] Socket disconnected. Waiting 2s before retry (${attempt}/${retries})...`);
                await new Promise(res => setTimeout(res, 2000));
            } else {
                throw err;
            }
        }
    }
}

module.exports = {
    name: 'play',
    aliases: ['song', 'music', 'yta', 'audio'],
    category: 'media',
    description: 'Download audio from YouTube',
    usage: '.song <song name or YouTube link>',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            // Clean input from surrounding quotes or angle brackets
            let rawInput = args.join(' ').trim().replace(/^["'<]+|["'>]+$/g, '').trim();

            if (!rawInput) {
                return await safeSendMessage(sock, chatId, {
                    text: 'Usage: .song <song name or YouTube link>'
                }, { quoted: msg });
            }

            let videoUrl = '';
            let video = null;

            const isYouTubeUrl = rawInput.includes('youtube.com') || rawInput.includes('youtu.be');

            if (isYouTubeUrl) {
                const videoIdMatch = rawInput.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                const videoId = videoIdMatch ? videoIdMatch[1] : null;

                if (videoId) {
                    videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

                    // Safely try fetching metadata without letting 429 break the command
                    try {
                        const searchById = await yts({ videoId });
                        if (searchById) {
                            video = {
                                url: videoUrl,
                                title: searchById.title || 'YouTube Audio',
                                timestamp: searchById.timestamp || searchById.duration?.timestamp || 'Unknown',
                                thumbnail: searchById.thumbnail || searchById.image || null
                            };
                        }
                    } catch (e) {
                        console.log('[Song DL] yts rate-limited (429) or failed. Using fallback metadata.');
                    }
                }

                if (!video) {
                    videoUrl = rawInput.split('?')[0];
                    video = {
                        url: videoUrl,
                        title: 'YouTube Audio',
                        timestamp: 'Unknown',
                        thumbnail: null
                    };
                }
            } else {
                // Search query pathway wrapped in try/catch for 429s
                try {
                    const search = await yts(rawInput);
                    if (search && search.videos && search.videos.length > 0) {
                        video = search.videos[0];
                        videoUrl = video.url;
                    }
                } catch (e) {
                    console.log('[Song DL] yts search query rate-limited (429).');
                }

                if (!video) {
                    return await safeSendMessage(sock, chatId, {
                        text: '❌ YouTube search is currently rate-limited. Please try again with a direct YouTube link.'
                    }, { quoted: msg });
                }
            }

            // Safe Thumbnail Fetching (Prevents Baileys 429 crash)
            let thumbnailBuffer = null;
            if (video.thumbnail) {
                try {
                    const thumbRes = await axios.get(video.thumbnail, {
                        responseType: 'arraybuffer',
                        timeout: 5000,
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    if (thumbRes.status === 200) {
                        thumbnailBuffer = Buffer.from(thumbRes.data);
                    }
                } catch (e) {
                    console.log('[Song DL] Thumbnail fetch failed (429/Timeout). Sending text notification.');
                }
            }

            // Send download status message
            if (thumbnailBuffer) {
                await safeSendMessage(sock, chatId, {
                    image: thumbnailBuffer,
                    caption: `🎵 Downloading: *${video.title}*\n⏱ Duration: ${video.timestamp}`
                }, { quoted: msg });
            } else {
                await safeSendMessage(sock, chatId, {
                    text: `🎵 Downloading: *${video.title}*\n⏱ Duration: ${video.timestamp}`
                }, { quoted: msg });
            }

            // Fallback API download chain
            let audioBuffer;
            let downloadSuccess = false;

            const apiMethods = [
                { name: 'EliteProTech', method: () => APIs.getEliteProTechDownloadByUrl(videoUrl) },
                { name: 'Yupra', method: () => APIs.getYupraDownloadByUrl(videoUrl) },
                { name: 'Okatsu', method: () => APIs.getOkatsuDownloadByUrl(videoUrl) },
                { name: 'Izumi', method: () => APIs.getIzumiDownloadByUrl(videoUrl) }
            ];

            for (const apiMethod of apiMethods) {
                try {
                    const audioData = await apiMethod.method();
                    const audioDlUrl = audioData?.download || audioData?.dl || audioData?.url;

                    if (!audioDlUrl) continue;

                    try {
                        const audioResponse = await axios.get(audioDlUrl, {
                            responseType: 'arraybuffer',
                            timeout: 120000,
                            maxContentLength: Infinity,
                            maxBodyLength: Infinity,
                            decompress: true,
                            validateStatus: s => s >= 200 && s < 400,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                'Accept': '*/*',
                                'Accept-Encoding': 'identity'
                            }
                        });
                        audioBuffer = Buffer.from(audioResponse.data);

                        if (audioBuffer && audioBuffer.length > 0) {
                            downloadSuccess = true;
                            break;
                        }
                    } catch (downloadErr) {
                        // Stream Fallback
                        const audioResponse = await axios.get(audioDlUrl, {
                            responseType: 'stream',
                            timeout: 120000,
                            maxContentLength: Infinity,
                            maxBodyLength: Infinity,
                            validateStatus: s => s >= 200 && s < 400,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                'Accept': '*/*',
                                'Accept-Encoding': 'identity'
                            }
                        });
                        const chunks = [];
                        await new Promise((resolve, reject) => {
                            audioResponse.data.on('data', c => chunks.push(c));
                            audioResponse.data.on('end', resolve);
                            audioResponse.data.on('error', reject);
                        });
                        audioBuffer = Buffer.concat(chunks);

                        if (audioBuffer && audioBuffer.length > 0) {
                            downloadSuccess = true;
                            break;
                        }
                    }
                } catch (apiErr) {
                    console.log(`[Song DL] ${apiMethod.name} failed: ${apiErr.message}`);
                    continue;
                }
            }

            if (!downloadSuccess || !audioBuffer || audioBuffer.length === 0) {
                throw new Error('All download sources failed. The content may be unavailable or blocked.');
            }

            // Format Detection
            const firstBytes = audioBuffer.slice(0, 12);
            const hexSignature = firstBytes.toString('hex');
            const asciiSignature = firstBytes.toString('ascii', 4, 8);

            let fileExtension = 'mp3';
            if (asciiSignature === 'ftyp' || hexSignature.startsWith('000000')) {
                fileExtension = 'm4a';
            } else if (audioBuffer.toString('ascii', 0, 3) === 'ID3' || (audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0)) {
                fileExtension = 'mp3';
            } else if (audioBuffer.toString('ascii', 0, 4) === 'OggS') {
                fileExtension = 'ogg';
            } else if (audioBuffer.toString('ascii', 0, 4) === 'RIFF') {
                fileExtension = 'wav';
            }

            // Convert to MP3 if required
            let finalBuffer = audioBuffer;
            if (fileExtension !== 'mp3') {
                try {
                    finalBuffer = await toAudio(audioBuffer, fileExtension);
                } catch (convErr) {
                    finalBuffer = audioBuffer;
                }
            }

            // Prepare Payload
            const fileSizeInBytes = finalBuffer.length;
            const fileSizeMB = (fileSizeInBytes / (1024 * 1024)).toFixed(1);
            const sanitizeFilename = (title) => (title || 'song').replace(/[^\w\s-]/g, '').trim();
            const fileName = `${sanitizeFilename(video.title)}.mp3`;

            if (fileSizeInBytes > MAX_DOCUMENT_SIZE) {
                throw new Error(`File size (${fileSizeMB} MB) exceeds WhatsApp limit of 2GB.`);
            }

            // Send payload via safe wrapper
            if (fileSizeInBytes > MAX_AUDIO_SIZE) {
                console.log(`[Song DL] File size is ${fileSizeMB}MB (> 16MB). Sending as Document.`);
                await safeSendMessage(sock, chatId, {
                    document: finalBuffer,
                    mimetype: 'audio/mpeg',
                    fileName: fileName,
                    caption: `🎵 *${video.title}*\n⏱ Duration: ${video.timestamp}\n📁 File Size: ${fileSizeMB} MB`
                }, { quoted: msg });
            } else {
                console.log(`[Song DL] File size is ${fileSizeMB}MB (<= 16MB). Sending as Audio.`);
                await safeSendMessage(sock, chatId, {
                    audio: finalBuffer,
                    mimetype: 'audio/mpeg',
                    fileName: fileName,
                    ptt: false
                }, { quoted: msg });
            }

            // Cleanup temp directory
            try {
                const tempDir = path.join(__dirname, '../../temp');
                if (fs.existsSync(tempDir)) {
                    const files = fs.readdirSync(tempDir);
                    const now = Date.now();
                    files.forEach(file => {
                        const filePath = path.join(tempDir, file);
                        try {
                            const stats = fs.statSync(filePath);
                            if (now - stats.mtimeMs > 10000) {
                                fs.unlinkSync(filePath);
                            }
                        } catch (e) { }
                    });
                }
            } catch (cleanupErr) { }

        } catch (err) {
            console.error('Song command error:', err);

            let errorMessage = '❌ Failed to download song.';
            if (err.message && err.message.includes('blocked')) {
                errorMessage = '❌ Download blocked. The content may be unavailable or restricted.';
            } else if (err.message && err.message.includes('All download sources failed')) {
                errorMessage = '❌ All download sources failed to fetch this YouTube link.';
            } else if (err.message && err.message.includes('exceeds WhatsApp')) {
                errorMessage = `❌ ${err.message}`;
            }

            try {
                await safeSendMessage(sock, chatId, { text: errorMessage }, { quoted: msg });
            } catch (e) {
                console.error('Failed to send error response:', e.message);
            }
        }
    }
};