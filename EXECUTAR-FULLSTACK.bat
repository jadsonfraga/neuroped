@echo off
chcp 65001 >nul
title NeuroPed EDJ - Setup Fullstack Autonomo
color 0A
cd /d "%~dp0"

echo.
echo ================================================================
echo   NeuroPed EDJ - Setup Fullstack Autonomo
echo   Branch: feat/fullstack-lgpd-backend
echo ================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-fullstack.ps1"
