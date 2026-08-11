const { areJidsSameUser } = require('@whiskeysockets/baileys');

if (!global.goodbyeSettings) global.goodbyeSettings = {};

module.exports = {
    name: "goodbye",
    aliases: ["left"],
    description: "Enables or disables automatic goodbye messages when members leave (Admins & Owner only)",

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
                    text: `❌ *Usage:* \`.goodbye on\` or \`.goodbye off\`\n*Current Status:* ${global.goodbyeSettings[jid] ? "Active ✅" : "Disabled ❌"}`
                }, { quoted: m });
            }

            global.goodbyeSettings[jid] = (option === "on");
            await sock.sendMessage(jid, {
                text: `✅ Goodbye messages have been turned *${option.toUpperCase()}* for this group.`
            }, { quoted: m });

        } catch (err) {
            console.error("Goodbye Command Error:", err);
            await sock.sendMessage(jid, { text: "❌ Error executing goodbye command." }, { quoted: m });
        }
    }
};