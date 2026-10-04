# Arquivo histórico

Relatórios de auditoria, sessões de deploy, planos de fase e resumos de
trabalho concluídos. Movidos da raiz em 2026-10-04 (ciclo 5 do loop SaaS)
porque documentam decisões passadas, não estado vigente.

## Critério de permanência na raiz

Um .md só fica na raiz se for canônico (`AGENTS.md`, `README.md`,
`CONTRIBUTING.md`, `LGPD.md`, `SECURITY.md`), artefato vivo do loop SaaS
(`ROADMAP.md`, `DECISIONS.md`, `METRICS.md`) ou referenciado por
teste/guard com caminho exato (ex.: `CLOUD-STORAGE.md`,
`DEPLOYMENT_READY.md`, ver `tests/unit/deploy-entrypoints.test.mjs`).

## Como encontrar um documento

- Estado vigente de processos: raiz + `docs/`.
- Registro de auditoria por data: `docs/audits/`.
- Histórico de deploy: `docs/archive/DEPLOYMENT_*.md` + `docs/DEPLOY_LOG.md`.

## Regra para novos relatórios

Relatório de trabalho concluído nasce diretamente em `docs/audits/` (com data
no nome) ou `docs/archive/` — nunca na raiz. A raiz é navegação, não depósito.
