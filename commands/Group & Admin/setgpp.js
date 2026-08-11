const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: "setgpp",
    aliases: ["seticon", "setgrouppic"],
    description: "Updates the group profile picture",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: "❌ This command can only be used in groups." }, { quoted: m });
        }

        const context = m.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = context?.quotedMessage;
        const imageMsg = m.message?.imageMessage || quotedMsg?.imageMessage;

        if (!imageMsg) {
            return await sock.sendMessage(jid, { text: "❌ Please attach or reply to an image to set as group picture." }, { quoted: m });
        }

        try {
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            await sock.updateProfilePicture(jid, buffer);
            await sock.sendMessage(jid, { text: "🖼️ Group profile picture updated successfully!" }, { quoted: m });

        } catch (err) {
            console.error("SetGPP Error:", err);
            await sock.sendMessage(jid, { text: "❌ Failed to update profile picture. Make sure I am an admin." }, { quoted: m });
        }
    }
};