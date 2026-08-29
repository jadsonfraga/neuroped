@echo off
REM ============================================================
REM  NeuroPed - Feed Diario das Familias
REM  Clique duplo neste arquivo para configurar e publicar tudo.
REM ============================================================
setlocal

cd /d "%~dp0"

echo.
echo   NeuroPed - Feed Diario das Familias
echo   Iniciando o configurador...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Configurar-FeedFamilias.ps1" %*

echo.
echo   Pressione qualquer tecla para fechar.
pause >nul
endlocal
