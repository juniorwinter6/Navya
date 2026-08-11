const { jidNormalizedUser, areJidsSameUser } = require('@whiskeysockets/baileys');

module.exports = {
    name: "kick",
    aliases: ["remove"],
    description: "Kicks a member from the group (Admins & Bot Owner only)",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;

        try {
            const isGroup = from.endsWith("@g.us");

            if (!isGroup) {
                return await sock.sendMessage(from, { text: "❌ Group only command." }, { quoted: m });
            }

            const sender = m.key.participant || m.key.remoteJid;
            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants || [];

            // 1. Identify Bot Owner
            const ownerNumber = process.env.OWNER_NUMBER || "234XXXXXXXXXX"; // Clean phone number without @s.whatsapp.net
            const isOwner = sender.includes(ownerNumber);

            // 2. Identify Sender Admin Status
            const senderData = participants.find(p => areJidsSameUser(p.id, sender));
            const isAdmin = senderData?.admin === "admin" || senderData?.admin === "superadmin";

            // Permission Check: Must be Admin OR Owner
            if (!isAdmin && !isOwner) {
                return await sock.sendMessage(from, { text: "❌ Only group admins or the bot owner can use this command." }, { quoted: m });
            }

            // 3. Robust Bot Admin Check
            const botJid = sock.user?.id ? jidNormalizedUser(sock.user.id) : null;
            const botLid = sock.user?.lid ? jidNormalizedUser(sock.user.lid) : null;

            const botData = participants.find(p =>
                (botJid && areJidsSameUser(p.id, botJid)) ||
                (botLid && areJidsSameUser(p.id, botLid))
            );

            const isBotAdmin = botData?.admin === "admin" || botData?.admin === "superadmin";

            if (!isBotAdmin) {
                return await sock.sendMessage(from, { text: "❌ Bot must be promoted to admin first." }, { quoted: m });
            }

            // 4. Get Target User (Mention or Quoted reply)
            const context = m.message?.extendedTextMessage?.contextInfo;
            let targetUser = context?.mentionedJid?.[0] || context?.participant;

            if (!targetUser) {
                return await sock.sendMessage(from, { text: "❌ Please reply to or tag the user you want to kick." }, { quoted: m });
            }

            // Safety check: Prevent kicking the bot or owners
            if (areJidsSameUser(targetUser, botJid) || targetUser.includes(ownerNumber)) {
                return await sock.sendMessage(from, { text: "❌ Cannot kick the bot or owner!" }, { quoted: m });
            }

            // 5. Execute Kick Action
            await sock.groupParticipantsUpdate(from, [targetUser], "remove");
            await sock.sendMessage(from, { text: "✅ User successfully removed." }, { quoted: m });

        } catch (err) {
            console.error("KICK COMMAND ERROR:", err);
            await sock.sendMessage(from, { text: "❌ Failed to kick user. Make sure I have admin permissions." }, { quoted: m });
        }
    }
};