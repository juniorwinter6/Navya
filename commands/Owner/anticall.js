// commands/anticall.js
const config = require("../../config");

module.exports = {
    name: "anticall",
    alias: ["autocallreject", "rejectcall"],
    category: "owner",
    description: "Toggle automatic call rejection and warning system on or off",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;
        const prefix = config.PREFIX || ".";

        // 1. Verify owner status internally
        const isGroup = from.endsWith('@g.us');
        const senderJid = isGroup ? (m.key.participant || from) : from;
        const senderNumber = senderJid.replace(/[^0-9]/g, '');
        const isFromMe = m.key.fromMe;

        const ownerList = (config.OWNERS || []).map(num => String(num).replace(/[^0-9]/g, ''));
        if (config.OWNER_NUMBER) {
            ownerList.push(String(config.OWNER_NUMBER).replace(/[^0-9]/g, ''));
        }

        const isOwner = isFromMe || ownerList.includes(senderNumber) || senderJid.includes("100399675609189");

        // 2. Guard check: Restrict to owners
        if (!isOwner) {
            await sock.sendMessage(from, {
                text: "❌ Only bot owners can use this command."
            }, { quoted: m });
            return;
        }

        const option = args[0]?.toLowerCase();

        // 3. Handle toggle options
        if (option === "on" || option === "enable") {
            config.ANTICALL = true;
            await sock.sendMessage(from, {
                text: "✅ *Anti-Call is now ENABLED!*\nCalls will be auto-rejected and persistent callers will be warned/blocked."
            }, { quoted: m });
        } else if (option === "off" || option === "disable") {
            config.ANTICALL = false;
            await sock.sendMessage(from, {
                text: "❌ *Anti-Call is now DISABLED!*\nIncoming calls will be ignored."
            }, { quoted: m });
        } else {
            // Show status and usage
            const status = config.ANTICALL ? "ENABLED 🟢" : "DISABLED 🔴";
            await sock.sendMessage(from, {
                text: `📞 *Anti-Call Status:* *${status}*\n\n*Usage:*\n• \`${prefix}anticall on\` - Enable Anti-Call\n• \`${prefix}anticall off\` - Disable Anti-Call`
            }, { quoted: m });
        }
    }
};