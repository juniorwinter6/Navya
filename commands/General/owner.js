const config = require("../../config");

module.exports = {
    name: "owner",
    description: "Displays developer and owner credentials",
    async execute(sock, m, args) {
        const from = m.key.remoteJid;

        // Formulate a beautiful, readable layout
        const ownerDetails = `👑 *NAVYA AI DEVELOPER PROFILE* 👑
──────────────────────────
👤 *Name:* ${config.OWNER_NAME}
📱 *WhatsApp:* wa.me/${config.OWNER_NUMBER}
🌐 *GitHub:* ${config.GITHUB || "Not Set"}
📸 *Instagram:* ${config.INSTAGRAM || "Not Set"}
──────────────────────────
💡 _Need custom modifications or help? Tap the link above to chat directly with my creator!_`;

        // 1. Generate a WhatsApp vCard format so users can save your contact easily
        const vcard = 'BEGIN:VCARD\n' // Standard contact format
            + 'VERSION:3.0\n'
            + `FN:${config.OWNER_NAME}\n` // Full Name
            + `ORG:NAVYA AI Creator;\n` // Organization
            + `TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER}:+${config.OWNER_NUMBER}\n` // Actual Linkable Number
            + 'END:VCARD';

        try {
            // 2. Send the contact card first
            await sock.sendMessage(from, {
                contacts: {
                    displayName: config.OWNER_NAME,
                    contacts: [{ vcard }]
                }
            }, { quoted: m });

            // 3. Send the profile details right beneath it
            return await sock.sendMessage(from, { text: ownerDetails }, { quoted: m });

        } catch (error) {
            console.error("❌ Error running owner command:", error);
            // Fallback message if vCard rendering fails
            return await sock.sendMessage(from, { text: ownerDetails }, { quoted: m });
        }
    }
};