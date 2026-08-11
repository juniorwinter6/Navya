module.exports = {
    name: "unmute",

    async execute(sock, m) {

        const from = m.key.remoteJid
        const sender = m.key.participant || m.key.remoteJid

        try {

            const metadata = await sock.groupMetadata(from)

            const participant = metadata.participants.find(
                p => p.id === sender
            )

            const isAdmin =
                participant?.admin === "admin" ||
                participant?.admin === "superadmin"

            if (!isAdmin) {
                return sock.sendMessage(from, {
                    text: "❌ Admin only command"
                })
            }

            await sock.groupSettingUpdate(from, "not_announcement")

            await sock.sendMessage(from, {
                text: "🔊 Group has been unmuted"
            })

        } catch (err) {

            console.log("UNMUTE ERROR:", err)

            await sock.sendMessage(from, {
                text: "❌ Failed to unmute group"
            })
        }
    }
}