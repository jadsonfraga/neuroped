# DECISIONS — log de decisões

Formato: contexto → decisão → consequência. Uma entrada por ciclo.

## Ciclo 0 — Auditoria de prontidão (Fase 0)
- **Contexto:** o app é descrito como "ferramenta interna sem billing/onboarding", mas o código real (`functions/api/billing/**`, `functions/api/tenants/**`, testes `cliente-zero-journey`, `saas-*`) já implementa multi-tenant com isolamento verificável, onboarding de 10 marcos server-side, checkout Asaas com webhook idempotente e export LGPD. A lacuna real não é engenharia de produto: é validação externa (Asaas/Resend/deploy) e decisão de ICP/posicionamento.
- **Decisão:** tratar o loop a partir da evidência do repositório (não da descrição), priorizar desbloqueio externo de billing/e-mail/deploy sobre novas features clínicas, e registrar os artefatos vivos na raiz (ROADMAP/DECISIONS/METRICS).
- **Consequência:** ciclos seguintes atacam `BLOCKED_EXTERNAL` e GTM; nenhuma feature clínica nova entra até existir primeiro real faturado. Preço único canônico (R$ 99/assento/mês) permanece até decisão de packaging na Fase 2.

## Ciclo 1 — Trava anti-regressão do loop (Fase 0/1)
- **Contexto:** o desbloqueio de billing/e-mail é operacional (variáveis no Cloudflare + webhook no painel Asaas, já documentado em `docs/GO_LIVE_M5.md`), não de código. Sem trava, mudanças futuras podem apagar os artefatos vivos ou alterar o preço canônico sem que a CI perceba.
- **Decisão:** executar `test:saas-self-service` localmente (verde, exit 0, jornada cliente-zero ponta a ponta) e adicionar `tests/unit/saas-loop-artifacts-static.test.mjs` à suíte e ao workflow `saas-self-service-guard.yml`, cobrindo existência/conteúdo de ROADMAP/DECISIONS/METRICS e o contrato `CANONICAL_PRICE_CENTS = 9900` / trial 14 dias.
- **Consequência:** qualquer PR que remova os artefatos, esvazie o backlog ou mude o pricing sem atualizar o teste falha na CI. Mudança de preço exige agora edição consciente em `shared/billing.ts` + no teste.

## Ciclo 2 — Runbook de smoke pós-deploy (Fase 1)
- **Contexto:** `GET /api/admin/go-live` valida configuração presente, mas não existe roteiro executável que conecte deploy publicado → primeira cobrança; `SAAS_AUTONOMOUS_READINESS.md` lista "deploy publicado + smoke" como bloqueio externo sem passos.
- **Decisão:** criar `docs/SMOKE_CLIENTE_ZERO.md` com fases A–D (diagnóstico go-live → jornada clique a clique de 12 passos → critérios de aceite objetivos, incluindo `charge_paid` persistido e time-to-first-value < 30 min → registro em METRICS/audits), em vez de escrever mais código de verificação — o verificador já existe e está coberto por `tests/unit/go-live-readiness.test.ts`.
- **Consequência:** "deploy validado" passa a ter definição operacional verificável; nenhuma abertura de cadastro self-service sem smoke sandbox verde; a medição do time-to-first-value real alimenta a METRICS na primeira execução.

## Ciclo 3 — Kit GTM: entrevistas + piloto pago (Fase 4)
- **Contexto:** achado da auditoria do copy: `client/src/pages/planos.tsx` posiciona o produto para clínicas multiprofissionais, enquanto o caso de uso validado é do médico individual — ICP indefinido com contradição interna; a Fase 4 (prova de demanda) é a mais demorada e não dependia de código.
- **Decisão:** criar `docs/GTM_ENTREVISTAS_E_PILOTO.md` com roteiro Mom Test (9 perguntas, sinal de dor antes do pitch, teste de preço não-comprometido), oferta de piloto pago a R$ 99/mês sem desconto de fundador (trial 14 dias já implementado), e regra de desempate de segmento por dor espontânea em 10 entrevistas (5 individuais + 5 clínicas).
- **Consequência:** Fase 4 pode começar em paralelo ao desbloqueio operacional do billing; decisão de ICP e reposicionamento do copy saem de evidência de entrevistas, não de opinião; regra de parada explícita (<4 dores espontâneas em 10 = revisar proposta de valor antes de mais código).

## Ciclo 4 — Checklist LGPD pré-go-live (Fase 3)
- **Contexto:** `LGPD.md` é tecnicamente sólido (base legal art. 11 II "f", direitos art. 18 implementados e testados), mas contém lacunas de processo: tabela de fornecedores com `__DEFINIR__`, DPAs pendentes, backup "a configurar no provedor", RTO `DESCONHECIDO`, e revisão jurídica formal declarada pendente em `docs/COMPLIANCE_LGPD.md`.
- **Decisão:** criar `docs/LGPD_PRE_GO_LIVE.md` separando comprovado-em-código (A1–A8, com evidência e comando de verificação) de pendente-de-processo (B1–B10, cada um com ação e responsável), com hard gates explícitos: B7 (revisão jurídica) bloqueia `SAAS_SIGNUP_ENABLED=true`; B10 (consentimento específico) bloqueia qualquer paciente real em piloto.
- **Consequência:** "conformidade LGPD" deixa de ser pendência difusa e vira gap-list rastreável com datas em `LGPD.md` §11; ordem de execução prioriza o caminho crítico (revisão jurídica); a CI já cobre os fundamentos da seção A por testes existentes.

## Ciclo 5 — Arquivamento da raiz (higiene de repo)
- **Contexto:** 81 arquivos .md na raiz dificultavam navegação de revisores/colaboradores; a auditoria de referências mostrou 8 arquivos citados por testes/guards com caminho exato (ex.: `deploy-entrypoints.test.mjs` exige `CLOUD-STORAGE.md`/`DEPLOYMENT_READY.md` na raiz com marcador de registro histórico) e ~12 canônicos.
- **Decisão:** mover 59 relatórios históricos sem nenhuma referência em código/teste/docs para `docs/archive/` via `git mv` (histórico preservado), criar `docs/archive/README.md` com critério de permanência na raiz e regra para novos relatórios; arquivos referenciados e canônicos ficam intocados.
- **Consequência:** raiz de 81 → 22 .md apenas com navegação canônica; testes que referenciam .md da raiz continuam verdes (deploy-entrypoints, scale-time, auth-client-races, browser-audit, catalog-census, saas-loop-artifacts); a viés de "raiz como depósito" fica codificado em documento e não em hábito.

