@echo off
chcp 65001 >nul
set LOGFILE=%~dp0deploy_log.txt
echo. > "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"
echo NeuroPed Deploy Script - %DATE% %TIME% >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"

cd /d "%~dp0"
echo [DIR] Working in: %CD% >> "%LOGFILE%"

echo. >> "%LOGFILE%"
echo === STEP 1: GH CLI auth === >> "%LOGFILE%"
gh auth status >> "%LOGFILE%" 2>&1
if %ERRORLEVEL%==0 (echo GH_CLI_OK >> "%LOGFILE%") else (echo GH_CLI_NOT_AUTH >> "%LOGFILE%")

echo. >> "%LOGFILE%"
echo === STEP 2: Windows Credential Manager (GitHub) === >> "%LOGFILE%"
cmdkey /list | findstr /i "github" >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% NEQ 0 (echo NO_GITHUB_CREDENTIAL_IN_CMDKEY >> "%LOGFILE%")

echo. >> "%LOGFILE%"
echo === STEP 3: Wrangler auth === >> "%LOGFILE%"
call npx wrangler whoami >> "%LOGFILE%" 2>&1

echo. >> "%LOGFILE%"
echo === STEP 4: dist/public status === >> "%LOGFILE%"
if exist "dist\public\index.html" (
    echo BUILD_OK - dist\public\index.html EXISTS >> "%LOGFILE%"
    dir /b "dist\public" >> "%LOGFILE%" 2>&1
) else (
    echo BUILD_MISSING - rodando npm run build... >> "%LOGFILE%"
    echo. >> "%LOGFILE%"
    call npm run build >> "%LOGFILE%" 2>&1
    if exist "dist\public\index.html" (
        echo BUILD_SUCCESS >> "%LOGFILE%"
    ) else (
        echo BUILD_FAILED >> "%LOGFILE%"
    )
)

echo. >> "%LOGFILE%"
echo === STEP 5: Git status e credenciais === >> "%LOGFILE%"
git remote -v >> "%LOGFILE%" 2>&1
git status --short >> "%LOGFILE%" 2>&1
echo [Testando git push --dry-run] >> "%LOGFILE%"
git push --dry-run origin feat/auditoria-total-ui-backend-memoria >> "%LOGFILE%" 2>&1

echo. >> "%LOGFILE%"
echo === STEP 6: Deploy Cloudflare Pages === >> "%LOGFILE%"
if exist "dist\public\index.html" (
    echo Tentando wrangler pages deploy... >> "%LOGFILE%"
    call npx wrangler pages deploy dist/public --project-name=neuroped --branch=feat/auditoria-total-ui-backend-memoria >> "%LOGFILE%" 2>&1
    if %ERRORLEVEL%==0 (
        echo DEPLOY_SUCCESS >> "%LOGFILE%"
    ) else (
        echo DEPLOY_FAILED - ver log acima >> "%LOGFILE%"
    )
) else (
    echo SKIPPED - build nao existe >> "%LOGFILE%"
)

echo. >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"
echo CONCLUIDO em %TIME% >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"

echo Script concluido. Log salvo em: %LOGFILE%
echo.
echo Pressione qualquer tecla para fechar...
pause
