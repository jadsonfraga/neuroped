# SPIRAL 1 — NeuroPed SaaS

**Data:** 2026-09-05 · **HEAD da main ao fechar:** `b523072`

Este documento registra evidência, não intenção. Cada linha da tabela de
gates aponta para uma execução real (CI, migração aplicada, teste rodado) ou
declara explicitamente que a evidência não existe.

---

## O que foi corrigido nesta volta

| # | Correção | Migração | Evidência |
| --- | --- | --- | --- |
| #778 | M-CHAT remoto deixa de se apresentar como R/F sem aplicar o Follow-Up | — | `check-remote-scale-clinical-truth.mjs`: 6 instrumentos íntegros, sem alegação de Follow-Up não executado |
| #779 | Identidade canônica de e-mail case-insensitive | 0022 | **Aplicada em produção**: preflight sem colisão, `idx_users_email_canonical` verificado no D1 real (run `33972872374`) |
| #780 | Auditoria atômica de envios clínicos públicos + fim do bypass do rate limiter de reset | 0023 | `public_submission_audit_log` metadata-only no mesmo `db.batch()` da submissão; regressões verificadas falhando com o defeito reintroduzido |
| #781 | Verificação de posse do e-mail no cadastro externo | 0024 | Aberto; suíte `email-verification.test.ts` e jornada de aceite verdes sobre a main atual |
| #784 | Vitrine pública `/planos` + smoke de produção agendado | — | Aberto; contratos novos verificados falhando com o defeito reintroduzido |

### Causa-raiz do CI vermelho de #780/#781

Não era defeito de código. `migration-prefix-guard` exige sequência contígua e
`check-migration-governance.py` exige um prefixo por PR aberto. Os quatro PRs
nasceram do mesmo commit-base, então 0022/0023/0024 disputavam o mesmo espaço.
A correção foi **ordenar**, não afrouxar guarda: 0022 → 0023 → 0024, cada um
sincronizado com a main depois do anterior. Nenhum guard foi editado para
passar.

---

## Sellability Score — 68/100

Pontuação atribuída contra evidência, sem arredondar para cima.

| Domínio | Peso | Nota | O que sustenta / o que falta |
| --- | --- | --- | --- |
| Segurança | 15 | **12** | Fail-closed em auth/tempo/rate limit, SQL parametrizado, sem PHI em log, suítes adversariais. Falta: P0 #514 (cifra de dado clínico persistido) e P0 #515 (revogação de credencial histórica) seguem abertos. |
| Tenant isolation | 10 | **9** | Jornada de aceite prova duas clínicas coexistindo com adversarial cross-tenant; decisão sempre server-side, nunca por `clinic_id` do cliente; guard dedicado em CI. |
| Auth | 10 | **8** | Identidade agora estrutural no banco; rotação de refresh com detecção de reuso; reset com token de uso único. Verificação de e-mail existe mas ainda não está na main (#781). |
| Billing | 10 | **7,5** | Domínio provider-agnostic, preço centralizado, webhook com comparação em tempo constante, ledger idempotente, entitlement server-side, trial/past_due/carência/suspensão/cancelamento — tudo com teste adversarial. Falta: nenhuma cobrança real jamais percorreu o provedor em produção. |
| Onboarding externo | 10 | **5** | Todo o caminho existe em código. Falta: `SAAS_SIGNUP_ENABLED` fechada em produção e nenhum passo leva o novo dono da clínica ao checkout — ele precisa achar `/configuracoes` sozinho. |
| LGPD | 10 | **7,5** | Consentimentos versionados, executor de eliminação com lease/replay/idempotência, retenção, legal hold, e agora trilha dos envios públicos (0023). Falta: #630 e #685 abertos. |
| Observabilidade | 10 | **5** | `/api/health` real, logs estruturados, e (em #784) smoke de produção horário — antes disso o smoke existia e **nenhum workflow o executava**. Falta: métricas, latência, taxa de erro, reconciliação de billing, monitor dos jobs de background. |
| Backup / DR | 5 | **2** | Runbook completo e honesto em `docs/D1_DISASTER_RECOVERY_RUNBOOK.md`. Falta: RPO `NÃO VERIFICADO`, RTO `DESCONHECIDO`, nenhum rehearsal de restore executado. Backup sem restore testado não conta. |
| UX comercial | 10 | **6** | Equipe, papéis, assentos, assinatura e encerramento existem em `/configuracoes`; `/planos` entra em #784. Falta: painel com utilização e um caminho guiado do cadastro até o pagamento. |
| Verdade clínica | 5 | **3,5** | M-CHAT corrigido, guard travando a reincidência, nenhuma escala emite diagnóstico. Falta: #629 (bloquear instrumentos incompletos/licenciados) aberto. |
| Release governance | 5 | **3** | CI extenso, governança de migração fail-closed, deploy no mesmo SHA. Falta: não consegui confirmar daqui o estado vivo da proteção de `main`; `HUMAN_ACTION_REQUIRED.md` ainda descreve #584 como aberto, e #584 foi fechada em 01/09 — documentação e realidade divergem. |

**Maturidade: M2 — HARDENED.**

Não é M3 (PILOT READY) por um motivo objetivo, não estético: com
`SAAS_SIGNUP_ENABLED` fechada, nem o cadastro aberto **nem o aceite de
convite** criam identidade de login. Nenhum piloto, mesmo controlado, começa
sem que um operador abra essa flag.

---

## Bloqueadores que nenhum PR alcança

Todos exigem credencial ou console de provedor. Procedimento exato:

1. **Cadastro externo fechado** — Cloudflare Pages → projeto NeuroPed →
   Settings → Environment variables → `SAAS_SIGNUP_ENABLED=true` (produção).
   Enquanto estiver fechada, `/planos` informa o preço e o visitante não
   consegue concluir a compra sozinho.
2. **Entrega de e-mail não configurada** — mesmas variáveis:
   `AUTH_PUBLIC_APP_URL` (https obrigatório), `AUTH_RESEND_API_KEY`,
   `AUTH_EMAIL_FROM`. Sem elas, `emailVerificationConfigured()` devolve
   `false`, nenhuma confirmação sai e (depois de #781) nenhuma conta nova
   cria clínica. Recuperação de senha responde 202 genérico sem emitir token.
3. **Cobrança nunca exercida de verdade** — `ASAAS_API_KEY`,
   `ASAAS_WEBHOOK_TOKEN`, `ASAAS_ENVIRONMENT`. Um checkout sandbox ponta a
   ponta, com webhook chegando e entitlement virando `active`, é o menor
   experimento que transforma "billing testado" em "billing comprovado".
4. **Restore nunca ensaiado** — executar as etapas A–I do
   `D1_DISASTER_RECOVERY_RUNBOOK.md` num alvo isolado e preencher RPO/RTO com
   número medido. Exige `CLOUDFLARE_API_TOKEN` com escopo de D1.
5. **Proteção de `main` não confirmada** — verificar se o ruleset
   `main-production` está ativo e reconciliar `HUMAN_ACTION_REQUIRED.md` com o
   fechamento de #584.

---

## Maior delta remanescente

Observabilidade e Backup/DR são as duas menores notas proporcionais (5/10 e
2/5) e as duas onde a falha é silenciosa. Depois de #781 e #784 entrarem, a
próxima intervenção de maior valor é o rehearsal de restore — porque é o único
gate onde "não sabemos" e "não funciona" são indistinguíveis até o dia do
incidente.
