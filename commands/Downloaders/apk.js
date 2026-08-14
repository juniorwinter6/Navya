const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "apk",
    aliases: ["app", "apkdl"],
    category: "downloader",
    desc: "Downloads genuine, full-size Android APKs directly.",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;

        try {
            const query = args.join(" ").trim();
            const prefix = config?.prefix || ".";

            if (!query) {
                return await sock.sendMessage(from, {
                    text: `💡 *Usage:* \`${prefix}apk <App Name>\`\n\n*Example:*\n\`${prefix}apk WhatsApp\``
                }, { quoted: m });
            }

            await sock.sendMessage(from, { text: `🔍 Searching for official APK: *${query}*...` }, { quoted: m });

            let appData = null;

            // ==========================================
            // ENGINE 1: DUGGAN / APKPURE MIRROR
            // ==========================================
            try {
                const res1 = await axios.get(`https://api.vreden.web.id/api/apkdownloader?q=${encodeURIComponent(query)}`, { timeout: 20000 });
                const result1 = res1.data?.result;

                if (result1 && result1.download) {
                    appData = {
                        name: result1.name || query,
                        version: result1.version || "Latest",
                        size: result1.size || "Unknown",
                        package: result1.package || "N/A",
                        download: result1.download
                    };
                }
            } catch (e1) {
                console.log("[APK] Engine 1 failed, trying Engine 2...");
            }

            // ==========================================
            // ENGINE 2: DG-APKS direct parser
            // ==========================================
            if (!appData) {
                try {
                    const res2 = await axios.get(`https://bk9.fun/download/apk?q=${encodeURIComponent(query)}`, { timeout: 20000 });
                    const result2 = res2.data?.BK9;

                    if (result2 && result2.dllink) {
                        appData = {
                            name: result2.name || query,
                            version: result2.version || "Latest",
                            size: result2.size || "Unknown",
                            package: result2.package || "N/A",
                            download: result2.dllink
                        };
                    }
                } catch (e2) {
                    console.log("[APK] Engine 2 failed, trying fallback...");
                }
            }

            // ==========================================
            // ENGINE 3: APTOIDE FILTER (Full Build > 25MB Only)
            // ==========================================
            if (!appData) {
                try {
                    const searchRes = await axios.get(`https://ws75.aptoide.com/api/7/apps/search?query=${encodeURIComponent(query)}&limit=10`, { timeout: 15000 });
                    const appList = searchRes.data?.datalist?.list || [];

                    // Filter out stubs (files smaller than 15MB for heavy apps)
                    const fullApp = appList.find(a => (a.file?.filesize || 0) > 15 * 1024 * 1024) || appList[0];

                    if (fullApp && fullApp.file?.path) {
                        const sizeMB = fullApp.file?.filesize
                            ? (fullApp.file.filesize / (1024 * 1024)).toFixed(1) + " MB"
                            : "Unknown";

                        appData = {
                            name: fullApp.name || query,
                            version: fullApp.file?.versionname || fullApp.version || "Latest",
                            size: sizeMB,
                            package: fullApp.package || "N/A",
                            download: fullApp.file.path || fullApp.file.path_alt
                        };
                    }
                } catch (e3) {
                    console.log("[APK] Engine 3 failed:", e3.message);
                }
            }

            if (!appData || !appData.download) {
                return await sock.sendMessage(from, {
                    text: `❌ Could not find a full, genuine APK for "*${query}*".`
                }, { quoted: m });
            }

            await sock.sendMessage(from, {
                text: `📥 Downloading *${appData.name}* (${appData.size})... Please wait!`
            }, { quoted: m });

            const cleanFileName = `${appData.name.replace(/[^a-zA-Z0-9]/g, "_")}.apk`;

            const captionText = `📱 *App:* ${appData.name}\n` +
                `🏷️ *Version:* ${appData.version}\n` +
                `📦 *Package:* ${appData.package}\n` +
                `📊 *Size:* ${appData.size}`;

            await sock.sendMessage(from, {
                document: { url: appData.download },
                fileName: cleanFileName,
                mimetype: "application/vnd.android.package-archive",
                caption: captionText
            }, { quoted: m });

        } catch (err) {
            console.error("[APK ERROR]:", err.message);
            await sock.sendMessage(from, {
                text: "❌ An error occurred while downloading the APK."
            }, { quoted: m });
        }
    }
};