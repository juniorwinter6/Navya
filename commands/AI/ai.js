const axios = require('axios');

module.exports = {
    name: "ai",
    aliases: ["ask", "gemini", "gpt"],
    category: "ai",
    type: "ai",
    description: "Chat with Google Gemini AI (with 2x failover system)",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;

        const quotedText = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
            m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;

        const prompt = args.join(" ").trim() || quotedText;

        if (!prompt) {
            return await sock.sendMessage(from, {
                text: "❌ Please provide a question or reply to a message.\n\n*Example:* `.ai Explain quantum computing`"
            }, { quoted: m });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        try {
            await sock.sendPresenceUpdate('composing', from);

            let replyText = "";
            let engineUsed = "Gemini 2.0 Flash";

            // --- 1. PRIMARY PROVIDER: Gemini API ---
            if (apiKey) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

                    const response = await axios.post(url, {
                        contents: [{ parts: [{ text: prompt }] }]
                    }, {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 8000
                    });

                    replyText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                } catch (geminiErr) {
                    const status = geminiErr?.response?.status;
                    console.warn(`[AI Engine] Gemini primary failed (${status || geminiErr.message}). Switching to Backup 1...`);
                }
            }

            // --- 2. BACKUP PROVIDER 1: Pollinations GET Endpoint (Bypasses 402) ---
            if (!replyText) {
                try {
                    engineUsed = "Backup Engine (Pollinations)";
                    const systemPrompt = "You are Navya AI, a helpful, polite, and concise WhatsApp assistant.";
                    const pollUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?system=${encodeURIComponent(systemPrompt)}`;

                    const fallbackRes = await axios.get(pollUrl, { timeout: 10000 });
                    if (fallbackRes.data) {
                        replyText = typeof fallbackRes.data === 'string' ? fallbackRes.data : JSON.stringify(fallbackRes.data);
                    }
                } catch (fallbackErr) {
                    console.warn(`[AI Engine] Backup 1 failed (${fallbackErr.message}). Switching to Backup 2...`);
                }
            }

            // --- 3. BACKUP PROVIDER 2: Public Free GPT Endpoint ---
            if (!replyText) {
                try {
                    engineUsed = "Backup Engine (Vyturex)";
                    const vyturexUrl = `https://api.vyturex.com/gpt?prompt=${encodeURIComponent(prompt)}`;
                    const res = await axios.get(vyturexUrl, { timeout: 10000 });
                    replyText = res.data?.response || res.data?.result || (typeof res.data === 'string' ? res.data : null);
                } catch (vyturexErr) {
                    console.error("[AI Engine] Backup 2 failed:", vyturexErr.message);
                }
            }

            // If all 3 providers fail
            if (!replyText) {
                throw new Error("All AI services are temporarily busy. Please try again in a few seconds.");
            }

            await sock.sendMessage(from, {
                text: `🤖 *NAVYA AI* _(${engineUsed})_\n\n${replyText.trim()}`
            }, { quoted: m });

        } catch (err) {
            console.error("AI Command Execution Error:", err.message);
            await sock.sendMessage(from, {
                text: `❌ *AI Service Notice:* ${err.message}`
            }, { quoted: m });
        } finally {
            await sock.sendPresenceUpdate('paused', from);
        }
    }
};