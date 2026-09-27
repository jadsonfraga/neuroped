# PROFESSIONAL_GAP_ANALYSIS — ciclo 5 (2026-09-26)

Produzido no início da operação "NeuroPed — Operação Professional SaaS",
antes da primeira alteração de código deste ciclo, conforme exigido. Baseado
em revalidação direta contra `origin/main` (HEAD `0b4f74f` no início do
ciclo, worktree limpa, zero PR aberta), na auditoria de tenancy já existente
(`docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md`, 79 achados, ciclo 4 desta
mesma espiral) e no estado registrado em `docs/saas/spiral/STATE.md` e
`BACKLOG.md`. Este documento não repete os 79 achados originais — só
reclassifica o que continua verdadeiro contra o código atual e escolhe o
próximo gap executável.

## A. Estado comprovado

- **Tenancy/autorização**: dos 22 itens priorizados no ciclo 4 (S1–S22), 16
  estão `FECHADO` com evidência em `EVIDENCE.md` (teste visto falhando pelo
  motivo certo contra o código anterior, depois verde). Isolamento
  Alfa×Beta é exercitado por teste real (schema + migrações + handlers) em
  vários domínios: agenda/operações (S8), rotas clínicas legadas (S16/S17),
  billing (S6/S7), convites/membros (S11/S20), auditoria (S19/S21),
  agendamento público (S22).
- **LGPD**: exportação de tenant e purge de encerramento têm teste
  comportamental RED/BLUE contra schema real. Até este ciclo, `complete`
  no manifesto de export já era computado (não fixo), e o purge por clínica
  já recusava fail-closed enquanto o export não cobrisse tudo (S12). Este
  ciclo fechou a lacuna que sobrava: os oito domínios (avaliações,
  documentos, intake, escala remota) agora saem de fato no payload —
  ver seção G.
- **CI**: `npm run check`, lint e `npm run test:quick-wins` (suíte completa,
  0 `not ok`) verdes no HEAD atual mais as mudanças deste ciclo. Workflows
  dedicados por domínio (`lgpd-worker-executor-core.yml`,
  `saas-tenant-lifecycle.yml`, `runtime-readiness.yml`) disparam por path,
  cobrindo os arquivos tocados.
- **Cliente Zero / jornada sintética**: `tests/unit/cliente-zero-journey.test.ts`
  e `tests/unit/saas-acceptance-journey.test.ts` existem e passam, mas
  exercitam o backend com handlers reais contra schema sintético — não é
  produção real (ver seção D).

## B. P0 existentes

1. **S9 — bypass do admin global no domínio clínico legado**
   (`AUTHZ-P0-01`/`LEG-01..04`). Papel `admin` ainda lê/altera/apaga
   `patients_demo` e filhas de qualquer usuário/clínica nas rotas legadas.
   Censo de produção já executado (workflow `36271735655`, sucesso):
   4 pacientes legados, 3 sem owner, 1 com owner sem clínica ativa — nenhum
   vínculo de tenant inequívoco. **Não é mais um bloqueio de acesso**; é
   bloqueio de **decisão de negócio** (destinação autorizada dos registros
   órfãos + comprovação do cliente zero) — ver seção E. Continua sendo o
   achado de maior severidade residual do projeto.

## C. P1 existentes

1. **S10 — papel duplo global×membership incoerente** (`AUTHZ-P1-07`,
   `LTB-05`, `LEG-13`, `OPS-04`). O middleware global decide escrita pelo
   papel GLOBAL (`admin`/`professional` escrevem; `reader`/`operator` não);
   os handlers SaaS decidem pela membership da clínica. Um `assistant`/
   `financial` legítimo de uma clínica (papel global default `professional`
   desde o signup) passa em `canWriteClinicalData` nas rotas legadas sem
   nunca ter sido autorizado pela clínica para isso. Toca
   `functions/api/_middleware.ts` — usado por TODA rota clínica — e por
   isso é deliberadamente grande; não é um `assumir`, é um redesenho de
   autorização que precisa de escopo próprio.
