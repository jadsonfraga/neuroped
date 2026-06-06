@echo off
title NeuroPed — Deploy Final
color 0A
echo.
echo  ================================================
echo   NeuroPed — Deploy para Cloudflare Pages
echo  ================================================
echo.
echo  Este script vai:
echo  1. Verificar o build (ja pronto)
echo  2. Tentar deploy via wrangler
echo  3. Se precisar de login: abre o browser do Cloudflare
echo  4. Apos login: deploy automatico
echo  5. Retorna a URL publica (neuroped.pages.dev)
echo.
echo  Aguarde...
echo.
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0WRANGLER-DEPLOY.ps1"
