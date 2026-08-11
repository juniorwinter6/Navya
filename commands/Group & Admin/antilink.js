const fs = require('fs');

module.exports = {
    name: 'antilink',
    description: 'Toggle group link protection on or off',
    category: 'group',
    async execute(sock, m, args) {
        if (!m || !m.key) return;

        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        // Check if it's a group
        if (!isGroup) {
            return sock.sendMessage(from, { text: '❌ This command can only be used in group chats!' }, { quoted: m });
        }

        // Check if sender is admin
        const groupData = await sock.groupMetadata(from).catch(() => null);
        const members = groupData?.participants || [];

        const senderJid = m.key.participant || m.key.remoteJid;
        const cleanSenderNumber = senderJid.split("@")[0].split(":")[0];
        const senderObject = members.find(p => p.id.includes(cleanSenderNumber));
        const isGroupAdmin = senderObject?.admin === "admin" || senderObject?.admin === "superadmin";

        // Check global owner status as a bypass
        const isOwner = global.OWNERS && global.OWNERS.includes(cleanSenderNumber);

        if (!isGroupAdmin && !isOwner) {
            return sock.sendMessage(from, { text: '❌ This command is restricted to Group Admins!' }, { quoted: m });
        }

        const configPath = './lib/antispam_config.json';
        let config = {};

        // Read existing config safely
        try {
            if (fs.existsSync(configPath)) {
                config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            }
        } catch { config = {}; }

        // Initialize sub-object keys for antilink if they don't exist yet
        if (!config.antilink) config.antilink = {};

        const action = args[0]?.toLowerCase();

        if (action === 'on') {
            config.antilink[from] = "on";
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            return sock.sendMessage(from, { text: '🛡️ *Link Protection Activated:* The anti-link security engine is now *ON*. Any unauthorized external links will be deleted instantly.' }, { quoted: m });
        }

        if (action === 'off') {
            config.antilink[from] = "off";
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            return sock.sendMessage(from, { text: '⚠️ *Link Protection Deactivated:* Link filtering is now *OFF*. Members are allowed to post links again.' }, { quoted: m });
        }

        // Default fallback if they just type !antilink without options
        const currentStatus = config.antilink[from] === "on" ? "🟢 ON" : "🔴 OFF";
        return sock.sendMessage(from, { text: `💡 *Usage:* Type *!antilink on* to enable or *!antilink off* to disable.\n\n*Current Status:* ${currentStatus}` }, { quoted: m });
    }
};