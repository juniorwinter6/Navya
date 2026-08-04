const fs = require("fs");
const path = require("path");

// 1. Path to your config file - adjust the folder depth if needed (e.g., "../../config")
const config = require("../config");

const pathJson = "./lib/antiporn.json";

const loadData = () => {
    if (!fs.existsSync(pathJson)) {
        fs.writeFileSync(pathJson, JSON.stringify({}, null, 2));
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(pathJson, "utf8"));
    } catch (e) {
        return {};
    }
};

module.exports = {
    name: "antiporn",

    async execute(sock, m, args) {
        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        if (!isGroup) {
            return sock.sendMessage(from, { text: "❌ This command can only be used in groups." }, { quoted: m });
        }

        // Get sender ID strings safely
        const senderRaw = m.key.participant || m.key.remoteJid || "";

        // Clean the sender ID to just the raw phone digits (strips @s.whatsapp.net and device :1, :2 tokens)
        const senderDigits = senderRaw.split("@")[0].split(":")[0];

        // 2. MATCH AGAINST YOUR CONFIG FILE
        // Cleans out any non-digits from your main OWNER_NUMBER
        const primaryOwnerDigits = String(config.OWNER_NUMBER || "").replace(/\D/g, "");

        // Maps through your OWNERS array and strips any extra formatting from those numbers too
        const secondaryOwnersList = (config.OWNERS || []).map(num => String(num).replace(/\D/g, ""));

        // Checks if you are the primary owner OR listed in the OWNERS array
        const isOwner = senderDigits === primaryOwnerDigits || secondaryOwnersList.includes(senderDigits);

        let isAdmin = false;

        // Skip checking Group Admins entirely if you are recognized as an Owner
        if (!isOwner) {
            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participants = groupMetadata.participants || [];
                const admins = participants.filter(p => p.admin !== null).map(p => p.id);
                isAdmin = admins.includes(senderRaw);
            } catch (err) {
                console.error("Failed to fetch group metadata for permission check:", err);
            }
        }

        // Security Gate Enforcer
        if (!isOwner && !isAdmin) {
            return sock.sendMessage(from, {
                text: "❌ Access Denied! Only Group Admins or the Bot Owner can change AntiPorn settings."
            }, { quoted: m });
        }

        const data = loadData();

        if (!data[from]) {
            data[from] = { enabled: false, warns: {} };
        }

        const option = args[0]?.toLowerCase();

        if (!option) {
            return sock.sendMessage(from, {
                text: `🔞 AntiPorn Settings\n\nStatus: ${data[from].enabled ? "ON" : "OFF"}\n\nUse:\n${config.PREFIX || "."}antiporn on\n${config.PREFIX || "."}antiporn off`
            }, { quoted: m });
        }

        if (option === "on") {
            data[from].enabled = true;
        } else if (option === "off") {
            data[from].enabled = false;
        } else {
            return sock.sendMessage(from, { text: "❌ Invalid option. Use 'on' or 'off'." }, { quoted: m });
        }

        fs.writeFileSync(pathJson, JSON.stringify(data, null, 2));

        return sock.sendMessage(from, {
            text: `✅ AntiPorn ${option.toUpperCase()}`
        }, { quoted: m });
    }
};