module.exports = {

    name: "kick",

    async execute(sock, m, args) {

        try {

            const from = m.key.remoteJid
            const sender = m.key.participant || m.key.remoteJid
            const isGroup = from.endsWith("@g.us")

            console.log("COMMAND STARTED")

            if (!isGroup) {
                return await sock.sendMessage(from, {
                    text: "❌ Group only command."
                })
            }

            const metadata = await sock.groupMetadata(from)

            console.log("METADATA:", metadata)

            const participants = metadata.participants

            console.log("PARTICIPANTS:", participants)

            console.log("BOT USER:", sock.user)

            // Sender admin
            const senderData = participants.find(
                p =>
                    p.id === sender ||
                    p.id.includes(sender.split("@")[0])
            )

            console.log("SENDER DATA:", senderData)

            if (!senderData?.admin) {
                return await sock.sendMessage(from, {
                    text: "❌ Only admins can use this command."
                })
            }

            // Bot admin
            const botLid = sock.user.lid || sock.user.id

            const botData = participants.find(p => {
                return (
                    p.id === botLid ||
                    p.phoneNumber === sock.user.id.split(":")[0] + "@s.whatsapp.net"
                )
            })

            console.log("BOT LID:", botLid)
            console.log("BOT DATA:", botData)

            if (!botData || botData.admin !== "admin" && botData.admin !== "superadmin") {
                return await sock.sendMessage(from, {
                    text: "❌ Bot must be admin."
                })
            }

            // Mentioned user
            let user

            if (
                m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length
            ) {
                user =
                    m.message.extendedTextMessage.contextInfo.mentionedJid[0]
            }

            else if (
                m.message?.extendedTextMessage?.contextInfo?.participant
            ) {
                user =
                    m.message.extendedTextMessage.contextInfo.participant
            }

            console.log("TARGET USER:", user)

            if (!user) {
                return await sock.sendMessage(from, {
                    text: "❌ Tag or reply to a user."
                })
            }

            await sock.groupParticipantsUpdate(
                from,
                [user],
                "remove"
            )

            await sock.sendMessage(from, {
                text: "✅ User removed."
            })

        } catch (err) {

            console.log("FULL ERROR:", err)

            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ Error occurred."
            })
        }
    }
}