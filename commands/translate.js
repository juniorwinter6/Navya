const { GoogleGenAI } = require("@google/genai");
// Uses the same API initialization setup from your index.js file
const ai = new GoogleGenAI({ apiKey: "AIzaSyA9unnq4-yGPb1PC8pZLSvg7iz3ZPfTZhA" });

module.exports = {
    name: "translate",
    aliases: ["tr"],
    category: "tools",
    description: "Translates text into almost any language in the world.",
    async execute(sock, m, args) {
        const from = m.key.remoteJid;

        // Combine all arguments into a single string to process
        const fullInput = args.join(" ").trim();

        // Validate that input exists and contains the pipe separator "|"
        if (!fullInput || !fullInput.includes("|")) {
            return sock.sendMessage(from, {
                text: "🌸 *How to use the Translate command:*\n\n" +
                    "Format: `!translate [language] | [your text]`\n\n" +
                    "*Examples:*\n" +
                    "💡 `!translate spanish | Hello my friend`\n" +
                    "💡 `!translate french | Where is the train station?`\n" +
                    "💡 `!translate igbo | God is good`"
            }, { quoted: m });
        }

        // Split the target language from the actual text to be translated
        const parts = fullInput.split("|");
        const targetLanguage = parts[0].trim();
        const textToTranslate = parts.slice(1).join("|").trim();

        if (!textToTranslate) {
            return sock.sendMessage(from, { text: "❌ Please provide the text you want to translate." }, { quoted: m });
        }

        // Trigger typing state to show the bot is actively working
        await sock.sendPresenceUpdate("composing", from);

        try {
            // Build a hyper-specific system prompt so the AI acts purely as a translator engine
            const systemInstruction = `
                You are a precise, professional translation engine for a WhatsApp bot.
                Your sole task is to translate the user's text into the requested language: "${targetLanguage}".
                
                CRITICAL RULES:
                1. Output ONLY the translated text. Do not add conversational filler like "Here is your translation:" or "Sure!".
                2. Preserve the tone, layout, and any emojis present in the original text.
                3. If the requested language is invalid or completely unrecognized, reply exactly with: "ERROR_UNKNOWN_LANG".
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-lite", // Using flash-lite to save your free tier requests
                contents: textToTranslate,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.3, // Lower temperature means more precise, accurate translations
                }
            });

            const resultText = response.text ? response.text.trim() : "";

            if (resultText === "ERROR_UNKNOWN_LANG") {
                return sock.sendMessage(from, {
                    text: `❌ I couldn't recognize "${targetLanguage}" as a valid language. Please check the spelling and try again!`
                }, { quoted: m });
            }

            if (!resultText) {
                throw new Error("Empty response from translation engine");
            }

            // Send back the beautifully translated text layout
            const responsePayload = `✨ *TRANSLATION SUCCESS* ✨\n\n` +
                `🌐 *Target Language:* ${targetLanguage.toUpperCase()}\n` +
                `📝 *Result:* ${resultText}`;

            await sock.sendMessage(from, { text: responsePayload }, { quoted: m });

        } catch (error) {
            console.error("Translation Command Error:", error);
            await sock.sendMessage(from, {
                text: "🌸 Sorry, I couldn't process that translation right now. Please try again in a few moments!"
            }, { quoted: m });
        } finally {
            // Turn off typing state safely
            await sock.sendPresenceUpdate("paused", from);
        }
    }
};