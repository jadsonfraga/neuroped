$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$paths = @(
    "C:\Program Files\Git\bin",
    "C:\Program Files\Git\cmd",
    "C:\Program Files\GitHub CLI"
)
foreach ($p in $paths) {
    if ((Test-Path $p) -and ($env:Path -notlike "*$p*")) {
        $env:Path = "$p;$env:Path"
    }
}

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  NeuroPed v9.9 - Push para GitHub" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

Write-Host ""
Write-Host "==> Verificando Git..." -ForegroundColor Cyan
$gitVer = & git --version 2>&1
Write-Host "    Git: $gitVer" -ForegroundColor Gray

if (-not (Test-Path ".git")) {
    Write-Host "    [ERRO] Repositorio Git nao inicializado nesta pasta" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "==> Status atual..." -ForegroundColor Cyan
& git status --short

Write-Host ""
Write-Host "==> Adicionando arquivos..." -ForegroundColor Cyan
& git add -A

$status = & git status --porcelain
if (-not $status) {
    Write-Host "    Nada novo para commitar" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 0
}

Write-Host ""
Write-Host "==> Criando commit v9.9..." -ForegroundColor Cyan
& git commit -m "v9.9 - Limpeza Perplexity + SEO/JSON-LD + identidade PANT + docs institucionais"

Write-Host ""
Write-Host "==> Fazendo push para o GitHub..." -ForegroundColor Cyan
& git push 2>&1 | ForEach-Object {
    if ($_ -match "fatal|error") {
        Write-Host "    $_" -ForegroundColor Red
    } else {
        Write-Host "    $_" -ForegroundColor DarkGray
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "  [OK] v9.9 enviada com sucesso!" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Site: https://jadsonfraga.github.io/neuroped/" -ForegroundColor White
    Write-Host "  Repo: https://github.com/jadsonfraga/neuroped" -ForegroundColor White
    Write-Host "  Actions: https://github.com/jadsonfraga/neuroped/actions" -ForegroundColor White
    Write-Host ""
    Write-Host "  Aguarde 1-3 minutos para o deploy do GitHub Pages atualizar." -ForegroundColor Cyan
    Write-Host ""

    Start-Process "https://github.com/jadsonfraga/neuroped/actions"
} else {
    Write-Host ""
    Write-Host "    [ERRO] Falha no push (exit code: $LASTEXITCODE)" -ForegroundColor Red
}

Write-Host ""
Read-Host "Pressione Enter para fechar"
