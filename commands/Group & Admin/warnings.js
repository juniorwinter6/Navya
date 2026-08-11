const { areJidsSameUser } = require('@whiskeysockets/baileys');

if (!global.warns) global.warns = {};

module.exports = {
    name: "warnings",
    aliases: ["warns", "checkwarns"],
    description: "Checks active warning count for a member (Admins & Owner only)",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        // 1. Check if used in a group
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: "❌ This command can only be used in groups." }, { quoted: m });
        }

        try {
            const sender = m.key.participant || jid;
            const groupMetadata = await sock.groupMetadata(jid);
            const participants = groupMetadata.participants || [];

            // 2. Permission Guard (Admin or Owner only)
            const ownerNumber = process.env.OWNER_NUMBER || "234XXXXXXXXXX";
            const isOwner = sender.includes(ownerNumber);

            const senderData = participants.find(p => areJidsSameUser(p.id, sender));
            const isAdmin = senderData?.admin === "admin" || senderData?.admin === "superadmin";

            if (!isAdmin && !isOwner) {
                return await sock.sendMessage(jid, {
                    text: "❌ Only group admins or the bot owner can use this command!"
                }, { quoted: m });
            }

            // 3. Extract target user (mentioned, replied, or self)
            const contextInfo = m.message?.extendedTextMessage?.contextInfo;
            const target = contextInfo?.mentionedJid?.[0] ||
                contextInfo?.participant ||
                sender;

            // 4. Retrieve Warning Status
            const key = `${jid}_${target}`;
            const count = global.warns[key] || 0;

            await sock.sendMessage(jid, {
                text: `📊 *Warning Status*\n\nUser: @${target.split('@')[0]}\nWarnings: *${count}/3*`,
                mentions: [target]
            }, { quoted: m });

        } catch (err) {
            console.error("Warnings Command Error:", err);
            await sock.sendMessage(jid, { text: "❌ Error checking warnings." }, { quoted: m });
        }
    }
};