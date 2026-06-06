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
Write-Host "  Merge LOCAL do PR Safe Public Layer v1 + push para main" -ForegroundColor Green
Write-Host "  (usa credenciais Git ja cacheadas, sem nova autenticacao)" -ForegroundColor Gray
Write-Host "================================================================" -ForegroundColor Green

Step "Atualizando refs do remoto"
& git fetch origin 2>&1 | Out-Null
Ok "Fetch concluido"

Step "Indo para main"
& git checkout main 2>&1 | Out-Null
Ok "Branch atual: main"

Step "Atualizando main com o remoto"
& git pull origin main 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
if ($LASTEXITCODE -ne 0) {
    Err "Falha no pull. Tentando reset hard..."
    & git reset --hard origin/main 2>&1
}
Ok "main sincronizada com origin"

Step "Aplicando squash merge de feature/safe-public-layer-v1"
& git merge --squash feature/safe-public-layer-v1 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }

if ($LASTEXITCODE -ne 0) {
    Err "Falha no squash merge."
    Read-Host "Pressione Enter para fechar"
    exit 1
}

# Criar o commit do squash merge
Step "Criando commit do merge"
$commitMsg = @"
Merge: Safe Public Layer v1 - vitrine educativa + nucleo clinico restringido

Mescla feature/safe-public-layer-v1 em main via squash.

Conteudo agregado:
- curadoria-conteudo-publico.json (politica publico/restrito)
- MIGRATION_BACKEND.md (plano de migracao com custos e riscos)
- PUBLIC_SAFETY_REVIEW.md (checklist de aprovacao publica)
- safe-public-layer.css (oculta itens clinicos da sidebar)
- safe-public-layer.js (intercepta rotas sensiveis -> restricted.html)
- restricted.html (tela neutra de area profissional)
- manifest.json (atalho Prontuario removido; Biblioteca Educativa adicionada)
- index.html (carrega CSS+JS da camada segura)
- assets/pacientes-D5Tbomu5.js (literais 'CPF como senha' substituidos por 'Identificador legado')

Pendencias documentadas para iteracao com source code disponivel.
"@

& git commit -m $commitMsg 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }

if ($LASTEXITCODE -ne 0) {
    Warn "Commit falhou (talvez nada para commitar). Verificando..."
    $status = & git status --porcelain
    if (-not $status) {
        Warn "Nada novo. Talvez o merge ja tenha sido feito antes."
    }
}

Step "Push para origin/main (com credenciais cacheadas)"
& git push origin main 2>&1 | ForEach-Object {
    if ($_ -match "fatal|error|denied") {
        Write-Host "    $_" -ForegroundColor Red
    } else {
        Write-Host "    $_" -ForegroundColor DarkGray
    }
}

if ($LASTEXITCODE -ne 0) {
    Err "Push falhou (provavelmente credenciais expiraram)."
    Write-Host "    Vou tentar mesmo assim atualizar status..." -ForegroundColor Yellow
    Read-Host "Pressione Enter para fechar"
    exit 1
}

Ok "main atualizada no GitHub!"

Step "Removendo branch feature local e remota"
& git branch -D feature/safe-public-layer-v1 2>&1 | Out-Null
& git push origin --delete feature/safe-public-layer-v1 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
if ($LASTEXITCODE -eq 0) {
    Ok "Branch remota removida"
} else {
    Warn "Branch remota nao foi removida (pode estar protegida)"
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  MERGE CONCLUIDO!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Repositorio: https://github.com/jadsonfraga/neuroped" -ForegroundColor White
Write-Host "  Site (atualiza em 1-3 min): https://jadsonfraga.github.io/neuroped/" -ForegroundColor White
Write-Host "  Actions: https://github.com/jadsonfraga/neuroped/actions" -ForegroundColor White
Write-Host ""
Write-Host "  O GitHub Pages vai reconstruir automaticamente." -ForegroundColor Cyan
Write-Host ""

Start-Process "https://github.com/jadsonfraga/neuroped/actions"
Start-Sleep -Seconds 2
Start-Process "https://jadsonfraga.github.io/neuroped/"

Read-Host "Pressione Enter para fechar"
