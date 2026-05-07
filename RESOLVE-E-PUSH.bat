@echo off
chcp 65001 >nul
title Resolver conflito e fazer push
color 0A
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0resolve-and-push.ps1"
