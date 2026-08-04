const fs = require("fs")

function loadJSON(path, fallback = []) {
    try {
        return JSON.parse(fs.readFileSync(path, "utf8"))
    } catch {
        return fallback
    }
}

function saveJSON(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

module.exports = {
    name: "antibadwords",
    category: "admin",
    desc: "Toggles anti-badwords filtering system. Restricted to owners and group admins.",

    async execute(sock, m, args) {
        try {
            const from = m.key.remoteJid
            const sender = m.key.participant || m.key.remoteJid || ""

            // ==========================================
            // 1. GROUP ONLY CHECK
            // ==========================================
            if (!from.endsWith("@g.us")) {
                return sock.sendMessage(from, {
                    text: "❌ This command works only in groups."
                }, { quoted: m })
            }

            // ==========================================
            // 2. AUTHORIZATION GATE (OWNER OR ADMIN)
            // ==========================================
            const OWNER_LID = "100399675609189@lid"

            const metadata = await sock.groupMetadata(from)
            const senderInGroup = metadata.participants.find(p => p.id === sender || p.lid === sender)
            const isSenderAdmin = senderInGroup?.admin === "admin" || senderInGroup?.admin === "superadmin"

            // Block execution if the user is neither the verified bot owner nor a group admin
            if (sender !== OWNER_LID && !isSenderAdmin) {
                return sock.sendMessage(from, {
                    text: "❌ Access Denied. Only the bot owner or group admins can manage this setting."
                }, { quoted: m })
            }

            // ==========================================
            // 3. GROUP SETTINGS DB
            // ==========================================
            const db = loadJSON("./lib/antibadwords.json", {})
            const option = args[0]?.toLowerCase()

            // ==========================================
            // ENABLE
            // ==========================================
            if (option === "on") {
                db[from] = {
                    enabled: true,
                    warns: {}
                }

                saveJSON("./lib/antibadwords.json", db)

                return sock.sendMessage(from, {
                    text: "✅ AntiBadWords enabled for this group."
                }, { quoted: m })
            }

            // ==========================================
            // DISABLE
            // ==========================================
            if (option === "off") {
                db[from] = {
                    enabled: false,
                    warns: {}
                }

                saveJSON("./lib/antibadwords.json", db)

                return sock.sendMessage(from, {
                    text: "❌ AntiBadWords disabled for this group."
                }, { quoted: m })
            }

            // ==========================================
            // STATUS
            // ==========================================
            const status = db[from]?.enabled ? "ON ✅" : "OFF ❌"

            return sock.sendMessage(from, {
                text: `🛡️ AntiBadWords Status: ${status}\n\nUse:\n!antibadwords on\n!antibadwords off`
            }, { quoted: m })

        } catch (err) {
            console.log("ANTIBADWORDS ERROR:", err)
            sock.sendMessage(m.key.remoteJid, {
                text: "❌ Error executing command."
            }, { quoted: m })
        }
    }
}