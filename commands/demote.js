const config = require("../config");

module.exports = {
    name: "demote",
    category: "admin",
    desc: "Demotes an administrator back to a regular group member.",

    async execute(sock, m, args) {
        try {
            const from = m.key.remoteJid;
            const sender = m.key.participant || m.key.remoteJid || "";
            const isGroup = from.endsWith("@g.us");

            if (!isGroup) {
                return sock.sendMessage(from, { text: "❌ Group only command." }, { quoted: m });
            }

            // ==========================================
            // 1. AUTHORIZATION GATE (OWNER OR ADMIN)
            // ==========================================
            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants || [];

            // Clean sender IDs for matching
            const senderNumber = sender.split('@')[0].split(':')[0].replace(/\D/g, "");

            const configOwners = Array.isArray(config.OWNERS) ? config.OWNERS : [];
            const isOwner = configOwners.some(num => num.replace(/\D/g, '') === senderNumber) ||
                (config.OWNER_NUMBER && config.OWNER_NUMBER.replace(/\D/g, '') === senderNumber);

            const senderData = participants.find(p => p.id === sender || (p.lid && p.lid === sender));
            const isSenderAdmin = senderData?.admin === "admin" || senderData?.admin === "superadmin";

            // If you are the owner, you always bypass this check
            if (!isOwner && !isSenderAdmin) {
                return sock.sendMessage(from, {
                    text: "❌ Access Denied. Only the bot owner or group admins can demote users."
                }, { quoted: m });
            }

            // ==========================================
            // 2. PARSE TARGET USER
            // ==========================================
            let user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                m.message?.extendedTextMessage?.contextInfo?.participant;

            if (!user && args.length > 0) {
                user = args[0].replace(/\D/g, '') + '@s.whatsapp.net';
            }

            if (!user) {
                return sock.sendMessage(from, { text: "❌ Tag or reply to an admin to demote them." }, { quoted: m });
            }

            const targetNumber = user.split("@")[0].split(":")[0].replace(/\D/g, "");

            // ==========================================
            // 3. FORCE EXECUTION (No internal bot-admin validation)
            // ==========================================
            // We let WhatsApp's servers handle the permission logic directly
            await sock.groupParticipantsUpdate(from, [user], "demote");

            // If it succeeds, send confirmation
            sock.sendMessage(from, {
                text: `📉 @${targetNumber} has been successfully demoted.`,
                mentions: [user]
            }, { quoted: m });

        } catch (err) {
            console.log("DEMOTE ERROR:", err);

            // If it fails here, it means the bot actually lacks admin permissions on WhatsApp's servers
            sock.sendMessage(m.key.remoteJid, {
                text: "❌ *Operation Failed:*\n\nMake sure the bot is an admin, and make sure the target user isn't the group creator."
            }, { quoted: m });
        }
    }
};