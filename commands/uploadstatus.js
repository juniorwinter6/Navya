const fs = require("fs");
const path = require("path");

const STATUS_DB_PATH = path.join(__dirname, "../group_statuses.json");

function saveStatusData(data) {
    fs.writeFileSync(STATUS_DB_PATH, JSON.stringify(data, null, 2));
}

function loadStatusData() {
    if (!fs.existsSync(STATUS_DB_PATH)) return {};
    return JSON.parse(fs.readFileSync(STATUS_DB_PATH, "utf-8"));
}

module.exports = {
    name: "uploadstatus",
    aliases: ["poststatus", "gpost"],
    category: "group",
    description: "Uploads a new internal status/story for group members to view.",
    async execute(sock, m, args) {
        const from = m.key.remoteJid;
        const isGroup = from.endsWith("@g.us");

        if (!isGroup) {
            return sock.sendMessage(from, { text: "❌ This feature can only be managed inside a group chat." }, { quoted: m });
        }

        try {
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants || [];
            const senderId = m.key.participant || m.key.remoteJid;
            const isUserAdmin = participants.some(p => p.id === senderId && (p.admin === "admin" || p.admin === "superadmin"));

            if (!isUserAdmin) {
                return sock.sendMessage(from, { text: "❌ Only group administrators can upload a status update." }, { quoted: m });
            }

            const statusText = args.join(" ").trim();

            // Look closely inside the incoming message structure to find any image data arrays
            const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMessage = m.message?.imageMessage || quotedMsg?.imageMessage;

            if (!statusText && !imageMessage) {
                return sock.sendMessage(from, {
                    text: "🌸 *How to post a Group Status:*\n\n" +
                        "👉 *Text Status:* `!uploadstatus [your text message]`\n" +
                        "👉 *Image Status:* Send an image (or reply to one) with the caption `!uploadstatus [optional text]`"
                }, { quoted: m });
            }

            const db = loadStatusData();

            db[from] = {
                postedBy: `@${senderId.split("@")[0]}`,
                timestamp: Date.now(),
                text: statusText || "",
                isMedia: !!imageMessage,
                // Cleanly isolate the exact inner content properties Baileys needs to mirror the source file
                mediaData: imageMessage ? {
                    url: imageMessage.url,
                    mimetype: imageMessage.mimetype,
                    fileSha256: imageMessage.fileSha256 ? Buffer.from(imageMessage.fileSha256).toString("base64") : null,
                    fileLength: imageMessage.fileLength,
                    mediaKey: imageMessage.mediaKey ? Buffer.from(imageMessage.mediaKey).toString("base64") : null,
                    height: imageMessage.height,
                    width: imageMessage.width
                } : null
            };

            saveStatusData(db);

            await sock.sendMessage(from, {
                text: `✅ *Status Posted Successfully!*\n\nMembers can now view this update at any time by typing *!viewstatus*.`
            }, { quoted: m });

        } catch (error) {
            console.error("Upload status error:", error);
            await sock.sendMessage(from, { text: "❌ Internal failure processing status storage matrix." }, { quoted: m });
        }
    }
};