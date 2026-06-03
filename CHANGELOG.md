# Changelog — NeuroPed EDJ

## v6.44.14 — 2026-06-03 — Evidência verificada: +6 instrumentos no registry

- `evidence-registry.json` (curadoria autorizada pelo Dr. Jadson): adicionadas 6 entradas
  curadas com fonte primária e PMID rastreável — **ofc-psc** (PSC-17, Gardner 2007),
  **ofc-swyc** (SWYC Milestones, Sheldrick 2013), **ofc-rcads** (Chorpita 2000),
  **ofc-phq-gad** (PHQ-A Johnson 2002 + GAD-7 Spitzer 2006), **ofc-crafft** (Knight 2002)
  e **ofc-minimacs** (Eliasson 2017). Total: 13 instrumentos curados, todos validados pelo
  `validateRegistry` (PMID obrigatório). Fontes verificadas no PubMed.

## v6.44.10 — 2026-06-03 — Testes diretos lúdicos + celebrações de progresso

Adiciona **5 mini-testes interativos** aplicados na criança em página própria
(`testes-diretos.html`), com UI tipo Duolingo, e camada de **micro-celebrações**
em 25/50/75/100% das escalas longas.

**Novo módulo `testes-diretos.html` + `testes-diretos-engine.js`** (motor puro)
- 🔢 **Span de Dígitos** — dígito aparece em tela cheia, criança toca no teclado
  numérico pra repetir; trava em direta após erro, parte pra inversa; mede maior
  span correto. Forward/backward separados.
- 🧠 **Memória de Figuras** — 4 emojis aparecem por 4s, depois grid de 8 pra
  apontar quais estavam ali. 3 rodadas. Score = corretos − erros.
- 🔍 **Atenção Visual** — grid 5×5 com 24 distratores + 1 alvo (gatinho entre
  cachorrinhos, maçã vermelha entre verdes, etc). 5 rodadas. Cronometra tempo
  médio e erros.
- 🌗 **Inibição Dia/Noite** — clássica de função executiva: palavra DIA aparece,
  criança toca em NOITE. 10 rodadas, 4 pares. Acerto + tempo médio.
- 🎵 **Consciência Fonológica** — som inicial, rima e contagem de sílabas. 5
  perguntas com 3 opções cada. Hint clínico no feedback.

Cada teste salva resultado em `np_direct_tests_session_v1` com uma linha pronta
pro laudo. Sumário exporta tudo via clipboard.

**Camada `instrumento-celebrations.js`**
- Hook em `#answered` via MutationObserver. Dispara toast central animado em
  25/50/75/100% das respostas: 🌱 ⭐ 🚀 🏆.
- Respeita `prefers-reduced-motion` (sem animação).
- Idempotente (cada milestone só uma vez) + cleanup em `pagehide`.

**Wiring**
- Card "Testes Diretos" adicionado ao `central-atalhos.html` (faixa principal).
- SW precache atualizado (`v6.44.10`) com os 3 arquivos novos.
- Suite estática preservada em 740+ OK / 0 falhas.

## v6.44.9 — 2026-06-03 — Unificação do progresso/fadiga

- O runner `escala.html` passa a usar o helper compartilhado **`NeuroPedProgress`**
  (`scales-progress.js`) como fonte única de salvar/retomar e do plano de blocos
  (`blockPlan`/`isLong`), no lugar da lógica própria. Sem duplicar storage; o bloco
  de retomada é derivado das respostas (abre no primeiro item ainda sem resposta).

## v6.44.7 — 2026-06-03 — Runner: coach, blocos e testes diretos

Camada exclusiva do **runner `escala.html`** (não toca a taxonomia/medalhas/curadoria já em produção).

### Adicionado
- **`scales-question-coach.js`** — humaniza cada pergunta do runner: emoji contextual,
  exemplos do dia a dia (📌) e microexplicação de "o que observar" (👀). Roteia por
  25 temas clínicos (texto do item + domínio/keywords), com segurança em primeiro lugar.
- **`scales-direct-tasks.js`** — biblioteca de **testes diretos aplicados na criança**
  (reconhecimento de letras, consciência fonológica, span de dígitos, nomeação rápida,
  leitura, atenção/inibição, observação social, motor…), roteada por domínio e idade.

### Melhorado — `escala.html`
- Cada pergunta com emoji + bloco recolhível "Exemplos e o que observar".
- **Anti-fadiga:** escalas com mais de 7 itens divididas em **blocos** de 6, com
  navegação, dots de etapa e bloco atual salvo.
- **Progresso salvo** por criança + instrumento (retoma de onde parou).
- Linha "🎯 Para que serve" e seção "🎯 Testes diretos sugeridos".

