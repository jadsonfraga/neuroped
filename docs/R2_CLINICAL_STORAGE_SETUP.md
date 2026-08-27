# Storage clínico privado em R2

## Objetivo

O NeuroPed grava PDFs clínicos e artefatos de portabilidade somente em object storage privado, nunca em `localStorage`, IndexedDB, URLs públicas ou colunas BLOB do D1. O D1 mantém metadados tenant-aware: clínica, paciente, tipo, autor, timestamp, versão, SHA-256, tamanho, chave opaca e status.

## Configuração canônica

O runtime Cloudflare deve receber um binding R2 chamado `CLINICAL_PDF_BUCKET`. O código também aceita `CLINICAL_ARTIFACT_BUCKET` para instalações que separam PDFs de exportações LGPD. O bucket deve ser privado e não deve ter domínio público ou regra de cache público.

```bash
npx wrangler r2 bucket create neuroped-clinical-private
```

Depois, adicione ao ambiente de Pages/Workers o binding ao bucket criado, sem commitar credenciais. O repositório deliberadamente não inventa o nome real do bucket nem o ID da conta. Enquanto o binding não existir, `/api/live/pdf-archives`, o worker LGPD e o health diagnostic falham fechado ou mostram estado degradado.

## Migration

A migration é aditiva e deve ser aplicada pelo workflow oficial, com os `ALTER TABLE` executados de forma idempotente e validação de `pragma_table_info` antes do deploy:

```bash
npx wrangler d1 execute neuroped-db --remote --yes --file=./db/migrations/0016_clinical_operational_hardening.sql
```

Em instalações que já tenham aplicado parte da migration, o operador deve executar somente as colunas ausentes, registrar o resultado e rodar `npm run audit:migrations`. Nenhum comando de purge ou alteração destrutiva é feito automaticamente pelo build.

## Controles de download

O endpoint de download exige autenticação, membership ativa, entitlement de clínica e `clinic_id` explícito. A chave R2 nunca é retornada ao cliente. O objeto é cifrado no backend com a chave clínica derivada por tenant, e o response devolve somente `application/pdf` após descriptografia autenticada.

## Rollback

Rollback de código não remove objetos nem desfaz migration. O procedimento seguro é voltar o código para a versão anterior, manter o binding privado e preservar as tabelas novas. Se uma migration tiver sido parcialmente aplicada, usar forward-fix idempotente; não executar `DROP TABLE`, `DELETE` global ou remoção do bucket como rollback automático.
