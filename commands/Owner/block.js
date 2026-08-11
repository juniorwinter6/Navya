module.exports = {

    name: "block",

    async execute(sock, m, args) {

        try {

            const from = m.key.remoteJid

            // ======================
            // OWNER ONLY
            // ======================
            const sender = (m.key.participant || m.key.remoteJid)
                .split("@")[0]
                .split(":")[0]

            if (!global.OWNERS.includes(sender)) {
                return sock.sendMessage(m.key.remoteJid, {
                    text: "❌ Owner only command."
                }, { quoted: m })
            }

            // ======================
            // TARGET
            // ======================
            const context =
                m.message?.extendedTextMessage?.contextInfo || {}

            let target =
                context.mentionedJid?.[0] ||
                context.participant

            // number method
            if (!target && args[0]) {

                const number =
                    args[0].replace(/[^0-9]/g, "")

                target =
                    number + "@s.whatsapp.net"
            }

            if (!target) {

                return await sock.sendMessage(from, {
                    text:
                        `❌ Reply or tag a user.

Example:
!block @user`
                }, { quoted: m })
            }

            // ======================
            // BLOCK
            // ======================
            await sock.updateBlockStatus(
                target,
                "block"
            )

            // ======================
            // SUCCESS
            // ======================
            await sock.sendMessage(from, {
                text:
                    `🚫 User blocked successfully.`,
                mentions: [target]
            }, { quoted: m })

        } catch (err) {

            console.log("BLOCK ERROR:", err)

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    text: "❌ Failed to block user."
                },
                { quoted: m }
            )
        }
    }
}