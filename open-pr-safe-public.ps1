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

$Branch = "feature/safe-public-layer-v1"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  NeuroPed - Safe Public Layer v1 - Abrir PR" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

Write-Host ""
Write-Host "==> Verificando estado do repositorio..." -ForegroundColor Cyan
& git fetch origin 2>&1 | Out-Null
$current = (& git branch --show-current).Trim()
Write-Host "    Branch atual: $current" -ForegroundColor Gray

# Garantir que estamos partindo da main atualizada
Write-Host ""
Write-Host "==> Indo para main atualizada..." -ForegroundColor Cyan
& git checkout main 2>&1
& git pull origin main --rebase 2>&1 | Out-Null

# Criar/checkout da feature branch
Write-Host ""
Write-Host "==> Criando/atualizando branch $Branch..." -ForegroundColor Cyan
& git branch -D $Branch 2>$null  # remove se existe local
& git checkout -b $Branch 2>&1

# Aplicar mudancas que ja estao no working tree
Write-Host ""
Write-Host "==> Adicionando arquivos..." -ForegroundColor Cyan
& git add -A 2>&1

$status = & git status --porcelain
if (-not $status) {
    Write-Host "    Nada novo (working tree pode estar identico a main)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==> Criando commit..." -ForegroundColor Cyan
& git commit -m "Safe Public Layer v1 - vitrine educativa, restricao do nucleo clinico" -m "
- Cria curadoria-conteudo-publico.json (politica publico/restrito)
- Cria MIGRATION_BACKEND.md (plano de migracao com custos e riscos)
- Cria PUBLIC_SAFETY_REVIEW.md (checklist de aprovacao publica)
- Atualiza manifest.json: remove atalho 'Prontuario Clinico'; adiciona Biblioteca Educativa
- Patcha bundle (pacientes-D5Tbomu5.js): remove 'CPF como login e senha'; rotula como 'Identificador legado'
- Documenta tarefas que requerem source code (route guards, sidebar publica, splitting do portal)
- NAO faz force push, NAO altera estetica global, NAO apaga modulos
" 2>&1

if ($LASTEXITCODE -ne 0 -and -not $status) {
    Write-Host "    Commit pulado (sem alteracoes)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==> Push do branch para o GitHub (sem force)..." -ForegroundColor Cyan
& git push -u origin $Branch 2>&1 | ForEach-Object {
    if ($_ -match "fatal|error") { Write-Host "    $_" -ForegroundColor Red }
    else { Write-Host "    $_" -ForegroundColor DarkGray }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "    [ERRO] Push falhou. Saindo." -ForegroundColor Red
    Read-Host "Pressione Enter para fechar"
    exit 1
}

Write-Host ""
Write-Host "==> Abrindo PR via gh CLI..." -ForegroundColor Cyan

$prBody = @"
## Safe Public Layer v1

Reorganiza o NeuroPed EDJ em duas camadas: vitrine pública educativa segura + núcleo clínico preservado mas restringido da exposição pública.

### O que entra neste PR

- Cria **`curadoria-conteudo-publico.json`** — política formal do que é público e do que é restrito.
- Cria **`MIGRATION_BACKEND.md`** — plano técnico de migração (Supabase/Cloudflare/AWS São Paulo), custos estimados, marcos prioritários (patients, scale_results, portal_documents, audit_logs, consents) e requisitos não-funcionais para uso clínico real.
- Cria **`PUBLIC_SAFETY_REVIEW.md`** — checklist de 10 perguntas de revisão tripla (jurídica/LGPD, médica, reputacional/autoral) aplicada por módulo.
- Atualiza **`manifest.json`** — remove atalho ``Prontuário Clínico``, mantém apenas atalhos seguros (CAA Premium, Diário Educativo, Filtro Orientativo, Biblioteca Educativa).
- Patcha o **bundle de pacientes** (``pacientes-D5Tbomu5.js``) — substitui literais de texto problemáticos:
  - ""🔑 O CPF é usado como login e senha"" → "Identificador legado do paciente. Portal documental restrito até autenticação segura."
  - ""CPF da criança (login no Portal)"" → "Identificador (CPF) — opcional (legado)".
- Atualiza CHANGELOG e documentação com pendências.

### Restrições inegociáveis cumpridas

- Não há force push.
- Não reescreve o app.
- Não altera identidade visual global.
- Não substitui o bundle principal inteiro.
- Não remove módulos úteis.
- Não cria diagnóstico automático.

### O que **não** entra (requer source code; documentado como pendência)

A maior parte do prompt v1.0 exige modificação de código React (Layout/sidebar, route guards, conteúdo das páginas, splitting do Portal Família). O repositório contém apenas o bundle compilado pelo Perplexity Computer. Estas tarefas ficam documentadas para iteração futura quando o source equivalente for recuperado:

- [ ] Função utilitária ``isSensitiveRoute()`` e tela de guard
- [ ] Esconder itens sensíveis da sidebar pública (Pacientes, Prontuário, Prescrição, Calculadora de Dose, Farmacologia, Laudos, Portal documental, Agenda, Lembretes clínicos)
- [ ] Splitting do Portal Família em camadas (público educativo / restrito documental)
- [ ] Modificar saída do Filtro de Escalas para tom orientativo (eliminar termos diagnósticos)
- [ ] Modificar Testes Lúdicos para linguagem observacional (eliminar conclusão diagnóstica/CID)
- [ ] Adicionar avisos discretos em todas as páginas públicas
- [ ] Restringir bundles de Calculadora de Dose e Farmacologia da navegação pública
- [ ] Remover PIN gate global (atualmente ``Mw`` com PIN ""vasco1108"" no bundle)

### QA aplicado

- ``grep`` por frases proibidas no diretório: zero ocorrências (exceto ``PUBLIC_SAFETY_REVIEW.md`` que cita como exemplos negativos — comportamento esperado).
- Manifest validado.
- ``index.html`` íntegro (sem alterações de estética).

### Critérios para merge

Aprovar **manualmente** após:

1. Validação de que o app continua abrindo na home.
2. CAA Premium continua acessível e funcional.
3. Biblioteca Educativa, Filtro de Escalas e Diário continuam abrindo.
4. Manifest aceita instalação.
5. Nenhuma rota pública expõe diagnóstico, dose, prescrição, prontuário ou laudo.

Não fazer merge automático.
"@

$prTitle = "Safe Public Layer v1 - abrir vitrine educativa e restringir nucleo clinico"

$prFile = "$env:TEMP\pr-body-$(Get-Random).md"
$prBody | Set-Content -Path $prFile -Encoding UTF8

& gh pr create --title $prTitle --body-file $prFile --base main --head $Branch 2>&1

Remove-Item $prFile -Force -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "  [OK] PR aberto com sucesso!" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Repo: https://github.com/jadsonfraga/neuroped" -ForegroundColor White
    Write-Host "  Branch: $Branch" -ForegroundColor White
    Write-Host "  PRs: https://github.com/jadsonfraga/neuroped/pulls" -ForegroundColor White
    Write-Host ""
    Write-Host "  Abra o PR no navegador para revisar antes de mesclar." -ForegroundColor Cyan
    Write-Host ""
    Start-Process "https://github.com/jadsonfraga/neuroped/pulls"
} else {
    Write-Host ""
    Write-Host "    [!] gh CLI falhou. PR nao foi aberto automaticamente." -ForegroundColor Yellow
    Write-Host "    Branch foi enviado. Abra manualmente em:" -ForegroundColor Yellow
    Write-Host "    https://github.com/jadsonfraga/neuroped/pull/new/$Branch" -ForegroundColor White
    Start-Process "https://github.com/jadsonfraga/neuroped/pull/new/$Branch"
}

Write-Host ""
Read-Host "Pressione Enter para fechar"
