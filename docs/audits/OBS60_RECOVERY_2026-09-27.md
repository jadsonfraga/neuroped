# OBS-60 — retomada durável e critérios de entrega

Data: 27 de setembro de 2026.
Repositório canônico: `jadsonfraga/neuroped`.
PR canônica: **#1023**, vinculada à issue #1022.
Branch observada na recuperação: `feat/obs60-video-evidence-20260927`.

## Fonte de verdade após reinício de sandbox

O checkout e processos locais são descartáveis. Commits enviados, PR, checks,
logs e artifacts do GitHub Actions são a fonte de retomada. Não presumir que
`/home/claude`, uma branch lembrada da conversa ou um processo de revisão em
background ainda existam. A existência de um push precisa ser verificada no
GitHub, não inferida de texto de uma sessão anterior.

Em um ambiente de engenharia autenticado, sem pedir novamente o owner/repo:

```sh
gh pr view 1023 --repo jadsonfraga/neuroped \
  --json number,state,isDraft,headRefName,headRefOid,mergeCommit,url
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

Se houver checkout existente, conferir o remote e alterações locais antes de
fetch/checkout; nunca apagar trabalho não enviado, resetar ou forçar main.
Consultar o head remoto novamente antes de qualquer escrita ou merge.
Ausência de Git/CLI no sandbox não apaga a PR: usar o conector GitHub e o CI.
Não registrar chaves, cookies, dados clínicos ou arquivos de pacientes.

## Falha identificada e correção mínima

No head `d0456157cd02724955ff624f95267e7eb2847958`, o Verify NeuroPed
(run `36339394219`, job `108676371866`) parou em `audit:inventory`:
`client/src/features/obs60/` foi considerado sem importador.
O launcher estava montado em `FirstTimeGuide`, mas o import relativo entre
features não continha o segmento `features/` reconhecido pelo inventário.

A correção troca exclusivamente o import por
`@/features/obs60/Obs60Launcher`. O guard permanece inalterado, sem nova
allowlist. A regressão executa o próprio predicado do inventário e exige que
remover esse import faça a detecção falhar.

## Provas reproduzíveis versionadas

Workflow: `.github/workflows/obs60-proof.yml`, para PR e push em main.

```sh
npm ci
node --experimental-strip-types --test tests/unit/obs60.test.mjs tests/unit/obs60-mount-static.test.mjs
node --import tsx --test tests/unit/obs60-tenant-integration.test.mjs
VITE_OPEN_ACCESS=false npm run build:client
npx playwright install --with-deps chromium
node tests/e2e/obs60-guide.mjs
npm run verify
```

O workflow conserva screenshots, relatório de acessibilidade, gravação
sintética e `result.json` como artifact `obs60-browser-proof` por sete dias.
Os testes e a fixture permanecem versionados e podem regenerar evidências
após expiração do artifact. Código de teste escrito não equivale a execução
verde: consultar conclusão, tentativa e SHA no GitHub Actions.

Escopos distintos:
- Contrato/transporte: saída e provedor simulados; não valida percepção.
- Integração: handlers e SQL reais em SQLite, identidades sintéticas; não
  comprova sessão remota nem instalação Cloudflare.
- Navegador: frontend compilado, MediaRecorder real com câmera sintética,
  MP4 sem pessoa, autenticação/capability simuladas; não há envio ao Google.
- Produção: requer deploy canônico e smoke no SHA efetivamente publicado.
- IA clínica: exige os itens de `BLOCKED_EXTERNAL_OBS60_VIDEO_AI.md`.

## Merge, deploy e rollback

Não mesclar com gate obrigatório vermelho, revisão bloqueante ou mudança de
head sem revalidação. Usar expected head SHA no merge, sem bypass.
O push em main aciona `Deploy Cloudflare Pages`; esse workflow repete a
catraca de release, publica Functions/frontend e verifica produção. Um merge
ou build verde isolado não comprova deploy. Conferir o status
`NeuroPed / Cloudflare production` e o commit de `deploy-check.json`.
Vercel é somente espelho do mesmo SHA, nunca backend alternativo.

O guia local pode ser publicado mantendo a análise automática bloqueada.
Não habilitar `OBS60_VIDEO_AI_ENABLED` nem declarar
`OBS60_PRIVACY_APPROVED` para fazer um teste passar. Aprovação institucional,
configuração segura e prova real do provedor são uma liberação separada.

Rollback operacional: desabilitar `OBS60_VIDEO_AI_ENABLED`.
Rollback de código: reverter somente o merge de #1023 via outra PR,
revalidar e republicar. Não há migrations próprias do OBS-60.
