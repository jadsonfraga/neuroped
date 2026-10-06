# Criptografia clínica e armazenamento LGPD — bloqueios externos verificados

Reverificação em 28/09/2026 sobre o HEAD `966debf88065862e8f446688322e435a678b5cba`, após o deploy Cloudflare
run `36369651852` e o audit read-only `36370524799` (job `108765713935`).
O código continua fail-closed e as regressões de provisionamento passaram; a
produção clínica/LGPD permanece **NO-GO** até a prova remota ficar verde.

## Evidência vigente em 28/09/2026

O artefato metadata-only `clinical-lgpd-readiness-36370524799` mostrou, sem
ler valores de secret nem dados clínicos:

- `CLINICAL_LIVE_ENABLED=true`, D1 `DB` operacional e schema LGPD pronto.
- `CLINICAL_DATA_KEY`, `CLINICAL_DATA_KEY_ID` e `CLINICAL_INDEX_KEY`
  existem no metadata do Pages com tipo `secret_text`.
- A presença do nome de um secret no metadata **não prova valor utilizável no
  runtime**. O endpoint restrito de diagnóstico respondeu
  `configured=false`, código `CLINICAL_CRYPTO_NOT_CONFIGURED`.
- Pelo contrato de `functions/api/tenant/_crypto.ts`, esse código é emitido
  quando a chave clínica corrente `CLINICAL_DATA_KEY` chega ausente, vazia,
  apenas whitespace ou com menos de 32 caracteres. O audit não lê nem deve
  ler o valor, portanto não é possível distinguir entre essas alternativas
  sem atuação do custodiante da chave.
- R2: `bindingPresent=false` e `apiPermission=denied`.
- Runtime: `lgpdExport.storageBindingPresent=false` e
  `lgpdExport.configured=false`.
- Blockers finais: `CLINICAL_CRYPTO_NOT_READY`,
  `LGPD_BUCKET_NOT_CONFIGURED` e `LGPD_EXPORT_NOT_CONFIGURED`.

Esta atualização substitui a interpretação histórica de 26/09 de que os
**nomes** dos secrets estavam ausentes. Hoje os nomes existem; o keyring
corrente continua inválido no runtime.

## Bloqueio 1 — keyring clínico (CLINICAL_CRYPTO_NOT_READY)

Sistema: projeto Cloudflare Pages `neuroped`, secrets de produção.

Código/configuração versionável: nenhuma falha demonstrada. O keyring é
validado por `clinicalCryptoStatus()`; o runtime falha fechado e não grava
prontuário LIVE em claro.

Dependência externa: recuperar da custódia humana um `CLINICAL_DATA_KEY`
válido (mínimo 32 caracteres) e confirmar também que
`CLINICAL_DATA_KEY_ID` respeita `^[A-Za-z0-9_-]{1,32}$` e que
`CLINICAL_INDEX_KEY` tem ao menos 32 caracteres e é diferente das chaves de
dados. O script `node scripts/ops/generate-clinical-keyring.mjs` gera um
novo conjunto válido e imprime os comandos `wrangler pages secret put`,
mas **não gerar/substituir cegamente uma chave existente**: se houver
ciphertext histórico, uma chave nova não recupera o conteúdo cifrado com uma
chave perdida. Nesse cenário, restaurar a chave original de sua custódia ou
executar antes um inventário operacional metadata-only das versões de chave.

Permissão/ação externa: custódia humana das chaves e acesso de edição aos
secrets do Cloudflare Pages. Nenhuma chave deve ser inventada, impressa em CI,
commitada ou registrada em artefato.

Risco de não executar: prontuário LIVE e Escuta continuam fail-closed; os
módulos clínicos não ficam aptos para produção.

Verificação de conclusão: o diagnóstico restrito
`/api/admin/clinical-crypto-readiness` precisa retornar
`{"configured":true}`, e `/api/health` não pode conter
`CLINICAL_CRYPTO_NOT_READY`.

## Bloqueio 2 — bucket privado de exportação LGPD (LGPD_BUCKET_NOT_CONFIGURED)

Sistema: conta Cloudflare, R2.

Código/configuração versionável: o `wrangler.toml` do HEAD contém
`CLINICAL_LIVE_ENABLED=true` e o D1 `DB`, mas **deliberadamente não contém
binding R2 versionado**. A regressão
`tests/unit/clinical-lgpd-provisioning-static.test.mjs` exige esse
comportamento: o deploy só acrescenta
`[[r2_buckets]] / LGPD_EXPORT_BUCKET -> neuroped-lgpd-exports` na execução
em que o bucket foi previamente comprovado. Isso evita apontar produção para
um recurso inexistente.

Dependência externa comprovada: o `CLOUDFLARE_API_TOKEN` recebeu HTTP 403 ao
consultar R2. Há dois caminhos válidos, mas eles não são equivalentes:

1. **caminho automatizado (preferido):** adicionar ao token da automação a
   permissão de conta `Workers R2 Storage: Edit`. O workflow
   `.github/workflows/deploy-cloudflare.yml` então confere o bucket, cria
   `neuroped-lgpd-exports` apenas no 404, injeta o binding
   `LGPD_EXPORT_BUCKET` somente se o recurso existir, faz o deploy e verifica
   nos metadados do Pages tanto o R2 quanto o D1 `DB`;
2. **caminho manual:** criar o bucket privado `neuroped-lgpd-exports` e
   configurar explicitamente no Cloudflare Pages de produção o binding
   `LGPD_EXPORT_BUCKET -> neuroped-lgpd-exports`.

Criar **somente** o bucket pelo painel, mantendo o token com HTTP 403, não
desbloqueia o pipeline atual: a etapa de deploy não consegue comprovar o
recurso, mantém `available=0` e não injeta o binding.

Risco de não executar: `LGPD_EXPORT_NOT_CONFIGURED` permanece; exportações
LGPD não têm armazenamento privado verificável e o worker continua
fail-closed.

Verificação de conclusão: deploy precisa registrar o binding
`LGPD_EXPORT_BUCKET -> neuroped-lgpd-exports`; `/api/health` deve mostrar
`lgpdExport.storageBindingPresent=true` e `lgpdExport.configured=true`.

## Critério de GO

Não declarar prontidão clínica/LGPD apenas porque build, deploy ou health
básico passaram. O único GO aceitável para este bloqueio é nova execução do
workflow **Clinical and LGPD production readiness audit** com
`ready=true`, sem blockers. Até lá: **NO-GO**.

## Reversão

Esta documentação não altera secrets, chaves, bucket, dados nem o deploy.
Rollback: reverter apenas o commit documental/regressão correspondente.

## Atualização 06/10/2026 — sincronização GitHub → Pages

O workflow `deploy-cloudflare.yml` passou a espelhar, como secrets **opcionais**,
`CLINICAL_DATA_KEY`, `CLINICAL_DATA_KEY_ID`, `CLINICAL_INDEX_KEY`,
`CLINICAL_DATA_KEY_PREVIOUS[_ID]` e `NEUROPED_IMPORT_ENCRYPTION_KEY` do GitHub
para o projeto Pages (mesmo padrão de `OPERATIONAL_DATA_KEY`: valor por stdin,
log só "definido", ausente = no-op).

Isso **não** substitui a custódia humana nem autoriza gerar/substituir cegamente
uma chave existente com ciphertext histórico. Continua valendo: se houver
registros cifrados com uma chave anterior, restaurar a original ou rotacionar
com `PREVIOUS`. O bloqueio R2 (`Workers R2 Storage: Edit` no
`CLOUDFLARE_API_TOKEN`) permanece externo e independente do keyring.