## v5.1 — 2026-05-28 — Truth-Pass

### Removido (correção da verdade pública)
- 487 instrumentos sintéticos com perguntas-placeholder
- Botões e textos de cobrança ("Pro R$197/mês", "Clínica R$497/mês")
- Módulo "Financeiro" (KPIs falsos, cobrança fake)
- Módulo "Mensagens" (sem persistência segura, risco LGPD)
- Módulo "Planos" (assinaturas fake)
- Menções a "Telemedicina integrada" em todos os textos
- Claim "Laudos PDF com assinatura digital" (substituído por aviso correto)
- Claim "Tudo sincronizado com nuvem segura"
- Auth multi-perfil simulado (não havia segurança real)

### Adicionado
- Banner persistente "AMBIENTE DEMONSTRATIVO" no topo
- Painel de transparência no Início (números honestos)
- Status badges por instrumento (`live`, `preview`, `gated`, `catalog`, `licensed`)
- Carimbo "DEMONSTRAÇÃO" em PDFs gerados
- Marcação `[DEMO]` em todos os pacientes fictícios
- Registry estruturado de instrumentos com 15 campos obrigatórios
- Catálogo de 8 instrumentos clássicos como REFERÊNCIA (sem botão aplicar)
- Aviso de "licença comercial obrigatória" para SRS-2, CBCL, ASQ-3, Vineland-3, Conners-3

### Documentação criada
- `AUDIT_REMEDIATION_REPORT.md`
- `INSTRUMENT_REGISTRY.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `PRIVACY_AND_LGPD.md`
- `KNOWN_LIMITATIONS.md`
- `GO_LIVE_CHECKLIST.md`
- `CHANGELOG.md` (este arquivo)

### Corrigido
- Bug do modal "Confirmar ação" aparecendo na tela inicial (`.modal[hidden]` agora respeitado pelo CSS)

### Preservado
- Design system completo (tokens, dark/light, glassmorphism, animações)
- 15 instrumentos autorais do Dr. Jadson Fraga
- 8 materiais educativos
- 9 marcos do desenvolvimento
- 2 calculadoras (IMC, dose pediátrica)
- CAA com 72 pictogramas + voz pt-BR
- Página institucional do Dr. Jadson
- Página de contato com WhatsApp direto
- Service Worker para conteúdo público offline
- PIN MASTER `FRAGA1108` (documentado como NÃO sendo mecanismo de segurança)

### Nota honesta sobre o status
Esta versão tem propositalmente menor "perfeição comercial aparente" que a v5.0. Isso é correto: a v5.0 enganava. A v5.1 é honesta.

---

## v5.0 — 2026-05-28 — Modo único + PIN

### Adicionado
- Modo único de acesso (removidas telas multi-perfil)
- PIN MASTER para módulos clínicos
- 12 módulos públicos vs clínicos
- Página "Sobre o Dr. Jadson"
- Página "Materiais educativos"
- Página "Marcos do desenvolvimento"
- Página "Calculadoras"
- Página "Agendar consulta" com WhatsApp

### Removido
- Onboarding em 3 telas
- Tela de login multi-perfil
- Multi-profile (médico/secretária/família)

### Limitações (corrigidas em v5.1)
- Claims falsos ainda presentes
- Placeholders de instrumentos ainda contados como aplicáveis

---

## v4.0 — 2026-05-28 — Edição "Comercial"

### Adicionado
- Sistema de autenticação multi-perfil (simulado)
- 12 módulos comerciais
- Telas de planos (Starter, Pro, Clínica)
- Cobrança simulada
- Mensagens simuladas
- Telemedicina visual

### Auditado em v5.1
Esta versão recebeu auditoria honesta concluindo que múltiplos módulos eram demonstrações sem implementação real.

---

## v3.0 — 2026-05-28 — Migração para PWA modular

### Adicionado
- SPA com hash router
- Service Worker
- Manifest com shortcuts
- Cliente Cloud opcional (Supabase + Cloudflare)

---

## v1.x–v2.x — Anterior a 2026-05

Múltiplas iterações estáticas com HTML separado por escala.

---

## Princípios de mudança a partir de v5.1

A cada mudança, perguntar:
1. Esta funcionalidade existe de fato ou é apenas demonstração visual?
2. Esta funcionalidade pode ser usada com dados reais com segurança?
3. Esta documentação descreve a realidade, ou aspiração?
4. Algum claim público fica desatualizado por esta mudança?

Se a resposta a (1) ou (2) for "não", a funcionalidade DEVE estar marcada como demo/preview/gated.
Se a resposta a (3) for "aspiração", DEVE ser corrigido para realidade.
Se a resposta a (4) for "sim", DEVE ser corrigido no app antes do merge.
