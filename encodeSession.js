const fs = require('fs');
const path = require('path');

const sessionDir = path.join(__dirname, 'session');

if (!fs.existsSync(sessionDir)) {
    console.error('❌ Session folder not found!');
    process.exit(1);
}

const sessionData = {};

// Read all session files into an object
const files = fs.readdirSync(sessionDir);
for (const file of files) {
    const filePath = path.join(sessionDir, file);
    if (fs.statSync(filePath).isFile()) {
        sessionData[file] = fs.readFileSync(filePath, 'base64');
    }
}

// Convert object to Base64 string
const jsonString = JSON.stringify(sessionData);
const base64Session = Buffer.from(jsonString).toString('base64');

// Save directly to a text file
const outputFile = path.join(__dirname, 'session_string.txt');
fs.writeFileSync(outputFile, base64Session);

console.log('\n=============================================================');
console.log('✅ SUCCESS!');
console.log(`📁 Your session string was saved to: session_string.txt`);
console.log('=============================================================\n');