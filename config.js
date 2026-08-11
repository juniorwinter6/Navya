require("dotenv").config();

module.exports = {
    // -------------------------------------------------------------
    // 1. BOT IDENTITY & SERVER
    // -------------------------------------------------------------
    PORT: process.env.PORT || 3000,
    BOT_NAME: process.env.BOT_NAME || "Navya",
    BOT_NUMBER: process.env.BOT_NUMBER || "2347077445628",
    PREFIX: process.env.PREFIX || ".",
    MODE: process.env.MODE || "public", // 'public' or 'private'
    ANTICALL: process.env.ANTICALL === "true" || false,

    // -------------------------------------------------------------
    // 2. SESSION & AUTH
    // -------------------------------------------------------------
    SESSION_ID: process.env.SESSION_ID || "",

    // -------------------------------------------------------------
    // 3. API KEYS & EXTERNAL SERVICES
    // -------------------------------------------------------------
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
    SIGHTENGINE_USER: process.env.SIGHTENGINE_USER || "",
    SIGHTENGINE_SECRET: process.env.SIGHTENGINE_SECRET || "",

    // -------------------------------------------------------------
    // 4. OWNER & SUDO ACCESS
    // -------------------------------------------------------------
    OWNER_NAME: process.env.OWNER_NAME || "Rise",

    // Primary Owner Number
    OWNER_NUMBER: process.env.OWNER_NUMBER || "2348058068041",

    // Sudo/Moderator List (Reads comma-separated numbers from .env or defaults)
    SUDO: process.env.SUDO
        ? process.env.SUDO.split(",").map(num => num.trim())
        : ["2348058068041", "2348115336615", "2349130961572"],

    // -------------------------------------------------------------
    // 5. SOCIAL LINKS
    // -------------------------------------------------------------
    INSTAGRAM: process.env.INSTAGRAM || "https://www.instagram.com/winterrise",
    GITHUB: process.env.GITHUB || "https://github.com/juniorwinter6"
};