@echo off
chcp 65001 >nul
title NeuroPed - Fix Windows + Iniciar Dev
color 0A
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-and-start.ps1"
