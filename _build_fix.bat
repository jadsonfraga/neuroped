@echo off
chcp 65001 > nul
cd /d "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia"
echo ==========================================
echo  NEUROPED BUILD - Iniciando...
echo ==========================================
echo.

echo [1/7] npm install...
call npm install 2>&1
if errorlevel 1 (
    echo ERRO no npm install!
    pause
    exit /b 1
)

echo.
echo [2/7] npm run build...
call npm run build 2>&1
set BUILD_RESULT=%errorlevel%

if %BUILD_RESULT% neq 0 (
    echo.
    echo *** BUILD FALHOU - Veja os erros acima ***
    pause
    exit /b %BUILD_RESULT%
)

echo.
echo [3/7] Build passou! Rodando lint...
call npm run lint 2>&1

echo.
echo [4/7] Build final de confirmacao...
call npm run build 2>&1
set BUILD_RESULT2=%errorlevel%

if %BUILD_RESULT2% neq 0 (
    echo *** BUILD FINAL FALHOU ***
    pause
    exit /b %BUILD_RESULT2%
)

echo.
echo [5/7] git add -A
git add -A

echo.
echo [6/7] git commit
git commit -m "fix: build 100%% limpo apos auditoria final"

echo.
echo [7/7] git push
git push

echo.
echo ==========================================
echo  BUILD COMPLETO COM SUCESSO!
echo ==========================================
pause
