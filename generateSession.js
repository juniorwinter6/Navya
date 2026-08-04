const fs = require('fs');
const path = require('path');
const https = require('https');

async function uploadSession() {
    console.log('📦 Gathering core session credentials...');
    const sessionDir = path.join(__dirname, 'session');

    if (!fs.existsSync(sessionDir)) {
        console.error('❌ Session directory not found!');
        return;
    }

    const sessionData = {};
    const files = fs.readdirSync(sessionDir);

    let count = 0;
    for (const file of files) {
        if (file === 'creds.json' || file.startsWith('app-state-sync-key')) {
            const filePath = path.join(sessionDir, file);
            sessionData[file] = fs.readFileSync(filePath, 'base64');
            count++;
        }
    }

    console.log(`✅ Extracted ${count} core credential files.`);
    const payload = JSON.stringify(sessionData);

    console.log('☁️ Uploading session to secure pastebin service...');

    const postData = new URLSearchParams({
        api_dev_key: '068be1e08927429188d3a77610190ee0', // public helper dev key
        api_option: 'paste',
        api_paste_code: payload,
        api_paste_private: '1', // unlisted
        api_paste_name: 'navya_session'
    }).toString();

    const req = https.request({
        hostname: 'pastebin.com',
        path: '/api/api_post.php',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    }, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
            if (responseData.startsWith('https://pastebin.com/')) {
                const rawUrl = responseData.replace('pastebin.com/', 'pastebin.com/raw/');
                const base64Code = Buffer.from(rawUrl).toString('base64');
                const sessionId = `NAVYA~${base64Code}`;

                console.log('\n=============================================================');
                console.log('🎉 SHORT SESSION ID GENERATED SUCCESSFULLY!');
                console.log('=============================================================');
                console.log(`\nSESSION_ID: ${sessionId}\n`);
                console.log('Copy the SESSION_ID line above for Render!');
                console.log('=============================================================\n');
            } else {
                // Fallback to local base64 if Pastebin rate limits
                console.log('⚡ Generating direct compact string fallback...');
                const compactString = Buffer.from(payload).toString('base64');
                console.log(`\nSESSION_ID: NAVYA~DIRECT~${compactString}\n`);
            }
        });
    });

    req.on('error', (e) => {
        console.error('❌ Upload error:', e.message);
    });

    req.write(postData);
    req.end();
}

uploadSession();