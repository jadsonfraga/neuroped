<#
.SYNOPSIS
    Configura, publica e verifica o Feed Diário das Famílias do NeuroPed.

.DESCRIPTION
    Script único para Windows. Executa, do começo ao fim:
      1. Verifica e instala pré-requisitos (Git, Node.js, GitHub CLI).
      2. Autentica no GitHub.
      3. Registra o token do Instagram como segredo (opcional, recomendado).
      4. Registra o PAT de automação (opcional, torna a renovação perpétua).
      5. Faz o merge do pull request do feed (com confirmação).
      6. Dispara a atualização do feed e acompanha a execução.
      7. Aguarda o deploy e confirma o conteúdo no site publicado.

    Cada etapa é idempotente: rodar o script de novo não quebra nada e
    apenas completa o que ainda faltar.

.PARAMETER InstagramToken
    Token de acesso do Instagram. Se omitido, o script pergunta (e aceita
    ficar sem, seguindo pelo caminho público sem token).

.PARAMETER AutomationToken
    Personal Access Token do GitHub com permissão de administrar segredos.
    Permite que a automação renove o token do Instagram sozinha, para sempre.

.PARAMETER PullRequest
    Número do pull request a ser mesclado. Padrão: 737.

.PARAMETER SkipMerge
    Não mescla o pull request; apenas configura segredos e publica o feed
    a partir do que já estiver no main.

.EXAMPLE
    .\Configurar-FeedFamilias.ps1

.EXAMPLE
    .\Configurar-FeedFamilias.ps1 -InstagramToken "IGQ..." -AutomationToken "ghp_..."
#>

[CmdletBinding()]
param(
    [string]$InstagramToken,
    [string]$AutomationToken,
    [int]$PullRequest = 737,
    [switch]$SkipMerge
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Repo = 'jadsonfraga/neuroped'
$FeedWorkflow = 'family-feed-daily.yml'
$SiteUrl = 'https://neuroped.pages.dev'
$MirrorUrl = 'https://superneuroped.vercel.app'
$FeedPath = '/family-feed/novidades.json'

# ─────────────────────────── Apresentação ───────────────────────────

function Write-Step {
    param([int]$Number, [string]$Title)
    Write-Host ''
    Write-Host ('=' * 62) -ForegroundColor DarkCyan
    Write-Host ("  ETAPA $Number - $Title") -ForegroundColor Cyan
    Write-Host ('=' * 62) -ForegroundColor DarkCyan
}

function Write-Ok    { param([string]$m) Write-Host "  [OK]    $m" -ForegroundColor Green }
function Write-Info  { param([string]$m) Write-Host "  [INFO]  $m" -ForegroundColor Gray }
function Write-Warn2 { param([string]$m) Write-Host "  [AVISO] $m" -ForegroundColor Yellow }
function Write-Err2  { param([string]$m) Write-Host "  [ERRO]  $m" -ForegroundColor Red }

function Confirm-Action {
    param([string]$Question, [bool]$DefaultYes = $true)
    $hint = if ($DefaultYes) { '[S/n]' } else { '[s/N]' }
    $answer = Read-Host "  $Question $hint"
    if ([string]::IsNullOrWhiteSpace($answer)) { return $DefaultYes }
    return $answer -match '^[sSyY]'
}

function Test-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

# Executa um comando externo silenciando stderr e devolve apenas o codigo de
# saida. Necessario porque, sob $ErrorActionPreference = 'Stop', o redirecionamento
# "2>&1" de um comando nativo pode virar erro terminante no PowerShell 5.1.
function Invoke-NativeQuiet {
    param([scriptblock]$Command)
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $Command 2>&1 | Out-Null
        return $LASTEXITCODE
    }
    catch {
        return 1
    }
    finally {
        $ErrorActionPreference = $previous
    }
}

