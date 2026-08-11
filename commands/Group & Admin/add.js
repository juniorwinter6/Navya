module.exports = {
    name: "add",
    aliases: ["append"],
    category: "group",
    desc: "Adds a user to the group via their phone number. Admin privilege verified via action token pulling.",

    async execute(sock, m, args) {
        try {
            const from = m.key.remoteJid;

            // ==========================================
            // 1. GROUP ONLY CHECK
            // ==========================================
            if (!from.endsWith("@g.us")) {
                return await sock.sendMessage(from, {
                    text: "❌ This command can only be executed within a group chat."
                }, { quoted: m });
            }

            // ==========================================
            // 2. AUTHORIZATION GATE (OWNER OR ADMIN)
            // ==========================================
            const OWNER_LID = "100399675609189@lid";
            const senderJid = m.key.participant || m.key.remoteJid || "";

            const metadata = await sock.groupMetadata(from);
            const senderInGroup = metadata.participants.find(p => p.id === senderJid || p.lid === senderJid);
            const isSenderAdmin = senderInGroup?.admin === "admin" || senderInGroup?.admin === "superadmin";

            if (senderJid !== OWNER_LID && !isSenderAdmin) {
                return await sock.sendMessage(from, {
                    text: "❌ Access Denied. Only the bot owner or group admins can use this command."
                }, { quoted: m });
            }

            // ==========================================
            // 3. BOT ADMIN PRIVILEGE BYPASS VERIFICATION
            // ==========================================
            let inviteCode = null;
            try {
                // Testing actual admin privileges directly via the WhatsApp core engine
                inviteCode = await sock.groupInviteCode(from);
            } catch (adminError) {
                // If the engine throws an error here, the bot is missing administrative rights
                return await sock.sendMessage(from, {
                    text: "❌ Configuration Error. Please promote the bot to an **Admin** to allow it to add users."
                }, { quoted: m });
            }

            // ==========================================
            // 4. PARSE AND SANITIZE TARGET NUMBER
            // ==========================================
            if (!args || args.length === 0) {
                return await sock.sendMessage(from, {
                    text: "💡 Usage: `!add <phone number>`\nExample: `!add +2348058068041`"
                }, { quoted: m });
            }

            const rawDigits = args.join("").replace(/\D/g, "");
            if (rawDigits.length < 8) {
                return await sock.sendMessage(from, {
                    text: "❌ Invalid phone number format provided. Please provide a full country code and phone number."
                }, { quoted: m });
            }

            const targetJid = `${rawDigits}@s.whatsapp.net`;

            // Check if user is already a member
            const isAlreadyMember = metadata.participants.find(p => p.id === targetJid || p.id.includes(rawDigits));
            if (isAlreadyMember) {
                return await sock.sendMessage(from, {
                    text: "ℹ️ This user is already a member of this group chat."
                }, { quoted: m });
            }

            // ==========================================
            // 5. EXECUTE ADD / INVITE PROTOCOL
            // ==========================================
            await sock.sendMessage(from, { text: `⏳ Attempting to add +${rawDigits}...` }, { quoted: m });

            const response = await sock.groupParticipantsUpdate(from, [targetJid], "add");

            for (const res of response) {
                if (res.status === "200") {
                    await sock.sendMessage(from, {
                        text: `✅ Successfully added @${rawDigits} to the group.`,
                        mentions: [targetJid]
                    }, { quoted: m });
                }
                else if (res.status === "403" || res.content === "invite") {
                    await sock.sendMessage(from, {
                        text: `🔒 User privacy restriction detected. Generating and forwarding a secure invite link to their DMs instead...`
                    }, { quoted: m });

                    // Re-use our pulled invite code safely
                    if (!inviteCode) inviteCode = await sock.groupInviteCode(from);
                    const inviteMessage = `👋 Hello! You were invited to join *${metadata.subject}*.\n\n🔗 Click the link below to join:\nhttps://chat.whatsapp.com/${inviteCode}`;

                    await sock.sendMessage(targetJid, { text: inviteMessage });
                }
                else {
                    await sock.sendMessage(from, {
                        text: `❌ System failed to complete user insert operation. Status returned: ${res.status}`
                    }, { quoted: m });
                }
            }

        } catch (err) {
            console.error("ADD COMMAND CRITICAL ERROR:", err);
            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ An internal server error occurred while processing the add request."
            }, { quoted: m });
        }
    }
};