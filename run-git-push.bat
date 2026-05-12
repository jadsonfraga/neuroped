@echo off
title Git Push — NeuroPed Railway Fix
color 0A
echo.
echo Iniciando git push das correcoes Railway...
echo.

cd /d "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia"

echo Status atual:
git status --short
echo.

echo Adicionando arquivos...
git add railway.toml nixpacks.toml package.json

echo.
echo Commitando...
git commit -m "fix: corrige build Railway - devDeps + build completo cliente+servidor"

echo.
echo Fazendo push...
git push origin HEAD

echo.
echo ============================================================
echo  PUSH CONCLUIDO!
echo ============================================================
echo.
pause
