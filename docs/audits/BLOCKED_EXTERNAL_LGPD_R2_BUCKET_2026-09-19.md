# BLOCKED_EXTERNAL_LGPD_R2_BUCKET — 2026-09-19

## Sistema externo

Cloudflare R2, bucket privado dos artefatos de exportação LGPD (binding `LGPD_EXPORT_BUCKET`).

## Permissão e recursos necessários

- conta Cloudflare com R2 habilitado e permissão de criação de bucket;
- bucket privado dedicado, sem acesso público e sem domínio customizado;
- binding declarado no deploy de produção das Pages Functions.

## Ação que falta

Criar o bucket e declarar o binding. O código não pode fazer nenhuma das duas coisas: ambas exigem console/credencial de operador.

```bash
npx wrangler r2 bucket create neuroped-lgpd-export
```

e, só depois que o bucket existir, acrescentar a `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "LGPD_EXPORT_BUCKET"
bucket_name = "neuroped-lgpd-export"
```

O binding **não foi declarado antecipadamente de propósito**: `wrangler pages deploy` falha quando o bucket referenciado não existe, então declarar antes derrubaria o release de produção inteiro por causa de um recurso ausente.

## Risco de não executar

A exportação assíncrona permanece recusando com `EXPORT_STORE_NOT_CONFIGURED` (503), sem fallback — `run-export.ts` falha antes de reivindicar o job, então não queima tentativa no ledger. Não há falso sucesso: o D1 também recusa `completed` sem prova física, pelos triggers `trg_live_export_completed_requires_worker` e `trg_lgpd_worker_export_completed_evidence` da migração 0017.

O direito de portabilidade continua atendido pela exportação síncrona (`GET /api/tenants/:id/export`), que devolve o payload na resposta e tem limite de bytes. O que falta é o caminho assíncrono para volumes acima desse limite.

## Contingência ativa

Exportação síncrona para volumes dentro do limite. `GET /api/health` já reporta `storageBindingPresent: false` e o blocker `LGPD_BUCKET_NOT_CONFIGURED`, de modo que a ausência é visível em vez de silenciosa.

## Lacuna conhecida, não bloqueada por terceiro

Não existe rota autorizada de download do artefato: mesmo com o bucket provisionado, o ciphertext ficaria acessível apenas ao executor. Isso **não** é bloqueio externo — é decisão de produto pendente, porque a rota precisaria decifrar e servir um prontuário completo, criando superfície nova de PHI. Merece desenho explícito (quem baixa, por quanto tempo o link vale, que auditoria grava) antes de existir, e não deve ser improvisada junto do provisionamento.

## Como verificar a conclusão futura

1. `GET /api/health` passa a reportar `storageBindingPresent: true` e some o blocker `LGPD_BUCKET_NOT_CONFIGURED`;
2. solicitar exportação sintética (sem dado real) de clínica de teste e executá-la: o job conclui com `artifact_key`, digest de 64 caracteres e `artifact_byte_length > 0`;
3. confirmar no bucket que o objeto existe e que seu conteúdo **não** é legível como JSON — o storage só recebe ciphertext;
4. executar eliminação LGPD do mesmo titular e confirmar, por leitura direta do bucket, que o objeto deixou de existir (o executor já faz readback e recusa concluir se o objeto sobreviver — ver `_artifactPurge.ts`);
5. repetir a eliminação com o bucket temporariamente indisponível e confirmar que a operação recusa com `EXPORT_ARTIFACT_STORE_REQUIRED` em vez de declarar cumprida.
