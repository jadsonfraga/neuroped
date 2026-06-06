@echo off
chcp 65001 >nul
title NeuroPed - Safe Public Layer v1 - Abrir PR
color 0E
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0open-pr-safe-public.ps1"
