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
*Atualização na reconferência (R2):* a CI já respondeu, e as rotas passam lá. Uma segunda sandbox reprovou `/#/cars` e `/#/snap`, enquanto o runner da CI aprovou todas as rotas no mesmo dia.

## Achados

| # | Gravidade | Achado | Evidência | Estado |
|---|---|---|---|---|
| 1 | Alta (conhecido) | Papel global `admin` continua sem filtro de dono nas rotas legadas de paciente: lista, lê, altera e apaga pacientes de todos os donos. Viola "admin global não é fallback de rota clínica comum". | `functions/api/auth/_authorization.ts`, `patientOwnerPredicate` devolve cláusulas vazias para admin. Rotas legadas ainda usadas pelo cliente (`laudo-um-clique`, `receita-c1`, `memoria-clinica`, `CommandPalette`). | Aberto. S9 / gate G3, aguardando decisão do proprietário sobre os registros legados. |
| 2 | ~~Baixa~~ Refutado | ~~`POST /api/tenants/:id/members` devolve 500 `DB_ERROR` quando o gatilho D1 aborta com `SEAT_LIMIT_REACHED`.~~ A rota só muda o papel de quem já é membro ativo. Nesse caminho, nenhum gatilho de assento dispara. | Ver "Reconferência", item R1. Já coberto por `tests/unit/cliente-zero-journey.test.ts:372`, que espera 201 com os assentos cheios. | Refutado. Já constava como refutado em `docs/saas/spiral/STATE.md`, Ciclo 8b (LTB-22e). |
| 3 | Baixa (verdade clínica) | Topo da Biblioteca exibe selo "Revisão médica" com ícone de escudo, que lê como conteúdo revisado. Todos os capítulos estão em `revisao_medica`, sem aceite. Além disso, o cartão escreve "Revisão médica pendente" fixo, sem ler `item.status`: quando um capítulo for aceito, continuará dizendo pendente. | `client/src/pages/biblioteca-clinica.tsx`, selos do cabeçalho e linha do cartão. | Aberto. |
| 4 | Informativo (não verificável daqui) | `wrangler.toml` não tem `[env.preview]`. Se o projeto Pages tiver integração Git com builds de preview, cada branch herdaria `ENVIRONMENT=production` e o D1 de produção. | `wrangler.toml`. Todos os workflows publicam só `--branch main`. | Conferir no painel do Cloudflare Pages se há builds automáticos de branch. |
| 5 | ~~Média~~ Ambiental | Lighthouse: `/#/cars` reprovou nas duas medições na sandbox (desempenho 84, bloqueio total 371 ms). | `npm run audit:lighthouse`, exit 1, apenas em sandbox. Na CI, a `main` passou (ver "Reconferência", item R2). | Não confirmado como regressão. Reprovação limitada a CPU de sandbox. |
| 6 | ~~Documentação~~ Sem ação | O `STATE.md` cita LEG-17 como "ainda não avaliado" num parágrafo antigo (linhas 191-194). | Na mesma página, o Ciclo 8b (linhas 321-338) registra LEG-17 como fechado, e o código usa `escapeLike` com `ESCAPE '\\'` (`functions/api/memory/index.ts:55-58`). | O `STATE.md` é cronológico: o registro posterior fecha o item, e o parágrafo antigo não precisa ser editado. |

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

## Reconferência independente (segunda sessão, mesmo dia)

