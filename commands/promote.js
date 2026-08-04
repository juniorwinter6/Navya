const config = require("../config");

module.exports = {
    name: "promote",
    category: "admin",
    desc: "Promotes a member to a group administrator role.",

    async execute(sock, m, args) {
        try {
            const from = m.key.remoteJid;
            const sender = m.key.participant || m.key.remoteJid || "";
            const isGroup = from.endsWith("@g.us");

            if (!isGroup) {
                return sock.sendMessage(from, { text: "❌ Group only command." }, { quoted: m });
            }

            // ==========================================
            // 1. OWNER / ADMIN CHECK
            // ==========================================
            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants || [];

            const senderNumber = sender.split('@')[0].split(':')[0].replace(/\D/g, "");
            const configOwners = Array.isArray(config.OWNERS) ? config.OWNERS : [];
            const isOwner = configOwners.some(num => num.replace(/\D/g, '') === senderNumber) ||
                (config.OWNER_NUMBER && config.OWNER_NUMBER.replace(/\D/g, '') === senderNumber);

            const senderData = participants.find(p => p.id === sender || (p.lid && p.lid === sender));
            const isSenderAdmin = senderData?.admin === "admin" || senderData?.admin === "superadmin";

            if (!isOwner && !isSenderAdmin) {
                return sock.sendMessage(from, { text: "❌ Access Denied. Only the bot owner or group admins can promote users." }, { quoted: m });
            }

            // ==========================================
            // 2. PARSE TARGET
            // ==========================================
            let user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                m.message?.extendedTextMessage?.contextInfo?.participant;

            if (!user) {
                return sock.sendMessage(from, { text: "❌ Tag or reply to a user to promote them." }, { quoted: m });
            }

            // ==========================================
            // 3. THE "CLEAN TAG" LOGIC
            // ==========================================
            // If it's a phone number (JID), it looks like @234... 
            // If it's an LID, we'll tag the internal ID so it still highlights blue.
            const isLid = user.includes('@lid');
            const displayId = user.split('@')[0].split(':')[0];

            // ==========================================
            // 4. EXECUTE
            // ==========================================
            await sock.groupParticipantsUpdate(from, [user], "promote");

            await sock.sendMessage(from, {
                text: `👑 @${displayId} has been successfully promoted to Admin.`,
                mentions: [user] // This ensures the tag works regardless of JID or LID
            }, { quoted: m });

        } catch (err) {
            console.log("PROMOTE ERROR:", err);
            sock.sendMessage(from, { text: "❌ Failed. Make sure the bot is an admin." }, { quoted: m });
        }
    }
};