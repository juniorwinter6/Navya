const config = require("../../config");

module.exports = {
    name: "promote",
    aliases: ["pm", "admin"],
    category: "admin",
    desc: "Promotes a member to a group administrator role.",

    // Accepts context/options passed by your main command handler
    async execute(sock, m, args, context = {}) {
        const from = m.key.remoteJid;

        try {
            const isGroup = from.endsWith("@g.us");

            if (!isGroup) {
                return sock.sendMessage(from, { text: "❌ Group-only command." }, { quoted: m });
            }

            // Fetch group metadata
            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants || [];

            // ==========================================
            // 1. DETERMINE OWNER STATUS
            // ==========================================
            const rawSender = m.key.participant || m.key.remoteJid || "";
            const senderNum = rawSender.split('@')[0].split(':')[0].replace(/\D/g, "");

            const botJid = sock.decodeJid ? sock.decodeJid(sock.user?.id) : (sock.user?.id || "");
            const botNum = botJid.split('@')[0].split(':')[0].replace(/\D/g, "");

            const isBotSelf = m.key.fromMe || (senderNum.length > 0 && senderNum === botNum);

            // Collect owners from config
            let rawOwners = [];
            if (Array.isArray(config.OWNERS)) rawOwners.push(...config.OWNERS);
            if (Array.isArray(config.OWNER)) rawOwners.push(...config.OWNER);
            if (config.OWNER_NUMBER) rawOwners.push(config.OWNER_NUMBER);
            if (config.OWNER) rawOwners.push(config.OWNER);

            const cleanOwners = rawOwners
                .flatMap(item => String(item).split(','))
                .map(num => num.replace(/\D/g, ''))
                .filter(Boolean);

            const isConfigOwner = cleanOwners.some(ownerNum => {
                if (!ownerNum || !senderNum) return false;
                return senderNum === ownerNum || senderNum.endsWith(ownerNum) || ownerNum.endsWith(senderNum);
            });

            // Read owner flag directly from main handler context or properties
            const isOwner = Boolean(context?.isOwner) ||
                Boolean(context?.isDev) ||
                Boolean(m?.isOwner) ||
                isBotSelf ||
                isConfigOwner;

            console.log(`[PROMOTE] Sender: ${senderNum} | IsOwner: ${isOwner}`);

            // Check Admin Status in Group
            const senderParticipant = participants.find(p => {
                const pPhone = p.id.split('@')[0].split(':')[0].replace(/\D/g, "");
                const pLid = p.lid ? p.lid.split('@')[0].split(':')[0].replace(/\D/g, "") : "";
                return senderNum && (pPhone === senderNum || pLid === senderNum);
            });

            const isSenderAdmin = senderParticipant?.admin === "admin" || senderParticipant?.admin === "superadmin";

            if (!isOwner && !isSenderAdmin) {
                return sock.sendMessage(from, {
                    text: "❌ Access Denied. Only the bot owner or group admins can promote users."
                }, { quoted: m });
            }

            // ==========================================
            // 2. PARSE & RESOLVE TARGET USER
            // ==========================================
            let rawTarget = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                m.message?.extendedTextMessage?.contextInfo?.participant;

            if (!rawTarget && args.length > 0) {
                const cleanNum = args[0].replace(/\D/g, "");
                if (cleanNum.length >= 7) {
                    rawTarget = `${cleanNum}@s.whatsapp.net`;
                }
            }

            if (!rawTarget) {
                return sock.sendMessage(from, {
                    text: `❌ Tag a user, reply to their message, or type their phone number to promote them.\n\n*Example:* \`${config.prefix || "."}pm @user\``
                }, { quoted: m });
            }

            const targetDigits = rawTarget.split('@')[0].split(':')[0].replace(/\D/g, "");

            // Find target in group
            const targetParticipant = participants.find(p => {
                const pPhone = p.id.split('@')[0].split(':')[0].replace(/\D/g, "");
                const pLid = p.lid ? p.lid.split('@')[0].split(':')[0].replace(/\D/g, "") : "";
                return targetDigits && (pPhone === targetDigits || pLid === targetDigits);
            });

            // Use participant ID if found, otherwise pass original JID
            const realTargetJid = targetParticipant?.id || rawTarget;

            if (targetParticipant && (targetParticipant.admin === "admin" || targetParticipant.admin === "superadmin")) {
                const displayId = realTargetJid.split('@')[0];
                return sock.sendMessage(from, {
                    text: `⚠️ @${displayId} is already a Group Admin.`,
                    mentions: [realTargetJid]
                }, { quoted: m });
            }

            // ==========================================
            // 3. EXECUTE PROMOTION
            // ==========================================
            await sock.groupParticipantsUpdate(from, [realTargetJid], "promote");

            const displayId = realTargetJid.split('@')[0];

            return sock.sendMessage(from, {
                text: `👑 @${displayId} has been successfully promoted to Admin.\n\n*© ${config.botName || "Navya"}*`,
                mentions: [realTargetJid]
            }, { quoted: m });

        } catch (err) {
            console.log("PROMOTE ERROR:", err);

            sock.sendMessage(from, {
                text: "❌ Failed to promote user. Make sure Navya is an admin in this group."
            }, { quoted: m });
        }
    }
};