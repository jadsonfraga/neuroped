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

function Step { param($m) Write-Host ""; Write-Host "==> $m" -ForegroundColor Cyan }
function Ok { param($m) Write-Host "    [OK] $m" -ForegroundColor Green }
function Warn { param($m) Write-Host "    [!] $m" -ForegroundColor Yellow }
function Err { param($m) Write-Host "    [ERRO] $m" -ForegroundColor Red }

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  NeuroPed - Merge autonomo do PR Safe Public Layer v1" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

# ------- Autenticacao OAuth Device Flow -------
Step "Autenticando no GitHub via Device Flow"

$ClientId = "178c6fc778ccc68e1d6a"
$Scopes = "repo,workflow"

try {
    $deviceResp = Invoke-RestMethod -Method Post `
        -Uri "https://github.com/login/device/code" `
        -Headers @{ "Accept" = "application/json" } `
        -Body @{ client_id = $ClientId; scope = $Scopes }
} catch {
    Err "Falha ao iniciar autenticacao: $_"
    Read-Host "Pressione Enter para fechar"
    exit 1
}

$userCode = $deviceResp.user_code
$deviceCode = $deviceResp.device_code
$verifyUri = $deviceResp.verification_uri
$pollInterval = if ($deviceResp.interval) { [int]$deviceResp.interval } else { 5 }
$expiresIn = if ($deviceResp.expires_in) { [int]$deviceResp.expires_in } else { 900 }

Write-Host ""
Write-Host "  ===========================================================" -ForegroundColor Yellow
Write-Host "  CODIGO DE AUTORIZACAO:" -ForegroundColor Yellow
Write-Host ""
Write-Host "                $userCode" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host ""
Write-Host "  1. Navegador abrira em $verifyUri" -ForegroundColor Yellow
Write-Host "  2. Cole o codigo (ja esta na area de transferencia)" -ForegroundColor Yellow
Write-Host "  3. Continue e Authorize" -ForegroundColor Yellow
Write-Host "  ===========================================================" -ForegroundColor Yellow

try { Set-Clipboard -Value $userCode; Ok "Codigo copiado para a area de transferencia" } catch {}
Start-Process $verifyUri

Write-Host "  Aguardando autorizacao..." -ForegroundColor Cyan
$accessToken = $null
$elapsed = 0
$startTime = Get-Date

while ($null -eq $accessToken -and $elapsed -lt $expiresIn) {
    Start-Sleep -Seconds $pollInterval
    $elapsed = (New-TimeSpan -Start $startTime -End (Get-Date)).TotalSeconds
    try {
        $tokenResp = Invoke-RestMethod -Method Post `
            -Uri "https://github.com/login/oauth/access_token" `
            -Headers @{ "Accept" = "application/json" } `
            -Body @{
                client_id = $ClientId
                device_code = $deviceCode
                grant_type = "urn:ietf:params:oauth:grant-type:device_code"
            } -ErrorAction Stop
    } catch { continue }

    if ($tokenResp.access_token) { $accessToken = $tokenResp.access_token; break }
    if ($tokenResp.error -and $tokenResp.error -ne "authorization_pending" -and $tokenResp.error -ne "slow_down") {
        Err "Autorizacao falhou: $($tokenResp.error_description)"
        Read-Host "Pressione Enter para fechar"
        exit 1
    }
    if ($tokenResp.error -eq "slow_down" -and $tokenResp.interval) { $pollInterval = [int]$tokenResp.interval }
}

if (-not $accessToken) {
    Err "Tempo esgotado."
    Read-Host "Pressione Enter para fechar"
    exit 1
}
Ok "Autorizado!"

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Accept" = "application/vnd.github+json"
    "User-Agent" = "NeuroPed-MergeBot"
}

# ------- Localizar o PR aberto -------
Step "Localizando PR aberto do Safe Public Layer"

try {
    $prs = Invoke-RestMethod -Method Get `
        -Uri "https://api.github.com/repos/jadsonfraga/neuroped/pulls?state=open&head=jadsonfraga:feature/safe-public-layer-v1" `
        -Headers $headers
} catch {
    Err "Falha ao listar PRs: $_"
    Read-Host "Pressione Enter para fechar"
    exit 1
}

if (-not $prs -or $prs.Count -eq 0) {
    Warn "Nenhum PR aberto encontrado para feature/safe-public-layer-v1"
    Write-Host "    Tentando listar todos os PRs abertos..." -ForegroundColor Gray
    $prs = Invoke-RestMethod -Method Get `
        -Uri "https://api.github.com/repos/jadsonfraga/neuroped/pulls?state=open" `
        -Headers $headers
    if ($prs -and $prs.Count -gt 0) {
        $prs = $prs | Where-Object { $_.head.ref -eq "feature/safe-public-layer-v1" }
    }
}

