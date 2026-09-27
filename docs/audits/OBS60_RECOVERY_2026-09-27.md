# OBS-60 — retomada durável e critérios de entrega

Data: 27 de setembro de 2026.
Repositório canônico: `jadsonfraga/neuroped`.
PR canônica: **#1023**, vinculada à issue #1022.
Head da PR: `feat/obs60-video-evidence-20260927`.
Branch adicional preservada: `claude/obs-60-neuroped-module-28nyqy`,
verificada em `4a47f451ae8c32af73ec58c26351636796cd1eac`.

## Recuperação da branch original

As duas branches existem e divergiram de
`d0456157cd02724955ff624f95267e7eb2847958`. Não confundir o head da PR com a
branch mencionada pela sessão Claude. A branch adicional contém auditoria
de falha do provedor e testes integrados que ainda não estavam no head da PR.
Foram recuperados os blobs exatos desses arquivos, sem reescrever os testes:

- `functions/api/integrations/obs60/index.ts`:
  `32b741b5139e31337cb09e5f50b8dc6c70e8be08`.
- `tests/unit/obs60-tenant-gate.test.ts`:
  `b6f8b632eadfd077c0afbe982bb36e9511e6acde`.

O workflow combina esses testes com as novas provas de navegador,
inventário e middleware. Nenhuma branch original foi apagada ou resetada.
O documento `BLOCKED_EXTERNAL_smoke-s13-directory-2026-09-27.md` permanece
preservado na branch original: trata de outro domínio/PR e não foi misturado
à mudança OBS-60. Seu conteúdo não foi perdido nem declarado resolvido.

## Fonte de verdade após reinício de sandbox

Checkout e processos locais são descartáveis. Commits enviados, PR, checks,
logs e artifacts do GitHub Actions são a fonte de retomada. Não presumir
que `/home/claude` ou uma revisão local em background ainda existam.
Verificar o push no GitHub, não apenas no relato da sessão anterior.

Em ambiente de engenharia autenticado, sem perguntar novamente owner/repo:

```sh
gh pr view 1023 --repo jadsonfraga/neuroped \
  --json number,state,isDraft,headRefName,headRefOid,mergeCommit,url
gh api repos/jadsonfraga/neuroped/git/ref/heads/claude/obs-60-neuroped-module-28nyqy
gh repo clone jadsonfraga/neuroped neuroped
cd neuroped
# Somente se a PR ainda estiver aberta:
gh pr checkout 1023
# Se já estiver merged: usar main e conferir mergeCommit retornado acima.
cat AGENTS.md
git status --short
git rev-parse HEAD
gh pr checks 1023 --repo jadsonfraga/neuroped
```

Se houver checkout existente, conferir remote e alterações locais antes de
fetch/checkout; nunca apagar trabalho não enviado ou forçar main.
Consultar head remoto antes de escrever/mesclar. Ausência de Git/CLI no
sandbox não apaga a PR: usar o conector GitHub e CI. Não registrar chaves,
cookies, dados clínicos ou arquivos de pacientes.

## Falha identificada e correção mínima

No head `d0456157cd02724955ff624f95267e7eb2847958`, Verify NeuroPed
(run `36339394219`, job `108676371866`) parou em `audit:inventory`:
`client/src/features/obs60/` foi considerado sem importador.
O launcher estava montado em `FirstTimeGuide`, mas o import relativo entre
features não continha o segmento `features/` reconhecido pelo inventário.

A correção troca exclusivamente o import por
`@/features/obs60/Obs60Launcher`. Guard inalterado e sem nova allowlist.
A regressão usa o próprio predicado do inventário e exige que remover o
import faça a detecção falhar. O conteúdo restante de Orientation foi
preservado, confirmado por compare de commits (uma linha substituída).

## Provas reproduzíveis versionadas

Workflow: `.github/workflows/obs60-proof.yml`, para PR e push em main.

```sh
npm ci
node --experimental-strip-types --test tests/unit/obs60.test.mjs tests/unit/obs60-mount-static.test.mjs
node --import tsx --test tests/unit/obs60-tenant-gate.test.ts tests/unit/obs60-tenant-integration.test.mjs
VITE_OPEN_ACCESS=false npm run build:client
npx playwright install --with-deps chromium
node tests/e2e/obs60-guide.mjs
npm run verify
```

Screenshots, relatório de acessibilidade, gravação sintética e `result.json`
ficam no artifact `obs60-browser-proof` por sete dias. Testes e fixture
permanecem versionados para regenerar evidências. Código de teste escrito
não equivale a execução verde: consultar conclusão, tentativa e SHA no CI.

Escopos distintos:
- Contrato/transporte: provedor simulado; não valida percepção.
- Integração: handlers e SQL reais em SQLite, identidades sintéticas;
  autorização e auditoria sem sessão remota ou instalação Cloudflare.
- Navegador: frontend compilado, MediaRecorder real com câmera sintética,
  MP4 sem pessoa, autenticação/capability simuladas; nenhum envio ao Google.
- Produção: exige deploy canônico e smoke no SHA efetivamente publicado.
- IA clínica: exige os itens de `BLOCKED_EXTERNAL_OBS60_VIDEO_AI.md`.

## Merge, deploy e rollback

Não mesclar com gate obrigatório vermelho, revisão bloqueante ou mudança
não revalidada de head. Usar expected head SHA no merge, sem bypass.
Push em main aciona `Deploy Cloudflare Pages`, que repete a catraca,
publica Functions/frontend e verifica produção. Merge/build isolado não
comprova deploy. Conferir `NeuroPed / Cloudflare production` e o commit de
`deploy-check.json`. Vercel é espelho do mesmo SHA, nunca backend alternativo.

O guia local pode ser publicado com análise automática bloqueada. Não
habilitar `OBS60_VIDEO_AI_ENABLED` nem declarar `OBS60_PRIVACY_APPROVED`
para passar teste. Aprovação institucional, configuração segura e prova
real do provedor são liberação separada.

Rollback operacional: desabilitar `OBS60_VIDEO_AI_ENABLED`.
Rollback de código: reverter somente o merge de #1023 via outra PR,
revalidar e republicar. Não há migrations próprias do OBS-60.
