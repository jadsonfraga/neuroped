# =====================================================================
# NeuroPed EDJ - Setup fullstack autonomo
# Faz: git checkout, geracao de segredos, .env, npm install, dev server.
# =====================================================================

$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false

# Refresh PATH (Git, Node, npm)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$extraPaths = @(
    "C:\Program Files\Git\bin",
    "C:\Program Files\Git\cmd",
    "C:\Program Files\nodejs",
    "$env:APPDATA\npm",
    "$env:LOCALAPPDATA\Programs\nodejs"
)
foreach ($p in $extraPaths) {
    if ((Test-Path $p) -and ($env:Path -notlike "*$p*")) { $env:Path = "$p;$env:Path" }
}

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

function Step { param($m) Write-Host ""; Write-Host "==> $m" -ForegroundColor Cyan }
function Ok { param($m) Write-Host "    [OK] $m" -ForegroundColor Green }
function Warn { param($m) Write-Host "    [!] $m" -ForegroundColor Yellow }
function Err { param($m) Write-Host "    [ERRO] $m" -ForegroundColor Red }

function GenerateBase64Bytes {
    param([int]$Bytes)
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $buf = New-Object byte[] $Bytes
    $rng.GetBytes($buf)
    [Convert]::ToBase64String($buf)
}

function Test-Command {
    param($cmd)
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  NeuroPed EDJ - Setup fullstack autonomo" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

# -------------------------------------------------------------
# Etapa 1: Verificar Node.js
# -------------------------------------------------------------
Step "Etapa 1/8 - Verificando Node.js"
if (-not (Test-Command "node")) {
    Err "Node.js nao encontrado. Instalando via winget..."
    try {
        winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-source-agreements --accept-package-agreements
        # Refresh PATH apos instalacao
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        if (Test-Path "C:\Program Files\nodejs") { $env:Path = "C:\Program Files\nodejs;$env:Path" }
    } catch {
        Err "Instale Node.js 20+ manualmente em https://nodejs.org/ e rode novamente."
        Start-Process "https://nodejs.org/"
        Read-Host "Pressione Enter para fechar"
        exit 1
    }
}
$nodeVer = & node --version 2>&1
$npmVer = & npm --version 2>&1
Ok "Node: $nodeVer / npm: $npmVer"

# -------------------------------------------------------------
# Etapa 2: Verificar Git
# -------------------------------------------------------------
Step "Etapa 2/8 - Verificando Git"
if (-not (Test-Command "git")) {
    Err "Git nao encontrado. Instale em https://git-scm.com/download/win"
    Read-Host "Pressione Enter para fechar"
    exit 1
}
Ok "Git: $(git --version)"

# -------------------------------------------------------------
# Etapa 3: Inicializar git e criar branch
# -------------------------------------------------------------
Step "Etapa 3/8 - Configurando Git e branch feat/fullstack-lgpd-backend"

if (-not (Test-Path ".git")) {
    & git init 2>&1 | Out-Null
    & git checkout -b main 2>&1 | Out-Null
    Ok "Repositorio Git inicializado"
} else {
    Ok "Repositorio Git ja existe"
}

# Cria/troca para a branch feat
$branchExists = & git rev-parse --verify "feat/fullstack-lgpd-backend" 2>$null
if ($LASTEXITCODE -eq 0) {
    & git checkout "feat/fullstack-lgpd-backend" 2>&1 | Out-Null
    Ok "Trocado para branch feat/fullstack-lgpd-backend"
} else {
    & git checkout -b "feat/fullstack-lgpd-backend" 2>&1 | Out-Null
    Ok "Branch feat/fullstack-lgpd-backend criada"
}

# -------------------------------------------------------------
# Etapa 4: Gerar segredos e criar .env
# -------------------------------------------------------------
Step "Etapa 4/8 - Gerando segredos e criando .env"

$envFile = Join-Path $ProjectRoot ".env"
if (Test-Path $envFile) {
    Warn ".env ja existe. Mantendo arquivo atual (nao sobrescreve)."
    $masterKey = ""
    $jwtSecret = ""
    $adminPassword = ""
} else {
    $masterKey = GenerateBase64Bytes 48
    $jwtSecret = GenerateBase64Bytes 64
    # Senha admin: 24 bytes em base64 (~32 chars)
    $adminPassword = GenerateBase64Bytes 18

    $envContent = @"
# Gerado automaticamente em $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# NUNCA commite este arquivo no git.

NODE_ENV=development
PORT=5000
HOST=0.0.0.0

DATABASE_PATH=./neuroped.db

NEUROPED_MASTER_KEY=$masterKey
NEUROPED_JWT_SECRET=$jwtSecret

ADMIN_EMAIL=jadsonfraga@hotmail.com
ADMIN_NAME=Dr. Jadson Fraga
ADMIN_INITIAL_PASSWORD=$adminPassword

CORS_ORIGINS=http://localhost:5000,http://localhost:5173

# SMTP - configure quando contratar provedor (Brevo recomendado)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=NeuroPed EDJ <noreply@drjadsonfraga.com.br>
"@

    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
    Ok "Arquivo .env criado com segredos aleatorios"
}

# -------------------------------------------------------------
# Etapa 5: npm install
# -------------------------------------------------------------
Step "Etapa 5/8 - Instalando dependencias (npm install)"
Write-Host "    Isso pode levar 2-4 minutos. Aguarde..." -ForegroundColor Gray

& npm install --no-audit --no-fund 2>&1 | ForEach-Object {
    if ($_ -match "ERR!|error") {
        Write-Host "    $_" -ForegroundColor Red
    } elseif ($_ -match "warn|deprecated") {
        # silencia warnings comuns
    } else {
        Write-Host "    $_" -ForegroundColor DarkGray
    }
}

if ($LASTEXITCODE -ne 0) {
    Err "npm install falhou. Verifique sua conexao e tente novamente."
    Read-Host "Pressione Enter para fechar"
    exit 1
}
Ok "Dependencias instaladas"

# -------------------------------------------------------------
# Etapa 6: Salvar credenciais em arquivo seguro
# -------------------------------------------------------------
Step "Etapa 6/8 - Salvando credenciais em arquivo seguro"

if ($adminPassword) {
    $credFile = Join-Path $ProjectRoot "CREDENCIAIS-LOCAIS.txt"
    $credContent = @"
================================================================
NeuroPed EDJ - Credenciais geradas em $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
================================================================

LEIA E GUARDE EM LOCAL SEGURO. APAGUE ESTE ARQUIVO APOS LER.

URL do app local:  http://localhost:5000
URL de login:      http://localhost:5000/#/login

Email do admin:    jadsonfraga@hotmail.com
Senha temporaria:  $adminPassword

ACAO OBRIGATORIA APOS PRIMEIRO LOGIN:
  1. Trocar a senha em /configuracoes
  2. Apagar este arquivo
  3. Editar .env e remover ADMIN_INITIAL_PASSWORD para nao recriar admin

NEUROPED_MASTER_KEY (cripto AES, criptografa CPF/nome/notas):
  $masterKey

NEUROPED_JWT_SECRET (assina tokens de autenticacao):
  $jwtSecret

GUARDE essas duas chaves em gerenciador de senhas (1Password,
Bitwarden, KeePass). Sem elas voce NAO consegue ler dados
criptografados nem validar tokens.

NUNCA TROQUE NEUROPED_MASTER_KEY apos comecar a usar com dados reais
(invalida tudo que esta criptografado).

================================================================
"@
    Set-Content -Path $credFile -Value $credContent -Encoding UTF8
    Ok "Credenciais salvas em CREDENCIAIS-LOCAIS.txt"
    Warn "GUARDE essas credenciais em gerenciador de senhas e APAGUE o arquivo"
}

# -------------------------------------------------------------
# Etapa 7: Iniciar dev server em janela separada
# -------------------------------------------------------------
Step "Etapa 7/8 - Iniciando servidor de desenvolvimento"
Write-Host "    Janela do servidor abrira separadamente." -ForegroundColor Gray
Write-Host "    Para parar o servidor, feche aquela janela ou Ctrl+C nela." -ForegroundColor Gray

$devCmd = "Set-Location '$ProjectRoot'; `$env:NODE_ENV='development'; npm run dev"
Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", $devCmd

# Aguardar servidor subir
Write-Host "    Aguardando servidor responder..." -ForegroundColor Gray
$serverUp = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $serverUp = $true
            break
        }
    } catch { }
}

