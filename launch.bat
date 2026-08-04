@echo off
cd /d "%~dp0"
echo 🌸 Starting Navya Bot...
:start
:: The ">> log.txt 2>&1" part forces Windows to save all normal text and errors into a text file
node index.js >> log.txt 2>&1
echo ⚠️ Bot stopped. Restarting in 5 seconds... >> log.txt
timeout /t 5 >nul
goto start