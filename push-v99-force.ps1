$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$paths = @("C:\Program Files\Git\bin", "C:\Program Files\Git\cmd", "C:\Program Files\GitHub CLI")
foreach ($p in $paths) {
    if ((Test-Path $p) -and ($env:Path -notlike "*$p*")) {
        $env:Path = "$p;$env:Path"
    }
}
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "==> Tentando fetch + rebase..." -ForegroundColor Cyan
& git fetch origin

Write-Host ""
Write-Host "==> Tentando rebase com remoto..." -ForegroundColor Cyan
& git pull origin main --rebase --strategy-option=theirs 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "    Conflito de rebase. Abortando..." -ForegroundColor Yellow
    & git rebase --abort
    Write-Host ""
    Write-Host "==> Force push (sobrescrevendo remoto com nossa versao v9.9)..." -ForegroundColor Cyan
    & git push --force-with-lease origin main 2>&1
} else {
    Write-Host ""
    Write-Host "==> Push normal apos rebase..." -ForegroundColor Cyan
    & git push origin main 2>&1
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
    Start-Process "https://github.com/jadsonfraga/neuroped/actions"
    Start-Sleep -Seconds 2
    Start-Process "https://jadsonfraga.github.io/neuroped/"
} else {
    Write-Host ""
    Write-Host "    [ERRO] Push ainda falhou (exit: $LASTEXITCODE)" -ForegroundColor Red
}

Write-Host ""
Read-Host "Pressione Enter para fechar"