function Install-WithWinget {
    param([string]$PackageId, [string]$FriendlyName)
    if (-not (Test-Command 'winget')) {
        Write-Err2 "$FriendlyName nao esta instalado e o winget nao esta disponivel."
        Write-Info "Instale manualmente e rode este script de novo."
        return $false
    }
    Write-Info "Instalando $FriendlyName via winget..."
    winget install --id $PackageId --silent --accept-package-agreements --accept-source-agreements | Out-Null
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
                [Environment]::GetEnvironmentVariable('Path', 'User')
    return $true
}

Write-Host ''
Write-Host '  NeuroPed - Feed Diario das Familias' -ForegroundColor White
Write-Host '  Instagram + novidades de neuropediatria, atualizados sozinhos' -ForegroundColor DarkGray

# ───────────────────── ETAPA 1 — Pré-requisitos ─────────────────────

Write-Step 1 'Pre-requisitos'

$tools = @(
    @{ Cmd = 'git';  Id = 'Git.Git';        Name = 'Git' },
    @{ Cmd = 'node'; Id = 'OpenJS.NodeJS';  Name = 'Node.js' },
    @{ Cmd = 'gh';   Id = 'GitHub.cli';     Name = 'GitHub CLI' }
)

foreach ($tool in $tools) {
    if (Test-Command $tool.Cmd) {
        Write-Ok "$($tool.Name) encontrado."
    }
    else {
        Write-Warn2 "$($tool.Name) nao encontrado."
        if (-not (Install-WithWinget -PackageId $tool.Id -FriendlyName $tool.Name)) { exit 1 }
        if (-not (Test-Command $tool.Cmd)) {
            Write-Err2 "$($tool.Name) foi instalado mas ainda nao esta no PATH."
            Write-Info 'Feche e reabra o terminal, depois rode este script novamente.'
            exit 1
        }
        Write-Ok "$($tool.Name) instalado."
    }
}

# ─────────────────── ETAPA 2 — Autenticação GitHub ──────────────────

Write-Step 2 'Autenticacao no GitHub'

$authOk = ((Invoke-NativeQuiet { gh auth status }) -eq 0)

if ($authOk) {
    Write-Ok 'Ja autenticado no GitHub.'
}
else {
    Write-Info 'Abrindo o login do GitHub no navegador...'
    gh auth login --hostname github.com --git-protocol https --web
    if ($LASTEXITCODE -ne 0) {
        Write-Err2 'Login no GitHub nao concluido.'
        exit 1
    }
    Write-Ok 'Autenticado.'
}

if ((Invoke-NativeQuiet { gh repo view $Repo --json name }) -ne 0) {
    Write-Err2 "Sem acesso ao repositorio $Repo com a conta autenticada."
    exit 1
}
Write-Ok "Acesso ao repositorio $Repo confirmado."

# ──────────────── ETAPA 3 — Token do Instagram ──────────────────────

Write-Step 3 'Token do Instagram (opcional, recomendado)'

Write-Info 'Com o token, o app usa a API oficial do Instagram e o post mais'
Write-Info 'recente aparece sempre. Sem o token, o sistema ainda funciona pelo'
Write-Info 'caminho publico, que o Instagram pode limitar em alguns dias.'
Write-Host ''
Write-Info 'Como obter (gratuito, ~10 min): developers.facebook.com -> criar app'
Write-Info '-> produto "Instagram" -> gerar token de acesso de longa duracao.'
Write-Host ''

$existingSecrets = @()
$previousEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try {
    $secretList = gh secret list --repo $Repo 2>$null
    if ($LASTEXITCODE -eq 0 -and $secretList) {
        $existingSecrets = @($secretList | ForEach-Object { ($_ -split '\s+')[0] })
    }
}
catch { }
finally { $ErrorActionPreference = $previousEap }

$hasInstagramSecret = $existingSecrets -contains 'INSTAGRAM_ACCESS_TOKEN'
if ($hasInstagramSecret) {
    Write-Ok 'O segredo INSTAGRAM_ACCESS_TOKEN ja existe no repositorio.'
}

