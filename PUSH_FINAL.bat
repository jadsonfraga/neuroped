@echo off
chcp 65001 > nul
title NeuroPed â€” Push Final CI/CD

cd /d "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia"

echo.
echo === PASSO 1: STATUS ATUAL ===
git status --short

echo.
echo === PASSO 2: FORCANDO ADD DE TODOS OS ARQUIVOS ===
git add -A
git add -f .github/workflows/deploy.yml 2>nul
git add -f .github/workflows/pr-check.yml 2>nul
git add -f .github/workflows/security-audit.yml 2>nul
git add -f render.yaml 2>nul
git add -f wrangler.toml 2>nul
git add -f vite.config.ts 2>nul
git add -f package.json 2>nul
git add -f docs/DEPLOY.md 2>nul
git add -f scripts/deploy.sh 2>nul
git add -f scripts/setup-env.sh 2>nul

echo.
echo === PASSO 3: DIFF STAGED ===
git diff --cached --stat

echo.
echo === PASSO 4: COMMIT ===
git commit -m "feat: add CI/CD pipeline for autonomous GitHub Pages and Render.com deploy

- .github/workflows/deploy.yml: auto-deploy to GitHub Pages on push
- .github/workflows/pr-check.yml: PR validation with build report
- .github/workflows/security-audit.yml: weekly npm audit
- render.yaml: Render.com free backend auto-deploy
- wrangler.toml: Cloudflare D1 database config
- vite.config.ts: hash routing compatible with GitHub Pages
- package.json: added build:client and build:server scripts
- scripts/deploy.sh + setup-env.sh: local helper scripts
- docs/DEPLOY.md: complete deployment guide"

echo.
echo === PASSO 5: PUSH ===
git push origin feat/auditoria-total-ui-backend-memoria

echo.
if %ERRORLEVEL% == 0 (
    echo ================================================================
    echo  SUCESSO! Pipeline CI/CD commitado e enviado para o GitHub.
    echo.
    echo  PROXIMOS PASSOS UNICOS:
    echo  1. Ativar GitHub Pages:
    echo     github.com/jadsonfraga/neuroped/settings/pages
    echo     Source: GitHub Actions
    echo  2. Configurar secrets de backend no provedor:
    echo     github.com/jadsonfraga/neuroped/settings/secrets/actions
    echo  3. Conectar Render.com:
    echo     render.com -> New -> Blueprint -> jadsonfraga/neuroped
    echo ================================================================
) else (
    echo ================================================================
    echo  AVISO: Nenhuma alteracao nova para commitar (ja estava atualizado)
    echo  OU erro no push. Verifique o output acima.
    echo.
    echo  Para verificar manualmente:
    echo    git log --oneline -5
    echo    git status
    echo ================================================================
)
echo.
pause
