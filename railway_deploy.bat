@echo off
chcp 65001 >nul
set LOGFILE=%~dp0railway_log.txt
echo. > "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"
echo NeuroPed Railway Deploy - %DATE% %TIME% >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"

cd /d "%~dp0"
echo [DIR] %CD% >> "%LOGFILE%"

echo.
echo === [1/7] Verificando Railway CLI ===
railway --version >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Railway CLI nao encontrado. Instalando...
    echo Instalando Railway CLI... >> "%LOGFILE%"
    call npm install -g @railway/cli >> "%LOGFILE%" 2>&1
    railway --version >> "%LOGFILE%" 2>&1
    echo Railway CLI instalado. >> "%LOGFILE%"
) else (
    echo Railway CLI ja instalado. >> "%LOGFILE%"
)

echo.
echo === [2/7] Verificando status do login Railway ===
railway whoami >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Fazendo login no Railway (abrira o browser)...
    echo LOGIN_NECESSARIO >> "%LOGFILE%"
    railway login >> "%LOGFILE%" 2>&1
    echo LOGIN_CONCLUIDO >> "%LOGFILE%"
) else (
    echo Ja logado no Railway. >> "%LOGFILE%"
    echo JA_LOGADO >> "%LOGFILE%"
)

echo.
echo === [3/7] Verificando projeto Railway existente ===
railway status >> "%LOGFILE%" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Criando projeto Railway neuroped...
    echo CRIANDO_PROJETO >> "%LOGFILE%"
    railway init --name neuroped >> "%LOGFILE%" 2>&1
) else (
    echo Projeto Railway ja existe. >> "%LOGFILE%"
)

echo.
echo === [4/7] Adicionando banco Postgres ===
echo Adicionando plugin Postgres... >> "%LOGFILE%"
railway add --plugin postgresql >> "%LOGFILE%" 2>&1
echo POSTGRES_STATUS=%ERRORLEVEL% >> "%LOGFILE%"

echo.
echo === [5/7] Build do servidor (esbuild) ===
echo Rodando npm run build:server... >> "%LOGFILE%"
call npm run build:server >> "%LOGFILE%" 2>&1
if exist "dist\index.cjs" (
    echo BUILD_SERVER_OK >> "%LOGFILE%"
) else (
    echo BUILD_SERVER_FAILED >> "%LOGFILE%"
)

echo.
echo === [6/7] Configurando variaveis de ambiente no Railway ===
railway variables set NODE_ENV=production >> "%LOGFILE%" 2>&1
railway variables set PORT=3000 >> "%LOGFILE%" 2>&1

for /f "tokens=2 delims==" %%a in ('findstr "NEUROPED_MASTER_KEY" "%~dp0.env"') do (
    railway variables set NEUROPED_MASTER_KEY=%%a >> "%LOGFILE%" 2>&1
)
for /f "tokens=2 delims==" %%a in ('findstr "NEUROPED_JWT_SECRET" "%~dp0.env"') do (
    railway variables set NEUROPED_JWT_SECRET=%%a >> "%LOGFILE%" 2>&1
)
for /f "tokens=2 delims==" %%a in ('findstr "ADMIN_EMAIL" "%~dp0.env"') do (
    railway variables set ADMIN_EMAIL=%%a >> "%LOGFILE%" 2>&1
)
for /f "tokens=2 delims==" %%a in ('findstr "ADMIN_NAME" "%~dp0.env"') do (
    railway variables set ADMIN_NAME=%%a >> "%LOGFILE%" 2>&1
)
for /f "tokens=2 delims==" %%a in ('findstr "ADMIN_INITIAL_PASSWORD" "%~dp0.env"') do (
    railway variables set ADMIN_INITIAL_PASSWORD=%%a >> "%LOGFILE%" 2>&1
)

echo VARS_SET >> "%LOGFILE%"

echo.
echo === [7/7] Deploy Railway ===
echo Iniciando railway up... >> "%LOGFILE%"
railway up --detach >> "%LOGFILE%" 2>&1
if %ERRORLEVEL%==0 (
    echo DEPLOY_SUCCESS >> "%LOGFILE%"
) else (
    echo DEPLOY_FAILED_OU_PENDENTE >> "%LOGFILE%"
)

echo. >> "%LOGFILE%"
echo === URL e status final === >> "%LOGFILE%"
railway status >> "%LOGFILE%" 2>&1
railway domain >> "%LOGFILE%" 2>&1

echo. >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"
echo CONCLUIDO em %TIME% >> "%LOGFILE%"
echo ============================================= >> "%LOGFILE%"

echo.
echo Script concluido. Lendo log...
type "%LOGFILE%"
echo.
echo Pressione qualquer tecla para fechar...
pause
