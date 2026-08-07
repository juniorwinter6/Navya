const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

const router = express.Router();

function removeFolder(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

router.get('/code', async (req, res) => {
    let phone = req.query.number;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    // Sanitize phone number to pure digits
    phone = phone.replace(/[^0-9]/g, '');

    // Temp auth directory for this session
    const sessionDir = path.join(__dirname, `./temp_session_${Date.now()}`);

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        const Sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
            },
            printQRInTerminal: false,
            logger: pino({ level: 'fatal' }),
            browser: ["Ubuntu", "Chrome", "20.0.04"]
        });

        if (!Sock.authState.creds.registered) {
            await delay(1500);
            const code = await Sock.requestPairingCode(phone);

            // Send back code to frontend
            if (!res.headersSent) {
                res.json({ code: code });
            }
        }

        Sock.ev.on('creds.update', saveCreds);

        Sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                await delay(3000);

                // Read creds.json and encode into Base64 Session String
                const credsPath = path.join(sessionDir, 'creds.json');
                if (fs.existsSync(credsPath)) {
                    const credsData = fs.readFileSync(credsPath);
                    const base64Session = Buffer.from(credsData).toString('base64');
                    const sessionId = "NAVYA~" + base64Session;

                    // Send session string directly to the user's WhatsApp chat
                    const userJid = Sock.user.id.split(':')[0] + '@s.whatsapp.net';
                    await Sock.sendMessage(userJid, {
                        text: `🎉 *NAVYA BOT SESSION CONNECTED*\n\nHere is your SESSION_ID. Copy and keep it safe:\n\n\`\`\`${sessionId}\`\`\`\n\n*Note:* Do not share this key with anyone!`
                    });
                }

                await delay(1000);
                await Sock.ws.close();
                removeFolder(sessionDir);
            } else if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode !== 401) {
                    // Retry or cleanup if needed
                }
            }
        });

    } catch (err) {
        console.error("Pairing Error:", err);
        removeFolder(sessionDir);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate pairing code' });
        }
    }
});

module.exports = router;