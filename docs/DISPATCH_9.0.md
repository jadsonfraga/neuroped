# DISPATCH — NeuroPed: 7,5 → 9,0 de piso (Claude Code autônomo, máquina remota)

> Ordens operacionais de continuação para o Cowork. **Você é o único motorista.**
> Meta: 9,0 de **PISO REAL** = a nota que sobrevive a um avaliador rigoroso.
> **NOTA = O MENOR DOS 6 EIXOS**, nunca a média. Trabalhe por número medido no CI.

## Estado atual (medido — NÃO refaça o que já está feito)
- ✔ **Segurança 9.0** — assinatura `fail-closed` (`functions/api/sign.js`), 0 segredo hardcoded.
- ✔ **Processo 8.0** — 9 gates no `npm run verify`; `audit-mp90.yml` sem `continue-on-error` (honesto); `docs/BRANCH_PROTECTION.md` com o roadmap.
- ✔ **Estética 8.5** — cor unificada (1 acento / 1 ouro); refinos globais em `np-foundation.css` (§3.4/§3.5: selection, scrollbar, accent-color, micro-interações); contraste AA matemático (`check-contrast`).
- ✔ **Clínico-motor** — `tests/run-engine-properties.mjs` (44 invariantes) no gate.
- ▲ **Clínico-dados 7.0** ← ELO 1: 29 casos para ~229 instrumentos; acurácia sem revisão médica.
- ▲ **Perf (não medido)** ← ELO 2: Lighthouse NÃO roda em PR (ponto cego).
- ▲ **A11y 7.5** — axe não roda em PR.
- ▲ **Estrutura 7.0** — 2 namespaces de token, 8 sistemas, **8.674 valores crus**, `scales-bundle.js` = 3.733 linhas.

## Regras (invioláveis)
1. **SEQUENCIAL**: 1 fase por vez; branch do `main` fresco; PR; CI verde; merge; só então a próxima. `npm run verify` 100% antes de cada commit.
2. **CATRACA**: todo número-piso só MELHORA. Gate novo entra no `verify` E no `test.yml`.
3. git `user.email noreply@anthropic.com` / `name Claude`. Tudo reversível.
4. Clínico: não tocar motor/`clinical-*.js` sem a suíte passar; sem PIN/segredo em claro; sem emoji em UI clínica formal; sem `!important` novo.
5. Honestidade: nota por fase + o que **só humano clínico** valida (não finja que máquina cobre).

---

### FASE A — PERF & A11Y VIRAM GATE DE PR  *(você TEM navegador)*
ZONA: `.github/workflows/`, `scripts/audit-*`, `<head>`, `sw.js`, ARIA no markup
1. **MEÇA o piso real**: rode `audit-lighthouse.mjs` e `audit-a11y.mjs` (puppeteer/lighthouse) contra build local ou produção. Anote os scores.
2. Faça-os rodar **em PR** (`pull_request`) e travar no piso medido; suba via catraca até **Perf/BP/SEO ≥90** e **axe 0 serious/critical**.
3. Conserte o que reprovar: preload/defer, dimensões de mídia (CLS), landmarks, labels, foco, `aria-live` em toda região dinâmica (resultado/progresso/revisão).
**ACEITE:** Lighthouse ≥90 e axe 0 medidos e BLOQUEANDO PR. Eixos PERF e A11Y ≥9.

### FASE B — INTEGRIDADE DO CATÁLOGO (229)  *(estrutural, sem juízo clínico)*
ZONA: `tests/`, leitura de `scales-bundle.js`
1. **Validador (teste no gate)**: carregue o catálogo e exija de TODOS os ~229: `age_min_months`/`age_max_months` válidos, fonte/proveniência (`source_document` ou citação PubMed/NICE/AAP/OMS), `domain`, `audience`, disclaimer. FALHA se 1 faltar. Comece em **modo relatório** (conte faltantes), corrija os dados, depois vire **bloqueante**.
2. **Catraca "não-piorar por PR"**: design-audit não sobe; nº de testes não cai; nenhum `.js` cresce além de ~1500 linhas (`scales-bundle` fica em dívida p/ Fase D).
**ACEITE:** 0 instrumento sem fonte/faixa; catracas ligadas. Sobe o piso CLÍNICO-DADOS.

### FASE C — CASOS CLÍNICOS  *(precisa do médico — NÃO invente asserção clínica)*
ZONA: `tests/`, `docs/PROVENIENCIA_CLINICA.md`
1. Gere uma **MATRIZ de casos candidatos** (queixa × idade × quem responde → instrumento esperado) a partir do catálogo, marcando os que precisam de confirmação humana. NÃO assuma o "certo" sozinho.
2. Entregue a matriz ao **Dr. Jadson** para validação; ao receber, transforme em **≥150 testes clínicos** verdes. Documente a fonte de cada recomendação.
**ACEITE:** ≥150 casos clínicos **validados por humano**. Eixo CLÍNICO ≥9. *(Único que depende de pessoa — sinalize e pause aqui se preciso.)*

### FASE D — DÍVIDA ESTRUTURAL → `design-audit --strict`  *(visual; confira no navegador)*
ZONA: CSS (`np-*` + legados) + `<style>` das páginas; split de `scales-bundle.js`
1. Quebre `scales-bundle.js` (3733) em módulos sob demanda (sai da dívida da Fase B).
2. Reduza os 8.674 valores crus monotonicamente; colapse os 2 namespaces (`--primary/--text` → `--np-*`) e os 8 sistemas → **≤3 canônicos**. PRESERVE cor intencional (identidade por instrumento, hero editorial, ilustrações).
3. **LIGUE `design-audit --strict`.** CONFIRA no navegador cada tela tocada (você tem a máquina — não suba mudança visual às cegas).
**ACEITE:** `--strict` ON e verde; ≤3 sistemas; 0 regressão (suíte + axe + seu olho). Eixo ESTRUTURA ≥9.

---

## Rubrica final — declare 9,0 só quando os SEIS, medidos no CI, passam juntos
- Segurança ✓ · Processo ✓ · Perf (LH≥90 em PR) · A11y (axe 0 em PR) · Clínico (≥150 validados + 229 com fonte) · Estrutura (`--strict`, ≤3).

**NOTA = menor dos seis.** Reporte os números, não a média. Liste explicitamente o que dependeu de **revisão clínica humana**.
