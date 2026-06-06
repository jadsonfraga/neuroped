@echo off
chcp 65001 >nul
title NeuroPed V4.0 - Clinical Intelligence Layer
color 0B
cd /d "%~dp0"

echo ============================================================
echo  NeuroPed - Clinical Intelligence Layer (V4.0)
echo  Camada de inteligencia clinica longitudinal (FUNDACAO).
echo  Modulos INERTES: nao sao carregados por nenhuma pagina.
echo  Nenhum diagnostico automatico. Toda inferencia exige
echo  config clinica validada pelo responsavel (Dr. Jadson).
echo ============================================================
echo.

set FILES=clinical-explainability.js clinical-normalization.js clinical-timeline-engine.js phenotype-engine.js therapeutic-burden-engine.js response-engine.js contradiction-engine.js clinical-decision-support.js clinical-visual-schema.js clinical-visual-schema.js ARQUITETURA-CLINICA-V4.md APLICAR-ARQUITETURA-V4.bat

echo Verificando sintaxe (requer Node)...
where node >nul 2>nul
if %errorlevel%==0 (
  for %%F in (clinical-explainability.js clinical-normalization.js clinical-timeline-engine.js phenotype-engine.js therapeutic-burden-engine.js response-engine.js contradiction-engine.js clinical-decision-support.js clinical-visual-schema.js) do (
    node --check "%%F" && echo   OK %%F || echo   FALHOU %%F
  )
) else (
  echo   Node nao encontrado - pulando checagem de sintaxe.
)
echo.

echo Adicionando arquivos da V4 ao git...
git add clinical-explainability.js clinical-normalization.js clinical-timeline-engine.js phenotype-engine.js therapeutic-burden-engine.js response-engine.js contradiction-engine.js clinical-decision-support.js clinical-visual-schema.js ARQUITETURA-CLINICA-V4.md APLICAR-ARQUITETURA-V4.bat

git commit -m "feat(v4): Clinical Intelligence Layer - fundacao (timeline, normalizacao, fenotipo, burden, RTI, contradicao, CDS, visual) - inerte ate validacao clinica"

echo.
echo Pronto. Para publicar: git push -u origin <sua-branch>
echo Lembre-se: definir e revisar o clinicalConfig com o responsavel
echo antes de ligar qualquer tela clinica (ver ARQUITETURA-CLINICA-V4.md).
pause
