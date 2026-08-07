module.exports = {
    // Base64 session string (if user already has one)
    SESSION_ID: process.env.SESSION_ID || "",

    // Bot number used for generating pairing code in server logs
    BOT_NUMBER: process.env.BOT_NUMBER || "2348115336615",

    // Auth settings
    auth: {
        usePairingCode: true,
        phoneNumber: process.env.BOT_NUMBER || "2348115336615"
    },

    // The symbol used to trigger commands
    PREFIX: process.env.PREFIX || "!",

    // All owner numbers (reads comma-separated values from env, or uses default list)
    OWNERS: process.env.OWNERS
        ? process.env.OWNERS.split(",")
        : [
            "2348058068041",
            "2348115336615",
            "100399675609189" // WhatsApp LID
        ],

    // Additional aliases used by various command modules
    OWNER: process.env.OWNER
        ? process.env.OWNER.split(",")
        : ["2348058068041", "2348115336615"],

    MODS: process.env.MODS
        ? process.env.MODS.split(",")
        : ["2349130961572"],

    // Primary owner details for .owner command display
    OWNER_NAME: process.env.OWNER_NAME || "Rise",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "2348058068041",
    INSTAGRAM: process.env.INSTAGRAM || "https://www.instagram.com/winterrise",
    GITHUB: process.env.GITHUB || "https://github.com/juniorwinter6",

    // Bot work mode ('public' or 'private')
    MODE: process.env.MODE || "public"
};