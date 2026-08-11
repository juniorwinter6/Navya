const fs = require("fs");
const path = require("path");

module.exports = {
    name: "cleartmp",
    aliases: ["clearjunk", "cltmp"],
    category: "owner",
    type: "owner",
    description: "Clears temporary downloads and cache folder",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const tmpDir = path.join(__dirname, "../../tmp");

        if (!fs.existsSync(tmpDir)) {
            return await sock.sendMessage(jid, { text: "🧹 *No temporary folder found to clean.*" }, { quoted: m });
        }

        const files = fs.readdirSync(tmpDir);
        let deletedCount = 0;

        for (const file of files) {
            try {
                fs.unlinkSync(path.join(tmpDir, file));
                deletedCount++;
            } catch (err) {
                console.error("Error deleting file:", file, err);
            }
        }

        await sock.sendMessage(jid, {
            text: `🧹 *Cleanup Complete!* Removed \`${deletedCount}\` temporary file(s).`
        }, { quoted: m });
    }
};