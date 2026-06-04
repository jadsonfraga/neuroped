# NeuroPed EDJ — Arquitetura do Copiloto Neuropediátrico

> **Framework executivo** de homogeneização visual + motor cognitivo clínico.
> De "software médico" para **copiloto neuropediátrico**: experiência única,
> inteligência contextual e percepção premium nível Stripe / Linear / Notion / Raycast.
>
> Este documento é o **prompt mestre arquitetural** desta evolução. Ele NÃO inventa
> um sistema novo — ele **mapeia o que já existe**, declara o que congelar, o que
> proibir e em que ordem ativar. Substitui (como documento) a "arquitetura executiva"
> de #248 que foi revertida em #249, agora sem mexer em código antes de cada onda
> ser aprovada.

---

## 0. Diagnóstico honesto — o que já existe (não refazer)

A premissa do prompt arquitetural ("crie um design system", "projete um motor clínico")
está **80% atendida no repositório**. O risco real não é *greenfield*; é **ativação,
migração e governança**. Tratar isto como construção do zero seria recriar débito e
repetir o ciclo que levou ao revert de #247/#248.

### 0.1 Design System — JÁ EXISTE
| Camada | Arquivo canônico | Estado |
|---|---|---|
| Design tokens (cor/espaço/raio/sombra/tipo/motion) | `tokens.css` | ✅ Fase 1 entregue |
| Componentes canônicos (`.np-*`) | `components.css` | ✅ entregue |
| Ponte de variáveis legadas → tokens | `ds-tokens.css` | ✅ aditiva, reversível |
| Auditoria de débito visual | `scripts/design-audit.mjs` | ✅ ferramenta entregue |
| Doc do sistema + plano de fases | `DESIGN-SYSTEM.md` | ✅ |
| Piloto visual | `ds-pilot.html` | ✅ |

**Gap real:** a **Fase 4 (migração tela a tela) está aberta**. O audit hoje mede:

```
Arquivos varridos: 85 · Com valores crus: 78 · Total de hits: 9.256
Top ofensores: styles.css(824) · neuroped-master-biblioteca.css(519)
               filtro-escalas.html(513) · escala.html(398) · perfil-crianca.html(349)
```

Esses 9.256 hits **são** a "inconsistência visual entre módulos" do prompt. Não é
opinião — é número auditável. A migração tem uma métrica objetiva de progresso.

### 0.2 Motor Cognitivo Clínico — JÁ EXISTE (porém INERTE)
A "Clinical Intelligence Layer V4" (`ARQUITETURA-CLINICA-V4.md`) entrega o motor que o
prompt pede — como **biblioteca inerte** (`window.NeuroPedCIL`), não carregada por
nenhuma tela nem pelo Service Worker:

