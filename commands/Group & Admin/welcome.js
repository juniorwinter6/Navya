const { areJidsSameUser } = require('@whiskeysockets/baileys');

if (!global.welcomeSettings) global.welcomeSettings = {};

module.exports = {
    name: "welcome",
    description: "Enables or disables automatic welcome messages for new members (Admins & Owner only)",

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

            // 3. Process ON / OFF argument
            const option = args[0]?.toLowerCase();
            if (option !== "on" && option !== "off") {
                return await sock.sendMessage(jid, {
                    text: `❌ *Usage:* \`.welcome on\` or \`.welcome off\`\n*Current Status:* ${global.welcomeSettings[jid] ? "Active ✅" : "Disabled ❌"}`
                }, { quoted: m });
            }

            global.welcomeSettings[jid] = (option === "on");
            await sock.sendMessage(jid, {
                text: `✅ Welcome messages have been turned *${option.toUpperCase()}* for this group.`
            }, { quoted: m });

        } catch (err) {
            console.error("Welcome Command Error:", err);
            await sock.sendMessage(jid, { text: "❌ Error executing welcome command." }, { quoted: m });
        }
    }
};