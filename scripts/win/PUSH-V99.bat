@echo off
chcp 65001 >nul
title NeuroPed v9.9 - Push GitHub
color 0A
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0push-v99.ps1"
