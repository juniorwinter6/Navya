module.exports = {
    name: "link",
    aliases: ["invite", "grouplink"],
    description: "Gets the group invite link (Admin & Owner only)",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: "❌ This command can only be used in groups." }, { quoted: m });
        }

        try {
            const sender = m.key.participant || jid;
            const groupMetadata = await sock.groupMetadata(jid);
            const participants = groupMetadata.participants || [];

            // Permission Check: Admin or Owner only
            const ownerNumber = process.env.OWNER_NUMBER || "234XXXXXXXXXX";
            const isOwner = sender.includes(ownerNumber);
            const senderData = participants.find(p => p.id === sender);
            const isAdmin = senderData?.admin === "admin" || senderData?.admin === "superadmin";

            if (!isAdmin && !isOwner) {
                return await sock.sendMessage(jid, { text: "❌ Only group admins or the bot owner can use this command!" }, { quoted: m });
            }

            const inviteCode = await sock.groupInviteCode(jid);
            await sock.sendMessage(jid, {
                text: `🔗 *Group Invite Link:*\nhttps://chat.whatsapp.com/${inviteCode}`
            }, { quoted: m });

        } catch (err) {
            console.error("Link Command Error:", err);
            await sock.sendMessage(jid, { text: "❌ Failed to fetch link. Make sure I am a group admin." }, { quoted: m });
        }
    }
};