const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require("../../config"); // Pulls your OWNERS array and OWNER_NUMBER dynamically

module.exports = {
    name: "view",
    aliases: ["reveal", "vo", "vv"],

    async execute(sock, msg) {
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = msg.key.participant || msg.key.remoteJid;

        // ==========================================
        // 1. SECURITY BLOCK: OWNER & ADMINS ONLY
        // ==========================================

        // Clean the sender ID to get just the raw digits (e.g., "2348058068041")
        const senderNumber = sender.split('@')[0].replace(/[^0-9]/g, '');

        // Check if the sender's clean number exists anywhere in your config's OWNERS array, 
        // or matches your primary OWNER_NUMBER string.
        const configOwners = Array.isArray(config.OWNERS) ? config.OWNERS : [];
        const isOwner = configOwners.some(num => num.replace(/[^0-9]/g, '') === senderNumber) ||
            (config.OWNER_NUMBER && config.OWNER_NUMBER.replace(/[^0-9]/g, '') === senderNumber);

        let isAdmin = false;
        if (isGroup && !isOwner) {
            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants || [];
                const matchedUser = participants.find(p => p.id === sender);
                isAdmin = matchedUser && (matchedUser.admin === 'admin' || matchedUser.admin === 'superadmin');
            } catch (e) {
                console.error("⚠️ [VIEW SECURITY ERROR]: Could not fetch group metadata.", e);
            }
        }

        // If you are neither an authorized owner nor a group admin, block access
        if (!isOwner && !isAdmin) {
            return await sock.sendMessage(from, {
                text: "❌ *Access Denied:* This command can only be used by the Bot Owner or Group Admins."
            }, { quoted: msg });
        }

        // ==========================================
        // 2. EXTRACTION LOGIC: STRIP LAYERS
        // ==========================================
        const isQuoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let targetMessage = isQuoted ? msg.message.extendedTextMessage.contextInfo.quotedMessage : msg.message;

        let targetKey = isQuoted ? {
            remoteJid: from,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            participant: msg.message.extendedTextMessage.contextInfo.participant
        } : msg.key;

        if (!targetMessage) {
            return await sock.sendMessage(from, { text: "❌ *Error:* Please reply directly to a view-once photo or video." }, { quoted: msg });
        }

        let loopCounter = 0;
        let innerMedia = null;
        let typeFound = "";

        while (targetMessage && loopCounter < 5) {
            const currentType = Object.keys(targetMessage)[0];

            if (!currentType) break;

            if (currentType === 'imageMessage' || currentType === 'videoMessage') {
                innerMedia = targetMessage;
                typeFound = currentType;
                break;
            }

            if (['ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2', 'documentWithCaptionMessage'].includes(currentType)) {
                targetMessage = targetMessage[currentType].message || targetMessage[currentType];
            } else {
                targetMessage = targetMessage[currentType];
            }
            loopCounter++;
        }

        // ==========================================
        // 3. VALIDATION & DOWNLOADING
        // ==========================================
        if (!innerMedia || !typeFound) {
            return await sock.sendMessage(from, {
                text: "⚠️ *Target parsing failed.* Make sure you are replying directly to an unopened View-Once message."
            }, { quoted: msg });
        }

        const loadingMsg = await sock.sendMessage(from, { text: "🔄 _Extracting hidden media stream..._" }, { quoted: msg });

        try {
            const mockMsg = {
                key: targetKey,
                message: innerMedia
            };

            const buffer = await downloadMediaMessage(mockMsg, 'buffer', {});

            if (!buffer || buffer.length === 0) {
                throw new Error("Empty buffer returned from core decoder.");
            }

            const originalCaption = innerMedia[typeFound].caption || "";
            const finalCaption = originalCaption
                ? `🔓 *Revealed View-Once Media*\n\n_Original Caption:_ ${originalCaption}`
                : `🔓 *Revealed View-Once Media*`;

            if (typeFound === 'imageMessage') {
                await sock.sendMessage(from, {
                    image: buffer,
                    caption: finalCaption
                }, { quoted: msg });
            } else if (typeFound === 'videoMessage') {
                await sock.sendMessage(from, {
                    video: buffer,
                    caption: finalCaption,
                    mimetype: 'video/mp4'
                }, { quoted: msg });
            }

            await sock.sendMessage(from, { delete: loadingMsg.key });

        } catch (error) {
            console.error("❌ [VIEW COMMAND CRITICAL ERROR]:", error);
            await sock.sendMessage(from, {
                text: `❌ *Failed to extract media.*\n\n_Reason:_ Media could not be fetched. This happens if the view-once image has already been opened by the bot user session once before.`,
                edit: loadingMsg.key
            });
        }
    }
};