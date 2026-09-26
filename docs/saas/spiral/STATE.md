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

S14: links públicos de pré-consulta e de escala remota recusam (410) assim
que a clínica sai de `active` (suspensa, em encerramento ou encerrada) —
antes continuavam aceitando PHI de família mesmo sem billing/clínica
ativos. Evidência em EVIDENCE.md#S14.

S15: com billing suspenso ou trial vencido, a clínica volta a conseguir
listar e remover membros/convites — só criar/reenviar convite continua
exigindo billing em dia. Antes, GET e DELETE de `/members` e
`/invitations` também eram bloqueados, deixando a clínica sem forma de
reduzir a folha antes de assinar. Evidência em EVIDENCE.md#S15.

S16: as 10 rotas clínicas legadas que resolvem paciente por id não
distinguem mais "não existe" (404) de "existe, mas é de outro owner"
(403) — as duas respondem 404 idênticas. Guard estático fecha a regressão
para sempre. Evidência em EVIDENCE.md#S16.

S17: `conecta/[id].ts` DELETE, `memory/[id].ts` PATCH/DELETE e
`results/[id].ts` DELETE autorizavam via `getPatientAccess` mas mutavam só
por `WHERE id = ?`, sem repetir o owner no predicado final nem (em dois
casos) verificar `changes()` — uma corrida entre a checagem e a escrita
bastava para uma mutação cross-owner silenciosa. As quatro mutações agora
repetem `AND patient_id IN (SELECT id FROM patients_demo WHERE
owner_user_id = ?)` e só declaram sucesso com `changes() === 1`. Teste novo
injeta a corrida de propósito (reatribui o dono exatamente entre a
checagem e a mutação) e prova 404 sem efeito nas quatro; controles no
mesmo arquivo provam que o dono legítimo continua operando normalmente
— caminho que nenhum teste comportamental cobria antes. Evidência em
EVIDENCE.md#S17.

S18: o bridge de importação do BoaConsulta (`/api/integrations/boaconsulta/
import`) não tinha nenhum `_middleware.ts` de clínica/billing — qualquer
conta recém-criada (todo signup nasce role global "professional", sem
clínica) conseguia importar PHI de terceiros sem nunca ter pago. Provado em
runtime: o handler sozinho aceita e persiste o upload (201) de uma conta
sem nenhuma `clinic_membership`. Corrigido com um `_middleware.ts` novo,
cópia do padrão já usado em `patients/**` e `operations/**` — sem tocar o
handler nem exigir migração. Achado de forma independente por dois agentes
de varredura (um workflow de 4 domínios em paralelo + síntese + verificação
adversarial, e um scan avulso), ambos convergindo no mesmo item como topo
do ranking. Evidência em EVIDENCE.md#S18.

S19: `run-deletion.ts`/`run-export.ts` pulavam membership E billing inteiros
quando o ator era admin de plataforma, sem exigir razão nenhuma, e a trilha
de sucesso só era gravada DEPOIS da eliminação/exportação física
(best-effort); `audit-log.ts` não auditava a própria leitura global. Agora
o bypass de admin exige `reason` (400 antes de tocar o ledger sem ela) e
grava trilha PRÉVIA fail-closed antes de reivindicar a execução — provado
inclusive sob corrida de claim (a trilha sobrevive mesmo quando a execução
falha depois). `audit-log.ts` audita a própria leitura (best-effort,
cross-tenant). Evidência em EVIDENCE.md#S19.

S20: `POST /api/operations` `action=staff_link` distinguia por status/código
e-mail sem conta, papel inválido e operador já vinculado a outro
profissional — oráculo de enumeração de contas alheias na plataforma. As
três respondem agora 404 `STAFF_NOT_AVAILABLE` idêntico; caminho normal
(operador disponível) intacto. Evidência em EVIDENCE.md#S20.

S21: nenhuma rota expunha a trilha de auditoria SaaS (`saas_audit_log`)
para o owner/clinic_admin da própria clínica — só o admin global lia
`audit_logs` (legado, sem tenant), e `metrics.ts` só agrega contagens.
Novo `GET /api/tenants/:id/audit`, mesmo guard de `metrics.ts`/`export.ts`,
sem migração. Não era vazamento cross-tenant (nada existia para vazar) —
era lacuna de funcionalidade da "plataforma autogerenciável". Evidência em
EVIDENCE.md#S21.

S22: `POST /api/public-booking` `action=manage` devolvia o DTO completo do
painel PRIVADO (`providerUserId`, `patientId`, `amountCents`,
`paymentMethod` incluídos) a quem só tem o token opaco da reserva — mais
acesso financeiro do que a própria recepção autenticada da clínica recebe
(que já tem `amountCents`/`paymentMethod` redigidos em `operations/index.ts`).
Resposta agora lista explicitamente só o que a família precisa para o
autoatendimento. Evidência em EVIDENCE.md#S22.

## Próximo passo executável
S9 (bypass do admin global no legado clínico, o achado mais severo restante)
está bloqueado por censo de produção — ver
`docs/audits/BLOCKED_EXTERNAL_LEGACY_TENANT_CENSUS_2026-09-26.md`. Todos os
candidatos "small" mapeados pela varredura de auditoria desta sessão (S18
a S22) foram fechados. Não há mais candidato pequeno e seguro identificado
sem revisitar a auditoria original (docs/audits/
SAAS_TENANCY_AUDIT_2026-09-26.md) em busca de itens ainda não avaliados —
por exemplo LEG-17 (LIKE sem escapar em memory/index.ts, baixa severidade,
sem impacto de isolamento) e LTB-22(e) (SEAT_LIMIT_REACHED devolvendo 500
em vez de 409 em members.ts) foram citados como "aquecimento" mas ainda não
avaliados nesta sessão — ou sem abrir uma das frentes deliberadamente
grandes: S10 (papel duplo global×membership, toca middleware de billing
usado por toda rota clínica), S12B (expandir o export para cobrir
documentos/avaliações/intake/escala, cripto-pesado) e S13 (link público de
agendamento por clínica, redesenho de rota no frontend). Retomada:
`git fetch origin main && git log -1 origin/main` e reler este arquivo.


## S1-R1 — reconciliação de 26/09/2026 (PR #951)
Preservados os ciclos S2–S22 do main. O diagnóstico `admin/go-live` agora
retorna `CONFIGURACAO_INCOMPLETA` quando falta qualquer requisito, mantendo
`CONFIGURACAO_PRESENTE` somente sem pendências. Nenhuma chamada a banco ou
provedor é feita pelo diagnóstico; os cinco limites de `naoComprova` permanecem.
Reconciliação de código e documentação concluída; testes e CI do candidato
reconciliado exigidos antes de merge. Não equivale a autorização de venda.
