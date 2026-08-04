module.exports = {

    name: "hidetag",

    async execute(sock, m, args) {

        try {

            const from = m.key.remoteJid

            // ======================
            // GROUP ONLY
            // ======================
            if (!from.endsWith("@g.us")) {

                return await sock.sendMessage(from, {
                    text: "❌ This command works only in groups."
                })
            }

            // ======================
            // SENDER
            // ======================
            const sender =
                (m.key.participant || m.key.remoteJid)
                    .split("@")[0]
                    .split(":")[0]

            // ======================
            // OWNER IDS
            // ======================
            const OWNERS = [
                "2348058068041",
                "100399675609189"
            ]

            // ======================
            // GROUP METADATA
            // ======================
            const metadata =
                await sock.groupMetadata(from)

            const participants =
                metadata.participants

            // ======================
            // USER DATA
            // ======================
            const senderJid =
                m.key.participant || m.key.remoteJid

            const senderData =
                participants.find(
                    p => p.id === senderJid
                )

            // ======================
            // ADMIN CHECK
            // ======================
            const isAdmin =
                senderData?.admin === "admin" ||
                senderData?.admin === "superadmin"

            const isOwner =
                OWNERS.includes(sender)

            // ======================
            // PERMISSION CHECK
            // ======================
            if (!isAdmin && !isOwner) {

                return await sock.sendMessage(from, {
                    text: "❌ Only admins or bot owner can use this command."
                }, { quoted: m })
            }

            // ======================
            // MESSAGE
            // ======================
            const text =
                args.join(" ") ||
                "📢 Announcement"

            // ======================
            // MENTIONS
            // ======================
            const mentions =
                participants.map(p => p.id)

            // ======================
            // SEND
            // ======================
            await sock.sendMessage(from, {
                text,
                mentions
            }, { quoted: m })

        } catch (err) {

            console.log("HIDETAG ERROR:", err)

            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ Failed to execute hidetag."
            })
        }
    }
}