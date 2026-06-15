@echo off
setlocal EnableExtensions
chcp 65001 >nul
title NeuroPed - Railway Deploy via Token

set LOGFILE=%~dp0railway_token_log.txt
echo. > "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"
echo NeuroPed Railway Deploy - %DATE% %TIME% >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"

cd /d "%~dp0"
echo [DIR] %CD% >> "%LOGFILE%"

if "%RAILWAY_TOKEN%"=="" goto :missing_secrets
if "%NEUROPED_MASTER_KEY%"=="" goto :missing_secrets
if "%NEUROPED_JWT_SECRET%"=="" goto :missing_secrets
if "%ADMIN_EMAIL%"=="" goto :missing_secrets
if "%ADMIN_NAME%"=="" goto :missing_secrets
if "%ADMIN_INITIAL_PASSWORD%"=="" goto :missing_secrets
if "%CORS_ORIGINS%"=="" goto :missing_secrets

echo.
echo [1/8] Verificando Railway CLI...
railway --version >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Instalando Railway CLI...
    call npm install -g @railway/cli >> "%LOGFILE%" 2>&1
)
echo Railway CLI: OK >> "%LOGFILE%"

echo.
echo [2/8] Verificando autenticacao via token...
railway whoami >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: token Railway ausente, invalido ou sem acesso. >> "%LOGFILE%"
    goto :fim
)
echo AUTH_OK >> "%LOGFILE%"

echo.
echo [3/8] Criando projeto Railway neuroped-backend...
railway init --name neuroped-backend >> "%LOGFILE%" 2>&1
echo INIT_STATUS=%ERRORLEVEL% >> "%LOGFILE%"

echo.
echo [4/8] Configurando variaveis de ambiente...
railway variables set NODE_ENV=production >> "%LOGFILE%" 2>&1
railway variables set PORT=3000 >> "%LOGFILE%" 2>&1
railway variables set NEUROPED_MASTER_KEY="%NEUROPED_MASTER_KEY%" >> "%LOGFILE%" 2>&1
railway variables set NEUROPED_JWT_SECRET="%NEUROPED_JWT_SECRET%" >> "%LOGFILE%" 2>&1
railway variables set ADMIN_EMAIL="%ADMIN_EMAIL%" >> "%LOGFILE%" 2>&1
railway variables set ADMIN_NAME="%ADMIN_NAME%" >> "%LOGFILE%" 2>&1
railway variables set ADMIN_INITIAL_PASSWORD="%ADMIN_INITIAL_PASSWORD%" >> "%LOGFILE%" 2>&1
railway variables set CORS_ORIGINS="%CORS_ORIGINS%" >> "%LOGFILE%" 2>&1
echo VARS_OK >> "%LOGFILE%"

echo.
echo [5/8] Adicionando banco PostgreSQL...
railway add --plugin postgresql >> "%LOGFILE%" 2>&1
echo POSTGRES_STATUS=%ERRORLEVEL% >> "%LOGFILE%"

echo.
echo [6/8] Aguardando Postgres provisionar...
timeout /t 15 /nobreak > nul

echo.
echo [7/8] Fazendo deploy...
railway up --detach >> "%LOGFILE%" 2>&1
if %ERRORLEVEL%==0 (
    echo DEPLOY_SUCCESS >> "%LOGFILE%"
) else (
    echo DEPLOY_FAILED >> "%LOGFILE%"
)

echo.
echo [8/8] URL e status final...
railway domain >> "%LOGFILE%" 2>&1
railway status >> "%LOGFILE%" 2>&1
goto :fim

:missing_secrets
echo ERRO: variaveis obrigatorias ausentes. Configure RAILWAY_TOKEN e os segredos no ambiente/provedor antes do deploy. >> "%LOGFILE%"

:fim
echo. >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"
echo CONCLUIDO em %TIME% >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"

echo.
echo Log salvo em: %LOGFILE%
echo Pressione qualquer tecla para fechar...
pause >nul
