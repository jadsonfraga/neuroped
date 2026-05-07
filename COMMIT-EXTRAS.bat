@echo off
chcp 65001 >nul
title Safe Public Layer v1 - Commit Extras
color 0E
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0commit-extras-safe-public.ps1"
