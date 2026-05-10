$ErrorActionPreference = "Continue"
$proj = "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia"
$log  = "$proj\DEPLOY-LOG.txt"

function L($m) {
    $t = "[$(Get-Date -Format 'HH:mm:ss')] $m"
    Write-Host $t
    Add-Content $log $t
}

Set-Content $log "=== NeuroPed Deploy $(Get-Date) ==="
Set-Location $proj
L "DIR: $(Get-Location)"

# FASE 1 - npm install
L "--- npm install ---"
$r = npm install 2>&1
$r | ForEach-Object { L $_ }

# FASE 2 - build cliente
L "--- npm run build:client ---"
$r2 = npm run build:client 2>&1
$r2 | ForEach-Object { L $_ }

# Verifica onde ficou o build
$dist = $null
foreach ($d in @("dist\public","dist","build","out")) {
    $p = Join-Path $proj $d
    if (Test-Path "$p\index.html") { $dist = $p; break }
}

if (-not $dist) {
    # Tenta build completo
    L "--- npm run build ---"
    $r3 = npm run build 2>&1
    $r3 | ForEach-Object { L $_ }
    foreach ($d in @("dist\public","dist","build","out")) {
        $p = Join-Path $proj $d
        if (Test-Path "$p\index.html") { $dist = $p; break }
    }
}

if (-not $dist) { L "ERRO: build nao gerou index.html em nenhuma pasta"; Read-Host "Enter"; exit 1 }
L "Build OK: $dist"

# FASE 3 - descobre account_id
L "--- wrangler whoami ---"
$who = npx wrangler whoami 2>&1
$who | ForEach-Object { L $_ }
$acct = ($who | Select-String "([a-f0-9]{32})" | Select -First 1).Matches[0].Groups[1].Value

if (-not $acct) {
    L "--- wrangler pages project list ---"
    $pl = npx wrangler pages project list 2>&1
    $pl | ForEach-Object { L $_ }
    $acct = ($pl | Select-String "([a-f0-9]{32})" | Select -First 1).Matches[0].Groups[1].Value
}

if ($acct) { L "Account ID: $($acct.Substring(0,8))..." } else { L "Account ID nao encontrado — tentando deploy direto" }

# FASE 4 - deploy Cloudflare
$url = $null
$deployed = $false

if ($acct) {
    $toml = "$proj\wrangler.toml"
    $c = Get-Content $toml -Raw
    if ($c -notmatch 'account_id') {
        $c = "account_id = `"$acct`"`n" + $c
        Set-Content $toml $c
        L "account_id adicionado ao wrangler.toml"
    }
}

L "--- wrangler pages deploy ---"
$d = npx wrangler pages deploy $dist --project-name neuroped 2>&1
$d | ForEach-Object { L $_ }
$m = ($d | Select-String "https://[^\s]+").Matches
if ($m.Count -gt 0) {
    $url = $m[0].Value
    $deployed = $true
    L "CLOUDFLARE OK: $url"
}

# FASE 5 - fallback Netlify CLI
if (-not $deployed) {
    L "--- Netlify CLI ---"
    npm install -g netlify-cli 2>&1 | ForEach-Object { L $_ }
    $n = netlify deploy --dir $dist --prod 2>&1
    $n | ForEach-Object { L $_ }
    $m2 = ($n | Select-String "https://[^\s]+\.netlify\.app").Matches
    if ($m2.Count -gt 0) { $url = $m2[0].Value; $deployed = $true; L "NETLIFY OK: $url" }
}

# FASE 6 - Netlify API anonima
if (-not $deployed) {
    L "--- Netlify API anonima ---"
    $zip = "$env:TEMP\neuroped.zip"
    if (Test-Path $zip) { Remove-Item $zip }
    Compress-Archive -Path "$dist\*" -DestinationPath $zip -Force
    try {
        $resp = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites" -Method POST `
            -Headers @{ "Content-Type" = "application/zip" } -InFile $zip
        if ($resp.url) { $url = $resp.url; $deployed = $true; L "NETLIFY API OK: $url" }
        if ($resp.ssl_url) { $url = $resp.ssl_url; $deployed = $true; L "NETLIFY API OK: $url" }
    } catch { L "Netlify API falhou: $_" }
}

# RESULTADO
L "=== RESULTADO ==="
if ($deployed) {
    L "DEPLOY OK! URL: $url"
    Write-Host "`n=== DEPLOY OK ===" -ForegroundColor Green
    Write-Host "URL: $url" -ForegroundColor Green
} else {
    L "Deploy nao concluido. Log: $log"
    Write-Host "Nao foi possivel fazer o deploy automatico." -ForegroundColor Yellow
    Write-Host "Verifique o log: $log" -ForegroundColor Cyan
}
Write-Host "`nLog: $log" -ForegroundColor Cyan
Read-Host "Pressione Enter para fechar"
