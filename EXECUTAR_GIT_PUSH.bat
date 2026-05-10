@echo off
chcp 65001 >nul
echo ============================================================
echo   NeuroPed - Git Push para GitHub
echo   Repositório: jadsonfraga/neuroped
echo   Branch: feat/auditoria-total-ui-backend-memoria
echo ============================================================
echo.

cd /d "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia"

echo [1/4] Verificando status do repositório...
git status
echo.

echo [2/4] Últimos 5 commits prontos para push:
git log --oneline -5
echo.

echo [3/4] Executando git push...
git push -u origin feat/auditoria-total-ui-backend-memoria
echo.

if %ERRORLEVEL% EQU 0 (
    echo ============================================================
    echo   PUSH CONCLUÍDO COM SUCESSO!
    echo ============================================================
    echo.
    echo Próximos passos:
    echo   1. Acesse: https://github.com/jadsonfraga/neuroped/actions
    echo      (verifique se o CI/CD disparou)
    echo   2. Abra Pull Request em:
    echo      https://github.com/jadsonfraga/neuroped/compare/feat/auditoria-total-ui-backend-memoria
    echo.
) else (
    echo ============================================================
    echo   FALHA NO PUSH - Provavelmente autenticação necessária
    echo ============================================================
    echo.
    echo Opções para autenticar:
    echo.
    echo   OPÇÃO A - GitHub CLI (recomendado):
    echo     1. Baixe em: https://cli.github.com/
    echo     2. Execute: gh auth login
    echo     3. Execute novamente este script
    echo.
    echo   OPÇÃO B - Token pessoal (PAT):
    echo     1. Acesse: https://github.com/settings/tokens
    echo     2. Gere um token com escopo "repo"
    echo     3. Execute:
    echo        git remote set-url origin https://SEU_TOKEN@github.com/jadsonfraga/neuroped.git
    echo     4. Execute novamente este script
    echo.
    echo   OPÇÃO C - GitHub Desktop:
    echo     1. Abra o GitHub Desktop
    echo     2. Adicione o repositório local
    echo     3. Publique a branch feat/auditoria-total-ui-backend-memoria
    echo.
)

echo [4/4] Verificando build do projeto...
echo.
where npm >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Node.js encontrado. Executando npm run build...
    npm run build
    if %ERRORLEVEL% EQU 0 (
        echo Build concluído com sucesso!
    ) else (
        echo Build falhou. Verifique os erros acima.
    )
) else (
    echo Node.js não encontrado no PATH. Instale em: https://nodejs.org/
)

echo.
pause
