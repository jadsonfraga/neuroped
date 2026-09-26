# Criptografia clínica e armazenamento LGPD — bloqueios externos verificados

Verificação em 26/09/2026, sobre a auditoria read-only do PR #964 (run 36210615059) e o health publicado. O código já criptografa corretamente e já tem o adapter R2; o que falta é provisionamento na conta Cloudflare, que nenhuma execução daqui pode criar.

## Bloqueio 1 — keyring clínico (CLINICAL_CRYPTO_NOT_READY)

Sistema: projeto Cloudflare Pages `neuroped`, secrets de produção. Ausentes: `CLINICAL_DATA_KEY`, `CLINICAL_DATA_KEY_ID`, `CLINICAL_INDEX_KEY`.

Permissão exata: token com `Cloudflare Pages: Edit` (o token de deploy já tem) e custódia humana das chaves. Não é gerado em CI de propósito: uma chave que só existe dentro do Pages não tem cópia de guarda, e perdê-la torna irrecuperável todo dado clínico cifrado.

Ação que falta: rodar localmente `node scripts/ops/generate-clinical-keyring.mjs`, guardar os três valores no cofre de senhas e aplicar com os três comandos `wrangler pages secret put` que o script imprime.

Risco de não executar: prontuário LIVE e Escuta continuam fail-closed; nenhum dado clínico é gravado em claro, mas os módulos não abrem.

Verificação de conclusão: `GET https://neuroped.pages.dev/api/health` sem `CLINICAL_CRYPTO_NOT_READY` em `readiness.blockers`; workflow "Clinical and LGPD production readiness audit" com `clinicalCryptoConfigured: true`.

## Bloqueio 2 — bucket privado de exportação LGPD (LGPD_BUCKET_NOT_CONFIGURED)

Sistema: conta Cloudflare, R2. A auditoria devolveu `r2.apiPermission: denied`: o `CLOUDFLARE_API_TOKEN` do GitHub não tem permissão R2, então o bucket não pode ser conferido nem criado pelo pipeline.

Permissão exata: adicionar ao token `Workers R2 Storage: Edit` (escopo da conta), ou criar manualmente no painel o bucket `neuroped-lgpd-exports`.

O que já está construído: o workflow `deploy-cloudflare.yml` passou a conferir o bucket a cada deploy; com permissão, cria o bucket se faltar, adiciona o binding `LGPD_EXPORT_BUCKET` ao `wrangler.toml` daquela execução e, depois do deploy, verifica nos metadados do projeto que o binding entrou e que o binding D1 `DB` continua presente (fail-closed). Sem permissão, declara `BLOCKED_EXTERNAL_R2_TOKEN_PERMISSION` e segue sem o binding.

Risco de não executar: `LGPD_EXPORT_NOT_CONFIGURED` permanece; exportação e eliminação LGPD não podem ser marcadas `completed` porque não há efeito físico verificável.

Verificação de conclusão: passo "Verificar efeito do provisionamento LGPD" com ✅ no deploy; health com `lgpdExport.storageBindingPresent: true`.

## Estado e reversão

Nenhum segredo criado, lido ou exposto. Nenhum deploy alterado até o merge deste PR. Rollback: reverter o commit; o `wrangler.toml` versionado não muda.
