# Baseline NeuroPED — 2026-08-29

## Identidade da base

- Repositório: `jadsonfraga/neuroped`
- Branch auditada: `main`
- SHA atual de `main`: `21b480381de6e9892b67f22dace8ab28812ce300`
- SHA de referência informado: `21b480381de6e9892b67f22dace8ab28812ce300`
- Branch de trabalho: `codex/reconcile-neuroped-2026-08-29-21b4803`
- Estado inicial do checkout: limpo; `git diff --check` passou.

## Ambiente e comandos

| Comando | Exit code | Classificação | Evidência |
|---|---:|---|---|
| `git fetch --all --prune` | 0 | reproduzida | refs atualizadas sem alteração de arquivos |
| `git status --short` | 0 | passou | saída vazia antes da branch |
| `git diff --check` | 0 | passou | nenhuma ocorrência reportada |
| `node --version` | 1 | ambiente ausente | `node` não está disponível no PATH |
| `npm --version` | 1 | ambiente ausente | `npm` não está disponível no PATH |
| `npm ci` | 1 | ambiente ausente | não iniciou porque `npm` não está disponível |
| auditoria de dependências | não executada | ambiente ausente | depende de Node/npm |
| lint, tipos, testes e build | não executados | ambiente ausente | dependem de Node/npm |

## Inventário remoto inicial

- Branch padrão: `main`.
- Branches remotas listadas: 107.
- PRs abertas: 25; incluem #704, #708, #718–#728 e #731–#734, além de #737 e #738.
- Issues abertas não-PR: 29.
- Workflows ativos listados pela API: 96.
- Proteção de `main`: não acessível com a credencial disponível (HTTP 401); não foi alterada.
- Deploys, ambientes privados, ledger remoto D1 e checks remotos: não comprovados nesta fase.

## Decisões e bloqueios

1. O SHA de `main` não mudou desde a referência auditada; o baseline usa a ponta atual remota.
2. Nenhuma PR histórica foi mesclada, fechada ou alterada.
3. Nenhuma migração, deploy, regra de branch, segredo ou dado remoto foi alterado.
4. `BLOCKED_EXTERNAL_LOCAL_RUNTIME`: sistema local; falta Node.js/npm suportados para executar a suíte e instalar dependências. Risco: não há evidência local de lint, tipos, testes ou build. Verificação: disponibilizar o runtime compatível e repetir os comandos registrados.
5. `BLOCKED_EXTERNAL_BRANCH_PROTECTION_READ`: GitHub API; falta permissão de leitura das regras de proteção/rulesets. Risco: gates remotos não comprovados. Verificação: consultar proteção/rulesets com token autorizado.

