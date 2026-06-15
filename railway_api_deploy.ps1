# NeuroPed - Railway GraphQL API Deploy
# Requires secrets in environment variables. Never hardcode tokens or app secrets here.

$TOKEN = $env:RAILWAY_TOKEN
if (-not $TOKEN) {
    Write-Host "ERRO: defina RAILWAY_TOKEN no ambiente antes de executar este script."
    exit 1
}

$API = "https://backboard.railway.app/graphql/v2"
$LOGFILE = "$PSScriptRoot\railway_api_log.txt"

"" | Out-File $LOGFILE
"=============================================" | Out-File $LOGFILE -Append
"NeuroPed Railway API Deploy - $(Get-Date)" | Out-File $LOGFILE -Append
"=============================================" | Out-File $LOGFILE -Append

function Invoke-Railway($query, $variables = @{}) {
    $body = @{ query = $query; variables = $variables } | ConvertTo-Json -Depth 10
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
        "Content-Type"  = "application/json"
    }
    try {
        return Invoke-RestMethod -Uri $API -Method POST -Headers $headers -Body $body -ErrorAction Stop
    } catch {
        "ERRO API: $_" | Out-File $LOGFILE -Append
        return $null
    }
}

$vars = @{
    NODE_ENV                = "production"
    PORT                    = "3000"
    NEUROPED_MASTER_KEY     = $env:NEUROPED_MASTER_KEY
    NEUROPED_JWT_SECRET     = $env:NEUROPED_JWT_SECRET
    ADMIN_EMAIL             = $env:ADMIN_EMAIL
    ADMIN_NAME              = $env:ADMIN_NAME
    ADMIN_INITIAL_PASSWORD  = $env:ADMIN_INITIAL_PASSWORD
    CORS_ORIGINS            = $env:CORS_ORIGINS
}

foreach ($required in @("NEUROPED_MASTER_KEY", "NEUROPED_JWT_SECRET", "ADMIN_EMAIL", "ADMIN_NAME", "ADMIN_INITIAL_PASSWORD", "CORS_ORIGINS")) {
    if (-not $vars[$required]) {
        Write-Host "ERRO: variavel $required ausente no ambiente. Configure no provedor de segredos."
        exit 1
    }
}

Write-Host "[1/6] Verificando token Railway..."
"=== STEP 1: Auth ===" | Out-File $LOGFILE -Append
$me = Invoke-Railway "query { me { id name email teams { edges { node { id name } } } } }"
if (-not $me -or -not $me.data.me) {
    "ERRO: Token invalido ou sem acesso." | Out-File $LOGFILE -Append
    Write-Host "ERRO: Token invalido."
    exit 1
}

$teamId = $me.data.me.teams.edges[0].node.id
Write-Host "Auth OK."

Write-Host "[2/6] Criando projeto neuroped-backend..."
$createProject = Invoke-Railway @"
mutation {
  projectCreate(input: {
    name: "neuroped-backend"
    teamId: "$teamId"
  }) {
    id
    name
  }
}
"@

if (-not $createProject -or -not $createProject.data.projectCreate) {
    $projects = Invoke-Railway "query { projects(teamId: `"$teamId`") { edges { node { id name } } } }"
    $projectId = ($projects.data.projects.edges | Where-Object { $_.node.name -eq "neuroped-backend" } | Select-Object -First 1).node.id
} else {
    $projectId = $createProject.data.projectCreate.id
}
Write-Host "Project ID: $projectId"

Write-Host "[3/6] Obtendo environment..."
$envQuery = Invoke-Railway @"
query {
  project(id: "$projectId") {
    environments {
      edges {
        node {
          id
          name
        }
      }
    }
  }
}
"@
$envId = $envQuery.data.project.environments.edges[0].node.id

Write-Host "[4/6] Conectando repositorio GitHub jadsonfraga/neuroped..."
$createService = Invoke-Railway @"
mutation {
  serviceCreate(input: {
    projectId: "$projectId"
    name: "neuroped-api"
    source: {
      repo: "jadsonfraga/neuroped"
      branch: "main"
    }
  }) {
    id
    name
  }
}
"@
$serviceId = $createService.data.serviceCreate.id

Write-Host "[5/6] Configurando variaveis de ambiente..."
foreach ($key in $vars.Keys) {
    $val = $vars[$key]
    Invoke-Railway @"
mutation {
  variableUpsert(input: {
    projectId: "$projectId"
    environmentId: "$envId"
    serviceId: "$serviceId"
    name: "$key"
    value: "$val"
  })
}
"@ | Out-Null
    "VAR $key: OK" | Out-File $LOGFILE -Append
}

Write-Host "[6/6] Iniciando deploy..."
$deploy = Invoke-Railway @"
mutation {
  serviceInstanceDeploy(
    serviceId: "$serviceId"
    environmentId: "$envId"
  )
}
"@
($deploy | ConvertTo-Json -Depth 5) | Out-File $LOGFILE -Append

"CONCLUIDO: $(Get-Date)" | Out-File $LOGFILE -Append
Write-Host "Deploy iniciado. Log salvo em: $LOGFILE"
