# AGENTS.md — NeuroPED (canônico)

Guia operacional para agentes e colaboradores. Criado na reconciliação de
2026-08-29 (baseline `21b4803`). Em conflito com documentos históricos da raiz,
este arquivo prevalece.

## Arquitetura canônica

- **Produção/API canônica:** Cloudflare Pages Functions (`functions/api/**`) + D1 (SQLite).
- **Frontend:** React + Vite (`client/`), build via `npm run build:client`.
- **Express (`server/`)**: adaptador de desenvolvimento/espelho; não é uma segunda autoridade de backend. Regras de negócio compartilhadas não podem divergir entre Express e Functions.
- **Vercel:** espelho do frontend do mesmo SHA servido pelo Cloudflare — nunca autoridade.
- **Banco:** D1/SQLite com migrações em `db/migrations/` (numeradas, forward-only). Drizzle apenas como ferramenta de geração (`db:generate`); `db:push` externo é negado por guard.

## Comandos válidos (usar somente scripts existentes do package.json)

- Instalação determinística: `npm ci`
- Tipos: `npm run check` · Lint: `npm run lint`
- Testes de segurança/regressão: `npm run test:quick-wins`
- Testes clínicos: `npm run test:clinical`, `npm run test:filter`, `npm run test:interactive`
- Inventário diário: `npm run test:daily-inventory`
- Suíte de release: `npm run verify:release` (ou `npm run verify`)
- Build completo: `npm run build` · Somente cliente: `npm run build:client`
- Testes estáticos executáveis sem dependências: `node tests/unit/*-static.test.mjs`

## Regras de tenant (multi-clínica)

- `TenantContext` deriva apenas de identidade autenticada + sessão válida + associação ativa persistida + papel explícito. `clinicId` vindo de query/body/path é alvo solicitado, nunca autoridade.
- Toda leitura/mutação clínica repete o tenant no predicado SQL final (não basta autorizar antes e depois `UPDATE ... WHERE id = ?`).
- Nenhuma associação de tenant apenas em memória libera acesso; clínica pessoal deve existir persistida, transacional e única.
- Admin global não é fallback de rota clínica comum; ações de plataforma exigem escopo, razão e auditoria.
- Anti-enumeração: 403/404 consistentes; não revelar existência de recurso de outra clínica.

## Regras de D1/migrações

- Somente SQL suportado pelo SQLite/D1 (proibido `SELECT DISTINCT ON` e sintaxe PostgreSQL).
- Migração aplicada em qualquer ambiente é histórica: não editar; corrigir com migração forward-only nova.
- Toda escrita D1 deve ser realmente executada (`run`/`batch`), com verificação de efeito quando necessário, tenant no predicado e erro sem falso sucesso.
- Migração e deploy são etapas separadas; blocos idempotentes tolerados apenas quando seguidos de verificação fail-closed (padrão já usado em `deploy-cloudflare.yml`: `ALTER ... || true` seguido de `pragma_table_info` + `exit 1`).

## Segurança, segredos e LGPD

- `NEUROPED_JWT_SECRET` (assinatura JWT) e `OPERATIONAL_DATA_KEY` (criptografia operacional) têm finalidades separadas; nenhuma pode ser fallback da outra (regressão coberta em `tests/unit/operations-integration-static.test.mjs`).
- Produção falha fechada na ausência de chave obrigatória.
- Direitos LGPD (exportação/eliminação) só podem ser marcados `completed` após efeito físico verificado; auditoria metadata-only, sem PHI.
- Nunca commitar segredos, tokens, cookies, dumps de banco ou dados reais de pacientes — nem em testes, fixtures, screenshots, logs, issues ou PRs. Fixtures são 100% sintéticas.

## Verdade clínica

- Não criar normas, escores, pontos de corte ou equivalência oficial de instrumento licenciado. Instrumento incompleto não pontua, não interpreta e não aparece como oficial em UI ou PDF.
- Preservar a distinção: rastreio ≠ registro observacional ≠ questionário interno ≠ teste psicométrico licenciado ≠ diagnóstico.
- PDFs e UI carregam versão, status de validação e proveniência corretos.

## Artefatos gerados e determinismo

- Artefatos declarados determinísticos (ex.: inventário diário de contingência) devem gerar bytes idênticos para a mesma entrada; carimbos de tempo derivam de entrada estável (`NEUROPED_GENERATION_DATE`/`NEUROPED_GENERATION_TIMESTAMP`), nunca do relógio corrente.
- Artefatos gerados são reproduzidos pela CI, nunca editados à mão para "fazer bater".

## Política de PRs

- PRs pequenas, atômicas, por domínio, com escopo único, testes próprios, plano de rollback e vínculo com a issue rastreadora. Proibido PR monolítica multi-domínio.
- Proibido: commit direto em main, force-push em main, checks verdes via skip/only/`|| true` em etapa crítica/remoção de assertiva/`@ts-ignore` indiscriminado, mock que substitua produção em teste de integração.
- Formatação massiva separada de mudança funcional.

## Definição de pronto

Uma entrega só é "pronta" com: escopo único; testes verdes verificáveis (comando + exit code); nenhum teste enfraquecido; nenhum TODO/stub no caminho entregue; sem PHI/segredo; rollback documentado; worktree limpa; documentação atualizada.

## Bloqueios externos

Quando uma ação exigir permissão, segredo ou console externo ausente, não fingir conclusão nem transferir a decisão ao usuário: registrar `BLOCKED_EXTERNAL_*` em `docs/audits/` com sistema, permissão exata necessária, ação que falta, risco de não executar e como verificar a conclusão.