Feita em outro contêiner, sobre `main` = `302ea65e`. O delta em relação a
`211a582` é apenas documental (`docs/saas/**`, PR #1248). Nenhum código de
produto foi alterado.

**R1: achado 2 refutado.**
- Pela leitura do código: `POST /api/tenants/:id/members` devolve 404 `MEMBER_NOT_FOUND` para
  e-mail sem membership **ativa** nesta clínica (`members.ts:190-195`). A entrada de gente
  nova é exclusiva do convite. O upsert subsequente só atinge uma linha que já existe e está
  ativa. Nesse caso, `trg_membership_insert_seat_limit` (0025) é pulado pelo
  `NOT EXISTS` da linha existente. `trg_membership_reactivate_seat_limit` (0013)
  exige `OLD.active = 0`. Como `BILLING_ENTITLEMENT_DENIED` mora dentro desses mesmos
  gatilhos, também não dispara. Se o alvo for desativado entre a checagem e o batch, o
  `INSERT … SELECT … WHERE EXISTS (… active = 1)` afeta 0 linhas e a rota devolve
  409 `MEMBERSHIP_STALE`, não 500.
- Na reprodução: SQLite em memória com os gatilhos **reais** extraídos de 0013 e 0025 e o
  SQL **real** do upsert extraído de `members.ts`. A clínica tinha 2 membros ativos e 1
  assento contratado, pior caso acima do teto. A mudança de papel passou, com
  `changes = 1`. Nos controles, a inserção de membro novo e a reativação 0→1 abortaram
  com `SEAT_LIMIT_REACHED`, o que prova que os gatilhos estavam ativos. Com o alvo inativo,
  o resultado foi `changes = 0`.
- Já coberto por `tests/unit/cliente-zero-journey.test.ts:372`, que espera 201 em "owner
  altera o papel de um membro sem consumir assento". Também já registrado como refutado
  duas vezes em `docs/saas/spiral/STATE.md`, no Ciclo 8b (LTB-22e).

**R2: achado 5 (Lighthouse) é ambiental, não regressão.**
- A segunda sandbox reprovou: `/#/cars` com desempenho 93 e TBT de 209 ms; `/#/snap` com desempenho 90 e TBT de 271 ms.
  As duas confirmadas na repetição. As outras 10 rotas passaram.
- A CI aprovou: no deploy da `main` `302ea65e` (Deploy Cloudflare Pages, run 41221542776, job
  "Catraca técnica completa de release" → `npm run verify`, 16:58 UTC), o resultado foi
  `[lighthouse] ✓ todas as rotas cumprem`. `/#/cars` teve desempenho 100 e TBT de 34 ms;
  `/#/snap` teve desempenho 100 e TBT de 0 ms; a home teve desempenho 98. O deploy de
  `211a582` também concluiu com sucesso.
- Conclusão: o TBT das escalas interativas é sensível à CPU compartilhada da sandbox. Não há
  regressão a perfilar enquanto a CI permanecer verde.

**R3: achados 1, 3 e 4 confirmados no código.**
- 1: `_authorization.ts:45` e `:65`; `patients/index.ts:116-117`.
- 3: `biblioteca-clinica.tsx:210` (selo) e `:226` (texto fixo); os 3 capítulos
  em `revisao_medica` em `client/src/data/clinicalLibrary.ts`.
- 4: `wrangler.toml` sem `[env.preview]`.

**R4: Zod 4 (complemento).** Não há uso de APIs removidas (`invalid_type_error`,
`required_error`, `deepPartial`, `ZodEffects`, `errorMap`, `formErrors`). Restam 8 usos de
formatos encadeados marcados como obsoletos no Zod 4, mas ainda suportados
(`z.string().uuid()/.email()`), em `server/routes.ts`, `server/routes/{documents,files}.ts`
e `shared/schema.ts`. É informativo e não exige correção agora.

**Saldo após a reconferência:** 1 achado alto já conhecido (S9), 1 baixo de
verdade clínica (Biblioteca) e 1 a conferir no painel (`[env.preview]`). Os achados 2 e 5 caem,
e o achado 6 não exige ação.

## Pendências externas inalteradas

G2 (R2/LGPD), G4 (restauração com ciphertext real), G5 (webhook Asaas publicado),
G6 (revisão jurídica), G7 (texto de `/planos`), conforme `docs/saas/gtm/PHASE3_GATE.md`.

## Rollback

Este relatório é só documentação: `git revert` do commit que o adiciona.