if (-not $InstagramToken) {
    $question = if ($hasInstagramSecret) { 'Quer substituir o token atual?' } else { 'Tem um token do Instagram para configurar agora?' }
    if (Confirm-Action -Question $question -DefaultYes (-not $hasInstagramSecret)) {
        $secure = Read-Host '  Cole o token do Instagram' -AsSecureString
        $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        try { $InstagramToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) }
        finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    }
}

if ($InstagramToken) {
    $InstagramToken = $InstagramToken.Trim()
    Write-Info 'Validando o token na API do Instagram...'
    $account = $null
    try {
        $account = Invoke-RestMethod -Method Get -TimeoutSec 30 -Uri (
            'https://graph.instagram.com/me?fields=id,username&access_token=' +
            [Uri]::EscapeDataString($InstagramToken))
    }
    catch {
        Write-Err2 "Token recusado pelo Instagram: $($_.Exception.Message)"
        Write-Info 'Gere um novo token e rode o script de novo. Seguindo sem token.'
        $InstagramToken = $null
    }

    if ($InstagramToken -and $account) {
        Write-Ok "Token valido para a conta @$($account.username)."

        # Estende a validade para 60 dias antes de guardar o segredo.
        try {
            $refreshed = Invoke-RestMethod -Method Get -TimeoutSec 30 -Uri (
                'https://graph.instagram.com/refresh_access_token' +
                '?grant_type=ig_refresh_token&access_token=' +
                [Uri]::EscapeDataString($InstagramToken))
            if ($refreshed.access_token) {
                $InstagramToken = $refreshed.access_token
                $days = [math]::Round($refreshed.expires_in / 86400)
                Write-Ok "Token estendido: valido por ~$days dias."
            }
        }
        catch {
            Write-Info 'Token ja e de longa duracao ou ainda nao pode ser estendido; seguindo.'
        }

        $InstagramToken | gh secret set INSTAGRAM_ACCESS_TOKEN --repo $Repo
        if ($LASTEXITCODE -eq 0) { Write-Ok 'Segredo INSTAGRAM_ACCESS_TOKEN gravado.' }
        else { Write-Err2 'Falha ao gravar o segredo INSTAGRAM_ACCESS_TOKEN.' }
    }
}
elseif (-not $hasInstagramSecret) {
    Write-Warn2 'Seguindo sem token: o cartao usara o caminho publico do Instagram.'
    Write-Info 'Voce pode rodar este script de novo depois para adicionar o token.'
}

# ───────────── ETAPA 4 — PAT de automação (renovação perpétua) ──────

Write-Step 4 'PAT de automacao (opcional, deixa a renovacao perpetua)'

$hasAutomationToken = $existingSecrets -contains 'NEUROPED_AUTOMATION_TOKEN'
if ($hasAutomationToken) {
    Write-Ok 'O segredo NEUROPED_AUTOMATION_TOKEN ja existe.'
    Write-Info 'A automacao consegue renovar o token do Instagram sozinha.'
}
else {
    Write-Info 'Sem este PAT, o token do Instagram precisa ser renovado a cada ~60'
    Write-Info 'dias. Com ele, a automacao renova sozinha e nunca mais para.'
    Write-Info 'Crie em: github.com/settings/tokens (escopo "repo" + "workflow").'
    Write-Host ''
    if (-not $AutomationToken) {
        if (Confirm-Action -Question 'Tem um PAT para configurar agora?' -DefaultYes $false) {
            $secure = Read-Host '  Cole o PAT do GitHub' -AsSecureString
            $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
            try { $AutomationToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) }
            finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
        }
    }
    if ($AutomationToken) {
        $AutomationToken.Trim() | gh secret set NEUROPED_AUTOMATION_TOKEN --repo $Repo
        if ($LASTEXITCODE -eq 0) { Write-Ok 'Segredo NEUROPED_AUTOMATION_TOKEN gravado.' }
        else { Write-Err2 'Falha ao gravar o segredo NEUROPED_AUTOMATION_TOKEN.' }
    }
    else {
        Write-Warn2 'Seguindo sem o PAT (a automacao avisa quando precisar de renovacao).'
    }
}

