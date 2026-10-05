/**
 * API Integration Utilities
 */

const axios = require('axios');

// Central Axios Instance
const api = axios.create({
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
});

// Reusable Retry Utility
const tryRequest = async (getter, attempts = 2) => {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    throw lastError;
};

// API Endpoints
const APIs = {
    // Image Generation
    generateImage: async (prompt) => {
        try {
            const response = await api.get(`https://api.siputzx.my.id/api/ai/stablediffusion`, {
                params: { prompt }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to generate image');
        }
    },

    // AI Chat - Shizo API
    chatAI: async (text) => {
        try {
            const response = await api.get(`https://api.shizo.top/ai/gpt`, {
                params: { apikey: 'shizo', query: text }
            });
            if (response.data?.msg) {
                return { msg: response.data.msg };
            }
            return response.data;
        } catch (error) {
            throw new Error('Failed to get AI response');
        }
    },

    // YouTube Download (Audio / Video)
    ytDownload: async (url, type = 'audio') => {
        try {
            const endpoint = type === 'audio' ? 'ytmp3' : 'ytmp4';
            const response = await api.get(`https://api.siputzx.my.id/api/d/${endpoint}`, {
                params: { url }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to download YouTube content');
        }
    },

    // Instagram Download
    igDownload: async (url) => {
        try {
            const response = await api.get(`https://api.siputzx.my.id/api/d/igdl`, {
                params: { url }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to download Instagram content');
        }
    },

    // TikTok Download
    tiktokDownload: async (url) => {
        try {
            const response = await api.get(`https://api.siputzx.my.id/api/d/tiktok`, {
                params: { url }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to download TikTok video');
        }
    },

    // Translate
    translate: async (text, to = 'en') => {
        try {
            const response = await api.get(`https://api.siputzx.my.id/api/tools/translate`, {
                params: { text, to }
            });
            return response.data;
        } catch (error) {
            throw new Error('Translation failed');
        }
    },

    // Random Meme
    getMeme: async () => {
        try {
            const response = await api.get('https://meme-api.com/gimme');
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch meme');
        }
    },

    // Random Quote
    getQuote: async () => {
        try {
            const response = await api.get('https://api.quotable.io/random');
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch quote');
        }
    },

    // Random Joke
    getJoke: async () => {
        try {
            const response = await api.get('https://official-joke-api.appspot.com/random_joke');
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch joke');
        }
    },

    // Weather
    getWeather: async (city) => {
        try {
            const response = await api.get(`https://api.siputzx.my.id/api/tools/weather`, {
                params: { city }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to fetch weather');
        }
    },

    // Shorten URL
    shortenUrl: async (url) => {
        try {
            const response = await api.get(`https://tinyurl.com/api-create.php`, {
                params: { url }
            });
            return response.data;
        } catch (error) {
            throw new Error('Failed to shorten URL');
        }
    },

    // Wikipedia Search
    wikiSearch: async (query) => {
        try {
            const response = await api.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
            return response.data;
        } catch (error) {
            throw new Error('Wikipedia search failed');
        }
    },

    // Song Download APIs (With safe fallback structures)
    getIzumiDownloadByUrl: async (youtubeUrl) => {
        const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
        const res = await tryRequest(() => api.get(apiUrl));
        if (res?.data?.result?.download) return res.data.result;
        throw new Error('Izumi returned no download');
    },

    getIzumiDownloadByQuery: async (query) => {
        const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube-play?query=${encodeURIComponent(query)}`;
        const res = await tryRequest(() => api.get(apiUrl));
        if (res?.data?.result?.download) return res.data.result;
        throw new Error('Izumi play returned no download');
    },

    getYupraDownloadByUrl: async (youtubeUrl) => {
        const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
        const res = await tryRequest(() => api.get(apiUrl));
        if (res?.data?.success && res?.data?.data?.download_url) {
            return {
                download: res.data.data.download_url,
                title: res.data.data.title,
                thumbnail: res.data.data.thumbnail
            };
        }
        throw new Error('Yupra returned no download');
    },

    getOkatsuDownloadByUrl: async (youtubeUrl) => {
        const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
        const res = await tryRequest(() => api.get(apiUrl));
        if (res?.data?.dl) {
            return {
                download: res.data.dl,
                title: res.data.title,
                thumbnail: res.data.thumb
            };
        }
        throw new Error('Okatsu ytmp3 returned no download');
    },

    getEliteProTechDownloadByUrl: async (youtubeUrl) => {
        const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
        const res = await tryRequest(() => api.get(apiUrl));
        if (res?.data?.success && res?.data?.downloadURL) {
            return {
                download: res.data.downloadURL,
                title: res.data.title
            };
        }
        throw new Error('EliteProTech ytdown returned no download');
    },

    getEliteProTechVideoByUrl: async (youtubeUrl) => {
        const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp4`;
        const res = await tryRequest(() => api.get(apiUrl));
        if (res?.data?.success && res?.data?.downloadURL) {
            return {
                download: res.data.downloadURL,
                title: res.data.title
            };
        }
        throw new Error('EliteProTech ytdown video returned no download');
    },

    getYupraVideoByUrl: async (youtubeUrl) => {
        const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
        const res = await tryRequest(() => api.get(apiUrl));
        if (res?.data?.success && res?.data?.data?.download_url) {
            return {
                download: res.data.data.download_url,
                title: res.data.data.title,
                thumbnail: res.data.data.thumbnail
            };
        }
        throw new Error('Yupra returned no download');
    },

    getOkatsuVideoByUrl: async (youtubeUrl) => {
        const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
        const res = await tryRequest(() => api.get(apiUrl));
        if (res?.data?.result?.mp4) {
            return { download: res.data.result.mp4, title: res.data.result.title };
        }
        throw new Error('Okatsu ytmp4 returned no mp4');
    },

    // TikTok Download API
    getTikTokDownload: async (url) => {
        try {
            const response = await api.get(`https://api.siputzx.my.id/api/d/tiktok`, {
                params: { url }
            });

            const data = response.data?.data;
            if (response.data?.status && data) {
                let videoUrl = data.urls?.[0] || data.video_url || data.url || data.download_url;
                let title = data.metadata?.title || 'TikTok Video';

                if (videoUrl) {
                    return { videoUrl, title };
                }
            }
            throw new Error('Invalid TikTok response structure');
        } catch (error) {
            throw new Error('TikTok download failed');
        }
    },

    // Screenshot Website API
    screenshotWebsite: async (url) => {
        try {
            const apiUrl = `https://eliteprotech-apis.zone.id/ssweb?url=${encodeURIComponent(url)}`;
            const response = await api.get(apiUrl, {
                responseType: 'arraybuffer'
            });

            if (response.headers['content-type']?.includes('image')) {
                return Buffer.from(response.data);
            }

            try {
                const data = JSON.parse(Buffer.from(response.data).toString());
                return data.url || data.data?.url || data.image || apiUrl;
            } catch (e) {
                return Buffer.from(response.data);
            }
        } catch (error) {
            throw new Error('Failed to take screenshot');
        }
    },

    // Text to Speech API
    textToSpeech: async (text) => {
        try {
            const response = await api.get(`https://www.laurine.site/api/tts/tts-nova`, {
                params: { text }
            });

            const resData = response.data;
            if (resData) {
                if (typeof resData === 'string' && resData.startsWith('http')) {
                    return resData;
                }

                const target = resData.data || resData;
                if (target.URL || target.url) return target.URL || target.url;
                if (target.MP3 || target.mp3) return `https://ttsmp3.com/created_mp3_ai/${target.MP3 || target.mp3}`;
            }

            throw new Error('Invalid TTS response');
        } catch (error) {
            throw new Error(`Failed to generate speech: ${error.message}`);
        }
    }
};

module.exports = APIs;