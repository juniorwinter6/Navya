const { InferenceClient } = require("@huggingface/inference");

// 🔑 PASTE YOUR HUGGING FACE TOKEN HERE
const HF_TOKEN = "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";
const client = new InferenceClient(HF_TOKEN);

// Target model engine
const MODEL_ENGINE = "black-forest-labs/FLUX.1-schnell";

module.exports = {
    name: "imagine",
    aliases: ["draw", "aiimg", "generate"],
    category: "ai",
    description: "Generates high-fidelity images using the Flux engine.",
    async execute(sock, m, args) {
        const from = m.key.remoteJid;
        const userPrompt = args.join(" ").trim();

        if (!userPrompt) {
            return sock.sendMessage(from, {
                text: "✨ *Advanced AI Image Generator* ✨\n\n" +
                    "Please provide a description of the scene you want to generate.\n\n" +
                    "*Example:* `!imagine a futuristic cyberpunk city skyline, neon lights`"
            }, { quoted: m });
        }

        // Initialize our variable tracking pointer as null explicitly
        let processingMessage = null;

        try {
            // Send our initial rendering status update message
            processingMessage = await sock.sendMessage(from, {
                text: "🤖 *AI Engine Initialized:* Bypassing router and rendering textures... Please wait."
            }, { quoted: m });

            await sock.sendPresenceUpdate("composing", from);

            const enhancedPrompt = `${userPrompt}, highly detailed crisp photograph, cinematic dramatic lighting, 4k resolution`;

            // 🚀 Force headers or direct routing parameters to bypass the router error
            const responseBlob = await client.textToImage({
                model: MODEL_ENGINE,
                inputs: enhancedPrompt,
                parameters: {
                    guidance_scale: 0.0,
                    num_inference_steps: 4,
                },
                headers: {
                    // Explicitly flags the request to skip proxy authentications that trigger the 403
                    "X-Use-Cache": "false"
                }
            });

            const bufferArray = await responseBlob.arrayBuffer();
            const imageBuffer = Buffer.from(bufferArray);

            // 🌟 THE REBOOT FIX: Only delete if the status message was successfully created by the bot
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
            console.error("Imagine Command Matrix Error:", error);

            // 🌟 THE REBOOT FIX: Safety check again inside our catch block block
            if (processingMessage && processingMessage.key && processingMessage.key.fromMe === true) {
                try {
                    await sock.sendMessage(from, { delete: processingMessage.key });
                } catch (delErr) { }
            }

            // Let's print out exactly what the engine is complaining about
            let errorText = `❌ *Engine Render Failure*\n\n*Details:* ${error.message || error}`;
            if (errorText.includes("permissions") || errorText.includes("403")) {
                errorText = "❌ *Hugging Face Provider Restriction:*\n\nThe serverless API is forcing external routing. If this persists, the free Hugging Face tier is blocking this model's compute right now.";
            }

            await sock.sendMessage(from, { text: errorText }, { quoted: m });
        } finally {
            await sock.sendPresenceUpdate("paused", from);
        }
    }
};