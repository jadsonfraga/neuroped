# NeuroPed SDG — v6.45.9

**Plataforma educacional e demonstrativa de neuropediatria — local-first (PWA)**

Dr. Jadson Fraga Araújo Júnior · **CRM-PE 25227 · RQE 17756** · Neuropediatria
Rua Raimundo Lacerda, Casa 01 — Bairro São José, Petrolina-PE · CEP 56302-470

---

> ⚠️ **AMBIENTE DEMONSTRATIVO / EDUCACIONAL**
> Demonstração técnica honesta. Os instrumentos autorais são de **triagem orientadora**, não diagnóstico. Não inserir dados reais de pacientes. Laudos/documentos gerados trazem carimbo de demonstração e **não** têm valor jurídico até as etapas de `GO_LIVE_CHECKLIST.md` estarem completas.

---

## Arquitetura (estado real)

PWA estática (HTML/CSS/JS), **local-first**, sem backend obrigatório. Publica via **GitHub Pages** a partir de `main` em `jadsonfraga.github.io/neuroped/`. O PWA instalado abre por `app-shell.html` (`start_url`).

Camadas centrais:

- **`np-store.js`** — espinha de dados local (namespace `np:*`): múltiplas crianças, criança **ativa**, `resultsFor`, `medLogFor`, `diarySummary`, `exportAll`/`importAll` (mescla por id, nunca apaga). 100% no dispositivo.
- **`scales-enhance.js`** (`window.NeuroPedScales`) — motor de escala: pontua, gera **laudo PDF com respostas item-a-item**, salva histórico. Concatenado em `scales-bundle.js`.
- **`escala.html?id=<id>`** — runner unificado: responde **qualquer** escala do catálogo com fluxo guiado (auto-avanço, conclusão, skeleton); laudo amarrado à criança ativa.
- **`filtro-escalas.html`** — clique idade+queixa → 3 mais indicadas → runner; memória de queixa **por criança**.
- **`perfil-crianca.html`** — CRUD criança, linha do tempo, comparador longitudinal, **síntese do caso** (escalas × medicação × diário) + PDF, documentos prontos, reaplicar escala.
- **`central-atalhos.html`** — hub com faixa de destaque, indicadores de uso e "Continuar o caso".
- **`app-polish-mobile.js`** — camada universal (toda página): transições, **guia de jornada** (próximo passo contextual), prefetch preditivo, onboarding, marca em toda tela.
- **`app-shell.html`** — casca persistente (topo + abas + `<iframe>`) para experiência de moldura única.

Qualidade: `scripts/test-static.mjs` (**780+ asserções estáticas**, 0 falhas como gate de commit/CI), `scripts/build-scales-bundle.mjs` (frescor do bundle) e **`design-audit --check`** (gate de não-regressão visual). Todo PR roda esses gates no GitHub Actions antes do merge/deploy.

### Por que sem framework (escolha deliberada, não amadorismo)
HTML/CSS/JS direto é intencional para um produto clínico **local-first** que precisa durar: **zero build obrigatório**, auditável linha a linha, **offline real** via Service Worker, carga leve em aparelho de família e **sem cadeia de dependências** para envelhecer/quebrar. A disciplina vem dos **gates de teste + CI**, não do framework. Onde compila (o `index` é um bundle Vite), o artefato fica versionado e servido estático.

## O que esta versão FAZ

- Filtro de escalas por idade/queixa → 3 instrumentos indicados.
- Runner que responde a escala e gera **laudo PDF com as respostas**, salvo no histórico da criança ativa.
- Perfil longitudinal: linha do tempo, comparador (delta entre reavaliações), síntese do caso, documentos prontos (declaração escolar, relatório a terapeuta, atestado de acompanhamento).
- Diário de escola/terapias e inventário de **resposta à medicação** (família × escola).
- CAA gratuita (pictogramas + voz pt-BR) e materiais educativos para famílias.
- PWA instalável, funciona **offline** após a primeira visita.

## O que esta versão NÃO faz (limitações honestas)

- ❌ Não autentica médicos profissionalmente (PIN local **não** é autenticação).
- ❌ Não armazena em banco seguro com RLS por padrão (dados ficam no dispositivo).
- ❌ Não emite documentos com assinatura digital ICP-Brasil.
- ❌ Não processa cobranças/assinaturas reais (checkout a configurar).
- ❌ Não oferece telemedicina.

Detalhes em `KNOWN_LIMITATIONS.md` e `GO_LIVE_CHECKLIST.md`.

## Versão e disciplina de release

Versão canônica sincronizada em **4 carimbos**: `package.json`, `sw.js` (`CACHE_NAME`), `app-polish-mobile.js` (`__NP_VERSION`) e `verificar-app.html`. Antes de cada commit: `node scripts/test-static.mjs` deve retornar **0 falhas** e o nº de asserções não pode diminuir.

```bash
# servir localmente
python3 -m http.server 8080   # abrir http://localhost:8080/app-shell.html
# checagem estática (gate de commit)
node scripts/test-static.mjs
# refazer o bundle de escalas (se tocar módulos de escala)
node scripts/build-scales-bundle.mjs
```

## Acesso ao modo profissional (demo)

A área profissional (`consulta.html`) é **demonstrativa** e exige um PIN master. O PIN **não** está em texto claro no bundle: a verificação usa **hash SHA-256** (`master-access-policy.js`), **rotacionável** via `window.NEUROPED_MASTER_PIN_HASH`. É proteção de UX contra exposição acidental, **não** mecanismo de segurança. Endurecimento (sessão com expiração, rate-limit, cifragem em repouso) está mapeado no roteiro de segurança/LGPD.

### Modelo Pro (honesto, por design)
O desbloqueio Pro valida um **hash** do código no cliente (`pro-license.js` / `pro-hashes.js`) — sem backend. Como em qualquer infoproduto, isso significa que um código pode ser usado em mais de um aparelho; é **aceitável e revogável** (basta remover o hash do lote e republicar). Não é cofre criptográfico, e não precisa ser: o valor está no conteúdo curado, não em DRM.

## Aviso clínico

Os instrumentos autorais são recursos de **triagem operacional**. Não substituem avaliação médica, exame clínico ou instrumentos normatizados quando formalmente indicados. A decisão diagnóstica é sempre do médico responsável.

## Contato

- WhatsApp: **(87) 9 9109-7371** — `https://wa.me/5587991097371`
- Petrolina-PE

## Licença

- Conteúdo educacional e instrumentos autorais: CC-BY-NC do Dr. Jadson Fraga.
- Pictogramas/ícones: emoji Unicode (uso livre).

---

© 2026 NeuroPed SDG · Dr. Jadson Fraga Araújo Júnior · CRM-PE 25227 · RQE 17756 · Neuropediatria — Petrolina-PE

**Soli Deo Gloria.**
