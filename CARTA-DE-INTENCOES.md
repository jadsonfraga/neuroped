# NeuroPed — Carta de Intenções (prompt mestre de implementação)

> Síntese, por análise da evolução do projeto, de **tudo que há intenção de implementar
> mas ainda NÃO está em deploy**. Use este documento como **prompt** para um implementador
> (humano ou agente). Cada item traz: o que é · por que · contrato/dados · guardrails ·
> critério de pronto.

---

## 0. Contexto do produto (não mudar a essência)
NeuroPed EDJ — plataforma clínica de neuropediatria do **Dr. Jadson Fraga (CRM-PE 25227, RQE 17756)**.
- **Estética:** dark + violeta/índigo (`--primary #7C3AED`, `--primary-deep #4F46E5`), tipografia Fraunces/Inter. O dourado é **semântico** (medalhas/“Ouro clínico”/“Fonte oficial”) — não tratar como erro.
- **Arquitetura:** PWA. **Casca única `app-shell.html`** (start_url) embute as auxiliares num iframe via `#v=<arquivo>`; o guard (`app-frame.js` + `np-embed-guard.js`) reabre qualquer auxiliar **dentro da casca** e suprime chrome duplicado (`html.np-embedded`).
- **Service Worker** com versão única alinhada ao `package.json` (teste `test-static.mjs` exige `sw CACHE_NAME == neuroped-edj-v<package.version>`). Ao mudar HTML cacheado, **bumpar a versão** nos 3 lugares (package.json, sw.js, selo em app-polish + verificar-app.html).
- **Build de escalas:** `scripts/build-scales-bundle.mjs` gera `scales-bundle.js`. Editou fonte de escala? **Rode o build** (há teste que reprova bundle defasado).

## 1. Princípios NÃO-NEGOCIÁVEIS (segurança clínica — manter sempre)
1. **Nada de clínica fabricada.** Severidade, polaridade, cutoffs, clusters, MCID, regras de contradição vêm de **config validada pelo médico**. Sem config → `insufficient_clinical_configuration`, nunca adivinhar.
2. **Sem diagnóstico automático.** As engines *sinalizam*; o médico decide. Disclaimer em todo output.
3. **Explicável (sem caixa-preta):** todo insight carrega `evidence[]` (instrumento, domínio, sinal, peso), `confidence`, `explanation`.
4. **LGPD-local:** respostas ficam no dispositivo; nada vai a servidor sem consentimento.
5. **Honestidade de direção:** sem polaridade configurada, NÃO rotular melhora/piora (só sentido bruto).
6. **Reversibilidade:** consolidações por redirect (git revert), nunca apagar trabalho sem confirmação.

## 2. JÁ EM DEPLOY (não refazer)
Estética violeta unificada; foco AA + microinterações; **encoding corrigido (65 arquivos)**; tudo abre dentro da casca; diários fora da triagem + hub `diarios.html`; **Entrevista de Autismo (ADI-R)** com Seção A (rascunho) + B–F + abertas; **camada de sinais clínicos** no laudo (cutoffs/traps via `scales-clinical-signals.js`); **V4 Clinical Intelligence Layer** (engines em `window.NeuroPedCIL`) + `clinical-trajetoria-demo.html` (demo pré-validação) + `clinical-config.example.js` (rascunho); páginas V3 quebradas restauradas/redirecionadas; engines V3 auditados (carregam e classificam 4/4).

---

## 3. INTENÇÕES A IMPLEMENTAR (o que falta no deploy)

### A. Decidir o destino da arquitetura V3 paralela
**Estado:** a mega-deploy V3.2 referenciou 4 arquivos **nunca commitados** → 3 telas quebradas (já redirecionadas p/ as clássicas funcionais).
- **Opção 1 — Completar a V3:** commitar `neuroped-engine-clinica.js`, `neuroped-clinica-ui.js`, `neuroped-estilo-final.css`, `neuroped-clinica-ui.css`; remover os redirects de `escalas-questionarios.html`/`diarios-clinicos.html`/`diarios.html`; validar que populam (`#np-direct-tests-grid` etc.).
- **Opção 2 — Abandonar a V3:** manter as clássicas; remover do precache/links o código V3 órfão (`clinical-*`, `neuroped-router/ontology`, taxonomias) **com cuidado** (a `filtro-escalas` carrega esses engines aditivamente — testar antes de remover).
- **Pronto quando:** uma única direção, 0 refs quebradas, `npm test` verde.

