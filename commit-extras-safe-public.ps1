$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$paths = @("C:\Program Files\Git\bin","C:\Program Files\Git\cmd","C:\Program Files\GitHub CLI")
foreach ($p in $paths) {
    if ((Test-Path $p) -and ($env:Path -notlike "*$p*")) {
        $env:Path = "$p;$env:Path"
    }
}
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "==> Branch atual..." -ForegroundColor Cyan
$branch = (& git branch --show-current).Trim()
Write-Host "    $branch" -ForegroundColor Gray

if ($branch -ne "feature/safe-public-layer-v1") {
    Write-Host "==> Mudando para feature/safe-public-layer-v1..." -ForegroundColor Cyan
    & git checkout feature/safe-public-layer-v1 2>&1
}

Write-Host ""
Write-Host "==> Adicionando arquivos novos..." -ForegroundColor Cyan
& git add -A
& git status --short

Write-Host ""
Write-Host "==> Criando commit de incremento..." -ForegroundColor Cyan
& git commit -m "Safe Public Layer v1 - hide CSS + route guard + restricted page" -m "
Adiciona substancia ao PR existente sem alterar source React:

- safe-public-layer.css: oculta itens clinicos da sidebar/menu
  (Pacientes, Prontuario, Prescricao, Receita, Calculadora,
  Farmacologia, Laudos, Certificado, Alarme, Lembretes,
  Secretaria, Gerador, Prescritor, Plano Terapeutico,
  Plano Intervencao, Equivalencias, Relatorios, Anamnese)
  via [data-testid^=nav-] *= 'palavra'.

- safe-public-layer.js: interceptor de hashchange + popstate.
  Detecta rotas sensiveis no hash (/pacientes, /prontuario,
  /prescricao, /calculadora-dose, /farmacologia, /laudo, etc)
  e redireciona para restricted.html via location.replace.

- restricted.html: pagina estatica WarmMinimalism PANT com
  cadeado, mensagem 'Area Profissional Restrita', dois botoes
  (Voltar ao inicio / Conteudos educativos) e nota institucional
  com CRM-PE 25227 RQE 17756. Marcada noindex/nofollow.

- index.html: carrega o CSS no head e o JS no fim do body
  com defer, sem alterar bundle compilado nem estetica global.

Resultado pratico:
- Item clinico nao aparece no menu publico (CSS).
- URL direta para rota sensivel redireciona para tela neutra (JS).
- Nao pede PIN, nao expoe dado, nao mostra paciente.
- Funcionalidade preservada quando deploy mover para backend
  com auth real (basta remover/condicionar o CSS+JS desta camada).
" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "    Commit pulado ou falhou" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==> Push do branch (sem force)..." -ForegroundColor Cyan
& git push origin feature/safe-public-layer-v1 2>&1 | ForEach-Object {
    if ($_ -match "fatal|error") { Write-Host "    $_" -ForegroundColor Red }
    else { Write-Host "    $_" -ForegroundColor DarkGray }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "  [OK] Branch atualizado. PR sera atualizado automaticamente." -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  PR: https://github.com/jadsonfraga/neuroped/pulls" -ForegroundColor White
    Write-Host ""
    Start-Process "https://github.com/jadsonfraga/neuroped/pulls"
} else {
    Write-Host ""
    Write-Host "    [ERRO] Push falhou." -ForegroundColor Red
}

Read-Host "Pressione Enter para fechar"