| Capacidade pedida no prompt | Módulo que já entrega | 
|---|---|
| Timelines evolutivas automáticas | `clinical-timeline-engine.js` |
| Correlação de evolução terapêutica | `response-engine.js` (RTI, MCID, IC95) |
| Clusters / fenótipo por queixa | `phenotype-engine.js` |
| Carga terapêutica / burden familiar | `therapeutic-burden-engine.js` |
| Inconsistências entre fontes | `contradiction-engine.js` |
| Sugestão de conduta / lacunas | `clinical-decision-support.js` |
| Explicabilidade auditável | `clinical-explainability.js` |
| View-models (radar/heatmap/timeline) | `clinical-visual-schema.js` |
| Seleção de escala por idade+queixa | `scale-recommender.js` + `neuroped-scale-engine.js` |
| Intake autônomo (queixa → protocolo) | `intake.html` + `neuroped-preconsulta-filter.js` (#246) |

**Gap real:** falta (1) **config clínica validada pelo Dr. Jadson** (`clinical-config.js`
hoje é rascunho), (2) **wiring nas telas** (perfil/intake/secretária), (3) **precache no SW**.

### 0.3 Conclusão do diagnóstico
> Não vamos "construir o copiloto". Vamos **ligar** o copiloto que já está construído,
> **homogeneizar** as telas que o expõem e **blindar** contra regressão. O trabalho é
> 20% código novo, 80% migração + ativação + governança.

---

## 1. Princípios não-negociáveis (herdados — valem acima de qualquer onda)

Da `CARTA-DE-INTENCOES.md` e `ARQUITETURA-CLINICA-V4.md`. **Nenhuma onda pode violá-los.**

1. **Nada de clínica fabricada.** Severidade, polaridade, cutoffs, clusters, MCID e regras
   vêm de **config validada pelo médico**. Sem config → `insufficient_clinical_configuration`.
2. **Sem diagnóstico automático.** As engines *sinalizam*; o médico decide. Disclaimer em todo output.
3. **Explicável (sem caixa-preta).** Todo insight carrega `evidence[]`, `confidence`, `explanation`.
4. **LGPD-local.** Respostas no dispositivo; nada ao servidor sem consentimento.
5. **Honestidade de direção.** Sem polaridade configurada, não rotular melhora/piora.
6. **Reversibilidade.** Consolidação por redirect/revert (git), nunca apagar trabalho sem confirmação.
7. **Determinístico nesta fase.** Sem IA generativa em produção clínica sem validação. O "copiloto"
   é **orquestração explicável de engines determinísticas**, não um LLM solto sobre o paciente.

> O "copiloto" premium **não** é mágica generativa. É o sistema escolhendo a escala certa,
> organizando o intake, montando a timeline e justificando cada sinal — com o médico no centro.

---

## FASE 0 — FOUNDATIONS (congelar a fonte da verdade)

**Objetivo:** declarar `tokens.css` + `components.css` como **única fonte da verdade** e
proibir, a partir de agora, a introdução de estilo cru. Esta fase é quase toda *governança*,
porque os artefatos já existem.

### O que CRIAR
- Nada de tokens novos do zero. Apenas **completar lacunas semânticas clínicas** em `tokens.css`
  se faltarem (`--clinical-critical/warning/stable` → já mapeáveis para `--danger/--warning/--success`).
- `docs/ds-recon.md` (já existe) = tabela de mapeamento legado→token; mantê-la como contrato vivo.

### O que CONGELAR (freeze)
- `tokens.css` e `components.css` viram **append-only sob revisão de owner do DS**.
  Mudança de valor de token = PR com justificativa + rodar `design-audit` antes/depois.
- Identidade: **dark indigo+gold é o padrão**; light é opt-in (`data-theme="light"`).
  Dourado é **semântico** (Ouro clínico / fonte oficial) — nunca tratar como erro de design.

### O que PROIBIR IMEDIATAMENTE (regressão = bug)
A partir de agora, em **qualquer arquivo novo ou tocado**:
- ❌ Cor hex/rgb/hsl fora dos tokens
- ❌ `px` que não seja múltiplo de 4 ou que não venha de `--space-*`
- ❌ `border-radius` fora de `--radius-*`
- ❌ `box-shadow` fora de `--shadow-*`
- ❌ `font-size` fora de `--t-*`
- ❌ `transition`/`animation` fora de `--motion-*`
- ❌ Novo arquivo CSS "premium/override/skin" paralelo (a era dos `*-premium.css`, `*-override.css` acabou)

**Mecanismo de execução (debt-prevention real, não slogan):**
- CI roda `node scripts/design-audit.mjs --json` em todo PR e **falha se o total de hits subir**
  (gate de não-regressão por *delta*, não por absoluto — permite migrar sem travar).
- `--strict` (falha em qualquer hit) só liga quando a Onda 4 zerar o legado.

---

## FASE 1 — ATOMIC SYSTEM (estratégia híbrida de compatibilidade)

**Objetivo:** garantir que toda tela possa adotar os átomos `.np-*` **sem** depender da
paleta inline legada, durante a coexistência. Os átomos já existem em `components.css`:

| Sistema | Classe canônica | Estado |
|---|---|---|
| Button | `.np-btn` (+`--primary/secondary/ghost/danger`), 44px, loading/disabled | ✅ |
| Input | `.np-input/.np-select/.np-textarea`, 44px, focus-ring, `aria-invalid` | ✅ |
| Modal | `.np-modal-backdrop` + `.np-modal` (scale) | ✅ |
| Card | `.np-card` (hover→eleva) | ✅ base — ver Card System abaixo |
| Navigation | `.np-sidebar` + `.np-sidebar-group` (`aria-current`) | ✅ |
| Estado/feedback | `.np-badge`, `.np-empty`, `.np-skeleton`, `.np-tooltip` | ✅ |

### Bridge layer (coexistência legado ↔ novo) — JÁ RESOLVIDO
`ds-tokens.css` é a ponte: dá nomes inline antigos (`--teal`, `--ink`, `--wine`, `--gold`…)
a páginas que ainda não os definem, **sem sobrescrever** definições locais. Regra:
- Carregar **depois** de `tokens.css`.
- Página que define o nome local continua mandando (a ponte só preenche o que falta).
- Remover a ponte não quebra nada que já usa `tokens.css` → reversível.

### Wrappers temporários
Quando uma tela legada não puder ser totalmente migrada num PR, envolver blocos em
`.np-card`/`.np-btn` por fora, deixando o miolo legado funcionando. O audit mostra o delta caindo.

### Card System unificado (a única extensão de átomo a formalizar)
Todos os cards derivam de **`.np-card`**. Variantes como **modificadores**, não como CSS novo:

```
.np-card                     /* base: surface, radius-lg, shadow-2, hover eleva */
.np-card--clinical           /* faixa de severidade semântica (success/warning/danger) */
.np-card--metric             /* número grande + delta + sparkline */
.np-card--timeline           /* item de trajetória (data + domínio + direção) */
.np-card--insight            /* insight do motor: precisa de evidence[] visível */
.np-card--action             /* CTA da secretária/médico */
.np-card--ai                 /* recomendação do copiloto — SEMPRE com "por quê" + disclaimer */
```
Anatomia única (header/body/footer), padding via `--space-*`, estados (loading→`.np-skeleton`,
vazio→`.np-empty`, hover, focus), motion via `--motion-*`. **`.np-card--insight` e `--ai` só
renderizam se houver `evidence[]`** (princípio 3 vira regra de componente).

---

## ONDA 1 — CRITICAL EXPERIENCE (percepção premium imediata)

**Objetivo:** gerar a sensação de "produto único e premium" nas telas de maior toque.
Puro design system — **sem** ainda ligar o motor. Reduz o débito visual onde mais dói.

**Telas (por impacto × hits do audit):**
1. `perfil-crianca.html` (349 hits) — coração clínico
2. `intake.html` + filtro (`filtro-escalas.html` 513 hits) — porta de entrada da triagem
3. `escala.html` / `instrumento.html` (398/…) — aplicação de escala
4. `secretaria.html` — operação sem conhecimento técnico
5. `index.html` / dashboard

**Critério de pronto da onda:** delta de hits desses arquivos **−60%** no `design-audit`;
zero quebra nas 10 rotas principais; QA visual (print) aprovado dark+light; touch ≥44px.

---

## ONDA 2 — CLINICAL INTELLIGENCE (ligar o copiloto)

**Objetivo:** ativar `NeuroPedCIL` nas telas migradas. **Bloqueada pela config clínica** —
não liga nada antes do Passo 1.

- **Passo 1 (CLÍNICO, Dr. Jadson):** validar `clinical-config.example.js` → `clinical-config.js`:
  polaridade por instrumento, MCID, limiares de burden, pesos de clusters, regras de contradição,
  cutoffs pendentes (`npe-br-005`/`011`) e o **fluxo do `sentinel` de autolesão** (sensível).
- **Passo 2 (DEV):** card **Trajetória** em `perfil-crianca.html#trajetoria` consumindo
  `NeuroPedCIL.Timeline.buildForActiveChild(config)` + `clinical-visual-schema`; precache dos engines no SW.
- **Intake inteligente:** consolidar #246 (queixa → protocolo + destinatário) usando
  `scale-recommender` + ontologia; secretária opera sem decorar escala.
- **Insights contextuais:** via `.np-card--insight` (com `evidence[]`, `confidence`, disclaimer).

**Critério de pronto:** criança com ≥2 aplicações mostra trajetória com **direção rotulada**
(porque há polaridade) e cada insight exibe evidência; engines no precache; `npm test` verde.

---

## ONDA 3 — LONGITUDINAL EXPERIENCE

**Objetivo:** profundidade temporal premium. Tudo já tem view-model em `clinical-visual-schema`.
- Heatmaps clínicos (domínio × tempo), evolução temporal, resposta terapêutica (`response-engine`).
- Relatórios automáticos auditáveis (`clinical-pdf-auditable.js` já existe).
- Inteligência longitudinal orientada por fenótipo.

**Critério de pronto:** relatório PDF reproduz exatamente o que a tela mostra (auditável);
nenhuma direção rotulada sem polaridade configurada.

---

## ONDA 4 — LEGACY DESTRUCTION (zero legacy)

**Objetivo:** remover o paralelo, com reversibilidade.
- Remover CSS legado redundante: `design-system-premium.css`, `premium-override.css`,
  `editorial-impact.css`, `app-skin.css`, `neuroped-shell.css`, `np-cards.css` — **um por PR**,
  rodando audit antes/depois e verificando que nenhuma tela perde estilo (a ponte cobre).
- Decidir o destino da **V3 paralela** (Carta §3.A): completar ou abandonar — uma única direção.
- Unificar roteamento (`clinical-router` × `neuroped-router`) e engines de diário.

**Critério "zero legacy":**
- `node scripts/design-audit.mjs --strict` passa (0 hits crus fora dos tokens).
- 0 arquivos `*-premium/-override/-skin/-shell.css` paralelos.
- 0 referências quebradas; `npm test` verde; SW com versão única alinhada ao `package.json`.

---

## REQUISITOS TRANSVERSAIS (governança do produto)

### Matriz impacto × complexidade (priorização)
| | Baixa complexidade | Alta complexidade |
|---|---|---|
| **Alto impacto** | Onda 1 (migrar perfil/intake/escala) · gate de não-regressão no CI | Onda 2 (config clínica + wiring do motor) |
| **Baixo impacto** | Onda 4 limpeza de CSS órfão | Reescrever V3 paralela (decidir antes de gastar) |

Ordem = canto superior-esquerdo primeiro. Config clínica (alto impacto/alta complexidade) roda
**em paralelo** porque é gargalo humano (depende do médico), não de dev.

### Naming conventions
- CSS de componente: prefixo **`.np-*`**; variantes como `--modifier`. Sem novos prefixos.
- Tokens: `--<categoria>-<escala>` (`--space-4`, `--radius-lg`, `--t-h1`); semânticos `--ds-*` (ponte).
- Engines clínicas: `window.NeuroPedCIL.<Domínio>`; arquivos `clinical-*.js` / `*-engine.js`.
- Telas embutidas na casca: abrir via `app-shell.html#v=<arquivo>`.

### Component ownership
- **DS owner** (tokens/components/audit): aprova qualquer PR que toque `tokens.css`/`components.css`
  ou que adicione hit cru.
- **Clinical owner** (Dr. Jadson): única fonte de verdade da `clinical-config.js`. Dev **não** inventa
  valor clínico.
- **App/PWA owner**: SW, versão, precache, roteamento, casca.

### Controle de regressão visual
- `design-audit.mjs` no CI por **delta** (Onda 1–3) → **`--strict`** (Onda 4 em diante).
- QA visual por print dark+light nas telas da onda antes do merge (`QA_VISUAL_PWA_95.md`).
- Bump de versão do SW nos 3 lugares ao mudar HTML cacheado (Carta §0).

### Rollout (estratégia de migração em ondas)
Coexistência via ponte + wrappers. Cada PR é **pequeno, reversível e mensurável** (delta do audit).
Nunca um "big-bang" como #247/#248 — aquele padrão já provou que volta no revert.

### Debt-prevention system
Resumo operacional: **toda tela nova/tocada consome `tokens.css` + `components.css`**, não
introduz hit cru (CI barra), não cria CSS paralelo, e todo insight clínico carrega evidência.

---

## NORTE PREMIUM (Stripe / Linear / Notion / Raycast → tradução clínica)

| Princípio premium | Tradução NeuroPed |
|---|---|
| **Coerência absoluta** (um sistema) | Um único DS (`.np-*`); zero CSS paralelo; audit → 0 |
| **Densidade sem ruído** (Linear) | Cards modulares com hierarquia única; sem decoração gratuita |
| **Fluidez cognitiva** (Notion) | Intake e perfil reduzem decisão: o sistema escolhe a escala, organiza o protocolo |
| **Velocidade/atalhos** (Raycast) | `central-atalhos.html` + navegação por teclado; secretária opera sem treino |
| **Confiança/transparência** (Stripe) | Todo insight com "por quê" auditável + disclaimer; nada de caixa-preta |

---

## RESULTADO ESPERADO (definição de sucesso)
- Parece **um único produto coerente** → `design-audit --strict` em 0; sem CSS paralelo.
- Opera como **copiloto neuropediátrico** → motor `NeuroPedCIL` ligado, explicável, médico no centro.
- **Reduz carga cognitiva** da equipe → intake/escala/perfil escolhem e organizam por contexto.
- **Operável sem conhecimento técnico de escalas** → secretária dirige fluxos pelo intake.
- **Percepção premium elevada** → sem regressão visual, dark indigo+gold consistente, motion único.

---

## Apêndice — sequência executável (sem big-bang)
1. **Fase 0 (governança):** ligar gate de não-regressão do `design-audit` no CI. *(PR pequeno)*
2. **Fase 1:** formalizar variantes `.np-card--*` em `components.css`. *(PR pequeno)*
3. **Onda 1:** migrar `perfil-crianca` → `intake/filtro` → `escala/instrumento` → `secretaria`. *(1 tela/PR)*
4. **Onda 2 — Passo 1:** Dr. Jadson valida `clinical-config.js`. *(gargalo humano, começar já)*
5. **Onda 2 — Passo 2:** card Trajetória + precache. *(depois do Passo 1)*
6. **Onda 3:** heatmap/relatórios longitudinais.
7. **Onda 4:** remover CSS órfão (1/PR) + decidir V3 → `--strict`.

> Checklist de cada PR (Carta §5): `npm test` verde · `node --check` nos JS tocados ·
> 0 refs quebradas · 0 mojibake · rebuild do bundle se mexeu em escala · bump de versão se
> mudou HTML cacheado · `design-audit` não sobe · merge → GitHub Pages **e** Cloudflare verdes.
