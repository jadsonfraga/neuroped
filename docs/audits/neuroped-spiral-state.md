# NeuroPed — estado da espiral de convergência

Memória entre sessões da espiral sobre as aplicações diretas (Sonda Dez, OBS-10,
Reconhecimento Visual, Testes Cognitivos), o motor compartilhado `EasyGame` e as
superfícies que elas consomem. A espiral do SaaS comercial vive em
`docs/saas/spiral/` e não é reproduzida aqui.

Cada linha tem evidência verificável. Hipótese não entra em VALIDADO.

## VALIDADO

Baseline de 2026-09-26 sobre `origin/main` `5828e0f2`, com `npm ci` e build de produção do cliente:

| Gate | Resultado |
|---|---|
| `npm run check` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run test:sonda` | exit 0 |
| `npm run test:direct-track` | exit 0 |
| `npm run test:cognitive` | exit 0 |
| `npm run test:e2e:modo-facil` | exit 0 — quatro jogos até o resultado |
| `npm run test:e2e:sonda` | exit 0 — 76 etapas, 6 trilhas, exportações, controles móveis |
| `npm run test:e2e:direct-track` | exit 0 — guiado por padrão, direto sem guia, registro declarado |

Nenhuma falha pré-existente nesses gates: defeito encontrado na espiral é algo que eles não cobrem.

## FALHAS REPRODUZIDAS

(preenchido ao fim de cada volta)

## RISCOS

- Trabalho concorrente sobre o mesmo motor: a PR #959 (aberta) altera `EasyGame.tsx` para travar a corrida entre toque da criança e pulo do adulto. Mudanças da espiral no motor precisam reconciliar com ela, nunca sobrescrevê-la.
- Duas PRs abertas implementam a mesma funcionalidade (#961 e #966, Super NeuroPad Game), ambas tocando `App.tsx`, `navigation.ts` e `routeGuardPolicy.ts`.

## EM EXECUÇÃO

Volta 1: auditoria adversarial das quatro aplicações, do motor, das fronteiras de CSS, da persistência e da acessibilidade.

## CONCLUÍDO NESTA ESPIRAL

(nada ainda)

## PRÓXIMA FRONTEIRA

Definida pelo resultado da volta 1.
