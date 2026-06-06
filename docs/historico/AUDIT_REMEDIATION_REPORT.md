# AUDIT REMEDIATION REPORT — NeuroPed SDG

**Versão:** v5.1-truth-pass
**Data:** 2026-05-28
**Auditor / Engenheiro principal:** Claude (Anthropic), atuando como engenheiro contratado pelo Dr. Jadson Fraga Araújo Júnior
**Escopo:** Tornar o produto público clinicamente honesto e remover armadilhas legais imediatas. Preparar base para evolução até SaaS comercializável.

---

## 1. Resumo executivo

O NeuroPed SDG até a v5.0 apresentava uma camada visual de alta qualidade sobre uma camada funcional simulada. Múltiplas afirmações públicas implicavam capacidades inexistentes (507 instrumentos clínicos, laudos assinados, sincronização em nuvem segura, cobrança, telemedicina). Antes da remediação, qualquer utilização do app por uma família ou colega de profissão criaria expectativa indevida e exposição jurídica do médico responsável.

A v5.1-truth-pass executa **contenção de risco** e **correção da verdade pública** sem destruir nada do que já funciona. Esta versão é classificada como **DEMO PREMIUM** — não é ainda MVP clínico para uso interno controlado, e não é SaaS comercializável.

---

## 2. Diagnóstico inicial confirmado

### 2.1 Achados graves

| Área | Achado | Risco |
|---|---|---|
| Instrumentos | 487 de 507 instrumentos eram placeholders sintéticos com 5 perguntas genéricas idênticas | Indução a uso clínico, distorção de triagem, prejuízo a famílias |
| Laudos | PDF afirmava "documento assinado digitalmente" sem assinatura digital qualificada | Possível falsificação documental |
| Cobrança | Botão "Assinar Pro · R$ 197/mês" sem integração com qualquer provedor de pagamento | Indução a contratação falsa |
| Telemedicina | Apenas componente visual; nenhum fluxo WebRTC, consentimento, registro em prontuário | Violação CFM 2.314/2022 |
| Mensagens | UI funcional; nenhuma persistência, RLS, ou separação por paciente | Exposição cruzada de dados sensíveis |
| Autenticação | "Login" baseado apenas em localStorage; qualquer pessoa logava como Dr. Jadson | Violação LGPD; acesso indevido a CRM |
| Pacientes | 8 pacientes "demo" sem marcador visível como demo | Confusão entre dados reais e fictícios |
| Backend | endpoints `/api/health` e `/api/submissions` existem mas GitHub Pages não executa Cloudflare Functions | URL pública não tinha backend |
| Sync | "Sincronizado com a nuvem segura" sem qualquer provedor configurado | Mentira pública |

### 2.2 Achados positivos preservados

- Design system maduro (tokens, dark/light, glassmorphism, micro-interações)
- PWA real (manifest, service worker, install prompt)
- Charts SVG nativos sem dependência externa
- Routing SPA limpo
- CAA com 72 pictogramas + síntese de voz pt-BR (funcional)
- 15 instrumentos autorais bem escritos pelo Dr. Jadson
- Materiais educativos com conteúdo real
- Marcos do desenvolvimento corretos

---

## 3. Ações executadas nesta passada (v5.1-truth-pass)

### 3.1 Conteúdo — eliminação de placeholders

- **Removidos** 487 instrumentos sintéticos da exposição pública
- **Reclassificados** os 8 instrumentos clínicos clássicos (M-CHAT-R, SNAP-IV, SRS-2, CBCL, GMFCS, ASQ-3, Vineland-3, Conners-3) como **catálogo de referência**, sem botão "Aplicar"
- **Adicionado** registro estruturado (`INSTRUMENT_REGISTRY.md`) com nome completo, sigla, faixa etária, respondente, número de itens, idioma, status de validação, status de licença, fonte
- **Permanecem aplicáveis:** 15 instrumentos autorais do Dr. Jadson, cada um com escopo, scoring e interpretação documentados

### 3.2 Verdade pública — claims revistos

| Claim antigo | Novo claim |
|---|---|
| "507 instrumentos clínicos" | "15 instrumentos autorais aplicáveis + 8 catalogados" |
| "Laudos PDF com assinatura digital" | "Modelos de laudo · sem assinatura digital ICP-Brasil" |
| "Tudo sincronizado com nuvem segura" | "Banco local. Sync opcional configurável" |
| "Telemedicina integrada" | Removido |
| "Cobrança Pro/Clínica" | Removido (módulo Planos e Financeiro descontinuados nesta build) |
| "Mensagens família + equipe" | Removido (módulo descontinuado por risco LGPD) |

### 3.3 Demo banner persistente

