module.exports = {
    // Dynamically load the Base64 session string from environment variables
    SESSION_ID: process.env.SESSION_ID || "",

    // Auth settings for linking the device
    auth: {
        usePairingCode: true,
        phoneNumber: "2348115336615" // Updated to your active WhatsApp number
    },

    // The symbol used to trigger commands
    PREFIX: "!",

    // All your owner numbers collected into a clean list
    OWNERS: [
        "2348115336615",
        "2348058068041"
    ],

    // Primary owner details for the .owner command display
    OWNER_NAME: "Junior",
    OWNER_NUMBER: "2348115336615",
    INSTAGRAM: "https://www.instagram.com/winterrise",
    GITHUB: "https://github.com/juniorwinter6"
};