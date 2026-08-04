module.exports = {

    name: "setname",

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

            const senderJid = m.key.participant || m.key.remoteJid

            // ================= ADMIN CHECK =================
            const senderData = participants.find(p =>
                p.id === senderJid ||
                p.phoneNumber === senderJid ||
                p.id?.includes(senderJid.split("@")[0])
            )

            if (!senderData || (senderData.admin !== "admin" && senderData.admin !== "superadmin")) {
                return sock.sendMessage(from, {
                    text: "❌ Admin only command."
                })
            }

            // ================= BOT CHECK =================
            const botJid = sock.user.id

            const botData = participants.find(p =>
                p.id === botJid ||
                p.phoneNumber === sock.user.id.split(":")[0] + "@s.whatsapp.net" ||
                p.id?.includes(sock.user.id.split(":")[0])
            )

            if (!botData || (botData.admin !== "admin" && botData.admin !== "superadmin")) {
                return sock.sendMessage(from, {
                    text: "❌ Bot must be admin."
                })
            }

            // ================= NAME =================
            const newName = args.join(" ")

            if (!newName) {
                return sock.sendMessage(from, {
                    text: "❌ Usage: .setname New Group Name"
                })
            }

            await sock.groupUpdateSubject(from, newName)

            sock.sendMessage(from, {
                text: `✅ Group name updated to: ${newName}`
            })

        } catch (err) {
            console.log("SETNAME ERROR:", err)

            sock.sendMessage(m.key.remoteJid, {
                text: "❌ Failed to change group name."
            })
        }
    }
}