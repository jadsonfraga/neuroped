@echo off
chcp 65001 >nul
title NeuroPed — Railway Deploy via Token
set RAILWAY_TOKEN=f8f412d3-f3b6-4ea8-b6f3-21bfdb262d3b
set LOGFILE=%~dp0railway_token_log.txt
echo. > "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"
echo NeuroPed Railway Deploy - %DATE% %TIME% >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"

cd /d "%~dp0"
echo [DIR] %CD% >> "%LOGFILE%"

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
    echo ERRO: Token invalido ou sem conexao >> "%LOGFILE%"
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
railway variables set NEUROPED_MASTER_KEY=x1r9xGA2nUwzUF38XTm5M1KT3ngEHDfrmKNSUE/EHub7ftuz0tRUXhl8WYjA6huc >> "%LOGFILE%" 2>&1
railway variables set NEUROPED_JWT_SECRET=X2XRUzedCvNtT0AcmWF9OPLRXFYDAnRXmsdKXt3DtySWVmgzn3pPxB0XURoJ9XNgc/+4WKRdg9v35hqS0B70EA== >> "%LOGFILE%" 2>&1
railway variables set ADMIN_EMAIL=jadsonfraga@hotmail.com >> "%LOGFILE%" 2>&1
railway variables set ADMIN_NAME=Dr. Jadson Fraga >> "%LOGFILE%" 2>&1
railway variables set ADMIN_INITIAL_PASSWORD=LNXJYNN2UdZhPHsmBWfR5RlS >> "%LOGFILE%" 2>&1
railway variables set CORS_ORIGINS=https://neuroped.pages.dev,https://feat-auditoria-total-ui-back.neuroped.pages.dev >> "%LOGFILE%" 2>&1
echo VARS_OK >> "%LOGFILE%"

echo.
echo [5/8] Adicionando banco PostgreSQL...
railway add --plugin postgresql >> "%LOGFILE%" 2>&1
echo POSTGRES_STATUS=%ERRORLEVEL% >> "%LOGFILE%"

echo.
echo [6/8] Aguardando Postgres provisionar (15s)...
timeout /t 15 /nobreak > nul

echo.
echo [7/8] Fazendo deploy (railway up)...
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

:fim
echo. >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"
echo CONCLUIDO em %TIME% >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"

echo.
echo === LOG COMPLETO: ===
type "%LOGFILE%"
echo.
echo Pressione qualquer tecla para fechar...
pause
