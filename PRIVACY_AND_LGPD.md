# PRIVACY AND LGPD — NeuroPed SDG

**Status atual:** **NÃO CONFORME** para uso com dados reais de pacientes.
**Versão:** v5.1-truth-pass

Este documento estabelece o que precisa ser feito para que o NeuroPed SDG esteja em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018) antes de qualquer uso clínico real.

---

## 1. Base legal aplicável

| Tratamento | Base legal LGPD |
|---|---|
| Cadastro de paciente | Consentimento informado (art. 7, I) ou execução de contrato de prestação de serviço médico |
| Dados de saúde | Tutela da saúde (art. 11, II, f) — exclusiva para profissionais |
| Comunicação com responsável | Consentimento |
| Marketing | Consentimento específico (art. 8) |
| Trilha de auditoria | Cumprimento de obrigação legal e exercício regular de direitos |

Dados de saúde são **sensíveis** (art. 5, II). Exigem tratamento reforçado.

---

## 2. Direitos do titular (art. 18)

A plataforma DEVE oferecer ao paciente / responsável:

| Direito | Como implementar |
|---|---|
| Confirmação de tratamento | Portal família com listagem do que está sendo tratado |
| Acesso aos dados | Download em formato estruturado |
| Correção de dados | Form de solicitação que vira ticket para o médico |
| Anonimização ou exclusão | Botão "solicitar exclusão" com fluxo controlado |
| Portabilidade | Export JSON / PDF padronizado |
| Informação sobre uso compartilhado | Lista clara de operadores (Supabase, Cloudflare, etc.) |
| Revogação de consentimento | Botão "revogar consentimento" |

Nenhum desses fluxos está implementado na v5.1.

---

## 3. Controlador, operador e DPO

| Papel | Responsabilidade |
|---|---|
| Controlador | Dr. Jadson Fraga Araújo Júnior (decide finalidades) |
| Operador | NeuroPed SDG (software) + Supabase + Cloudflare (infraestrutura) |
| Encarregado (DPO) | A designar — pode ser o próprio Dr. Jadson em um primeiro momento |

Contato do DPO deve ser publicado na seção de privacidade do app.

---

## 4. Operadores subcontratados

Em produção, os seguintes terceiros processam dados:

| Operador | Função | Localização |
|---|---|---|
| Supabase Inc. | Banco e Auth | EUA (verificar opção SA) |
| Cloudflare Inc. | Hosting e CDN | Global |
| Bry / Vault ID (futuro) | Assinatura digital | Brasil |
| Asaas / Stripe (futuro) | Pagamentos | Brasil / EUA |

Cada um exige contrato de processamento de dados (DPA) assinado.

---

## 5. Princípios LGPD aplicados ao produto

| Princípio (art. 6) | Como aplicar |
|---|---|
| Finalidade | Cada coleta deve ter finalidade declarada e específica |
| Adequação | Coletar apenas o necessário |
| Necessidade | Eliminar campos não essenciais (ex.: CPF não obrigatório) |
| Livre acesso | Portal de transparência |
| Qualidade dos dados | Permitir correção |
| Transparência | Política clara e acessível |
| Segurança | Criptografia em trânsito (TLS) e em repouso |
| Prevenção | Antecipar incidentes via design |
| Não discriminação | Não usar dados para discriminar acesso |
| Responsabilização | Manter registros e auditoria |

---

## 6. Notificação de incidente

Em caso de vazamento envolvendo riscos relevantes:
- Notificar a ANPD em **prazo razoável** (entendido como 72h pelo mercado)
- Notificar o titular afetado
- Documentar: o que ocorreu, dados envolvidos, medidas mitigadoras, riscos
- Manter o registro do incidente

Esta plataforma precisa ter um processo escrito e treinado antes de receber pacientes reais.

---

## 7. Avaliação de Impacto à Proteção de Dados (RIPD)

Para dados de saúde de menores, é recomendável produzir um RIPD documentando:
- Finalidades
- Necessidade e proporcionalidade
- Riscos
- Medidas de mitigação
- Consentimento

Modelo de RIPD pode ser baseado no guia da ANPD.

---

## 8. Crianças e adolescentes (art. 14)

Tratamento de dados de crianças exige:
- Consentimento específico do responsável
- Interesse legítimo da criança
- Informações claras e acessíveis aos pais
- Não condicionar serviços ao consentimento para finalidades secundárias (marketing)

A plataforma DEVE separar:
- consentimento para tratamento clínico (obrigatório para usar o serviço)
- consentimento para comunicações de marketing (opcional)

---

## 9. Itens implementados na v5.1

- ✓ Banner persistente "AMBIENTE DEMONSTRATIVO · não usar com dados reais"
- ✓ Marcação `[DEMO]` em todos os pacientes fictícios
- ✓ PDF gerado leva carimbo "DEMONSTRAÇÃO"
- ✓ Documento `KNOWN_LIMITATIONS.md` público
- ✓ Documento `SECURITY.md` honesto sobre não-conformidade atual

## 10. Itens NÃO implementados (bloqueadores LGPD)

- ✗ Termo de uso revisado por advogado
- ✗ Política de privacidade revisada por advogado
- ✗ Consentimento informado registrado em banco
- ✗ Direitos do titular implementados (art. 18)
- ✗ DPO designado oficialmente
- ✗ DPAs com operadores assinados
- ✗ Notificação de incidente protocolada
- ✗ Criptografia em repouso para dados sensíveis
- ✗ Mascaramento de PII em logs

Sem todos esses itens marcados como concluídos, **não tratar dados reais de pacientes** na plataforma.

---

## 11. Recomendação imediata

Antes do primeiro paciente real:
1. Contratar advogado especializado em saúde digital
2. Produzir termo de uso e política de privacidade conformes
3. Implementar fluxo de consentimento
4. Implementar trilha de auditoria
5. Implementar direitos do titular
6. Assinar DPAs com Supabase e Cloudflare
7. Designar DPO formalmente
8. Treinar equipe na resposta a incidente

Este é um documento jurídico-técnico. Revisão por profissional do direito é obrigatória antes de publicar como política oficial.
