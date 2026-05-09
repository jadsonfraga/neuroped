# Fix do erro NODE_ENV no Windows: instala cross-env e reinicia dev server.
$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$extras = @("C:\Program Files\nodejs", "C:\Program Files\Git\cmd", "$env:APPDATA\npm")
foreach ($p in $extras) { if (Test-Path $p) { $env:Path = "$p;$env:Path" } }

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "==> Instalando cross-env (compatibilidade Windows)..." -ForegroundColor Cyan
& npm install --save-dev cross-env --no-audit --no-fund 2>&1 | ForEach-Object {
    if ($_ -match "ERR!|error") { Write-Host "    $_" -ForegroundColor Red }
    else { Write-Host "    $_" -ForegroundColor DarkGray }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "    [ERRO] Falha ao instalar cross-env" -ForegroundColor Red
    Read-Host "Pressione Enter para fechar"
    exit 1
}

Write-Host ""
Write-Host "==> Iniciando servidor de desenvolvimento..." -ForegroundColor Cyan
Write-Host "    Servidor abrira em http://localhost:5000" -ForegroundColor Gray
Write-Host "    Para parar: Ctrl+C nesta janela" -ForegroundColor Gray
Write-Host ""

$env:NODE_ENV = "development"

# Aguarda 3 segundos e abre browser em paralelo
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 8
    for ($i = 0; $i -lt 15; $i++) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
            if ($r.StatusCode -eq 200) {
                Start-Process "http://localhost:5000/#/login"
                break
            }
        } catch {}
        Start-Sleep -Seconds 2
    }
} | Out-Null

# Roda npm run dev (foreground)
& npm run dev