2. **S13 — link público de agendamento ainda por slug global, não por
   clínica**. `booking_provider_profiles.slug` é único globalmente; o
   diretório/reserva pública já recusa profissional com clínica ambígua
   (mitigação já fechada em S8/OPS-02), mas a URL pública em si não
   identifica a clínica. Exige mudança de rota no frontend
   (`agendar.tsx`, `marcacao.tsx`, `navigation.ts`) — fora do escopo de
   isolamento de dados já fechado.
3. **S4 — integração de billing sandbox real** ainda não exercitada (ver
   seção E — bloqueada externamente, não é um gap de código).

## D. Evidências que faltam

- **Billing LIVE**: nenhuma reconciliação webhook↔entitlement foi provada
  contra o provedor real (Asaas) fora de mock/interceptação. `S4` no
  backlog já registra isso como bloqueado por credencial.
- **Backup/restore comprovado** (`S5`): ainda não há um ensaio de
  disaster-recovery documentado com contagens/checksums antes/depois em
  ambiente isolado, conforme o mandato pede.
- **Produção real**: este ambiente de execução não tem acesso de rede ao
  D1/Cloudflare de produção; toda prova de código roda contra schema real
  (`db/schema.d1.sql` + migrações) em SQLite in-memory, nunca contra os
  dados de produção. O único fato de produção usado neste ciclo é o
  resultado já registrado do censo S9 (read-only, metadata-only,
  `docs/audits/LEGACY_TENANT_CENSUS_OBSERVED_2026-09-26.md`).

## E. Bloqueios externos

- **S9 (destinação autorizada)**: decisão de negócio sobre o destino dos
  registros legados órfãos/ambíguos e comprovação de qual conta é o cliente
  zero — não pode ser inferido de dados clínicos reais (proibido pelo
  AGENTS.md) nem decidido por este agente.
  `docs/audits/BLOCKED_EXTERNAL_LEGACY_TENANT_CENSUS_2026-09-26.md`.
- **S4 (billing sandbox)**: exige credencial sandbox autorizada pelo
  proprietário.
- Nenhum outro bloqueio externo identificado nesta revalidação além dos já
  registrados em `docs/audits/BLOCKED_EXTERNAL_*` existentes (PR #988 já
  mesclada — bloqueio de governança de migração já resolvido; verificado
  nesta revalidação: zero PRs abertas no repositório).

## F. Três maiores gaps até produto vendável

1. **S9** — maior risco de segurança residual (P0), mas tecnicamente
   bloqueado por decisão de negócio, não por código.
2. **S10** — modelo de autorização incoerente entre papel global e
   membership; bloqueia uma operação de clínica confiável com equipe
   (assistente/financeiro) e é pré-requisito real para "gestão de equipe"
   funcionar como prometido no mandato.
3. **S13** — agendamento público ainda não é uma feature "por clínica" de
   ponta a ponta; limita venda para qualquer clínica que precise de link
   público diferenciado por unidade.

## G. Primeiro gap escolhido

**S12B** (expandir `collectTenantExportPayload` para cobrir os oito
domínios que faltavam: avaliações/respostas, documentos/versões,
intake/escala remota). Critério de escolha: dos itens executáveis sem
bloqueio externo (S10, S12B, S13), S12B tem o menor raio de explosão (um
único arquivo de produção, sem tocar middleware global nem rota de
frontend), impacto direto em conformidade LGPD (nenhuma clínica com esses
dados conseguia concluir purge de encerramento até este ciclo) e evidência
de progresso mensurável (uma clínica desconhecida deixa de ficar impedida
de encerrar a própria conta por dados que o produto nunca ofereceu exportar).

Executado neste ciclo. Evidência: `docs/saas/spiral/EVIDENCE.md#S12B`,
`docs/saas/spiral/BACKLOG.md#S12B`, `docs/saas/spiral/STATE.md` (ciclo 5).

**Próximo maior multiplicador**: S10 (redesenho de autorização por
membership) ou S13 (link público por clínica) — ambos deliberadamente
grandes; a escolha entre os dois deve ser feita no início do próximo ciclo,
revalidando `origin/main` primeiro.
