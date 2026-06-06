@echo off
chcp 65001 >nul
title NeuroPed - Merge Local + Push
color 0A
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0merge-local.ps1"
