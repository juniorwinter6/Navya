require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
    try {
        const response = await genAI.listModels();
        console.log("Available models:");
        response.models.forEach(m => console.log(m.name));
    } catch (e) {
        console.error("Connection error:", e.message);
    }
}
run();