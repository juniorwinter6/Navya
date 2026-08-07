const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    DisconnectReason
} = require('@whiskeysockets/baileys');

const router = express.Router();

function removeFolder(dir) {
    if (fs.existsSync(dir)) {
        try {
            fs.rmSync(dir, { recursive: true, force: true });
        } catch (e) {
            console.error("Folder deletion error:", e);
        }
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

    phone = phone.replace(/[^0-9]/g, '');

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
            // Use native Baileys Browser helper for desktop registration
            browser: Browsers.ubuntu('Chrome'),
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: false,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            syncFullHistory: false
        });

        if (!Sock.authState.creds.registered) {
            // Give socket time to connect properly
            await delay(1500);

            try {
                // Formatting code string (adds hyphen e.g. XXXX-XXXX)
                const code = await Sock.requestPairingCode(phone);
                const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;

                if (!res.headersSent) {
                    res.json({ code: formattedCode });
                }
            } catch (pairingErr) {
                console.error("Error requesting pairing code:", pairingErr);
                removeFolder(sessionDir);
                if (!res.headersSent) {
                    return res.status(500).json({ error: 'Failed to request pairing code from WhatsApp servers' });
                }
            }
        }

        Sock.ev.on('creds.update', saveCreds);

        Sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                await delay(3000);

                const credsPath = path.join(sessionDir, 'creds.json');
                if (fs.existsSync(credsPath)) {
                    const credsData = fs.readFileSync(credsPath);
                    const base64Session = Buffer.from(credsData).toString('base64');
                    const sessionId = "NAVYA~" + base64Session;

                    const userJid = Sock.user.id.split(':')[0] + '@s.whatsapp.net';
                    await Sock.sendMessage(userJid, {
                        text: `🎉 *NAVYA BOT SESSION CONNECTED*\n\nHere is your SESSION_ID. Copy and keep it safe:\n\n\`\`\`${sessionId}\`\`\`\n\n*Note:* Do not share this key with anyone!`
                    });
                }

                await delay(1000);
                await Sock.ws.close();
                removeFolder(sessionDir);
            } else if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut || reason === 401) {
                    removeFolder(sessionDir);
                }
            }
        });

    } catch (err) {
        console.error("Pairing Error:", err);
        removeFolder(sessionDir);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Pairing service error' });
        }
    }
});

module.exports = router;