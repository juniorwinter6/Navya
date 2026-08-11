module.exports = {
    name: "revoke",
    aliases: ["resetlink"],
    description: "Resets the group invite link (Admin & Owner only)",

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

            // 2. Identify sender's admin status and owner status
            const senderAdmin = participants.find(p => p.id === sender)?.admin;
            const isAdmin = senderAdmin === 'admin' || senderAdmin === 'superadmin';

            const ownerNumber = process.env.OWNER_NUMBER || "234XXXXXXXXXX"; // Fallback if env variable isn't set
            const isOwner = sender.includes(ownerNumber);

            // 3. Permission Guard Clause
            if (!isAdmin && !isOwner) {
                return await sock.sendMessage(jid, {
                    text: "❌ Only group admins or the bot owner can use this command!"
                }, { quoted: m });
            }

            // 4. Revoke and generate new link
            await sock.groupRevokeInvite(jid);
            const newCode = await sock.groupInviteCode(jid);

            await sock.sendMessage(jid, {
                text: `🔗 *Group invite link revoked!*\n\n*New Link:* https://chat.whatsapp.com/${newCode}`
            }, { quoted: m });

        } catch (err) {
            console.error("Revoke Error:", err);
            await sock.sendMessage(jid, {
                text: "❌ Failed to revoke link. Make sure I am a group admin."
            }, { quoted: m });
        }
    }
};