@echo off
chcp 65001 > nul
cd /d "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia"

echo === GIT STATUS ============================ > git_diagnostico.txt
git status --porcelain >> git_diagnostico.txt
echo. >> git_diagnostico.txt
echo === ULTIMO COMMIT ========================= >> git_diagnostico.txt
git log --oneline -3 >> git_diagnostico.txt
echo. >> git_diagnostico.txt
echo === ARQUIVOS NOVOS (.github) ============== >> git_diagnostico.txt
git ls-files --others --exclude-standard .github/ >> git_diagnostico.txt
echo. >> git_diagnostico.txt
echo === ARQUIVOS MODIFICADOS ================== >> git_diagnostico.txt
git diff --name-only HEAD >> git_diagnostico.txt
echo. >> git_diagnostico.txt
echo === STAGED ================================ >> git_diagnostico.txt
git diff --cached --name-only >> git_diagnostico.txt
echo. >> git_diagnostico.txt
echo === BRANCH ================================ >> git_diagnostico.txt
git branch -vv >> git_diagnostico.txt
echo DONE >> git_diagnostico.txt
