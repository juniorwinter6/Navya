/**
 * Song Downloader - Download audio from YouTube
 */

const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const APIs = require('../../utils/api');
const { toAudio } = require('../../utils/converter');

module.exports = {
    name: 'play',
    aliases: ['song', 'music', 'yta', 'audio'],
    category: 'media',
    description: 'Download audio from YouTube',
    usage: '.song <song name or YouTube link>',

    async execute(sock, msg, args) {
        try {
            const text = args.join(' ').trim();
            const chatId = msg.key.remoteJid;

            if (!text) {
                return await sock.sendMessage(chatId, {
                    text: 'Usage: .song <song name or YouTube link>'
                }, { quoted: msg });
            }

            let videoUrl = text;
            let video = null;

            // Handle direct YouTube URLs vs search queries
            if (text.includes('youtube.com') || text.includes('youtu.be')) {
                // Extract video ID safely
                const videoIdMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                const videoId = videoIdMatch ? videoIdMatch[1] : null;

                if (videoId) {
                    try {
                        const searchById = await yts({ videoId });
                        video = {
                            url: text,
                            title: searchById.title || 'YouTube Audio',
                            timestamp: searchById.timestamp || searchById.duration?.timestamp || 'Unknown',
                            thumbnail: searchById.thumbnail || searchById.image || 'https://i.imgur.com/8N3K7L0.png'
                        };
                    } catch (e) {
                        video = {
                            url: text,
                            title: 'YouTube Audio',
                            timestamp: 'Unknown',
                            thumbnail: 'https://i.imgur.com/8N3K7L0.png'
                        };
                    }
                } else {
                    videoUrl = text;
                    video = {
                        url: text,
                        title: 'YouTube Audio',
                        timestamp: 'Unknown',
                        thumbnail: 'https://i.imgur.com/8N3K7L0.png'
                    };
                }
            } else {
                const search = await yts(text);
                if (!search || !search.videos.length) {
                    return await sock.sendMessage(chatId, {
                        text: '❌ No results found for that search query.'
                    }, { quoted: msg });
                }
                video = search.videos[0];
                videoUrl = video.url;
            }

            // Send download status message safely
            if (video.thumbnail) {
                await sock.sendMessage(chatId, {
                    image: { url: video.thumbnail },
                    caption: `🎵 Downloading: *${video.title}*\n⏱ Duration: ${video.timestamp}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: `🎵 Downloading: *${video.title}*...`
                }, { quoted: msg });
            }

            // Try multiple APIs with fallback chain
            let audioData;
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
                    audioData = await apiMethod.method();
                    const audioUrl = audioData?.download || audioData?.dl || audioData?.url;

                    if (!audioUrl) {
                        console.log(`[Song DL] ${apiMethod.name} returned no download URL, trying next...`);
                        continue;
                    }

                    try {
                        const audioResponse = await axios.get(audioUrl, {
                            responseType: 'arraybuffer',
                            timeout: 90000,
                            maxContentLength: Infinity,
                            maxBodyLength: Infinity,
                            decompress: true,
                            validateStatus: s => s >= 200 && s < 400,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
                        const statusCode = downloadErr.response?.status || downloadErr.status;
                        if (statusCode === 451) {
                            console.log(`[Song DL] Download blocked (451) from ${apiMethod.name}, trying next...`);
                            continue;
                        }

                        // Stream fallback
                        try {
                            const audioResponse = await axios.get(audioUrl, {
                                responseType: 'stream',
                                timeout: 90000,
                                maxContentLength: Infinity,
                                maxBodyLength: Infinity,
                                validateStatus: s => s >= 200 && s < 400,
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
                        } catch (streamErr) {
                            console.log(`[Song DL] Stream download failed from ${apiMethod.name}:`, streamErr.message);
                            continue;
                        }
                    }
                } catch (apiErr) {
                    console.log(`[Song DL] ${apiMethod.name} API failed:`, apiErr.message);
                    continue;
                }
            }

            if (!downloadSuccess || !audioBuffer || audioBuffer.length === 0) {
                throw new Error('All download sources failed. The content may be unavailable or blocked.');
            }

            // Detect actual format
            const firstBytes = audioBuffer.slice(0, 12);
            const hexSignature = firstBytes.toString('hex');
            const asciiSignature = firstBytes.toString('ascii', 4, 8);

            let fileExtension = 'mp3';
            let detectedFormat = 'MP3';

            if (asciiSignature === 'ftyp' || hexSignature.startsWith('000000')) {
                detectedFormat = 'M4A/MP4';
                fileExtension = 'm4a';
            } else if (audioBuffer.toString('ascii', 0, 3) === 'ID3' || (audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0)) {
                detectedFormat = 'MP3';
                fileExtension = 'mp3';
            } else if (audioBuffer.toString('ascii', 0, 4) === 'OggS') {
                detectedFormat = 'OGG';
                fileExtension = 'ogg';
            } else if (audioBuffer.toString('ascii', 0, 4) === 'RIFF') {
                detectedFormat = 'WAV';
                fileExtension = 'wav';
            } else {
                fileExtension = 'm4a';
                detectedFormat = 'M4A';
            }

            // Convert to MP3 if necessary
            let finalBuffer = audioBuffer;

            if (fileExtension !== 'mp3') {
                try {
                    finalBuffer = await toAudio(audioBuffer, fileExtension);
                    if (!finalBuffer || finalBuffer.length === 0) {
                        throw new Error('Conversion returned empty buffer');
                    }
                } catch (convErr) {
                    throw new Error(`Failed to convert ${detectedFormat} to MP3: ${convErr.message}`);
                }
            }

            // Send audio file
            const sanitizeFilename = (title) => (title || 'song').replace(/[^\w\s-]/g, '').trim();

            await sock.sendMessage(chatId, {
                audio: finalBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${sanitizeFilename(video.title)}.mp3`,
                ptt: false
            }, { quoted: msg });

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
                                if (file.endsWith('.mp3') || file.endsWith('.m4a') || /^\d+\.(mp3|m4a)$/.test(file)) {
                                    fs.unlinkSync(filePath);
                                }
                            }
                        } catch (e) {}
                    });
                }
            } catch (cleanupErr) {}

        } catch (err) {
            console.error('Song command error:', err);

            let errorMessage = '❌ Failed to download song.';
            if (err.message && err.message.includes('blocked')) {
                errorMessage = '❌ Download blocked. The content may be unavailable in your region or restricted.';
            } else if (err.message && err.message.includes('All download sources failed')) {
                errorMessage = '❌ All download sources failed to fetch this YouTube link.';
            }

            await sock.sendMessage(msg.key.remoteJid, {
                text: errorMessage
            }, { quoted: msg });
        }
    }
};