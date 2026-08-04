const fs = require("fs");

module.exports = {
    name: "groupstatus",
    aliases: ["gstatus", "groupinfo"],
    category: "group",
    description: "Displays real-time metadata and security configuration of the current group.",
    async execute(sock, m, args) {
        const from = m.key.remoteJid;
        const isGroup = from.endsWith("@g.us");

        // 🛑 SECURITY GATE: Prevent use inside Private Chats
        if (!isGroup) {
            return sock.sendMessage(from, {
                text: "❌ This command can only be used inside a WhatsApp Group Chat."
            }, { quoted: m });
        }

        try {
            await sock.sendPresenceUpdate("composing", from);

            // 1. Fetch Fresh Metadata via Baileys API Matrix
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants || [];

            // 2. Compute Participant Roles
            const admins = participants.filter(p => p.admin === "admin" || p.admin === "superadmin");
            const adminCount = admins.length;
            const regularCount = participants.length - adminCount;

            // 3. Evaluate Security Configurations
            // 'announce' status true means ONLY admins can broadcast text messages
            const isChatLocked = groupMetadata.announce ? "🔒 Admins Only" : "🔓 Everyone";

            // 'restrict' status true means ONLY admins can edit description/avatar settings
            const isGroupSettingsLocked = groupMetadata.restrict ? "🔒 Admins Only" : "🔓 Everyone";

            // 4. Determine Bot Privilege State
            const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
            const isBotAdmin = participants.some(p => p.id === botNumber && (p.admin === "admin" || p.admin === "superadmin"));
            const botAdminStatus = isBotAdmin ? "👑 Admin (Fully Operational)" : "⚠️ Regular Member (Restricted Privileges)";

            // 5. Parse Historic Timestamps
            // Convert UNIX epoch creation time into a human-readable clean date format
            const creationDate = groupMetadata.creation
                ? new Date(groupMetadata.creation * 1000).toLocaleDateString("en-US", {
                    year: 'numeric', month: 'long', day: 'numeric'
                })
                : "Unknown Epoch";

            const groupOwner = groupMetadata.owner || "System / Left Chat";

            // 6. Compile Scannable Status Interface Payload
            const statusReport =
                `📊 *📊 GROUP METADATA PROFILE* 📊\n\n` +
                `📝 *Name:* ${groupMetadata.subject}\n` +
                `🆔 *Group JID:* \`${groupMetadata.id}\`\n` +
                `📅 *Created On:* ${creationDate}\n` +
                `👑 *Creator/Owner:* @${groupOwner.split("@")[0]}\n\n` +
                `👥 *MEMBER DISTRIBUTION*\n` +
                `👥 *Total Members:* ${participants.length}\n` +
                `🛠 *Group Admins:* ${adminCount}\n` +
                `👤 *Regular Users:* ${regularCount}\n\n` +
                `⚙️ *SECURITY CONFIGURATION*\n` +
                `💬 *Send Messages:* ${isChatLocked}\n` +
                `🖼 *Edit Group Info:* ${isGroupSettingsLocked}\n\n` +
                `🤖 *BOT INTEGRATION STATUS*\n` +
                `⚡ *Privilege Tier:* ${botAdminStatus}\n\n` +
                `_Generated on current runtime session request._`;

            // Deliver finalized report with contextual mention tagging the owner parameter safely
            await sock.sendMessage(from, {
                text: statusReport,
                mentions: [groupOwner]
            }, { quoted: m });

        } catch (error) {
            console.error("Group Status Command Failure:", error);
            await sock.sendMessage(from, {
                text: "❌ Internal structural failure retrieving group metadata matrices. Please make sure the bot is in the chat."
            }, { quoted: m });
        } finally {
            await sock.sendPresenceUpdate("paused", from);
        }
    }
};