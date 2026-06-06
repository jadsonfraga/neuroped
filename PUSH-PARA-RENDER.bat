@echo off
chcp 65001 >nul
echo ========================================
echo  NeuroPed - Push para GitHub + Render
echo ========================================
echo.

cd /d "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia"

echo [1/4] Status atual...
git status --short
echo.

echo [2/4] Adicionando todos os arquivos...
git add -A
echo.

echo [3/4] Commit (se houver mudancas)...
git diff --cached --quiet
if %ERRORLEVEL% NEQ 0 (
  git commit -m "deploy: full-stack v2.0 - Cloudflare Pages + Render backend"
) else (
  echo Nenhuma mudanca nova para commitar.
)
echo.

echo [4/4] Push para origin main...
git push origin HEAD:main
if %ERRORLEVEL% EQU 0 (
  echo.
  echo ========================================
  echo  PUSH OK - Render auto-deploy iniciado
  echo  https://dashboard.render.com
  echo ========================================
) else (
  echo.
  echo Tentando push para feature branch...
  git push -u origin feat/auditoria-total-ui-backend-memoria
  if %ERRORLEVEL% EQU 0 (
    echo Push para feature branch OK.
    echo Acesse: https://github.com/jadsonfraga/neuroped/compare/feat/auditoria-total-ui-backend-memoria
  ) else (
    echo FALHA no push. Verifique autenticacao git.
  )
)

echo.
echo ========================================
echo  Frontend: https://neuroped.pages.dev (LIVE)
echo  Backend:  aguardando Render deploy...
echo ========================================
pause
