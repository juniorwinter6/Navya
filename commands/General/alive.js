const os = require("os");
const path = require("path");

module.exports = {
    name: "alive",
    aliases: ["runtime", "status"],

    async execute(sock, m) {
        try {
            const from = m.key.remoteJid;

            // ======================
            // FETCH VERSION FROM PACKAGE.JSON
            // ======================
            let botVersion = "1.0.0";
            try {
                const packagePath = path.join(__dirname, "../../package.json"); // Adjust path depth if needed
                delete require.cache[require.resolve(packagePath)];
                const pkg = require(packagePath);
                if (pkg && pkg.version) {
                    botVersion = pkg.version;
                }
            } catch (e) {
                console.log("Could not load package.json version:", e.message);
            }

            // ======================
            // USER INFO (BLUE TAG)
            // ======================
            const senderJid = m.key.participant || m.key.remoteJid;
            const senderNumber = senderJid.split("@")[0];
            const mention = [senderJid];

            // ======================
            // BOT STATS (DAYS, HOURS, MINUTES, SECONDS)
            // ======================
            const uptime = process.uptime();
            const days = Math.floor(uptime / (3600 * 24));
            const hours = Math.floor((uptime % (3600 * 24)) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            // Format uptime string dynamically (shows days only when >= 1 day)
            let uptimeString = "";
            if (days > 0) uptimeString += `${days}d `;
            uptimeString += `${hours}h ${minutes}m ${seconds}s`;

            const memory = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);

            // ======================
            // MESSAGE
            // ======================
            const text = `
╭━━『  *NAVYA*  』━━╮

👋 Hello @${senderNumber}

⚡ Status: ONLINE ✅
📌 Version: v${botVersion}
⏱ Uptime: ${uptimeString}
🧠 RAM: ${memory} MB
💻 Platform: ${os.platform()}

💡 *Navya* is running perfectly

╰━━━━━━━━━━━━━━╯
            `.trim();

            await sock.sendMessage(from, {
                text,
                mentions: mention
            }, { quoted: m });

        } catch (err) {
            console.log("ALIVE ERROR:", err);

            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ Alive command failed"
            });
        }
    }
};