$ErrorActionPreference = "Continue"
$proj  = "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia"
$wt    = "$proj\.claude\worktrees\friendly-goldberg-32f573"
$log   = "$proj\WRANGLER-LOG.txt"

function L($m) {
    $t = "[$(Get-Date -Format 'HH:mm:ss')] $m"
    Write-Host $t
    Add-Content $log $t
}

Set-Content $log "=== NeuroPed Wrangler Deploy $(Get-Date) ==="
L "Worktree: $wt"

# Verifica build
if (-not (Test-Path "$wt\dist\public\index.html")) {
    L "Build nao encontrado na worktree. Rodando npm run build:client no projeto principal..."
    Set-Location $proj
    npm run build:client 2>&1 | ForEach-Object { L $_ }
    # Verifica novamente
    if (-not (Test-Path "$proj\dist\public\index.html")) {
        L "ERRO: Build falhou. Verifique erros acima."
        Read-Host "Enter para fechar"; exit 1
    }
    $distDir = "$proj\dist\public"
} else {
    L "Build OK: $wt\dist\public"
    $distDir = "$wt\dist\public"
}

Set-Location $wt

# Verifica auth do wrangler
L "--- wrangler whoami ---"
$who = npx wrangler whoami 2>&1
$who | ForEach-Object { L $_ }
$authed = ($who -join " ") -match "You are logged in"

if (-not $authed) {
    L "Wrangler nao autenticado. Abrindo browser para login no Cloudflare..."
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Yellow
    Write-Host "  ABRA O BROWSER E AUTORIZE O CLOUDFLARE  " -ForegroundColor Yellow
    Write-Host "  Depois volte aqui — o deploy comeca     " -ForegroundColor Yellow
    Write-Host "  automaticamente apos o login.           " -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Yellow
    Write-Host ""
    npx wrangler login 2>&1 | ForEach-Object { L $_ }
    L "Login concluido (ou cancelado)."
}

# Deploy
L "--- wrangler pages deploy ---"
Write-Host ""
Write-Host "Iniciando deploy para Cloudflare Pages..." -ForegroundColor Cyan
$d = npx wrangler pages deploy $distDir --project-name neuroped 2>&1
$d | ForEach-Object { L $_ }

# Extrai URL do output
$urlMatch = $d | Select-String "https://[^\s]+" | Select-Object -First 1
if ($urlMatch) {
    $url = $urlMatch.Matches[0].Value
    L "=== DEPLOY OK: $url ==="

    # Salva URL em arquivo visivel
    Set-Content "$proj\NEUROPED-URL.txt" "URL do NeuroPed: $url`nData: $(Get-Date)"

    Write-Host ""
    Write-Host "====================================" -ForegroundColor Green
    Write-Host "  DEPLOY OK!" -ForegroundColor Green
    Write-Host "  URL: $url" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green

    # Verifica HTTP 200
    L "--- Verificando HTTP status ---"
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
        L "HTTP: $($r.StatusCode) — SITE NO AR!"
        Write-Host "HTTP $($r.StatusCode) — Site respondendo!" -ForegroundColor Green
    } catch {
        L "HTTP check: $_"
    }
} else {
    L "URL nao encontrada. Deploy pode ter falhado ou precisar de auth."
    Write-Host ""
    Write-Host "Deploy nao concluido. Veja o log: $log" -ForegroundColor Yellow
}

# Git push (tenta, nao bloqueia)
L "--- git push ---"
Set-Location $proj
git add wrangler.toml package-lock.json 2>&1 | ForEach-Object { L $_ }
$push = git push origin feat/auditoria-total-ui-backend-memoria 2>&1
$push | ForEach-Object { L $_ }

L "=== FIM. Log: $log ==="
Write-Host ""
Write-Host "Log salvo em: $log" -ForegroundColor Cyan
Read-Host "Pressione Enter para fechar"
