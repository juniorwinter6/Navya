const { InferenceClient } = require("@huggingface/inference");

if (!global.hfTokens) global.hfTokens = {};

// Target model engine
const MODEL_ENGINE = "black-forest-labs/FLUX.1-schnell";

module.exports = {
    name: "imagine",
    aliases: ["draw", "aiimg", "generate"],
    category: "ai",
    description: "Generates high-fidelity images using the Flux engine (Requires HF token).",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;
        const sender = m.sender || m.key.participant || m.key.remoteJid || "";
        const cleanSender = sender.replace(/[^0-9]/g, "");
        const userPrompt = args.join(" ").trim();

        // 1. Robust Token Resolution (User Custom > Global Config > Environment Variables)
        const userHfToken =
            global.hfTokens[cleanSender] ||
            global.hfToken ||
            global.HF_TOKEN ||
            (typeof config !== "undefined" && (config.HF_TOKEN || config.HUGGINGFACE_TOKEN)) ||
            process.env.HF_TOKEN ||
            process.env.HUGGINGFACE_TOKEN ||
            process.env.HUGGING_FACE_TOKEN;

        // 2. Only show instructions if NO token is set anywhere on server or user database
        if (!userHfToken) {
            return await sock.sendMessage(from, {
                text: "⚠️ *Hugging Face API Key Required*\n\n" +
                    "To generate images with the FLUX engine, you need to link your free Hugging Face token.\n\n" +
                    "📋 *How to get your free token:*\n" +
                    "1. Go to https://huggingface.co/settings/tokens\n" +
                    "2. Create a free account or log in.\n" +
                    "3. Click *\"Create new token\"* (Type: **Read**).\n" +
                    "4. Copy your token (starts with `hf_...`).\n\n" +
                    "🔑 *Save it to the bot:*\n" +
                    "Send: `.sethftoken your_token_here`"
            }, { quoted: m });
        }

        if (!userPrompt) {
            return await sock.sendMessage(from, {
                text: "✨ *Advanced AI Image Generator* ✨\n\n" +
                    "Please provide a description of the scene you want to generate.\n\n" +
                    "*Example:* `.imagine a futuristic cyberpunk city skyline, neon lights`"
            }, { quoted: m });
        }

        let processingMessage = null;

        try {
            // Instantiate client dynamically using the active user's or bot's token
            const client = new InferenceClient(userHfToken);

            processingMessage = await sock.sendMessage(from, {
                text: "🤖 *AI Engine Initialized:* Rendering textures with FLUX.1... Please wait."
            }, { quoted: m });

            await sock.sendPresenceUpdate("composing", from);

            const enhancedPrompt = `${userPrompt}, highly detailed crisp photograph, cinematic dramatic lighting, 4k resolution`;

            const responseBlob = await client.textToImage({
                model: MODEL_ENGINE,
                inputs: enhancedPrompt,
                parameters: {
                    guidance_scale: 0.0,
                    num_inference_steps: 4,
                },
                headers: {
                    "X-Use-Cache": "false"
                }
            });

            const bufferArray = await responseBlob.arrayBuffer();
            const imageBuffer = Buffer.from(bufferArray);

            // Clean up status message
            if (processingMessage && processingMessage.key && processingMessage.key.fromMe === true) {
                try {
                    await sock.sendMessage(from, { delete: processingMessage.key });
                } catch (delErr) {
                    console.log("[Imagine Script] Could not remove processing status message.");
                }
            }

            await sock.sendMessage(from, {
                image: imageBuffer,
                caption: `📸 *AI Generated Concept*\n\n` +
                    `💡 *Your Prompt:* "${userPrompt}"\n\n` +
                    `⚡ *Engine:* \`Flux.1-Schnell\``
            }, { quoted: m });

        } catch (error) {
            console.error("Imagine Command Error:", error);

            // Clean up status message on error
            if (processingMessage && processingMessage.key && processingMessage.key.fromMe === true) {
                try {
                    await sock.sendMessage(from, { delete: processingMessage.key });
                } catch (delErr) { }
            }

            const statusCode = error.status || error.statusCode || error.response?.status;
            const errorMsg = String(error.message || error).toLowerCase();

            let errorText = `❌ *Engine Render Failure*\n\n*Details:* ${error.message || error}`;

            // Specific, actionable error handling
            if (statusCode === 401 || errorMsg.includes("401") || errorMsg.includes("invalid token") || errorMsg.includes("unauthorized")) {
                errorText = "❌ *Invalid Hugging Face Token:*\n\nYour active HF token was rejected by Hugging Face. Please generate a new token (Type: Read) at https://huggingface.co/settings/tokens and update your environment variables or run `.sethftoken <token>`";
            } else if (statusCode === 403 || errorMsg.includes("403") || errorMsg.includes("permissions")) {
                errorText = "❌ *Access Denied:* Your Hugging Face token lacks permission or the free tier limit was reached for this model.";
            } else if (statusCode === 503 || errorMsg.includes("503") || errorMsg.includes("loading")) {
                errorText = "⏳ *Model Warming Up:* The FLUX engine is currently cold-starting on Hugging Face servers. Please try again in 20 seconds.";
            } else if (statusCode === 429 || errorMsg.includes("429") || errorMsg.includes("rate limit")) {
                errorText = "⚠️ *Rate Limit Exceeded:* You have hit Hugging Face's free usage limit. Please wait a few minutes before trying again.";
            }

            await sock.sendMessage(from, { text: errorText }, { quoted: m });
        } finally {
            await sock.sendPresenceUpdate("paused", from);
        }
    }
};