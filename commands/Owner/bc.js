module.exports = {

    name: "bc",
    aliases: ["broadcast"],

    async execute(sock, m, args) {

        try {

            const from = m.key.remoteJid

            // ======================
            // OWNER ONLY
            // ======================
            const sender = (
                m.key.participant ||
                m.key.remoteJid
            )
                .split("@")[0]
                .split(":")[0]

            if (!global.OWNERS.includes(sender)) {
                return sock.sendMessage(from, {
                    text: "❌ Owner only command."
                }, { quoted: m })
            }

            // ======================
            // MESSAGE
            // ======================
            const text = args.join(" ")

            if (!text) {
                return sock.sendMessage(from, {
                    text:
                        `❌ Example:

!bc Hello everyone`
                }, { quoted: m })
            }

            // ======================
            // FETCH GROUPS
            // ======================
            const groups =
                await sock.groupFetchAllParticipating()

            const ids = Object.keys(groups)

            let total = 0

            // ======================
            // START
            // ======================
            await sock.sendMessage(from, {
                text: `📢 Broadcasting to ${ids.length} groups...`
            }, { quoted: m })

            // ======================
            // SEND
            // ======================
            for (const id of ids) {

                try {

                    await sock.sendMessage(id, {
                        text:
                            `╭━━〔 📢 NAVYA BROADCAST 〕━━╮

${text}

╰━━━━━━━━━━━━━━╯`
                    })

                    total++

                    // anti-ban delay
                    await new Promise(resolve =>
                        setTimeout(resolve, 1500)
                    )

                } catch (err) {

                    console.log(
                        "FAILED GROUP:",
                        id
                    )
                }
            }

            // ======================
            // DONE
            // ======================
            await sock.sendMessage(from, {
                text:
                    `✅ Broadcast sent to ${total} groups.`
            }, { quoted: m })

        } catch (err) {

            console.log("BC ERROR:", err)

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    text: "❌ Broadcast failed."
                },
                { quoted: m }
            )
        }
    }
}