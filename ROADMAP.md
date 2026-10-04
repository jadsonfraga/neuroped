# ROADMAP — NeuroPed EDJ → SaaS vendável

Backlog priorizado. Atualizado a cada ciclo do loop de produto.
Critério de sucesso macro: um médico externo se cadastra sozinho, ativa, emite o primeiro laudo em <30 min e paga a assinatura — sem o criador tocar no processo.

## Now (Fase 0–1)
- [x] ✅ Ciclo 0 — Auditoria de prontidão (Painel 0–10) sobre o código real
- [x] ✅ Ciclo 1 — Trava anti-regressão: suíte `test:saas-self-service` verde localmente (exit 0) + guard `saas-loop-artifacts-static.test.mjs` na CI validando artefatos vivos e contrato de pricing canônico
- [ ] Definir ICP inicial (decisão do criador; bloqueia posicionamento e pricing)
- [ ] Proposta de valor em uma frase validável
- [ ] Fechar bloqueio externo Asaas: checkout + webhook real em ambiente autorizado (hoje `BLOCKED_EXTERNAL`)
- [x] ✅ Ciclo 2 — Runbook de smoke pós-deploy publicável (`docs/SMOKE_CLIENTE_ZERO.md`): jornada cliente-zero clique a clique, critérios de aceite e medição de time-to-first-value
- [ ] Fechar bloqueio externo Resend (e-mail de verificação/convite em produção)
- [ ] Smoke pós-deploy publicado do fluxo cliente-zero (cadastro → clínica → paciente → documento)

## Next (Fase 2–3)
- [ ] Pricing híbrido: hoje preço único canônico R$ 99/profissional/mês (`shared/billing.ts:67`); avaliar 2–3 tiers e consumo
- [ ] Revisão jurídica formal de Política/Termos/LGPD (pendência declarada em `docs/COMPLIANCE_LGPD.md`)
- [ ] DPO formal, retenção e DPA
- [ ] Níveis de permissão já existem (owner/members); validar papéis secretaria vs. médico na prática

## Later (Fase 4–5)
- [ ] 10+ entrevistas com ICP; 3+ pilotos pagos
- [ ] Instrumentação de funil (visitante → cadastro → ativação → assinatura → retenção)
- [ ] GTM: sociedades de neuropediatria, conteúdo médico ético, indicação
- [ ] Limites de engenharia, documentação, suporte
