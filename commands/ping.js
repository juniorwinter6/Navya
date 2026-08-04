const config = require("../config"); // Dynamically pulls your prefix

module.exports = {
    name: "ping",

    async execute(sock, msg) {
        const from = msg.key.remoteJid;

        // 1. Send initial loading message
        const initialMsg = await sock.sendMessage(
            from,
            { text: "*🏓 PING* ── _Checking connection..._" },
            { quoted: msg }
        );

        // Quick delay for the editing animation look
        await new Promise(resolve => setTimeout(resolve, 500));

        // 2. Extract sender ID for tagging
        const sender = msg.key.participant || msg.key.remoteJid;

        // 3. Build dynamic text with your footer
        const prefix = config.PREFIX || "!";
        const finalTemplate = `*🏓 PONG* ── _Active & Online_\n\nHello @${sender.split('@')[0]} I'm online! type ${prefix}menu to see my commands.\n\n\n*© Rise*`;

        // 4. Edit the original message to display the final text with mentions enabled
        await sock.sendMessage(from, {
            text: finalTemplate,
            edit: initialMsg.key,
            mentions: [sender] // Crucial for the @user tag to light up blue inside the edited text
        });
    }
};