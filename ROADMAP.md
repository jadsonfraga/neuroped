# ROADMAP — NeuroPed EDJ → SaaS vendável

Backlog priorizado. Atualizado a cada ciclo do loop de produto.
Critério de sucesso macro: um médico externo se cadastra sozinho, ativa, emite o primeiro laudo em <30 min e paga a assinatura — sem o criador tocar no processo.

## Now (Fase 0–1)
- [x] ✅ Ciclo 0 — Auditoria de prontidão (Painel 0–10) sobre o código real
- [x] ✅ Ciclo 1 — Trava anti-regressão: suíte `test:saas-self-service` verde localmente (exit 0) + guard `saas-loop-artifacts-static.test.mjs` na CI validando artefatos vivos e contrato de pricing canônico
- [x] ✅ ICP Solo decidido: neuropediatra que opera o próprio consultório; um profissional por assinatura inicial
- [x] ✅ Proposta de valor Solo alinhada na vitrine pública e nos artefatos GTM
- [ ] Fechar bloqueio externo Asaas: checkout + webhook real em ambiente autorizado (contrato fail-closed e runbook em `docs/ASAAS_OPERATIONAL_CONTRACT.md`; execução continua `BLOCKED_EXTERNAL`)
- [x] ✅ Ciclo 2 — Runbook de smoke pós-deploy publicável (`docs/SMOKE_CLIENTE_ZERO.md`): jornada cliente-zero clique a clique, critérios de aceite e medição de time-to-first-value
- [ ] Fechar bloqueio externo Resend (e-mail de verificação/convite em produção; contrato fail-closed e runbook em `docs/RESEND_OPERATIONAL_CONTRACT.md`; execução continua `BLOCKED_EXTERNAL`)
- [ ] Smoke pós-deploy publicado do fluxo cliente-zero (cadastro → clínica → paciente → documento). Script e workflow manual em `scripts/ops/cliente-zero-published-smoke.ts`; execução publicada continua `BLOCKED_EXTERNAL` (`docs/audits/BLOCKED_EXTERNAL_CLIENTE_ZERO_PUBLISHED_SMOKE_2026-10-17.md`)

## Next (Fase 2–3)
- [ ] Validar R$ 99/mês para um profissional em 10 entrevistas Solo e 3 pilotos pagos; não criar tiers antes da evidência
- [ ] Revisão jurídica formal de Política/Termos/LGPD (pendência declarada em `docs/COMPLIANCE_LGPD.md`; gap-list executável em `docs/LGPD_PRE_GO_LIVE.md`)
- [x] ✅ Ciclo 4 — Checklist LGPD pré-go-live (`docs/LGPD_PRE_GO_LIVE.md`): 8 fundamentos comprovados em código + 10 lacunas de processo com responsável, ordem e hard gates (B7, B10)
- [ ] DPO formal, retenção e DPA

## Later (Fase 4–5)
- [x] ✅ Ciclo 3 — Kit GTM reconciliado: roteiro de 10 entrevistas Solo (Mom Test) + oferta de piloto pago R$ 99/mês (`docs/GTM_ENTREVISTAS_E_PILOTO.md`)
- [ ] 10 entrevistas Solo com neuropediatras independentes; 3 pilotos pagos e 2 segundas faturas
- [ ] Oferta Clínica para equipes, papéis e múltiplos assentos — somente depois da validação Solo
- [ ] Instrumentação de funil (visitante → cadastro → ativação → assinatura → retenção)
- [ ] GTM: sociedades de neuropediatria, conteúdo médico ético, indicação
- [ ] Limites de engenharia, documentação, suporte

## Release comercial — P0 (25/10/2026, PR #1226 em draft)

- [ ] Aprovar/reconciliar PR #1226; branch em draft nao equivale a producao.
- [ ] Corrigir vulnerabilidades high em body-parser, zod, chromium-bidi e puppeteer-core (issue #480), sem acrescentar allowlist; reexecutar auditorias clinicas, lint, check, E2E e isolamento.
- [ ] Confirmar crypto, D1 e R2 no Cloudflare LIVE publicado; health sem blockers, exportacao sintetica executada e restore ensaiado.
- [ ] Comprovar verificacao por e-mail real no Resend e convites entregues.
- [ ] Comprovar transacao real no Asaas, webhook autenticado, idempotencia, entitlement e reconciliacao.
- [ ] Obter revisao juridica dos termos/privacidade, DPAs, protecao de criancas, IA e classificacao regulatoria de cada finalidade.
- [ ] Medir restore RPO/RTO e registrar simulacao de incidente.
- [ ] Auditar PANT/PANTY: versao/hash, aceite medico real, assinatura autorizada, QA integral de paginas.
- [ ] Executar jornada cliente-zero publicada, com cliente externo, documento sintetico, exportacao e cancelamento.
- [ ] Consolidar provas no scripts/ops/saas-release-gate.ts; o resultado nunca autoriza release sozinho.
- [ ] Entrevistar 10 medicos; validar tres pilotos pagos com segunda fatura; medir ativacao, tempo ate primeiro documento revisado, churn e margem.
- [ ] Desenvolver NeuroPed Evolution em PR separada: indicadores longitudinais auditaveis, proveniencia e validacao clinico-regulatoria antes de anunciar.

**Decisao atual: NO-GO comercial para uso clinico real**. Nao liberar signup, dados de criancas, assinatura, merge ou deploy sem os gates relevantes.