# ──────────────── ETAPA 5 — Merge do pull request ───────────────────

Write-Step 5 'Publicar a funcionalidade no main'

$merged = $false
if ($SkipMerge) {
    Write-Info 'Merge ignorado por opcao (-SkipMerge).'
}
else {
    $pr = $null
    $previousEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $prJson = gh pr view $PullRequest --repo $Repo --json number,title,state,mergeable,statusCheckRollup 2>$null
        if ($LASTEXITCODE -eq 0 -and $prJson) { $pr = $prJson | ConvertFrom-Json }
    }
    catch {
        Write-Warn2 "Nao foi possivel ler o PR #$PullRequest."
    }
    finally { $ErrorActionPreference = $previousEap }

    if ($pr -and $pr.state -eq 'MERGED') {
        Write-Ok "PR #$PullRequest ja esta mesclado."
        $merged = $true
    }
    elseif ($pr -and $pr.state -eq 'OPEN') {
        Write-Info "PR #$PullRequest - $($pr.title)"

        $failing = @()
        if ($pr.statusCheckRollup) {
            $failing = @($pr.statusCheckRollup | Where-Object {
                $_.conclusion -in @('FAILURE', 'TIMED_OUT', 'CANCELLED')
            })
        }
        if ($failing.Count -gt 0) {
            Write-Warn2 "$($failing.Count) verificacao(oes) de CI falhando:"
            $failing | ForEach-Object { Write-Info "  - $($_.name)" }
        }
        else {
            Write-Ok 'Nenhuma verificacao de CI falhando.'
        }

        if ($pr.mergeable -eq 'CONFLICTING') {
            Write-Err2 'O PR tem conflito com o main e precisa ser resolvido antes.'
        }
        elseif (Confirm-Action -Question "Mesclar o PR #$PullRequest no main agora?") {
            gh pr merge $PullRequest --repo $Repo --squash --delete-branch
            if ($LASTEXITCODE -eq 0) {
                Write-Ok 'PR mesclado no main.'
                $merged = $true
                Write-Info 'O merge dispara o deploy automatico do site.'
            }
            else {
                Write-Err2 'Merge nao concluido. Verifique as permissoes ou o status do PR.'
            }
        }
        else {
            Write-Info 'Merge adiado. O feed sera publicado a partir do main atual.'
        }
    }
    else {
        Write-Warn2 "PR #$PullRequest nao esta aberto; seguindo com o main atual."
    }
}

# ───────────── ETAPA 6 — Rodar a atualização do feed ────────────────

Write-Step 6 'Buscar novidades e o ultimo post do Instagram'

$workflowExists = ((Invoke-NativeQuiet { gh workflow view $FeedWorkflow --repo $Repo }) -eq 0)

