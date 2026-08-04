const util = require("util")

module.exports = {

    name: "eval",
    aliases: ["e"],

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
            // CODE
            // ======================
            const code = args.join(" ")

            if (!code) {
                return sock.sendMessage(from, {
                    text:
                        `╭━━〔 👑 NAVYA EVAL 〕━━╮

❌ Provide JavaScript code.

Example:
!eval 2 + 2

╰━━━━━━━━━━━━━━╯`
                }, { quoted: m })
            }

            // ======================
            // TIMER
            // ======================
            const start = Date.now()

            // ======================
            // EXECUTE
            // ======================
            let result = await eval(`(async () => { ${code} })()`)

            // ======================
            // FORMAT OUTPUT
            // ======================
            if (typeof result !== "string") {
                result = util.inspect(result, {
                    depth: 1
                })
            }

            // ======================
            // HIDE TOKENS
            // ======================
            if (typeof result === "string") {

                result = result
                    .replace(/session/gi, "[hidden]")
                    .replace(/token/gi, "[hidden]")
                    .replace(/apikey/gi, "[hidden]")
            }

            const end = Date.now()

            // ======================
            // LONG OUTPUT
            // ======================
            if (result.length > 4000) {
                result = result.slice(0, 4000)
            }

            // ======================
            // SEND RESULT
            // ======================
            await sock.sendMessage(from, {
                text:
                    `╭━━〔 👑 NAVYA DEV TOOL 〕━━╮

📥 INPUT:
${code}

━━━━━━━━━━━━━━

📤 OUTPUT:
${result || "undefined"}

━━━━━━━━━━━━━━

⏱️ TIME:
${end - start} ms

╰━━━━━━━━━━━━━━╯`
            }, { quoted: m })

        } catch (err) {

            console.log("EVAL ERROR:", err)

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    text:
                        `╭━━〔 ❌ EVAL ERROR 〕━━╮

${err}

╰━━━━━━━━━━━━━━╯`
                },
                { quoted: m }
            )
        }
    }
}