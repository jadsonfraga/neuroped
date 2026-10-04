# LGPD pré-go-live — checklist executável (Fase 3)

Fecha a pendência declarada em `docs/COMPLIANCE_LGPD.md` ("revisão jurídica
formal não realizada") com uma gap-list acionável. Cada item tem estado,
evidência e comando de verificação quando aplicável. Zero PHI em qualquer
verificação — dados sintéticos apenas.

Legenda: ✅ comprovado em código/teste · 🔶 existe mas sem prova externa ·
❌ pendente de processo/decisão humana.

## A. Fundamentos (já cobertos por código)

| # | Item | Estado | Evidência |
|---|---|---|---|
| A1 | Controlador/DPO nomeado | ✅ | `LGPD.md` §1 (Dr. Jadson, CRM-PE 25227) |
| A2 | Base legal mapeada (art. 11, II, "f") | ✅ | `LGPD.md` §2 |
| A3 | Consentimento de responsável legal de menor (art. 14) | ✅ | `functions/api/consents.ts`; tipo `responsavel_legal_menor` |
| A4 | Direitos do titular (art. 18) com export/delete | ✅ | `POST /api/lgpd/export-request`, `delete-request`; testes `cliente-zero-journey` (export `complete: true` com digest) |
| A5 | Criptografia em repouso AES-256-GCM por clínica | ✅ | `CLINICAL_DATA_KEY` derivada por tenant; falha fechada sem chave |
| A6 | Trilha de auditoria metadata-only (sem PHI) | ✅ | `saas_audit_log`; testes `tenant-audit-log`, `audit-log-contract` |
| A7 | Isolamento multi-tenant no predicado SQL | ✅ | `AGENTS.md` regras de tenant; testes de anti-enumeração |
| A8 | Direitos só marcados `completed` após efeito físico verificado | ✅ | Regra canônica do repo; teste do cliente-zero |

## B. Lacunas de processo (bloqueiam venda, não bloqueiam código)

| # | Item | Estado | Ação necessária (responsável: você) |
|---|---|---|---|
| B1 | DPA com hospedagem (Cloudflare) | ❌ | Enterprise/Business tem DPA; para plano gratuito, avaliar upgrade ou registrar análise de risco. Preencher linha de `LGPD.md` §7 |
| B2 | DPA com Asaas (processa nome/e-mail/cobrança) | ❌ | Contrato de processamento Asaas; preencher §7 |
| B3 | DPA com Resend (e-mail transacional) | ❌ | Idem; verificar região de processamento |
| B4 | Tabela §7 de `LGPD.md` com `__DEFINIR__` | ❌ | Substituir pelos provedores reais após B1–B3 |
| B5 | Backup em produção "configurar no provedor" | 🔶 | D1: ativar Point-in-Time Recovery/backups no painel; documentar RPO/RTO |
| B6 | Ensaio de restore executado | 🔶 | Workflow "DR mechanism rehearsal (D1)" já existe; preencher RTO em `docs/D1_DISASTER_RECOVERY_RUNBOOK.md` (hoje `DESCONHECIDO`) |
| B7 | Revisão jurídica formal de Política/Termos | ❌ | Advogado revisa `/privacidade.html`, Termos e `LGPD.md` antes de `SAAS_SIGNUP_ENABLED=true` |
| B8 | Registro de incidentes testado (art. 48) | 🔶 | Fluxo documentado em `LGPD.md` §9; fazer 1 tabletop exercise de 30 min e registrar data |
| B9 | Canal do DPO publicado na Política | 🔶 | Confirmar que `/privacidade.html` expõe e-mail/telefone do encarregado |
| B10 | Consentimento específico p/ dados sensíveis (art. 11, I) coletado no piloto | ❌ | Termo assinado antes do primeiro paciente real em cada piloto pago |

## C. Verificações executáveis agora (sem segredo, sem PHI)

```bash
# 1. Contratos LGPD das rotas seguem testados:
npm run test:quick-wins   # inclui consents-contract (Cloudflare+Express)
# 2. Jornada com export/eliminação íntegros:
npm run test:saas-self-service
# 3. Auditoria metadata-only:
node --import tsx tests/unit/tenant-audit-log.test.ts
```

## D. Critério de fechamento da Fase 3

Fase 3 considera-se pronta quando: A permanece ✅ em CI; B1–B7 e B10 marcados
como feitos com data em `LGPD.md` §11 (tabela de atualizações); B8–B9
registrados com data. Antes disso, **nenhum piloto pago com paciente real**
(B10 é hard gate) e nenhuma abertura de cadastro self-service (B7).

## E. Ordem recomendada
1. B7 (revisão jurídica) — caminho crítico, tudo depende dela.
2. B1–B4 (DPAs) — paralelizável com B7.
3. B5–B6 (backup + ensaio) — antes do primeiro cliente real.
4. B8–B10 — antes do primeiro paciente real de cada piloto.