if (-not $prs -or $prs.Count -eq 0) {
    Err "Nenhum PR encontrado. Verifique em https://github.com/jadsonfraga/neuroped/pulls"
    Read-Host "Pressione Enter para fechar"
    exit 1
}

$pr = $prs[0]
$prNumber = $pr.number
$prTitle = $pr.title
$prHead = $pr.head.ref
$prBase = $pr.base.ref
$prMergeable = $pr.mergeable
$prSha = $pr.head.sha

Ok "PR encontrado: #$prNumber - $prTitle"
Write-Host "    Branch: $prHead -> $prBase" -ForegroundColor Gray
Write-Host "    SHA: $prSha" -ForegroundColor Gray
Write-Host "    Mergeable: $prMergeable" -ForegroundColor Gray

# ------- Verificar status do PR antes de mesclar -------
Step "Verificando se PR esta pronto para merge"

# Re-fetch para ter mergeable_state atualizado
Start-Sleep -Seconds 2
$prDetail = Invoke-RestMethod -Method Get `
    -Uri "https://api.github.com/repos/jadsonfraga/neuroped/pulls/$prNumber" `
    -Headers $headers

Write-Host "    Mergeable: $($prDetail.mergeable)" -ForegroundColor Gray
Write-Host "    Mergeable state: $($prDetail.mergeable_state)" -ForegroundColor Gray
Write-Host "    Commits: $($prDetail.commits)" -ForegroundColor Gray
Write-Host "    Changed files: $($prDetail.changed_files)" -ForegroundColor Gray

if ($prDetail.mergeable -eq $false) {
    Err "PR tem conflitos. Resolva antes de mesclar."
    Read-Host "Pressione Enter para fechar"
    exit 1
}

# ------- Executar o merge via API -------
Step "Executando merge do PR #$prNumber"

$mergeBody = @{
    commit_title = "Merge: Safe Public Layer v1 - vitrine educativa + nucleo clinico restringido"
    commit_message = "Mescla feature/safe-public-layer-v1 em main."
    sha = $prSha
    merge_method = "squash"
} | ConvertTo-Json

try {
    $mergeResp = Invoke-RestMethod -Method Put `
        -Uri "https://api.github.com/repos/jadsonfraga/neuroped/pulls/$prNumber/merge" `
        -Headers $headers `
        -Body $mergeBody `
        -ContentType "application/json"

    if ($mergeResp.merged -eq $true) {
        Ok "PR #$prNumber mesclado com sucesso!"
        Write-Host "    Merge SHA: $($mergeResp.sha)" -ForegroundColor Gray
        Write-Host "    Mensagem: $($mergeResp.message)" -ForegroundColor Gray
    } else {
        Warn "Resposta inesperada: $($mergeResp | ConvertTo-Json -Compress)"
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Err "Falha no merge (HTTP $statusCode): $_"
    if ($_.ErrorDetails.Message) {
        Write-Host "    $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Read-Host "Pressione Enter para fechar"
    exit 1
}

# ------- Deletar branch da feature apos merge -------
Step "Removendo branch remota apos merge"
try {
    Invoke-RestMethod -Method Delete `
        -Uri "https://api.github.com/repos/jadsonfraga/neuroped/git/refs/heads/feature/safe-public-layer-v1" `
        -Headers $headers
    Ok "Branch remota removida"
} catch {
    Warn "Branch remota nao foi removida (provavelmente protegida ou ja removida)"
}

# ------- Acompanhar deploy do GitHub Pages -------
Step "Aguardando GitHub Actions iniciar deploy"
Start-Sleep -Seconds 5

try {
    $runs = Invoke-RestMethod -Method Get `
        -Uri "https://api.github.com/repos/jadsonfraga/neuroped/actions/runs?per_page=3" `
        -Headers $headers
    if ($runs.workflow_runs -and $runs.workflow_runs.Count -gt 0) {
        $latest = $runs.workflow_runs[0]
        Write-Host "    Ultimo workflow: $($latest.name)" -ForegroundColor Gray
        Write-Host "    Status: $($latest.status) ($($latest.conclusion))" -ForegroundColor Gray
        Write-Host "    URL: $($latest.html_url)" -ForegroundColor Gray
    }
} catch {
    Warn "Nao foi possivel listar workflows (continua tudo certo, apenas info)"
}

# ------- Final -------
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  MERGE CONCLUIDO!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  PR mesclado: https://github.com/jadsonfraga/neuroped/pull/$prNumber" -ForegroundColor White
Write-Host "  Site (atualizara em 1-3 min): https://jadsonfraga.github.io/neuroped/" -ForegroundColor White
Write-Host "  Actions: https://github.com/jadsonfraga/neuroped/actions" -ForegroundColor White
Write-Host ""
Write-Host "  Aguarde alguns minutos para o GitHub Pages atualizar." -ForegroundColor Cyan
Write-Host ""

Start-Process "https://github.com/jadsonfraga/neuroped/actions"

# Limpar token
$accessToken = $null

Read-Host "Pressione Enter para fechar"
