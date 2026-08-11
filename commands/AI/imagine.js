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
        const sender = m.key.participant || m.key.remoteJid;
        const cleanSender = sender.replace(/[^0-9]/g, "");
        const userPrompt = args.join(" ").trim();

        // 1. Retrieve User Token (User Custom > Global / Env Fallback)
        const userHfToken = global.hfTokens[cleanSender] || process.env.HF_TOKEN;

        // 2. If no token exists, provide instructions
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
            // Instantiate client dynamically using the active user's token
            const client = new InferenceClient(userHfToken);

            processingMessage = await sock.sendMessage(from, {
                text: "🤖 *AI Engine Initialized:* Bypassing router and rendering textures... Please wait."
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

            if (processingMessage && processingMessage.key && processingMessage.key.fromMe === true) {
                try {
                    await sock.sendMessage(from, { delete: processingMessage.key });
                } catch (delErr) { }
            }

            let errorText = `❌ *Engine Render Failure*\n\n*Details:* ${error.message || error}`;

            if (error.status === 401 || errorText.includes("token") || errorText.includes("401")) {
                errorText = "❌ *Invalid Hugging Face Token:*\n\nYour saved HF token was rejected. Please check your token or set a new one using `.sethftoken <your_token>`";
            } else if (errorText.includes("permissions") || errorText.includes("403")) {
                errorText = "❌ *Hugging Face Provider Restriction:*\n\nThe free Hugging Face serverless tier is currently limiting access to this model. Try again in a few moments.";
            }

            await sock.sendMessage(from, { text: errorText }, { quoted: m });
        } finally {
            await sock.sendPresenceUpdate("paused", from);
        }
    }
};