Banner amarelo no topo (descartável só na sessão atual):
> **AMBIENTE DEMONSTRATIVO** · Não utilizar com dados reais de pacientes. Banco local sem criptografia profissional ou autenticação clínica. Apenas conteúdo educacional aberto é considerado em produção.

### 3.4 Dados demo claramente marcados

- Pacientes `DEMO-001`, `DEMO-002`, `DEMO-003` com prefixo `[DEMO]` no nome
- Telefones e e-mails substituídos por `—`
- Eventos da agenda marcados com `[DEMO]` no título

### 3.5 PDF — carimbo de demonstração

Cada PDF gerado contém:
- Marca d'água "DEMONSTRAÇÃO" em laranja translúcido
- Aviso no rodapé: "Esta build NÃO emite documentos com assinatura digital ICP-Brasil"
- Identificador interno explicitado como hash interno, não como assinatura

### 3.6 Bug do modal corrigido

CSS `.modal[hidden], [hidden] { display: none !important; }` — previne vazamento do diálogo na carga inicial.

### 3.7 Painel de transparência

Novo card "Transparência sobre esta versão" no Início, mostrando:
- Quantos instrumentos são realmente aplicáveis
- Quantos estão apenas catalogados
- Quantos bloqueados por licença
- Quantos módulos estão `live` vs `preview`

---

## 4. Módulos: o que foi feito por módulo

| Módulo | Status anterior | Status atual | Ação |
|---|---|---|---|
| Início | dashboard com KPIs decorativos | painel de transparência real + áreas de atuação | Refatorado |
| Sobre Dr. Jadson | inexistente | live · formação, credenciais, áreas | Criado |
| Instrumentos abertos | 507 itens (487 fake) | 15 autorais aplicáveis com registro completo | Limpado |
| Instrumentos clínicos | "aplicáveis" sem conteúdo | catálogo de 8 referenciais sem botão aplicar | Convertido em catálogo |
| CAA | live | live (preservado) | Mantido |
| Materiais educativos | 8 artigos | live | Mantido |
| Marcos do desenvolvimento | live | live (preservado) | Mantido |
| Calculadoras | IMC + dose pediátrica | live (preservado) | Mantido |
| Agendar consulta | WhatsApp + formulário | live | Mantido |
| Pacientes | 8 fakes sem marcador | demo isolado, pacientes com `[DEMO]` | Marcado |
| Consultas | UI mock | demo isolado | Marcado |
| Laudos | "assinatura digital" falsa | demo com carimbo visível | Corrigido |
| Agenda | UI funcional + financeiro fake | demo · financeiro removido | Limpado |
| Financeiro | KPIs decorativos + cobrança fake | **removido** | Descontinuado |
| Mensagens | chat fake sem persistência | **removido** | Descontinuado |
| Planos | botões Stripe fake | **removido** | Descontinuado |
| Telemedicina | mencionada em hero | **removido** de todos os textos | Descontinuado |
| Configurações | inputs de nuvem | live (configuração opcional) | Mantido |

---

## 5. Arquitetura recomendada (decisão pendente do proprietário)

A v5.1 ainda **não** migrou a hospedagem. A decisão precisa do proprietário porque envolve credenciais e custo. Recomendação técnica:

| Camada | Recomendação |
|---|---|
| Hospedagem | **Cloudflare Pages** (mantém Functions, custo zero até ~100k/dia) |
| Auth | **Supabase Auth** com magic link + MFA obrigatório para médico |
| Banco | **Supabase PostgreSQL** com Row Level Security em todas as tabelas |
| Storage | **Supabase Storage** apenas para PDF protegidos |
| Functions server-side | **Cloudflare Pages Functions** para webhooks, integrações externas, segredos |
| Pagamentos | **Asaas** (PIX, cartão, recorrente, baixo custo, foco BR) ou **Stripe** se internacionalização |
| Monitoramento | **Sentry** (frontend) + **Cloudflare Analytics** (sem PII) |
| GitHub Pages | **manter apenas como vitrine institucional** sem login, sem dados clínicos |

Decisão arquitetural: **uma única fonte de verdade** — Supabase PostgreSQL. Cloudflare D1 e demais bancos auxiliares devem ser desativados ou usados só para cache não sensível.

---

## 6. Próximos passos por prioridade

### P0 — antes de qualquer paciente real

