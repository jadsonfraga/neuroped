# MISSÃO 8.4 REAL — Evidências de build e testes

Data: 2026-06-07.

## Comandos executados

| Comando | Resultado | Evidência |
|---|---|---|
| `npm install` | Não executado | Não necessário: `node_modules` já existia no ambiente. |
| `npm run check` | Passou | `tsc --noEmit` finalizou com código 0. |
| `npm run lint` | Falhou por warnings preexistentes | Após corrigir o erro de parser de `scorecard.mjs`, o lint ficou em 0 erros e 127 warnings; como o script usa `--max-warnings=0`, terminou com código 1. Não validado como verde. |
| `npm run validate:catalog` | Passou | `583 instrumentos`, `577 com fonte`, `6 pendentes`, integridade estrutural OK. |
| `npm run build` | Passou com warnings | Build client e server concluído. Warnings: PostCSS `from`, ordem de `@import`, chunks > 500 kB e `import.meta` em bundle CJS do servidor. |

## Observações honestas

- Não foi executada validação visual/manual em navegador; portanto UX visual final está **não validada visualmente**.
- Não foi declarada nota 8.4 atingida.
- O lint não está verde por dívida de warnings distribuída em vários arquivos do repositório; não foi mascarado.
