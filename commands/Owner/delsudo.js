const fs = require('fs');
const path = require('path');

module.exports = {
    name: "delsudo",
    aliases: ["removesudo", "delowner"],
    category: "owner",
    execute: async (sock, m, args, { isOwner }) => {
        if (!isOwner) return;

        const from = m.key.remoteJid;

        // 1. Extract raw JID/number from reply, mention, or argument
        let rawTarget =
            m.message?.extendedTextMessage?.contextInfo?.participant ||
            m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
            (args[0] ? args[0].replace(/[^0-9]/g, "") : "");

        if (!rawTarget) {
            await sock.sendMessage(from, {
                text: "❌ *Please reply to a user, mention them (@user), or provide their full phone number.*"
            }, { quoted: m });
            return;
        }

        let cleanNum = "";
        const targetClean = rawTarget.split("@")[0].split(":")[0];

        // 2. If target is an LID (15+ digits or ends with @lid), convert it via Group Metadata
        if (rawTarget.includes("@lid") || targetClean.length >= 14) {
            if (from.endsWith("@g.us")) {
                try {
                    const groupData = await sock.groupMetadata(from);
                    const participant = groupData.participants.find(p => {
                        const pLid = p.lid ? p.lid.split("@")[0].split(":")[0] : "";
                        const pId = p.id ? p.id.split("@")[0].split(":")[0] : "";
                        return pLid === targetClean || pId === targetClean;
                    });

                    if (participant && participant.id) {
                        cleanNum = participant.id.split("@")[0].split(":")[0];
                    }
                } catch (e) {
                    console.error("[DELSUDO] Group metadata lookup error:", e);
                }
            }
        }

        // 3. Fallback to raw input if not an LID or if outside group
        if (!cleanNum) {
            cleanNum = targetClean.replace(/[^0-9]/g, "");
        }

        if (!cleanNum || cleanNum.length < 7) {
            await sock.sendMessage(from, {
                text: "❌ *Could not resolve a valid phone number. Try typing the full number manually (e.g. .delsudo 2348123456789).* "
            }, { quoted: m });
            return;
        }

        // 4. Remove from lib/sudo.json
        const sudoPath = path.join(__dirname, "../../lib/sudo.json");
        let sudoList = [];

        if (fs.existsSync(sudoPath)) {
            try {
                sudoList = JSON.parse(fs.readFileSync(sudoPath, "utf-8"));
            } catch (e) {
                sudoList = [];
            }
        }

        if (!Array.isArray(sudoList) || !sudoList.includes(cleanNum)) {
            await sock.sendMessage(from, {
                text: `⚠️ *@${cleanNum}* is not in the SUDO list.`,
                mentions: [`${cleanNum}@s.whatsapp.net`]
            }, { quoted: m });
            return;
        }

        sudoList = sudoList.filter(num => num !== cleanNum);
        fs.writeFileSync(sudoPath, JSON.stringify(sudoList, null, 2));

        await sock.sendMessage(from, {
            text: `🗑️ *@${cleanNum}* has been removed from SUDO privileges!`,
            mentions: [`${cleanNum}@s.whatsapp.net`]
        }, { quoted: m });
    }
};