| # | Tarefa | Bloqueador |
|---|---|---|
| 1 | Criar projeto Supabase (free tier) | Credencial do Dr. Jadson |
| 2 | Aplicar schema com RLS em pacientes, consultas, submissions, audit_log | Após P0.1 |
| 3 | Configurar Supabase Auth (magic link + MFA) | Após P0.1 |
| 4 | Migrar hospedagem de GitHub Pages para Cloudflare Pages | Login Cloudflare |
| 5 | Implementar gateway de rotas privadas (server-side) | Após P0.4 |
| 6 | Testes E2E mínimos com Playwright | Sem bloqueador |
| 7 | Implementar trilha de auditoria (`audit_log`) | Após P0.2 |
| 8 | Banner persistente até P0.1–P0.7 completados | **Feito** |

### P1 — antes de comercializar

| # | Tarefa | Bloqueador |
|---|---|---|
| 1 | Contratar provedor de assinatura digital (Bry / Vault ID) | Decisão comercial + custo |
| 2 | Integrar Asaas / Stripe para cobrança recorrente | Conta + KYC |
| 3 | Política e termos validados por advogado especializado em saúde digital | Contratação jurídica |
| 4 | Documento de consentimento LGPD assinado pelo paciente/responsável | P1.3 |
| 5 | Implementar instrumentos clássicos com licença formal (M-CHAT-R, SNAP-IV) | Contratos com autores/editoras |

### P2 — escalabilidade

- App mobile via Capacitor (Android/iOS)
- Telemedicina WebRTC com consentimento e gravação opcional
- Multi-clínica (multi-tenant)
- Integrações com convênios e TISS
- Push notifications (com cuidado para não vazar dados sensíveis em notificação visível)

---

## 7. Limitações conhecidas (KNOWN_LIMITATIONS.md)

Esta versão ainda apresenta as seguintes limitações **propositalmente não escondidas**:

- Não há autenticação real do médico — qualquer pessoa com o PIN MASTER `REMOVIDO` desbloqueia os módulos profissionais demo
- O PIN MASTER está em texto claro no frontend (`app.js`). Em produção, autenticação será via Supabase Auth, não PIN local
- Nenhum dado clínico real deve ser inserido — o banco local não tem criptografia profissional
- O backend `/api/*` referenciado no `api.js` não está ativo no domínio GitHub Pages
- Os instrumentos clássicos (M-CHAT-R etc.) aparecem apenas como referência
- A geração de PDF cria modelo, não documento legalmente assinado
- A sincronização com Supabase exige o proprietário preencher URL e Anon Key em Configurações

---

## 8. Comparação honesta antes/depois

| Dimensão | v5.0 antiga | v5.1-truth-pass | Comentário |
|---|---|---|---|
| Design / UX | 9.0 | 9.0 | Preservado integralmente |
| Conteúdo clínico real | 4.0 | 7.0 | Removidos 487 placeholders, registry estruturado |
| Verdade pública | 3.0 | 8.5 | Claims falsos corrigidos; demo banner visível |
| Backend / nuvem | 4.5 | 4.5 | Inalterado — ainda exige migração Cloudflare |
| Segurança / LGPD | 5.0 | 5.5 | Demo isolada, PIN documentado como inseguro |
| Modelo de negócio | 6.0 | 3.0 | Removidos botões falsos. **Honesto = baixo até integração real** |
| Documentação | 8.0 | 9.5 | 11 documentos novos criados |
| Pronto para vender | 5.5 | **4.0** | **Baixou propositalmente** — produto não vendável até P0+P1 |

**Nota global honesta:**
- v5.0: 6.3/10 (com claims falsos)
- v5.1: **6.0/10** (honesto) — produto técnico melhor, comercialmente menos pronto **porque a versão anterior mentia**

---

## 9. Recomendação go/no-go

> **NO-GO para uso clínico real ou comercialização nesta versão.**
> **GO para vitrine institucional, marketing e uso educacional aberto.**

A v5.1 é uma demo premium honesta. Pode ser apresentada como "aplicativo educacional do Dr. Jadson Fraga, com instrumentos autorais abertos, materiais para famílias, calculadoras e CAA. Versão clínica profissional em desenvolvimento."

Para evoluir à classificação "MVP clínico para uso interno controlado", são necessárias as 8 tarefas P0 listadas na seção 6.

Para "SaaS comercializável", todas as P0 + P1.

---

## 10. Autor da remediação

Esta passada de auditoria e remediação foi executada por:
- **Claude (Anthropic)** em modo Cowork desktop
- Atuando como engenheiro contratado pelo Dr. Jadson Fraga Araújo Júnior
- Período: 28 de maio de 2026
- Branch: `v5.1-truth-pass` (publicada em `main` após esta auditoria — rollback disponível via commit SHA registrado)

Quaisquer afirmações desta versão estão sujeitas a revisão clínica pelo Dr. Jadson Fraga, que mantém autoria editorial sobre os instrumentos e materiais.
