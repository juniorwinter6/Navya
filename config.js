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
    ANTICALL: process.env.ANTICALL === "true" || false, // Default: false

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
    // 4. OWNER DETAILS
    // -------------------------------------------------------------
    OWNER_NAME: process.env.OWNER_NAME || "Rise",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "2348058068041",

    // Access Lists (reads comma-separated values from environment variables or uses defaults)
    OWNERS: process.env.OWNERS
        ? process.env.OWNERS.split(",")
        : ["2348058068041", "2348115336615", "100399675609189"],

    OWNER: process.env.OWNER
        ? process.env.OWNER.split(",")
        : ["2348058068041", "2348115336615"],

    MODS: process.env.MODS
        ? process.env.MODS.split(",")
        : ["2349130961572"],

    // -------------------------------------------------------------
    // 5. SOCIAL LINKS
    // -------------------------------------------------------------
    INSTAGRAM: process.env.INSTAGRAM || "https://www.instagram.com/winterrise",
    GITHUB: process.env.GITHUB || "https://github.com/juniorwinter6"
};