@echo off
chcp 65001 >nul
set OUT=%~dp0railway_check_log.txt
echo. > "%OUT%"
cd /d "%~dp0"

echo === Railway CLI version === >> "%OUT%"
railway --version >> "%OUT%" 2>&1

echo. >> "%OUT%"
echo === Railway whoami === >> "%OUT%"
railway whoami >> "%OUT%" 2>&1

echo. >> "%OUT%"
echo === Railway status (projeto atual) === >> "%OUT%"
railway status >> "%OUT%" 2>&1

echo. >> "%OUT%"
echo === Config file === >> "%OUT%"
type "%USERPROFILE%\.railway\config.json" >> "%OUT%" 2>&1

type "%OUT%"
pause
