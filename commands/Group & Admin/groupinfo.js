module.exports = {

    name: "groupinfo",

    async execute(sock, m, args) {

        try {

            const from = m.key.remoteJid
            const isGroup = from.endsWith("@g.us")

            if (!isGroup) {
                return sock.sendMessage(from, {
                    text: "❌ Group only command."
                })
            }

            const metadata = await sock.groupMetadata(from)

            const participants = metadata.participants

            const groupName = metadata.subject
            const memberCount = participants.length

            const admins = participants.filter(p =>
                p.admin === "admin" || p.admin === "superadmin"
            )

            const desc = metadata.desc || "No description"

            const info = `
📌 *GROUP INFO*

🏷️ Name: ${groupName}
👥 Members: ${memberCount}
👑 Admins: ${admins.length}
📝 Description: ${desc}

🤖 Bot Status: Active
            `

            await sock.sendMessage(from, {
                text: info.trim()
            })

        } catch (err) {

            console.log("GROUPINFO ERROR:", err)

            sock.sendMessage(m.key.remoteJid, {
                text: "❌ Failed to get group info."
            })
        }
    }
}