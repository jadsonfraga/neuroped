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

## Ciclo 3 — Kit GTM: entrevistas + piloto pago (Fase 4) [SUPERADO NO POSICIONAMENTO PELO CICLO 7]
- **Contexto:** achado da auditoria do copy: `client/src/pages/planos.tsx` posiciona o produto para clínicas multiprofissionais, enquanto o caso de uso validado é do médico individual — ICP indefinido com contradição interna; a Fase 4 (prova de demanda) é a mais demorada e não dependia de código.
- **Decisão:** criar `docs/GTM_ENTREVISTAS_E_PILOTO.md` com roteiro Mom Test (9 perguntas, sinal de dor antes do pitch, teste de preço não-comprometido), oferta de piloto pago a R$ 99/mês sem desconto de fundador (trial 14 dias já implementado), e regra de desempate de segmento por dor espontânea em 10 entrevistas (5 individuais + 5 clínicas).
- **Consequência:** o kit de entrevista e a regra de parada continuam úteis, mas a amostra 5+5 deixou de ser a estratégia vigente após a decisão Solo do Ciclo 7; as 10 entrevistas agora são todas com o ICP Solo.

## Ciclo 4 — Checklist LGPD pré-go-live (Fase 3)
- **Contexto:** `LGPD.md` é tecnicamente sólido (base legal art. 11 II "f", direitos art. 18 implementados e testados), mas contém lacunas de processo: tabela de fornecedores com `__DEFINIR__`, DPAs pendentes, backup "a configurar no provedor", RTO `DESCONHECIDO`, e revisão jurídica formal declarada pendente em `docs/COMPLIANCE_LGPD.md`.
- **Decisão:** criar `docs/LGPD_PRE_GO_LIVE.md` separando comprovado-em-código (A1–A8, com evidência e comando de verificação) de pendente-de-processo (B1–B10, cada um com ação e responsável), com hard gates explícitos: B7 (revisão jurídica) bloqueia `SAAS_SIGNUP_ENABLED=true`; B10 (consentimento específico) bloqueia qualquer paciente real em piloto.
- **Consequência:** "conformidade LGPD" deixa de ser pendência difusa e vira gap-list rastreável com datas em `LGPD.md` §11; ordem de execução prioriza o caminho crítico (revisão jurídica); a CI já cobre os fundamentos da seção A por testes existentes.

## Ciclo 5 — Contrato operacional Asaas, fail-closed (Fase 1)
- **Contexto:** checkout, webhook autenticado, idempotência e entitlement já eram `VERIFIED` em teste local, mas `asaasBaseUrl` tratava ambiente ausente como sandbox e o checkout devolvia indisponibilidade genérica. Sem credencial real, isso ainda é `BLOCKED_EXTERNAL` — e o caminho de produção não podia ficar implícito.
- **Decisão:** ambiente Asaas passa a ser explícito (`sandbox` ou `production`); checkout sem chave, token de webhook, ambiente ou URL HTTPS devolve `BILLING_BLOCKED_EXTERNAL` antes de qualquer POST; o runbook `docs/ASAAS_OPERATIONAL_CONTRACT.md` e `scripts/ops/asaas-operational-contract.ts` inspecionam a configuração sem imprimir segredo e, com `--probe`, só leem `GET /myAccount`.
- **Consequência:** instalação sem contrato declara `BLOCKED_EXTERNAL` e não cria cobrança. Probe aceito ou configuração presente não é pagamento, MRR nem cliente pagante. O marco de billing continua exigindo `charge_paid` persistido pelo webhook.

## Ciclo 6 — Contrato operacional Resend, fail-closed (Fase 1)
- **Contexto:** verificação de conta e convite já falhavam fechado sem transporte, mas a resposta não declarava `BLOCKED_EXTERNAL` e não havia runbook executável. Marcar `email_verified_at` sem token consumido seria bypass.
- **Decisão:** cadastro e convite sem Resend devolvem o código que já existia mais `blockedExternal: BLOCKED_EXTERNAL_RESEND`, sem criar conta e sem emitir bearer. `scripts/ops/resend-operational-contract.ts` inspeciona a configuração sem imprimir segredo e, com `--probe`, só faz `GET /domains`.
- **Consequência:** instalação sem provedor declara o bloqueio e não verifica e-mail por atalho. Probe aceito não é entrega, convite recebido nem conta confirmada. `email_verified_at` continua exclusivo do token `self_service_token`.

## Ciclo 7 — ICP e embalagem inicial NeuroPed Solo (2026-10-25)
- **Contexto:** o produto já suporta tenants e múltiplos assentos, mas lançar a oferta para clínicas aumentaria onboarding, suporte e ciclo comercial antes da primeira prova de demanda. A decisão explícita do proprietário foi começar pelo caminho mais simples, sem regressão dos contratos legados.
- **Decisão:** **Solo primeiro; Clínicas depois**. O ICP decidido é o neuropediatra que opera o próprio consultório. A oferta inicial é NeuroPed Solo por R$ 99/mês, 14 dias de avaliação e um profissional; a capacidade multiassento permanece disponível para tenants existentes, mas não integra o posicionamento inicial.
- **Consequência:** vitrine, onboarding, checkout e GTM usam a mesma história Solo. A validação exige 10 entrevistas Solo, 3 pilotos pagos e 2 segundas faturas. Clínica entra em Later. Asaas, Resend, R2/LGPD, revisão jurídica, legado e smoke publicado continuam bloqueios externos; esta decisão não declara produção pronta.
