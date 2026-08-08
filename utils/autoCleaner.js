const fs = require('fs');
const path = require('path');

// Folders where temporary media/downloads get saved
const TEMP_FOLDERS = ['./temp', './tmp', './downloads', './media'];

/**
 * Sweeps temporary media folders completely
 */
function cleanTempFolders() {
    TEMP_FOLDERS.forEach(folderName => {
        const dirPath = path.join(__dirname, '..', folderName);

        if (fs.existsSync(dirPath)) {
            fs.readdirSync(dirPath).forEach(file => {
                const filePath = path.join(dirPath, file);
                try {
                    if (fs.statSync(filePath).isFile()) {
                        fs.unlinkSync(filePath);
                    }
                } catch (err) {
                    // Ignore locked or in-use files
                }
            });
        }
    });
}

/**
 * Safely cleans old app-state-sync and pre-key files in ./session
 * NEVER deletes creds.json!
 */
function cleanSessionFolder() {
    const sessionPath = path.join(__dirname, '..', 'session');

    if (fs.existsSync(sessionPath)) {
        const files = fs.readdirSync(sessionPath);

        files.forEach(file => {
            // CRITICAL: NEVER delete creds.json (it holds your login)
            if (file === 'creds.json') return;

            // Only target temporary pre-keys and app state sync files
            if (file.startsWith('app-state-sync-') || file.startsWith('pre-key-')) {
                const filePath = path.join(sessionPath, file);
                try {
                    const stats = fs.statSync(filePath);
                    const fileAgeMinutes = (Date.now() - stats.mtimeMs) / (1000 * 60);

                    // If file is older than 2 hours (120 minutes), delete it
                    if (fileAgeMinutes > 120) {
                        fs.unlinkSync(filePath);
                    }
                } catch (err) {
                    // Ignore locked files
                }
            }
        });
    }
}

/**
 * Initializes the auto-cleaner scheduler
 * @param {number} intervalMinutes - How often to run (Default: every 60 mins)
 */
function startAutoCleaner(intervalMinutes = 60) {
    console.log(`🧹 [Auto-Cleaner] Initialized (running every ${intervalMinutes} minutes)`);

    // Run once on bot startup
    cleanTempFolders();
    cleanSessionFolder();

    // Set recurring timer
    setInterval(() => {
        console.log('🧹 [Auto-Cleaner] Running routine sweep of temp files & session bloat...');
        cleanTempFolders();
        cleanSessionFolder();
    }, intervalMinutes * 60 * 1000);
}

module.exports = { startAutoCleaner };