const { areJidsSameUser } = require('@whiskeysockets/baileys');

if (!global.warns) global.warns = {};

module.exports = {
    name: "warn",
    description: "Gives a warning strike to a group member (Admins & Owner only, auto-kick at 3 warnings)",

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
                    text: "❌ Please mention or reply to the user you want to warn."
                }, { quoted: m });
            }

            // Prevent warning the owner or the bot itself
            if (target.includes(ownerNumber) || areJidsSameUser(target, sock.user?.id)) {
                return await sock.sendMessage(jid, {
                    text: "❌ You cannot warn the owner or the bot!"
                }, { quoted: m });
            }

            // 4. Update Warning Count
            const key = `${jid}_${target}`;
            global.warns[key] = (global.warns[key] || 0) + 1;
            const currentWarns = global.warns[key];

            // 5. Check warning limit (3 warnings = kick)
            if (currentWarns >= 3) {
                delete global.warns[key];
                await sock.sendMessage(jid, {
                    text: `⚠️ @${target.split('@')[0]} reached 3 warnings and has been removed from the group.`,
                    mentions: [target]
                }, { quoted: m });

                try {
                    await sock.groupParticipantsUpdate(jid, [target], "remove");
                } catch (err) {
                    await sock.sendMessage(jid, {
                        text: "❌ Failed to kick user. Make sure I am a group admin."
                    }, { quoted: m });
                }
            } else {
                await sock.sendMessage(jid, {
                    text: `⚠️ @${target.split('@')[0]} has been warned!\n*Warnings:* ${currentWarns}/3`,
                    mentions: [target]
                }, { quoted: m });
            }

        } catch (err) {
            console.error("Warn Command Error:", err);
            await sock.sendMessage(jid, { text: "❌ Error executing warn command." }, { quoted: m });
        }
    }
};