if ($serverUp) {
    Ok "Servidor respondendo em http://localhost:5000"
} else {
    Warn "Servidor pode estar subindo ainda. Verifique a janela do dev server."
}

# -------------------------------------------------------------
# Etapa 8: Abrir navegador na pagina de login
# -------------------------------------------------------------
Step "Etapa 8/8 - Abrindo navegador"
Start-Process "http://localhost:5000/#/login"

# -------------------------------------------------------------
# Final
# -------------------------------------------------------------
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  SETUP CONCLUIDO!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  App em:        http://localhost:5000" -ForegroundColor White
Write-Host "  Login em:      http://localhost:5000/#/login" -ForegroundColor White
Write-Host "  Credenciais:   $ProjectRoot\CREDENCIAIS-LOCAIS.txt" -ForegroundColor White
Write-Host ""

if ($adminPassword) {
    Write-Host "  Email admin:   jadsonfraga@hotmail.com" -ForegroundColor Yellow
    Write-Host "  Senha temp.:   $adminPassword" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  TROQUE A SENHA APOS PRIMEIRO LOGIN E APAGUE CREDENCIAIS-LOCAIS.txt" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Servidor de dev rodando em janela separada." -ForegroundColor Cyan
Write-Host "  Esta janela pode ser fechada. O servidor continua rodando." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Para parar o servidor:" -ForegroundColor Gray
Write-Host "    Va na janela do servidor e pressione Ctrl+C" -ForegroundColor Gray
Write-Host ""

Read-Host "Pressione Enter para fechar esta janela (servidor continua rodando)"