if (-not $workflowExists) {
    Write-Warn2 "O workflow $FeedWorkflow ainda nao existe no main."
    Write-Info 'Mescle o pull request primeiro e rode este script novamente.'
}
else {
    Write-Info 'Disparando a atualizacao do feed...'
    gh workflow run $FeedWorkflow --repo $Repo
    if ($LASTEXITCODE -ne 0) {
        Write-Err2 'Nao foi possivel disparar o workflow.'
    }
    else {
        Write-Ok 'Execucao solicitada. Aguardando o GitHub registrar...'
        Start-Sleep -Seconds 12

        $runId = $null
        for ($i = 0; $i -lt 10; $i++) {
            $previousEap = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            try {
                $runsJson = gh run list --workflow $FeedWorkflow --repo $Repo --limit 1 --json databaseId,status 2>$null
                if ($LASTEXITCODE -eq 0 -and $runsJson) {
                    $runs = @($runsJson | ConvertFrom-Json)
                    if ($runs.Count -gt 0) { $runId = $runs[0].databaseId }
                }
            }
            catch { }
            finally { $ErrorActionPreference = $previousEap }
            if ($runId) { break }
            Start-Sleep -Seconds 6
        }

        if ($runId) {
            Write-Info "Acompanhando a execucao $runId (pode levar alguns minutos)..."
            gh run watch $runId --repo $Repo --exit-status
            if ($LASTEXITCODE -eq 0) {
                Write-Ok 'Feed atualizado com sucesso.'
            }
            else {
                Write-Warn2 'A execucao terminou com erro. Detalhes:'
                $previousEap = $ErrorActionPreference
                $ErrorActionPreference = 'Continue'
                try { gh run view $runId --repo $Repo --log-failed 2>$null | Select-Object -Last 25 }
                catch { Write-Info 'Log indisponivel; veja pela aba Actions.' }
                finally { $ErrorActionPreference = $previousEap }
                Write-Info 'O feed anterior permanece publicado; nada foi perdido.'
            }
        }
        else {
            Write-Warn2 'Execucao nao localizada. Acompanhe pela aba Actions do repositorio.'
        }
    }
}

# ──────────────── ETAPA 7 — Conferir o site publicado ───────────────

Write-Step 7 'Conferir o site publicado'

Write-Info 'Aguardando a publicacao propagar...'
Start-Sleep -Seconds 30

function Test-PublishedFeed {
    param([string]$BaseUrl, [string]$Label)

    $url = "$BaseUrl$FeedPath" + '?v=' + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    for ($attempt = 1; $attempt -le 6; $attempt++) {
        try {
            $feed = Invoke-RestMethod -Method Get -TimeoutSec 25 -Uri $url
            $newsCount = 0
            foreach ($topic in $feed.topics) { $newsCount += @($topic.items).Count }

            Write-Ok "$Label respondeu."
            Write-Info "  Atualizado em: $($feed.updatedAt)"
            Write-Info "  Temas: $(@($feed.topics).Count) | Novidades: $newsCount"
            if ($feed.instagram.permalink) {
                Write-Ok "  Instagram: post mais recente publicado."
                Write-Info "  $($feed.instagram.permalink)"
            }
            else {
                Write-Warn2 '  Instagram: sem post capturado ainda (o link do perfil funciona).'
                Write-Info '  Configure o token na Etapa 3 para captura garantida.'
            }
            return $true
        }
        catch {
            Start-Sleep -Seconds 20
        }
    }
    Write-Warn2 "$Label ainda nao respondeu com o feed."
    return $false
}

$primaryOk = Test-PublishedFeed -BaseUrl $SiteUrl -Label 'Site principal (Cloudflare)'
Test-PublishedFeed -BaseUrl $MirrorUrl -Label 'Espelho (Vercel)' | Out-Null

# ──────────────────────────── Encerramento ──────────────────────────

Write-Host ''
Write-Host ('=' * 62) -ForegroundColor DarkCyan
Write-Host '  CONCLUIDO' -ForegroundColor Green
Write-Host ('=' * 62) -ForegroundColor DarkCyan
Write-Host ''
Write-Info 'A partir de agora o feed se atualiza sozinho, todos os dias,'
Write-Info 'as 06h e 10h (horario de Recife). Nada mais precisa ser feito.'
Write-Host ''
Write-Info 'Para conferir no app:'
Write-Host "    $SiteUrl/portal-familia" -ForegroundColor White
Write-Host "    $SiteUrl/portal-familia/novidades" -ForegroundColor White
Write-Host ''

if ($primaryOk) {
    if (Confirm-Action -Question 'Abrir o portal das familias no navegador?') {
        Start-Process "$SiteUrl/portal-familia/novidades"
    }
}
