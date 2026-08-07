const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');

const router = express.Router();

// Helper function to safely delete temporary session folders
function removeFolder(dir) {
    if (fs.existsSync(dir)) {
        try {
            fs.rmSync(dir, { recursive: true, force: true });
        } catch (e) {
            console.error("Error removing directory:", e);
        }
    }
}

// Serve pair.html interface
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

// Pairing code API endpoint
router.get('/code', async (req, res) => {
    let phone = req.query.number;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    // Clean phone number to pure digits
    phone = phone.replace(/[^0-9]/g, '');

    // Temporary unique session folder for auth state
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
            // Official browser signature to prevent "Something went wrong" errors
            browser: ["Windows", "Chrome", "114.0.5735.198"],
            syncFullHistory: false
        });

        if (!Sock.authState.creds.registered) {
            // Delay to allow WebSocket handshake to complete on cloud servers
            await delay(3000);

            const code = await Sock.requestPairingCode(phone);

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

                    // Send the session ID directly to the user's WhatsApp DM
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
                // Cleanup temp folder if connection fails completely
                if (statusCode === 401) {
                    removeFolder(sessionDir);
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