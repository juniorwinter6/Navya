const fs = require("fs");
const path = require("path");

const STATUS_DB_PATH = path.join(__dirname, "../group_statuses.json");

function loadStatusData() {
    if (!fs.existsSync(STATUS_DB_PATH)) return {};
    return JSON.parse(fs.readFileSync(STATUS_DB_PATH, "utf-8"));
}

function getRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
}

module.exports = {
    name: "viewstatus",
    aliases: ["gstatus", "story", "status"],
    category: "group",
    description: "Displays the latest status posted by the group admins.",
    async execute(sock, m, args) {
        const from = m.key.remoteJid;
        const isGroup = from.endsWith("@g.us");

        if (!isGroup) {
            return sock.sendMessage(from, { text: "❌ You can only view group statuses within a group chat." }, { quoted: m });
        }

        const db = loadStatusData();
        const activeStatus = db[from];

        if (!activeStatus) {
            return sock.sendMessage(from, {
                text: "✨ *No Active Group Status*\n\nAdmins haven't posted any updates yet. Check back later!"
            }, { quoted: m });
        }

        // 24-hour expiration check window
        const isExpired = Date.now() - activeStatus.timestamp > 86400000;
        if (isExpired) {
            return sock.sendMessage(from, {
                text: "🕒 *Status Expired*\n\nThe last status update has timed out. Ask an admin to post a fresh one!"
            }, { quoted: m });
        }

        const timeString = getRelativeTime(activeStatus.timestamp);

        try {
            await sock.sendPresenceUpdate("composing", from);

            // 🟢 CASE A: Re-rendering an Image Status safely via native stream construction
            if (activeStatus.isMedia && activeStatus.mediaData) {
                const captionText = `📱 *GROUP STATUS UPLOAD* 📱\n` +
                    `👤 *Posted By:* ${activeStatus.postedBy}\n` +
                    `🕒 *Time:* ${timeString}\n` +
                    `￣￣￣￣￣￣￣￣￣￣￣￣￣￣\n\n` +
                    `${activeStatus.text || "_[No caption attached]_"}`;

                const media = activeStatus.mediaData;

                // Safely structure the message body so Baileys maps it as an existing cloud asset
                return await sock.sendMessage(from, {
                    image: { url: media.url }, // Points directly to the WhatsApp CDN link
                    caption: captionText,
                    mimetype: media.mimetype,
                    fileLength: media.fileLength,
                    fileSha256: media.fileSha256 ? Buffer.from(media.fileSha256, "base64") : undefined,
                    mediaKey: media.mediaKey ? Buffer.from(media.mediaKey, "base64") : undefined,
                    mentions: [m.sender]
                }, { quoted: m });
            }

            // 🔵 CASE B: Text-only status execution
            const textStatusPayload =
                `📱 *GROUP STATUS UPLOAD* 📱\n` +
                `👤 *Posted By:* ${activeStatus.postedBy}\n` +
                `🕒 *Time:* ${timeString}\n` +
                `￣￣￣￣￣￣￣￣￣￣￣￣￣￣\n\n` +
                `📝 *Status Message:*\n"${activeStatus.text}"`;

            await sock.sendMessage(from, {
                text: textStatusPayload,
                mentions: [m.sender]
            }, { quoted: m });

        } catch (error) {
            console.error("View Status Command Failure:", error);
            await sock.sendMessage(from, { text: "❌ Could not load the current group status slide." }, { quoted: m });
        }
    }
};