# Auditoria Comercial NeuroPed — agosto/2026

> Diagnóstico de comercialização feito sob a ótica de um operador de produto:
> "acabei de adquirir este aplicativo — o que falta para ele vender mais,
> interessar mais famílias e ser desejado por outras clínicas?"

## 1. Diagnóstico

### Forças (raras em produtos de nicho)
- **Profundidade clínica fora de série**: centenas de escalas, filtro
  inteligente por queixa/idade, escalas interativas com PDF, fluxogramas,
  laudos, farmacologia, diários.
- **Jornada da família já existe**: Portal da Família, pré-consulta,
  pré-retorno, marcação com Secretaria IA, conteúdos educativos públicos.
- **Fundação SaaS pronta no backend**: multi-tenant (clínicas isoladas),
  papéis, convites por e-mail, billing por assento via Asaas
  (R$ 99/assento/mês, trial de 14 dias), webhook conciliado, entitlement
  fail-closed.
- **Engenharia de confiança**: dezenas de guards de regressão, separação
  estrita público × clínico, LGPD substantiva, criptografia server-side.

### Lacuna central encontrada
**O produto não tinha porta de entrada comercial.** Todo o motor de receita
existia no backend, mas nenhuma tela vendia, explicava ou permitia contratar:

1. Não havia página de **planos/preço** — uma clínica interessada não
   conseguia descobrir quanto custa nem iniciar o trial/checkout.
2. Não havia página **B2B ("para clínicas")** — nada apresentava o produto a
   um decisor de outra clínica.
3. O fluxo de billing (checkout Asaas, estado da assinatura, assentos) não
   tinha **nenhuma superfície no cliente**.

## 2. Implementado nesta auditoria

| Item | Entrega |
|------|---------|
| `/planos` | Vitrine do plano canônico (preço e trial importados de `shared/billing.ts` — fonte única com o backend) + gestão viva da assinatura: snapshot via `GET /api/billing/me?scope=finance`, estados trial/ativa/pendente/suspensa, seleção de assentos (1..500) e checkout real via `POST /api/billing/checkout` com redirecionamento ao Asaas. Degrada graciosamente: sem sessão vira vitrine com CTA de login; backend sem billing (503) vira orientação de contato. |
| `/para-clinicas` | Página B2B pública: proposta de valor (filtro, escalas interativas, jornada da família, operação, multi-clínica, LGPD), passo a passo de onboarding (conta → clínica → convites → trial) e compromissos de transparência. Sem depoimentos fabricados, sem dado clínico. |
| Navegação | "Planos & Assinatura" na seção Clínica e Acompanhamento; "NeuroPed para Clínicas" em Portais e Suporte. |
| Zona pública | Ambas as rotas aprovadas nos DOIS registros exigidos pela catraca de segurança: `client/src/lib/publicRoutes.ts` e o contrato independente em `scripts/guards/validate-public-split.mjs`. |
| `/minha-clinica` | Onboarding self-service do funil SaaS: criação da clínica na UI (`POST /api/tenants`, com tratamento de conflito de slug), painel de convites da equipe (`GET/POST/DELETE /api/billing/invitations` — convidar com papel, reenviar, revogar, copiar link do convite) e reuso da regra `canManageClinic` do domínio compartilhado. Rota clínica fail-closed (fora da allowlist pública). |
| **Trava anti-regressão** | Novo teste `tests/unit/commercial-pages-static.test.mjs` (script `test:commercial`, encadeado em `test:quick-wins` → roda no `verify:release`). Protege: rotas registradas de ponta a ponta; preço nunca hardcoded (fonte única `shared/billing.ts`); contratos de billing honrados (`scope=finance`, `clinicId`+`seats`, tratamento de 503); páginas públicas sem importar dados clínicos. |

Gates verificados antes do push: `tsc --noEmit`, ESLint, `test:commercial`,
`validate:public`, `audit:navigation`, `audit:access`, `test:quick-wins`
completo e `build:client`.

## 3. Backlog comercial priorizado (próximas ondas)

1. ~~Onboarding self-service completo na UI~~ — **implementado nesta
   auditoria** em `/minha-clinica` (criação de clínica + convites de equipe),
   ligado a partir de `/planos`.
2. **E-mails de ciclo de vida** — boas-vindas ao trial, aviso de expiração
   (D-3), recibo de pagamento e recuperação de past_due; reaproveitar o
   pipeline SMTP existente.
3. **Métricas de valor para o gestor** — painel "quanto a clínica usou":
   escalas aplicadas/mês, PDFs emitidos, famílias ativas no portal. É o
   argumento de renovação.
4. **Página pública com prova social real** — quando existirem clínicas
   clientes, depoimentos verdadeiros e números agregados anonimizados (nunca
   inventados).
5. **Compartilhamento que vende** — rodapé institucional discreto nos PDFs e
   relatórios enviados a famílias/escolas com link para `/para-clinicas`
   (aquisição orgânica via documento que circula).
6. **Precificação por segmento** — plano solo (1 assento) vs. clínica; o
   domínio `shared/billing.ts` já suporta múltiplos planos.

---

*Documento gerado durante a auditoria comercial autônoma na branch
`claude/neuroped-commercial-audit-e2faoh`.*
