# NeuroPed Railway — verificar status do deploy
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$TOKEN     = $env:RAILWAY_TOKEN
if (-not $TOKEN) {
    Write-Host "Defina RAILWAY_TOKEN no ambiente antes de executar este script." -ForegroundColor Red
    exit 1
}
$API       = "https://backboard.railway.app/graphql/v2"
$FOLDER    = Split-Path -Parent $MyInvocation.MyCommand.Path
$LOG       = "$FOLDER\railway_status_log.txt"
$BODY_FILE = "$env:TEMP\railway_body.json"

$serviceId = "9724306d-35ba-4364-b520-83b3f84bcf82"
$envId     = "0e82b70b-9668-4395-9e36-3487fda39fa0"

"=== Status Check $(Get-Date) ===" | Out-File $LOG -Encoding UTF8

function gql($bodyJson) {
    [System.IO.File]::WriteAllText($BODY_FILE, $bodyJson, [System.Text.Encoding]::UTF8)
    $resp = curl.exe -s -X POST $API `
        -H "Authorization: Bearer $TOKEN" `
        -H "Content-Type: application/json" `
        -H "User-Agent: NeuroPed/1.0" `
        --data-binary "@$BODY_FILE"
    "RESP: $resp" | Out-File $LOG -Append -Encoding UTF8
    try { return $resp | ConvertFrom-Json } catch { return $null }
}

Write-Host "Verificando deployments..." -ForegroundColor Cyan
$deps = gql "{`"query`":`"query{deployments(input:{serviceId:\`"$serviceId\`" environmentId:\`"$envId\`"}){edges{node{id status createdAt staticUrl meta{commitMessage branch}}}}}`"}"
"deployments: $($deps | ConvertTo-Json -Depth 10)" | Out-File $LOG -Append -Encoding UTF8

$latest = $deps.data.deployments.edges[0].node
$status  = $latest.status
$branch  = $latest.meta.branch
$commit  = $latest.meta.commitMessage
$url     = $latest.staticUrl

Write-Host ""
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host " STATUS DO DEPLOY:" -ForegroundColor Cyan
Write-Host " Status : $status"
Write-Host " Branch : $branch"
Write-Host " Commit : $commit"
Write-Host " URL    : $url"
Write-Host " API    : https://neuroped-api-production.up.railway.app"
Write-Host "=============================================" -ForegroundColor Yellow

if ($status -eq "SUCCESS") {
    Write-Host " DEPLOY BEM-SUCEDIDO!" -ForegroundColor Green
} elseif ($status -eq "FAILED") {
    Write-Host " DEPLOY FALHOU - veja logs no painel Railway" -ForegroundColor Red
    # buscar logs do deploy
    $depId = $latest.id
    Write-Host " DeployID: $depId" -ForegroundColor Red
} else {
    Write-Host " Ainda em andamento: $status" -ForegroundColor Yellow
}

Read-Host "Enter para fechar"
