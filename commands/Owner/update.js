const { exec } = require("child_process");

module.exports = {
    name: "update",
    aliases: ["gitpull", "pull"],
    category: "owner",
    type: "owner",
    description: "Pulls latest changes from Git repository",

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { text: "📦 *Checking for updates from GitHub...*" }, { quoted: m });

        exec("git pull", (err, stdout, stderr) => {
            if (err) {
                return sock.sendMessage(jid, { text: `❌ *Update Failed:*\n\`\`\`${err.message}\`\`\`` }, { quoted: m });
            }
            sock.sendMessage(jid, { text: `✅ *Git Pull Result:*\n\`\`\`${stdout || stderr}\`\`\`` }, { quoted: m });
        });
    }
};