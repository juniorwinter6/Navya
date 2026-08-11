const { areJidsSameUser } = require('@whiskeysockets/baileys');

if (!global.warns) global.warns = {};

module.exports = {
    name: "unwarn",
    aliases: ["clearwarn"],
    description: "Removes a warning strike from a user (Admins & Owner only)",

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

            // 3. Extract target user
            const contextInfo = m.message?.extendedTextMessage?.contextInfo;
            const target = contextInfo?.mentionedJid?.[0] || contextInfo?.participant;

            if (!target) {
                return await sock.sendMessage(jid, {
                    text: "❌ Please mention or reply to the user to reduce their warnings."
                }, { quoted: m });
            }

            // 4. Update Warning Count
            const key = `${jid}_${target}`;
            const currentWarns = global.warns[key] || 0;

            if (currentWarns <= 0) {
                return await sock.sendMessage(jid, {
                    text: `✨ @${target.split('@')[0]} has no active warnings.`,
                    mentions: [target]
                }, { quoted: m });
            }

            global.warns[key] -= 1;
            await sock.sendMessage(jid, {
                text: `✅ Reduced warning for @${target.split('@')[0]}.\n*Current Warnings:* ${global.warns[key]}/3`,
                mentions: [target]
            }, { quoted: m });

        } catch (err) {
            console.error("Unwarn Command Error:", err);
            await sock.sendMessage(jid, { text: "❌ Error executing unwarn command." }, { quoted: m });
        }
    }
};