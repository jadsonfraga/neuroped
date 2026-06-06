@echo off
chcp 65001 >nul
title NeuroPed - Merge Autonomo do PR Safe Public Layer
color 0A
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0merge-pr-autonomous.ps1"
