# Auditoria do app — 31/10/2026

Escopo: mudanças desde a auditoria profunda de 22/10/2026
(`docs/audits/AUDITORIA_PROFUNDA_2026-10-22.md`) até `HEAD` 211a582, mais a suíte
completa de release e revisão dos invariantes do `AGENTS.md` (autenticação, tenant,
D1, verdade clínica). Somente leitura: nenhum código de produto foi alterado.

## Método

- `npm ci` pelo lockfile; cada etapa de `verify:release` executada isoladamente,
  registrando código de saída, para que uma falha não ocultasse as seguintes.
- Revisão direta de: middleware global de `/api`, JWT/PBKDF2, predicado de dono nas
  rotas legadas, migração 0038 e seus workflows, rota de membros da clínica, novo
  motor de complementaridade do pódio do Filtro, Biblioteca 365 e Super NeuroPad.
- Sonda do Filtro com o catálogo real e queixas mistas contendo risco de suicídio
  (dados 100% sintéticos, sem paciente).

## Resultado da suíte

Cada etapa de `verify:release` foi executada isoladamente, em sandbox Linux compartilhado.

| Grupo | Resultado |
|---|---|
| `npm ci`, `lint` (0 avisos), `check` (raiz + Functions), `build:client` | exit 0 |
| `audit:security` (sem high/critical, allowlist vazia) | exit 0 |
| Testes de segurança, tenant, clínicos, Filtro, escalas, documentos, operações, cognitivo | exit 0 |
| Guardas de catálogo, ranking, fluxogramas, acesso, identidade, navegação, ativos, cor, design, contraste | exit 0 |
| `audit:a11y`, `audit:visual-authenticated`, E2E (missão saúde, acompanhamento, modo fácil, escalas de visitante) | exit 0 |
| `audit:built-pin`, `audit:offline-shell`, `check-baseline` | exit 0 |
| `audit:lighthouse` | **exit 1** |

**Lighthouse.** Home, acessibilidade, boas práticas e SEO atingiram os limites (home: desempenho 95, acessibilidade 100). Falhou só a rota `/#/cars`, nas duas medições: desempenho 84 (mínimo 95) e tempo de bloqueio total de 371 ms (máximo 160 ms). A medição ocorreu em CPU de sandbox, que tende a inflar o bloqueio. Como a repetição confirmou a falha, não descarto regressão real. `snap` e `vineland` também falharam na primeira medição e passaram na repetição. Reexecutar na CI e, se persistir, perfilar o chunk de `cars`.

## Achados

| # | Gravidade | Achado | Evidência | Estado |
|---|---|---|---|---|
| 1 | Alta (conhecido) | Papel global `admin` continua sem filtro de dono nas rotas legadas de paciente: lista, lê, altera e apaga pacientes de todos os donos. Viola "admin global não é fallback de rota clínica comum". | `functions/api/auth/_authorization.ts`, `patientOwnerPredicate` devolve cláusulas vazias para admin. Rotas legadas ainda usadas pelo cliente (`laudo-um-clique`, `receita-c1`, `memoria-clinica`, `CommandPalette`). | Aberto. S9 / gate G3, aguardando decisão do proprietário sobre os registros legados. |
| 2 | Baixa | `POST /api/tenants/:id/members` devolve 500 `DB_ERROR` quando o gatilho D1 aborta com `SEAT_LIMIT_REACHED` ou `BILLING_ENTITLEMENT_DENIED`. O catch só reconhece "último owner". Com o default Solo de 1 assento (migração 0038), o caso deixa de ser raro. | `functions/api/tenants/[id]/members.ts`, bloco catch do POST; gatilhos em 0013 e 0025. Sem teste cobrindo. | Aberto (LTB-22e). A interface não chama este POST; o convite já devolve 409. Impacto restrito a chamada direta à API. |
| 3 | Baixa (verdade clínica) | Topo da Biblioteca exibe selo "Revisão médica" com ícone de escudo, que lê como conteúdo revisado. Todos os capítulos estão em `revisao_medica`, sem aceite. Além disso, o cartão escreve "Revisão médica pendente" fixo, sem ler `item.status`: quando um capítulo for aceito, continuará dizendo pendente. | `client/src/pages/biblioteca-clinica.tsx`, selos do cabeçalho e linha do cartão. | Aberto. |
| 4 | Informativo (não verificável daqui) | `wrangler.toml` não tem `[env.preview]`. Se o projeto Pages tiver integração Git com builds de preview, cada branch herdaria `ENVIRONMENT=production` e o D1 de produção. | `wrangler.toml`. Todos os workflows publicam só `--branch main`. | Conferir no painel do Cloudflare Pages se há builds automáticos de branch. |
| 5 | Média | Lighthouse: `/#/cars` reprovou nas duas medições (desempenho 84, bloqueio total 371 ms). | `npm run audit:lighthouse`, exit 1. | Aberto. Confirmar fora da sandbox. |
| 6 | Documentação | O `STATE.md` ainda lista LEG-17 (LIKE sem escape em `memory/index.ts`) como não avaliado. O código já usa `ESCAPE '\\'`. | `functions/api/memory/index.ts`. | Registro desatualizado; sem defeito no código. |

## Verificado e sem defeito

- **Autenticação:** JWT HS256 com checagem de `alg`, `typ`, `iss`, `aud`, `sid`, tipo, `iat`/`exp`
  e vida máxima; comparação em tempo constante; sessão revogável por família; segredo ≥32
  caracteres e falha fechada (503) sem ele.
- **Middleware global:** rate limit por `CF-Connecting-IP`, CORS com allowlist fixa,
  `Content-Type` JSON obrigatório em escrita, falha fechada sem D1 em produção.
- **Filtro (#1223):** com queixa de suicídio, isolada ou combinada com TDAH, sono ou ansiedade,
  o pódio mantém ASQ, ECAR-SI e C-SSRS, e a âncora funcional (EAF/EFDI) não entra. O alerta de
  risco agudo (SAMU 192) é independente do pódio. Com respondente pais/autorrelato o pódio fica
  vazio, por desenho: os instrumentos de risco são de aplicação clínica.
- **Super NeuroPad (#1220, #1222):** sem norma, percentil, ponto de corte ou diagnóstico; guias
  de hipótese declaram que não são critério diagnóstico; bateria 18+ desabilitada.
- **Migração 0038:** só troca o gatilho de trials futuros; aplicada por
  `saas-billing-d1-migration.yml` e `saas-billing-trial-seats.yml`.
- **Zod 4:** nenhum uso remanescente de `.errors` ou `z.record` de um argumento.
- **Dependências:** nenhuma vulnerabilidade high/critical; allowlist do gate vazia.
- **Correções de 22/10** estão em `main` (commit 4d0cb16).

## Pendências externas inalteradas

G2 (R2/LGPD), G4 (restauração com ciphertext real), G5 (webhook Asaas publicado),
G6 (revisão jurídica), G7 (texto de `/planos`), conforme `docs/saas/gtm/PHASE3_GATE.md`.

## Rollback

Este relatório é só documentação: `git revert` do commit que o adiciona.
