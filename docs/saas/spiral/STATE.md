# Estado da espiral SaaS

Atualizado em 2026-09-24 (ciclo 3). Este arquivo registra fatos verificados,
não intenções. Revalide `origin/main` e a produção antes de confiar nele.

## Baseline verificada
- main = candidato = produção: `e77bbf7` (Deploy run 1416, success 02:08Z;
  a etapa do workflow que confere o SHA em `deploy-check.json` executou).
  O acesso HTTP direto a `neuroped.pages.dev` é negado pela política de rede
  do container de sessão: a evidência de publicação vem do próprio workflow.
- Suítes SaaS verdes na baseline: `test:saas-self-service` (self-service,
  jornada de aceite, Cliente Zero), `test:quick-wins`, tipos e lint.

## Ciclo 1 (fechado)
- Problema: `pronto: true` de `GET /api/admin/go-live` atestava só
  configuração presente (sandbox aceito) sem declarar o nível nem o que não
  comprova — leitura de "autorização de venda" era possível (§11 do mandato).
- Mudança: campos aditivos `nivelAtestado`, `ambienteCobranca` (só códigos
  reconhecidos ou null) e `naoComprova` com os cinco degraus superiores;
  `nota` nega explicitamente a leitura comercial. `pronto`, `gates`,
  `pendencias` e `ordemInvertida` intocados; nenhum consumidor além do teste.
- Teste: bloco 7 de `tests/unit/go-live-readiness.test.ts`, escrito antes e
  visto falhando pelo motivo certo.

## Hipóteses refutadas (não reabrir sem evidência nova)
1. "Falha de entrega do e-mail de verificação produz falso sucesso" — NÃO:
   `issueEmailVerification` apaga o token e retorna false; signup nunca
   afirma envio; `POST /api/tenants` bloqueia não-verificado com mensagem
   clara que o onboarding exibe; `#/verificar-email` reenvia
   (anti-enumeração deliberada). O `[mail] delivery failed 403` no teste
   verde é o harness exercitando essa tolerância.
2. "Entitlement via redirect de checkout" — NÃO: `billing-retorno.tsx`
   declara processamento e remete ao estado servido pelo servidor;
   Cliente Zero cobre webhook duplicado/tardio.

## Fora da espiral, em andamento
- PR #855 (WAV silencioso): verde em `c76a779`, retida no gate manual de
  áudio do proprietário (microfone real). Check-in silencioso armado.

## Ciclo 1: integração
PR #949 mergeada em `6614fbf`; publicação em verificação no momento deste
commit (o check-in do deploy atualiza aqui se falhar).

## Ciclo 2 (este commit)
S2: a recusa EMAIL_VERIFICATION_REQUIRED no onboarding passa a levar à
página de reenvio (`#/verificar-email`), ancorada no código do backend.
Teste de contrato novo em test:quick-wins, visto falhando antes.

## Ciclo 2: integração
PR #950 mergeada em `a9452cf`.

## Ciclo 3 (este commit)
S3: inventário dos domínios Acesso (12 funcionalidades) e Comercial (8),
com evidência por import direto do handler real. A varredura achou UMA
lacuna: GET /api/auth/me, o bootstrap de identidade do cliente, sem import
em teste algum. Fechada no mesmo ciclo: contrato em
e2e-refresh-session-guard-regression (token válido sem credencial no corpo;
refresh≠access; família revogada nega; conta desativada nega), com a
assertiva de família revogada verificada falhando com o defeito
reintroduzido.

## Ciclo 4 (2026-09-26) — auditoria de tenancy + S6/S7 fechados
Auditoria completa de tenancy SaaS (8 auditores paralelos, 4 concluídos
antes do teto de sessão): 79 lacunas em auth/authz, domínio clínico legado,
agenda/operações e LIVE/tenants/billing. Relatório integral com evidência
arquivo:linha em `docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md`. Backlog
priorizado em `BACKLOG.md` (S6 em diante).

S6: `/api/billing/webhook` estava bloqueado pelo middleware global de Bearer
antes de o handler (que já se autentica sozinho) rodar — nenhuma
reconciliação automática de cobrança jamais funcionava em produção. Fechado
nesta sessão; evidência em EVIDENCE.md#S6.

S7: `CHECKOUT_EXPIRED`/`CHECKOUT_CANCELED`/`PAYMENT_DELETED` cancelavam de
forma terminal customer/subscription mesmo em trial ou ativo — um checkout
abandonado bastava para derrubar uma clínica pagante, sem rota de
reativação. Fechado nesta sessão: apenas `SUBSCRIPTION_DELETED`/
`SUBSCRIPTION_INACTIVATED` (a própria assinatura no provedor) cancela.
Evidência em EVIDENCE.md#S7.

Comandos exit 0 depois de S6+S7: `npm run check`, `npm run test:quick-wins`
(suíte completa), mais os testes de billing/tenant/cliente-zero listados em
EVIDENCE.md#S7.

S8: agenda/operações ganhou `clinic_id` (migração 0026, aditiva) em 8
tabelas, com backfill determinístico e todo filtro autenticado repetindo a
clínica no predicado — fecha o vazamento de PHI entre clínicas de um
profissional compartilhado (OPS-01). O diretório público e a reserva
pública já recusam clínica ambígua (mitigação de OPS-02), mas o link
público continua por slug global — redesenho de rota registrado como S13,
em aberto. Evidência em EVIDENCE.md#S8.

Comandos exit 0 depois de S8: os mesmos de S6+S7 mais
`tests/unit/operations-tenant-isolation.test.ts`, `npm run test:operations`,
`npm run lint` completo e `npm run test:quick-wins` completo novamente.

S11: `POST /api/tenants/:id/members` não conscreve mais conta alheia sem
convite — exige membership ativa prévia, com resposta uniforme (404
MEMBER_NOT_FOUND) que fecha o oráculo de enumeração por e-mail/papel
global. Evidência em EVIDENCE.md#S11.

S12: o purge de encerramento (escopo `clinic`) agora recusa
(`EXPORT_MANIFEST_INCOMPLETE`) enquanto a clínica tiver documentos,
avaliações, intake ou escala respondida — domínios que o export do tenant
ainda não leva. O manifesto de export parou de afirmar `complete: true`
sempre; agora é computado. Efeito colateral deliberado: nenhuma clínica com
esses dados consegue concluir o purge físico hoje, até S12B (expandir o
export) ser feito. Evidência em EVIDENCE.md#S12.

## Próximo passo executável
S9 (bypass do admin global no legado clínico, o achado mais severo restante)
está bloqueado por censo de produção — ver
`docs/audits/BLOCKED_EXTERNAL_LEGACY_TENANT_CENSUS_2026-09-26.md`. Sem esse
censo, os próximos itens executáveis sem depender de estado de produção
desconhecido são S10 (papel duplo global×membership), S12B (expandir o
export para cobrir documentos/avaliações/intake/escala) e S13 (link público
de agendamento por clínica) — ver BACKLOG.md para os três. Retomada: `git
fetch origin main && git log -1 origin/main` e reler este arquivo.
