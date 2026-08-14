const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "mediafire",
    aliases: ["mf", "mfdl"],
    category: "downloader",
    desc: "Downloads and sends direct files from MediaFire links.",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;

        try {
            const url = args[0]?.trim();
            const prefix = config?.prefix || ".";

            if (!url || !url.includes("mediafire.com")) {
                return await sock.sendMessage(from, {
                    text: `💡 *Usage:* \`${prefix}mediafire <MediaFire Link>\`\n\n*Example:*\n\`${prefix}mediafire https://www.mediafire.com/file/...\``
                }, { quoted: m });
            }

            await sock.sendMessage(from, { text: "📦 Extracting file from MediaFire..." }, { quoted: m });

            let fileData = null;

            try {
                const res = await axios.get(`https://api.shizumiaika.xyz/api/downloader/mediafire?url=${encodeURIComponent(url)}`, { timeout: 15000 });
                const result = res.data?.result || res.data;
                if (result?.link || result?.download) {
                    fileData = {
                        name: result.filename || result.name || "file",
                        size: result.filesize || result.size || "Unknown",
                        link: result.link || result.download,
                        mime: result.mime || "application/octet-stream"
                    };
                }
            } catch (err) {
                console.log("[MEDIAFIRE] Extraction failed:", err.message);
            }

            if (!fileData || !fileData.link) {
                return await sock.sendMessage(from, {
                    text: "❌ Could not parse MediaFire link. Check if the file was deleted or restricted."
                }, { quoted: m });
            }

            await sock.sendMessage(from, {
                document: { url: fileData.link },
                fileName: fileData.name,
                mimetype: fileData.mime,
                caption: `📄 *Filename:* ${fileData.name}\n📊 *Size:* ${fileData.size}`
            }, { quoted: m });

        } catch (err) {
            console.error("[MEDIAFIRE ERROR]:", err);
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download MediaFire file." }, { quoted: m });
        }
    }
};