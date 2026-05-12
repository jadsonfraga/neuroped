# NeuroPed — Railway GraphQL API Deploy
# Token: f8f412d3-f3b6-4ea8-b6f3-21bfdb262d3b

$TOKEN = "f8f412d3-f3b6-4ea8-b6f3-21bfdb262d3b"
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
        $resp = Invoke-RestMethod -Uri $API -Method POST -Headers $headers -Body $body -ErrorAction Stop
        return $resp
    } catch {
        "ERRO API: $_" | Out-File $LOGFILE -Append
        return $null
    }
}

# STEP 1: Verificar autenticacao
Write-Host "[1/6] Verificando token Railway..."
"=== STEP 1: Auth ===" | Out-File $LOGFILE -Append
$me = Invoke-Railway "query { me { id name email teams { edges { node { id name } } } } }"
if (-not $me -or -not $me.data.me) {
    "ERRO: Token invalido ou sem acesso." | Out-File $LOGFILE -Append
    Write-Host "ERRO: Token invalido!"
    exit 1
}
$userId = $me.data.me.id
$userName = $me.data.me.name
$teamId = $me.data.me.teams.edges[0].node.id
"Auth OK: $userName (id=$userId)" | Out-File $LOGFILE -Append
"Team ID: $teamId" | Out-File $LOGFILE -Append
Write-Host "Auth OK: $userName | Team: $teamId"

# STEP 2: Criar projeto
Write-Host "[2/6] Criando projeto neuroped-backend..."
"=== STEP 2: Create Project ===" | Out-File $LOGFILE -Append
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
    "AVISO: Nao foi possivel criar projeto (pode ja existir)" | Out-File $LOGFILE -Append

    # Tentar buscar projeto existente
    $projects = Invoke-Railway "query { projects(teamId: `"$teamId`") { edges { node { id name } } } }"
    ($projects | ConvertTo-Json -Depth 10) | Out-File $LOGFILE -Append
    $projectId = ($projects.data.projects.edges | Where-Object { $_.node.name -eq "neuroped-backend" } | Select-Object -First 1).node.id
} else {
    $projectId = $createProject.data.projectCreate.id
    "Projeto criado: ID=$projectId" | Out-File $LOGFILE -Append
}
Write-Host "Project ID: $projectId"

# STEP 3: Obter environment ID (production)
Write-Host "[3/6] Obtendo environment..."
"=== STEP 3: Environment ===" | Out-File $LOGFILE -Append
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
($envQuery | ConvertTo-Json -Depth 10) | Out-File $LOGFILE -Append
$envId = $envQuery.data.project.environments.edges[0].node.id
"Environment ID: $envId" | Out-File $LOGFILE -Append
Write-Host "Environment ID: $envId"

# STEP 4: Criar servico GitHub
Write-Host "[4/6] Conectando repositorio GitHub jadsonfraga/neuroped..."
"=== STEP 4: GitHub Service ===" | Out-File $LOGFILE -Append
$createService = Invoke-Railway @"
mutation {
  serviceCreate(input: {
    projectId: "$projectId"
    name: "neuroped-api"
    source: {
      repo: "jadsonfraga/neuroped"
      branch: "feat/auditoria-total-ui-backend-memoria"
    }
  }) {
    id
    name
  }
}
"@
($createService | ConvertTo-Json -Depth 10) | Out-File $LOGFILE -Append
$serviceId = $createService.data.serviceCreate.id
"Service ID: $serviceId" | Out-File $LOGFILE -Append
Write-Host "Service ID: $serviceId"

# STEP 5: Configurar variaveis de ambiente
Write-Host "[5/6] Configurando variaveis de ambiente..."
"=== STEP 5: Variables ===" | Out-File $LOGFILE -Append

$vars = @{
    NODE_ENV                = "production"
    PORT                    = "3000"
    NEUROPED_MASTER_KEY     = "x1r9xGA2nUwzUF38XTm5M1KT3ngEHDfrmKNSUE/EHub7ftuz0tRUXhl8WYjA6huc"
    NEUROPED_JWT_SECRET     = "X2XRUzedCvNtT0AcmWF9OPLRXFYDAnRXmsdKXt3DtySWVmgzn3pPxB0XURoJ9XNgc/+4WKRdg9v35hqS0B70EA=="
    ADMIN_EMAIL             = "jadsonfraga@hotmail.com"
    ADMIN_NAME              = "Dr. Jadson Fraga"
    ADMIN_INITIAL_PASSWORD  = "LNXJYNN2UdZhPHsmBWfR5RlS"
    CORS_ORIGINS            = "https://neuroped.pages.dev,https://feat-auditoria-total-ui-back.neuroped.pages.dev"
}

foreach ($key in $vars.Keys) {
    $val = $vars[$key]
    $upsertVar = Invoke-Railway @"
mutation {
  variableUpsert(input: {
    projectId: "$projectId"
    environmentId: "$envId"
    serviceId: "$serviceId"
    name: "$key"
    value: "$val"
  })
}
"@
    "VAR $key: OK" | Out-File $LOGFILE -Append
}
Write-Host "Variaveis configuradas."

# STEP 6: Adicionar PostgreSQL e deployar
Write-Host "[6/6] Adicionando Postgres e iniciando deploy..."
"=== STEP 6: Postgres + Deploy ===" | Out-File $LOGFILE -Append

$addPostgres = Invoke-Railway @"
mutation {
  serviceCreate(input: {
    projectId: "$projectId"
    name: "neuroped-postgres"
    source: {
      image: "ghcr.io/railwayapp-templates/postgres-ssl:edge"
    }
  }) {
    id
    name
  }
}
"@
($addPostgres | ConvertTo-Json -Depth 5) | Out-File $LOGFILE -Append
Write-Host "Postgres adicionado."

# Trigger deploy do servico principal
$deploy = Invoke-Railway @"
mutation {
  serviceInstanceDeploy(
    serviceId: "$serviceId"
    environmentId: "$envId"
  )
}
"@
($deploy | ConvertTo-Json -Depth 5) | Out-File $LOGFILE -Append

# Gerar dominio publico
$domain = Invoke-Railway @"
mutation {
  serviceInstanceSetDomain(
    environmentId: "$envId"
    serviceId: "$serviceId"
  ) {
    domain
  }
}
"@
($domain | ConvertTo-Json -Depth 5) | Out-File $LOGFILE -Append

"=============================================" | Out-File $LOGFILE -Append
"CONCLUIDO: $(Get-Date)" | Out-File $LOGFILE -Append
"=============================================" | Out-File $LOGFILE -Append

Write-Host ""
Write-Host "============================================="
Write-Host "DEPLOY INICIADO!"
Write-Host "Projeto ID : $projectId"
Write-Host "Service ID : $serviceId"
Write-Host "Acesse: https://railway.app/project/$projectId"
Write-Host "============================================="
Write-Host ""
Write-Host "Log salvo em: $LOGFILE"
Read-Host "Pressione Enter para fechar"
