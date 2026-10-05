const yts = require('yt-search');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Universal downloader: tries local yt-dlp first, then fallback APIs
async function downloadAudioStream(videoUrl, outputPath) {
    try {
        // Attempt local yt-dlp binary download
        await downloadWithYtdlp(videoUrl, outputPath);
    } catch (ytdlpErr) {
        console.warn('[Downloader Engine] Local yt-dlp failed or IP blocked by YouTube. Trying API fallback...', ytdlpErr.message);
        // Fallback to external API if yt-dlp gets IP-blocked on cloud host
        await downloadViaApiFallback(videoUrl, outputPath);
    }
}

// OS-Aware yt-dlp Runner
function downloadWithYtdlp(videoUrl, outputPath) {
    return new Promise((resolve, reject) => {
        let ytdlpCmd = 'yt-dlp';

        // Check if running on Windows locally
        if (process.platform === 'win32') {
            const localExe = path.join(process.cwd(), 'yt-dlp.exe');
            if (fs.existsSync(localExe)) {
                ytdlpCmd = `"${localExe}"`;
            }
        }

        // Arguments optimized for cloud servers (spoofing headers to evade IP blocks)
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
        const command = `${ytdlpCmd} -f "ba/b" -x --audio-format mp3 --user-agent "${userAgent}" --no-playlist --no-warnings -o "${outputPath}" "${videoUrl}"`;

        exec(command, { timeout: 90000 }, (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(stderr || error.message));
            }
            resolve(stdout);
        });
    });
}

// Fallback API when datacenter IPs are blocked by YouTube
async function downloadViaApiFallback(videoUrl, outputPath) {
    const extractVideoId = (url) => {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        return match ? match[1] : null;
    };

    const videoId = extractVideoId(videoUrl);
    if (!videoId) throw new Error('Invalid video ID for fallback download.');

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    // Primary Cloud API Streamer
    try {
        const res = await axios.get(`https://api.cobalt.tools/api/json`, {
            method: 'POST',
            data: { url: videoUrl, downloadMode: 'audio', audioFormat: 'mp3' },
            headers,
            timeout: 20000
        });
        if (res.data && res.data.url) {
            return await streamToFile(res.data.url, outputPath);
        }
    } catch (e) {
        // Continue to second backup
    }

    // Secondary Rapid Stream API
    const backupUrl = `https://api.guruapi.tech/api/ytmp3?url=${encodeURIComponent(videoUrl)}`;
    const res = await axios.get(backupUrl, { headers, timeout: 20000 });
    const streamUrl = res.data?.url || res.data?.result?.url;

    if (!streamUrl) {
        throw new Error('All download sources failed.');
    }

    return await streamToFile(streamUrl, outputPath);
}

// Binary Stream Pipe
async function streamToFile(fileUrl, outputPath) {
    const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'stream',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

module.exports = {
    name: 'play',
    aliases: ['song', 'yta', 'ytmp3', 'music', 'audio', 'downloadsong'],
    category: 'downloader',
    description: 'Search and download audio from YouTube with thumbnail preview',
    async execute(arg1, arg2, arg3) {
        let sock = null;
        let msg = null;
        let args = [];

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

            const extractVideoId = (url) => {
                const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                return match ? match[1] : null;
            };

            const videoId = extractVideoId(query);

            if (videoId) {
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

            // Execute cross-platform download strategy
            await downloadAudioStream(videoUrl, tempPath);

            if (!fs.existsSync(tempPath)) {
                throw new Error('Failed to generate local audio file.');
            }

            const audioBuffer = fs.readFileSync(tempPath);
            fs.unlinkSync(tempPath);

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

            const statusCaption = `🎶 *Sending audio:* "${formattedTitle}"${songDetails.timestamp ? ` [${songDetails.timestamp}]` : ''}`;
            const sanitizeFilename = `${songDetails.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;

            if (sock && typeof sock.sendMessage === 'function' && chatId) {
                if (thumbnailBuffer) {
                    await sock.sendMessage(chatId, {
                        image: thumbnailBuffer,
                        caption: statusCaption
                    }, { quoted: msg });
                } else {
                    await sendReply(statusCaption);
                }

                await sock.sendMessage(chatId, {
                    audio: audioBuffer,
                    mimetype: 'audio/mp4',
                    fileName: sanitizeFilename,
                    ptt: false
                }, { quoted: msg });

            } else if (typeof msg?.reply === 'function') {
                await msg.reply(statusCaption);
                await msg.reply({
                    files: [{ attachment: audioBuffer, name: sanitizeFilename }]
                });
            }

        } catch (error) {
            console.error('Song command error:', error);
            await sendReply(`❌ Failed to process song: ${error.message}`);
        }
    }
};