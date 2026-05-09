@echo off
cd /d "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia"

echo === Configurando git user ===
git config user.email "jadsonfraga@hotmail.com"
git config user.name "Dr. Jadson Fraga"

echo === Verificando remote ===
git remote -v
git remote remove origin 2>nul
git remote add origin https://github.com/jadsonfraga/neuroped.git
echo Remote configurado: https://github.com/jadsonfraga/neuroped.git

echo === Criando branch feat/auditoria-total-ui-backend-memoria ===
git checkout -b feat/auditoria-total-ui-backend-memoria 2>nul || git checkout feat/auditoria-total-ui-backend-memoria
git branch

echo === COMMIT 1: CI/CD workflows ===
git add .github/ render.yaml wrangler.toml scripts/
git commit -m "feat: add GitHub Actions CI/CD pipeline for autonomous deploy"

echo === COMMIT 2: Documentacao e seguranca ===
git add SECURITY.md docs/ .env.example 2>nul
git add docs/
git commit -m "docs: add complete security and LGPD documentation"

echo === COMMIT 3: Backend API e banco ===
git add functions/ db/
git commit -m "feat: add complete REST API and D1 database schema"

echo === COMMIT 4: Frontend melhorias ===
git add client/
git commit -m "feat: add security and UX improvements to frontend"

echo === COMMIT 5: README e arquivos raiz ===
git add README.md
git add -A
git commit -m "docs: update README with deploy badge and final project files"

echo === Log dos commits ===
git log --oneline -8

echo === Status final ===
git status

echo === DONE. Pronto para push ===
git remote get-url origin
