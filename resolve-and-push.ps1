$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$paths = @("C:\Program Files\Git\bin","C:\Program Files\Git\cmd")
foreach ($p in $paths) {
    if ((Test-Path $p) -and ($env:Path -notlike "*$p*")) {
        $env:Path = "$p;$env:Path"
    }
}
Set-Location $PSScriptRoot

function Step { param($m) Write-Host ""; Write-Host "==> $m" -ForegroundColor Cyan }
function Ok { param($m) Write-Host "    [OK] $m" -ForegroundColor Green }
function Warn { param($m) Write-Host "    [!] $m" -ForegroundColor Yellow }
function Err { param($m) Write-Host "    [ERRO] $m" -ForegroundColor Red }

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  Resolvendo conflito + completando merge + push" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

Step "Branch atual"
$branch = (& git branch --show-current).Trim()
Write-Host "    $branch" -ForegroundColor Gray

Step "Verificando estado do repo"
& git status --short

Step "Buscando outros arquivos com marcadores de conflito"
$conflictFiles = & git diff --name-only --diff-filter=U 2>&1
if ($conflictFiles) {
    Write-Host "    Arquivos em conflito:" -ForegroundColor Yellow
    $conflictFiles | ForEach-Object { Write-Host "      $_" -ForegroundColor Yellow }
} else {
    Ok "Nenhum conflito ativo (manifest.json ja foi resolvido)"
}

Step "Stage de manifest.json (resolvido)"
& git add manifest.json
& git add -A
Ok "Arquivos staged"

Step "Status apos stage"
& git status --short

Step "Tentando commit do squash merge"
$commitMsg = "Merge: Safe Public Layer v1 - vitrine educativa + nucleo clinico restringido (conflito de manifest resolvido)"
$commitOutput = & git commit -m $commitMsg 2>&1
$commitOutput | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }

if ($LASTEXITCODE -ne 0) {
    Warn "Commit retornou codigo $LASTEXITCODE - pode ja estar commitado"
}

Step "Status final"
& git status --short
$head = (& git log -1 --oneline).Trim()
Write-Host "    HEAD: $head" -ForegroundColor Gray

Step "Push para origin/main (credenciais cacheadas)"
& git push origin main 2>&1 | ForEach-Object {
    if ($_ -match "fatal|error|denied|rejected") {
        Write-Host "    $_" -ForegroundColor Red
    } else {
        Write-Host "    $_" -ForegroundColor DarkGray
    }
}

if ($LASTEXITCODE -ne 0) {
    Err "Push falhou. Verificando..."
    Write-Host ""
    Write-Host "    Tentando rebase com remoto antes de push..." -ForegroundColor Yellow
    & git pull origin main --rebase 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
    if ($LASTEXITCODE -eq 0) {
        & git push origin main 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
    }
}

if ($LASTEXITCODE -eq 0) {
    Step "Removendo branch feature"
    & git branch -D feature/safe-public-layer-v1 2>&1 | Out-Null
    & git push origin --delete feature/safe-public-layer-v1 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }

    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "  MERGE CONCLUIDO + PUSH PARA MAIN!" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Repo: https://github.com/jadsonfraga/neuroped" -ForegroundColor White
    Write-Host "  Site (atualiza em 1-3 min): https://jadsonfraga.github.io/neuroped/" -ForegroundColor White
    Write-Host "  Actions: https://github.com/jadsonfraga/neuroped/actions" -ForegroundColor White
    Write-Host ""
    Start-Process "https://github.com/jadsonfraga/neuroped/actions"
} else {
    Err "Push final falhou. Verifique manualmente."
}

Read-Host "Pressione Enter para fechar"
