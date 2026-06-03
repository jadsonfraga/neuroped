@echo off
chcp 65001 >nul
title NeuroPed - Patch da Trava de Dominio
color 0E
cd /d "%~dp0"

echo.
echo ================================================================
echo   Aplicando patch da trava de dominio + push para GitHub
echo ================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ErrorActionPreference='Continue';" ^
    "Set-Location '%~dp0';" ^
    "$env:Path = 'C:\Program Files\Git\bin;C:\Program Files\Git\cmd;' + $env:Path;" ^
    "Write-Host '==> Verificando alteracoes...' -ForegroundColor Cyan;" ^
    "$status = git status --porcelain;" ^
    "if (-not $status) { Write-Host '    [!] Nenhuma alteracao detectada' -ForegroundColor Yellow; exit 0 };" ^
    "git add -A;" ^
    "git commit -m 'Remover trava de dominio - permitir qualquer host';" ^
    "Write-Host '==> Enviando para o GitHub...' -ForegroundColor Cyan;" ^
    "git push;" ^
    "if ($LASTEXITCODE -eq 0) { Write-Host '';Write-Host '    [OK] Patch enviado!' -ForegroundColor Green;Write-Host '    Aguarde 1-3 minutos para o site no ar atualizar.' -ForegroundColor Green } else { Write-Host '    [ERRO] Falha no push' -ForegroundColor Red }"

echo.
pause
