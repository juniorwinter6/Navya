module.exports = {
    name: "tagall",

    async execute(sock, msg, args = []) {

        const from = msg.key.remoteJid

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
            (msg.key.participant || msg.key.remoteJid)
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
        const meta =
            await sock.groupMetadata(from)

        const participant =
            meta.participants.find(
                p => p.id === (msg.key.participant || msg.key.remoteJid)
            )

        // ======================
        // ADMIN CHECK
        // ======================
        const isAdmin =
            participant?.admin === "admin" ||
            participant?.admin === "superadmin"

        const isOwner =
            OWNERS.includes(sender)

        // ======================
        // PERMISSION CHECK
        // ======================
        if (!isAdmin && !isOwner) {
            return await sock.sendMessage(from, {
                text: "❌ Only admins or bot owner can use this command."
            }, { quoted: msg })
        }

        // ======================
        // EXTRACT CUSTOM MESSAGE
        // ======================
        // If your main command handler passes args, we join them.
        // Otherwise, we extract them directly from the message body as a fail-safe.
        let customMessage = args.join(" ");

        if (!customMessage) {
            const body = msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text || "";
            // Removes the command (e.g., "!tagall") and clips extra spaces
            customMessage = body.slice(body.indexOf(" ") + 1).trim();

            // If the user typed ONLY "!tagall", body.indexOf(" ") will be -1, 
            // or the text matches the command name exactly. Let's make sure it's valid:
            if (body === customMessage || body.indexOf(" ") === -1) {
                customMessage = "";
            }
        }

        // ======================
        // TAG MESSAGE BUILDING
        // ======================
        // If you typed a message, it shows up beautifully at the top!
        let text = customMessage
            ? `📢 *ANNOUNCEMENT:* ${customMessage}\n\n`
            : "📢 *TAG ALL MEMBERS:*\n\n";

        meta.participants.forEach(p => {
            text += `@${p.id.split("@")[0]}\n`
        })

        // ======================
        // SEND
        // ======================
        await sock.sendMessage(from, {
            text,
            mentions: meta.participants.map(p => p.id)
        }, { quoted: msg })
    }
}