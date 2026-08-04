const OpenAI = require("openai")

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

async function chatWithAI(prompt) {

    try {

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a friendly WhatsApp AI bot."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        })

        return response.choices[0].message.content

    } catch (err) {

        console.log("OPENAI ERROR:", err)

        return "❌ AI failed."
    }
}

module.exports = { chatWithAI }