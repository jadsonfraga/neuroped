# Modo público (educacional) — o que executa e o que fica oculto

O NeuroPed EDJ foi preparado para **divulgação ao público como ferramenta
educacional**, **sem nenhuma senha**. Como não há login/PIN para proteger nada,
as áreas sensíveis são **ocultadas** do deploy público (não dá para "proteger
sem senha"). O guarda é o `public-mode.js` (carregado cedo em todas as páginas):
redireciona páginas ocultas para a home, remove os links que apontam para elas e
bloqueia rotas internas sensíveis do SPA.

> **Trade-off assumido:** as ferramentas profissionais (consulta, secretaria,
> etc.) ficam **indisponíveis no deploy público**. Para uso clínico próprio,
> mantenha um build/branch privado separado — não há como liberar só para você
> sem um segredo (que seria, na prática, uma senha).

---

## ✅ O que FICA público (executado pelo app)

**Núcleo educacional / triagem**
- `index.html` — início / hub
- `app-shell.html` — casca do app
- `central-atalhos.html`, `menu-instrumentos.html`, `mapa-escalas.html`
- `filtro-escalas.html` — filtro de escalas (triagem orientadora)
- `escala.html`, `instrumento.html`, `instrumento-autoral.html` — responder instrumentos (triagem **não normatizada**, com aviso de natureza)
- `escala-abc-comportamento.html`, `entrevista-autismo-adir.html`, `impacto-medicacao.html`, `testes-diretos.html`
- `escalas.html`, `escalas-questionarios.html`, `banco-escalas*.html` — catálogo/banco
- `clinical-trajetoria.html` — evolução longitudinal (dados locais da própria criança)
- `perfil-crianca.html` — perfil/organização da própria criança (local; documentos com aviso de **demonstração, sem validade jurídica**)

**Família / educação**
- `comunicacao-alternativa.html` (CAA), `area-filho.html`, `portal-familia-livre.html`
- `diarios.html`, `diarios-clinicos.html`, `diario-escola-terapias*.html`
- `portal-novidades.html`, `gerador-cards.html`

**Institucional / conteúdo / conformidade**
- `sobre-dr-jadson.html`, `sobre-natureza.html`, `evidencia-cientifica.html`, `qualidade-neuroped.html`
- `neuroped-master-vitrine.html`, `neuroped-master-biblioteca.html`, `solicitar-neuroped-master.html` (vitrine/biblioteca/lead de e-book — marketing, sem dados sensíveis)
- `verificar-documento.html` (verificação pública de documento)
- `privacidade.html`, `privacy-policy.html`, `terms-of-use.html`, `acessibilidade.html`, `restricted.html`, `404.html`

> Camadas globais ativas no público: consentimento LGPD + direitos do titular
> (🛡️ exportar/apagar), corredor de crise nos rastreios de risco, retrô só nas
> telas lúdicas. Sons e moedas **não** aparecem em telas clínicas.

---

## 🔒 O que fica OCULTO (e por quê)

| Página | Categoria | Por que ocultar |
|---|---|---|
| `consulta.html`, `consulta-livre.html` | Operação clínica | Painel profissional de consulta — dados de paciente, prescrição, laudo. Não é para o público. |
| `intake.html` | Operação clínica | Coleta de dados de identificação/anamnese para o fluxo profissional. |
| `assinatura-digital.html` | Operação clínica | Assinatura/emissão profissional de documentos. |
| `secretaria.html` | Administração | Painel administrativo/secretaria. |
| `agenda-financeiro.html` | Administração | Agenda e financeiro — dados privados do consultório. |
| `gerar-licencas-pro.html` | Monetização (crítico) | **Gerador de licenças Pro** — se público, qualquer um geraria códigos. |
| `neuroped-pro.html` | Monetização | Painel/área Pro (conteúdo pago). |
| `ativar-passe-familiar.html`, `politica-acesso-familiar.html` | Monetização/acesso | Sistema de passe familiar (acesso pago) — sem sentido sem o gate. |
| `auditoria-ontologia.html`, `auditoria-operacional.html` | Dev/auditoria | Ferramentas internas de auditoria. |
| `qa-smoke-test.html`, `teste-e2e-manual.html`, `teste-ouro-pin.html`, `scale-engine-demo.html`, `clinical-trajetoria-demo.html`, `ds-pilot.html` | Dev/teste/demo | Páginas de desenvolvimento/teste/demonstração interna. |
| `verificar.html`, `verificar-app.html`, `cloud-status.html` | Dev/ops | Diagnóstico de versão/rota e status — uso interno. |
| `setup.html` | Admin | Configuração inicial/administrativa. |
| `guia-lancamento.html` | Interno | Guia de lançamento (material interno). |

**Rotas internas do SPA bloqueadas** (hash): `#/prontuario`, `#/prescricoes`,
`#/laudos`, `#/secretaria`, `#/pacientes`, `#/portal-documentos`, `#/portal-chat`,
`#/relatorio-*`, `#/calculadora-dose`, `#/farmacolog*`, `#/diario-epilepsia`, etc.

---

## 🔑 Senhas removidas
- **PIN master** (`master-access-policy.js`) — `unlockIfPin` desativado (no-op).
- **PIN da Consulta** — a consulta fica oculta (sem tela de PIN).
- **Senha de "estudo"** em `escala.html` — removida (continha texto claro); os
  instrumentos de referência de estudo abrem direto como **referência**.
- `safe-public-layer.js` deixa de mandar para PIN; manda para a home.

## 🧹 Remoção REAL no deploy (não só "cortina de JS")
`public-mode.js` oculta no navegador (defesa em profundidade), mas a remoção de
verdade é feita por **`scripts/strip-private.mjs`**, rodado nos workflows de
deploy (GitHub Pages **e** Cloudflare) **antes de publicar**: os arquivos
sensíveis (35 — operação clínica, admin, gerador de licenças, conteúdo pago,
dev/teste) **não vão ao ar** — nem por `curl`, `view-source` ou JS desligado.
O **repositório os mantém** (build privado do autor é recuperável) e os **testes
rodam contra o repositório** (intactos). O conteúdo pago (`neuroped-master-protegido-data.js`)
vira um **stub vazio** no deploy.

> **Mantido público de propósito:** `neuroped-pro.html` é a **landing de vendas**
> (Pro R$47, checkout, funil) — público por design e indexado para SEO. Não é
> dado sensível. O **gerador** de licenças (`gerar-licencas-pro.html`), sim, é
> removido.

## ⚠️ Limitação honesta
O app continua **client-only**: dados ficam no `localStorage` do aparelho. Para
persistência clínica regulada/áreas realmente autenticadas, é necessário
**backend** (fora do escopo do deploy público).

> **Pendência de modelo (sua decisão):** "sem senhas" desativou o desbloqueio
> Pro/master. A landing continua vendendo, mas o conteúdo pago fica como stub no
> público e não há mecanismo de unlock. Defina se o Pro continua (precisa de
> backend/checkout real) ou se o conteúdo vira gratuito.
