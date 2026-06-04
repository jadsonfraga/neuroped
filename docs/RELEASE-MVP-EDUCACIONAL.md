# NeuroPed EDJ — Release MVP Educacional · v6.45.0

**Data:** 2026-06-04 · **Responsável:** Dr. Jadson Fraga Araújo Júnior (CRM-PE 25227 · RQE 17756)

## Posicionamento (definição do produto)
O NeuroPed EDJ é uma **ferramenta educacional de apoio** à observação do desenvolvimento
infantil. **Não é diagnóstico, não substitui avaliação profissional e não é dispositivo
médico** para decisão clínica sobre pacientes. Dados ficam **apenas no dispositivo** do usuário.

Esta release **congela** esse posicionamento como o produto entregue.

## O que esta versão garante
- **Enquadramento honesto em TODA tela** — rodapé global (em todas as páginas, inclusive o
  Perfil) declara a natureza educacional e linka a página **`sobre-natureza.html`**.
- **Página "Natureza da ferramenta"** (`sobre-natureza.html`) — o que é / o que não é /
  instrumentos autorais não-normatizados / fontes oficiais sem reproduzir itens protegidos /
  privacidade local.
- **Banner de 1ª visita** reforça natureza educacional + dados locais.
- **Filtro (Clinical Intelligence Engine)** sobre o catálogo real (medalhas Ouro/Prata/Bronze
  por queixa × idade × respondente; evidência curada com PMID quando há).
- **Portal da família** e **PIN master** removidos da casca do app (ver PR #262).
- **Camada de som/háptico** opt-in; design premium consistente (tokens + Card System).

## Qualidade (o que roda)
- `npm test` → **test-static** (768 OK): contrato de strings/arquitetura, versão sincronizada,
  conformidade clínica (sem reproduzir itens protegidos), SEO/a11y.
- `npm run smoke` → **smoke funcional em Node** (14 OK): sintaxe de TODO `<script>` inline das
  telas críticas, contrato de DOM (IDs/handlers) e lógica do gerador-guia.
- `npm run verify` → roda os dois.

## Limites conhecidos (transparência)
- **Sem QA de navegador real (E2E completo)** — o smoke cobre sintaxe + contrato + lógica pura,
  não interação de browser. Aceitável para MVP educacional; recomendável antes de qualquer uso
  além do educacional.
- **SPA (React) é bundle compilado, sem `src/`** — o núcleo (consulta/prontuário/PDF) não é
  auditável por aqui. A rota interna `/portal-familias` permanece no bundle (sem pontos de
  entrada na casca).
- **Persistência local-only** — sem backup automático; o usuário exporta/limpa manualmente.

## Versão
`package.json`, `sw.js` (CACHE_NAME), `verificar-app.html` e o selo do app: **6.45.0**.
Tag sugerida: `v6.45.0`.