### B. Ativar a V4 (trajetória clínica) na tela do paciente
**Hoje:** só na demo (`clinical-trajetoria-demo.html`), com config rascunho.
- **Passo 1 (clínico):** validar `clinical-config.example.js` → `clinical-config.js`: **polaridade por instrumento** (sintomas=higher_is_worse; adaptativos=higher_is_better), **MCID**, **limiares de burden**, **pesos dos clusters de fenótipo**, **regras de contradição**.
- **Passo 2 (dev):** card “Trajetória” em `perfil-crianca.html#trajetoria` consumindo `NeuroPedCIL.Timeline.buildForActiveChild(config)` + `VisualSchema`. Precache dos engines.
- **Guardrails:** manter os 6 princípios; banner “apoio, não diagnóstico”.
- **Pronto quando:** com criança que tem ≥2 aplicações, a trajetória aparece com direção rotulada (porque há polaridade) e cada insight mostra evidência.

### C. Finalizar a camada clínica das escalas (decisões do autor)
- **Semântica das `traps`:** confirmar “qualquer item do idx ≥ min” (atual) × “todos”.
- **`cutoffs` de `npe-br-005` (SERA-10) e `npe-br-011` (DLEG-12):** definir limiares (hoje ausentes).
- **`sentinel` de risco de autolesão/suicídio (`npe-br-005`):** especificar o fluxo de roteamento seguro (é sensível — implementar só com protocolo definido).
- **Pronto quando:** `scales-clinical-signals.js` (e o bundle) refletem as regras validadas; rebuild do bundle feito.

### D. Entrevista de Autismo — revisar Seção A
A Seção A (itens 1–12) está como **rascunho de anamnese**. Revisar o texto à prática do autor; confirmar se mantém formato semiestruturado (observação + ★discutir) ou ganha campos específicos.

### E. Escala A-B-C de Comportamento (análise funcional)
Reconstruir no padrão do app: 6 itens (Antecedente, Comportamento, Consequência, Contexto, Duração/Intensidade, Função), Likert 0–3, faixas 0–6/7–12/13–18 **+ bloco multiescolha de “função aparente”** (fuga/atenção/tangível/sensorial/alívio) que gera **perfil funcional** no resultado — pré-requisito para plano comportamental. (Existe `escala-abc-comportamento.html` da outra sessão — verificar/concluir ou refazer no DS.)

### F. Visual 100% seamless dentro da casca
Hoje suprimo logos duplicados (`np-embedded.css`). Falta esconder, com cuidado, cabeçalhos próprios (`.topbar`/`header.cover`) **sem remover controles úteis** (ex.: busca do filtro). Precisa de iteração visual (print).

### G. Higiene de arquitetura (após decidir A)
- Renomear taxonomias para deixar claro o papel (v3.0=allowlist, v3.1=required_fields) ou unificar.
- Unificar roteamento (`clinical-router` × `neuroped-router`).
- Consolidar engines de diário (`neuroped-diarios.js` × `scales-diarios-uteis.js`).

### H. V4 — Fase 10 (futuro, só após V4 validada)
Embeddings clínicos; NLP de evolução textual; transcrição automática; integração escolar; input multimodal; analytics populacionais; benchmarks normativos. **Sem IA generativa em produção clínica sem validação.**

---

## 4. Ordem recomendada
1. **(B-Passo1 + C + D)** decisões clínicas do autor → destravam a maior parte.
2. **(A)** decidir V3 (completar com os 4 arquivos OU abandonar) → consolidar.
3. **(B-Passo2)** ligar a Trajetória V4 no perfil.
4. **(E, F, G)** A-B-C, seamless, higiene.
5. **(H)** futuro.

## 5. Checklist de deploy (sempre)
`npm test` verde · `node --check` nos JS tocados · 0 refs quebradas · 0 mojibake · rebuild do bundle se mexeu em fonte de escala · bump de versão se mudou HTML cacheado · merge → confirmar GitHub Pages **e** Cloudflare verdes.
