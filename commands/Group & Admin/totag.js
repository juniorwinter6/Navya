const { areJidsSameUser } = require('@whiskeysockets/baileys');

module.exports = {
    name: "totag",
    aliases: ["tag"],
    description: "Tags all members using a quoted message or custom text (Admins & Owner only)",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        // 1. Check if used in a group
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: "❌ This command can only be used in groups." }, { quoted: m });
        }

        try {
            const sender = m.key.participant || m.key.remoteJid;
            const groupMetadata = await sock.groupMetadata(jid);
            const participants = groupMetadata.participants || [];

            // 2. Identify Owner and Admin Status
            const ownerNumber = process.env.OWNER_NUMBER || "234XXXXXXXXXX";
            const isOwner = sender.includes(ownerNumber);

            const senderData = participants.find(p => areJidsSameUser(p.id, sender));
            const isAdmin = senderData?.admin === "admin" || senderData?.admin === "superadmin";

            // Permission Guard
            if (!isAdmin && !isOwner) {
                return await sock.sendMessage(jid, {
                    text: "❌ Only group admins or the bot owner can use this command!"
                }, { quoted: m });
            }

            // 3. Extract member JIDs and message content
            const participantJids = participants.map(p => p.id);
            const contextInfo = m.message?.extendedTextMessage?.contextInfo;
            const quoted = contextInfo?.quotedMessage;
            const messageText = args.join(" ") || "📢 Attention everyone!";

            // 4. Send tagged message or forward quoted content
            if (quoted) {
                await sock.sendMessage(jid, {
                    forward: {
                        key: {
                            remoteJid: jid,
                            id: contextInfo.stanzaId,
                            participant: contextInfo.participant
                        },
                        message: quoted
                    },
                    mentions: participantJids
                });
            } else {
                await sock.sendMessage(jid, {
                    text: messageText,
                    mentions: participantJids
                }, { quoted: m });
            }

        } catch (err) {
            console.error("Totag Error:", err);
            await sock.sendMessage(jid, { text: "❌ Failed to tag members." }, { quoted: m });
        }
    }
};