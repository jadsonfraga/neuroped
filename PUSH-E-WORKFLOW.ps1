$ErrorActionPreference = "Continue"
$proj = "C:\Users\User\OneDrive\Desktop\neuroped-comparacao\NeuroPed Escalas de Neuropedia"
$log  = "$proj\PUSH-LOG.txt"

function L($m) { $t="[$(Get-Date -f 'HH:mm:ss')] $m"; Write-Host $t; Add-Content $log $t }

Set-Content $log "=== NeuroPed Git Push + Workflow $(Get-Date) ==="
Set-Location $proj

# 1. Cria .github/workflows/
$wfDir = "$proj\.github\workflows"
New-Item -ItemType Directory -Force -Path $wfDir | Out-Null
L "Pasta criada: $wfDir"

# 2. Escreve o workflow de deploy
$yml = @'
name: Deploy NeuroPed to Cloudflare Pages

on:
  push:
    branches: [main, feat/auditoria-total-ui-backend-memoria]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run build:client
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: bebec59ba795c73c81f7c02365ac3c2d
          projectName: neuroped
          directory: dist/public
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
'@

Set-Content "$wfDir\deploy.yml" $yml -Encoding UTF8
L "Workflow criado: $wfDir\deploy.yml"

# 3. git add tudo novo
$added = git add .github wrangler.toml package-lock.json 2>&1
L "git add: $added"

$status = git status --short 2>&1
L "git status: $status"

# 4. commit
$commit = git commit -m "ci: GitHub Actions deploy Cloudflare Pages + account_id wrangler.toml" --no-verify 2>&1
L "git commit: $($commit -join ' ')"

# 5. push
L "--- git push ---"
$push = git push origin feat/auditoria-total-ui-backend-memoria 2>&1
$push | ForEach-Object { L $_ }

if ($LASTEXITCODE -eq 0) {
    L "PUSH OK!"
    Write-Host "`n=== PUSH OK! ===" -ForegroundColor Green
    Write-Host "GitHub Actions vai deployar automaticamente." -ForegroundColor Green
    Write-Host "Acompanhe: github.com/jadsonfraga/neuroped/actions" -ForegroundColor Cyan
} else {
    L "Push falhou. Codigo: $LASTEXITCODE"
    Write-Host "`nPush falhou — autenticacao necessaria." -ForegroundColor Yellow

    # Tenta gh auth
    $ghStatus = gh auth status 2>&1
    L "gh auth status: $($ghStatus -join ' ')"

    if ($ghStatus -match "Logged in") {
        L "Autenticado via gh. Tentando gh auth git-credential..."
        gh auth git-credential 2>&1 | L $_
        $push2 = git push origin feat/auditoria-total-ui-backend-memoria 2>&1
        $push2 | ForEach-Object { L $_ }
        if ($LASTEXITCODE -eq 0) {
            L "PUSH OK via gh!"
            Write-Host "PUSH OK via GitHub CLI!" -ForegroundColor Green
        }
    }
}

L "Log: $log"
Write-Host "`nLog: $log" -ForegroundColor Cyan
Read-Host "Enter para fechar"
