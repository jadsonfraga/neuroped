# Disaster Recovery executável — NeuroPed

## Objetivo

Este runbook cobre D1, object storage privado e configurações críticas. **RPO e RTO são parâmetros operacionais**, não promessa comercial:

| Parâmetro | Valor inicial de operação | Como confirmar |
| --- | --- | --- |
| RPO D1 | `RPO_D1_MINUTES` configurável | export/time-travel mais recente disponível |
| RPO R2 | `RPO_R2_MINUTES` configurável | inventário e digest dos objetos |
| RTO | `RTO_MINUTES` configurável | ensaio isolado automatizado |

Nenhum dado clínico real entra em fixture, log, artifact de CI ou relatório.

## Inventário protegido

O inventário mínimo é: migrations aplicadas e esperadas; binding e nome lógico do D1; tabelas LIVE; bucket privado; configuração de cifragem clínica e IDs de chave; segredo de worker separado; versão/commit publicado; workflows de migration e deploy. Secrets não são exportados: apenas presença, comprimento mínimo e identificador não secreto são verificados.

## Backup D1

O mecanismo provider-supported deve ser usado pelo operador autorizado:

```bash
npx wrangler d1 info neuroped-db
npx wrangler d1 time-travel info neuroped-db --json
npx wrangler d1 export neuroped-db --remote --output=/secure/neuroped-d1-$(date -u +%Y%m%dT%H%M%SZ).sql
```

O arquivo deve ficar fora do repositório, com controle de acesso e digest SHA-256. Nunca anexe o SQL a um workflow público.

## Inventário R2

Listar somente chaves e metadados técnicos no ambiente autorizado. O conteúdo deve permanecer no bucket privado; para cada objeto, registre chave opaca, tamanho, ETag/digest, data e versão. O relatório não pode incluir nome, telefone, diagnóstico, medicamento, patient ID ou conteúdo.

## Ensaio isolado

O comando abaixo cria um tenant, paciente e documento sintéticos em SQLite temporário, exporta o conjunto, calcula hashes e reconstrói em outro banco temporário. O teste prova contagem e integridade do fixture sem tocar D1 remoto ou R2 real:

```bash
node scripts/dr/restore-rehearsal.mjs
```

Critério de aprovação: o banco reconstruído contém exatamente o tenant sintético esperado, o documento tem o mesmo SHA-256 e nenhum sentinela clínico real aparece no log. O script apaga os arquivos temporários ao terminar, exceto quando `DR_KEEP_TEMP=1` for explicitamente usado fora do CI.

## Recuperação exata

1. Congele deploys e jobs de worker.
2. Identifique o bookmark/time-travel ou snapshot aprovado.
3. Crie um D1 temporário isolado; não restaure diretamente sobre produção.
4. Aplique migrations até a versão esperada e importe o snapshot.
5. Verifique hashes, contagens, triggers tenant-aware, bucket privado e keyring.
6. Rode `npm run test:dr` e o health diagnostic no ambiente isolado.
7. Somente após aprovação, execute o procedimento administrativo de cutover documentado pelo operador Cloudflare.
8. Publique um novo `BUILD_SHA` e confirme `/api/health`.

## Estado atual

O sistema só declara DR comprovado quando o ensaio automatizado passa. Falhas de binding, keyring, migration ou integridade interrompem a recuperação; não há fallback para armazenamento local de PHI.
