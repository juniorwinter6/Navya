module.exports = {
    name: "mute",

    async execute(sock, m) {

        const from = m.key.remoteJid

        // only groups
        if (!from.endsWith("@g.us")) {
            return sock.sendMessage(from, {
                text: "❌ This command only works in groups"
            })
        }

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

            await sock.groupSettingUpdate(from, "announcement")

            await sock.sendMessage(from, {
                text: "🔇 Group muted (admins only)"
            })

        } catch (err) {
            console.log("MUTE ERROR:", err)

            await sock.sendMessage(from, {
                text: "❌ Failed to mute group"
            })
        }
    }
}