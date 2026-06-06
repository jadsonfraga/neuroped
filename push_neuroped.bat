@echo off
chcp 65001 > nul
title NeuroPed — Git Push CI/CD Pipeline

echo.
echo ================================================
echo  NeuroPed — Commit e Push do Pipeline CI/CD
echo ================================================
echo.

:: Navegar para o diretório do projeto
cd /d "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia"

echo [1/5] Verificando repositorio git...
git status --short
echo.

echo [2/5] Configurando identidade git...
git config user.email "jadsonfraga@hotmail.com"
git config user.name "Dr. Jadson Fraga"

echo [3/5] Adicionando arquivos ao stage...
git add .github/workflows/deploy.yml
git add .github/workflows/pr-check.yml
git add .github/workflows/security-audit.yml
git add render.yaml
git add wrangler.toml
git add vite.config.ts
git add package.json
git add scripts/deploy.sh
git add scripts/setup-env.sh
git add docs/DEPLOY.md

echo.
git status --short
echo.

echo [4/5] Criando commit...
git commit -m "feat: add complete CI/CD pipeline for autonomous GitHub Pages deploy

- Add GitHub Actions workflow for automatic build + deploy to GitHub Pages
- Add PR check workflow with build validation and automated comments
- Add weekly security audit workflow (npm audit)
- Add render.yaml for Render.com backend auto-deploy (free tier)
- Add wrangler.toml for Cloudflare D1 database configuration
- Update vite.config.ts with hash-routing compatibility comment
- Add build:client and build:server convenience scripts to package.json
- Add scripts/deploy.sh and scripts/setup-env.sh for local operations
- Add docs/DEPLOY.md with complete deployment guide

Frontend deploy: https://jadsonfraga.github.io/neuroped/
Backend deploy: https://neuroped-api.onrender.com"

echo.

echo [5/5] Fazendo push para origin...
git push origin feat/auditoria-total-ui-backend-memoria
echo.

if %ERRORLEVEL% == 0 (
    echo ================================================
    echo  SUCESSO! Pipeline enviado para o GitHub.
    echo.
    echo  Proximos passos (apenas 1x):
    echo  1. github.com/jadsonfraga/neuroped/settings/pages
    echo     Source: GitHub Actions
    echo  2. Adicionar secret VITE_PIN_HASH
    echo     github.com/jadsonfraga/neuroped/settings/secrets/actions
    echo ================================================
) else (
    echo ================================================
    echo  ERRO no push. Possiveis causas:
    echo  - Token de autenticacao expirado
    echo  - Execute: git credential-manager erase
    echo    e tente novamente
    echo ================================================
)

echo.
pause
