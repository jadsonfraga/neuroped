# QA Visual PWA 9.5 — NeuroPed EDJ

## Objetivo

Validar se o NeuroPed EDJ atingiu padrão visual e operacional de PWA mobile premium.

## Ambientes a testar

- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Desktop Chrome
- [ ] PWA instalado
- [ ] Aba anônima com cache limpo

## Rotas principais

### Hub / Escalas
URL: `escalas.html`

- [ ] Abre sem erro
- [ ] Topbar aparece
- [ ] Busca universal aparece
- [ ] Quick actions aparecem
- [ ] Home feed premium aparece
- [ ] Dock inferior aparece
- [ ] Escalas prioritárias aparecem
- [ ] Visual parece app, não site

Nota visual estimada: 9.3–9.6

### Consulta Livre
URL: `consulta-livre.html`

- [ ] Abre sem senha
- [ ] Salva localmente
- [ ] Copia resumo
- [ ] Imprime / PDF
- [ ] Dock inferior aparece
- [ ] FAB / ações rápidas aparecem
- [ ] Visual mobile consistente

Nota visual estimada: 9.4–9.7

### Filtro de Escalas
URL: `filtro-escalas.html`

- [ ] Abre sem erro
- [ ] Ranking ouro/prata/bronze aparece
- [ ] Busca universal aparece
- [ ] Quick actions aparecem
- [ ] Dock aparece
- [ ] Escalas prioritárias aparecem
- [ ] Cards mantêm hierarquia visual

Nota visual estimada: 9.2–9.5

### Mapa de Escalas
URL: `mapa-escalas.html`

- [ ] Abre sem erro
- [ ] Filtros funcionam
- [ ] Botão abrir instrumento funciona
- [ ] Busca universal aparece
- [ ] Dock aparece
- [ ] Cards parecem app

Nota visual estimada: 9.1–9.5

### Instrumento
URL: `instrumento.html`

- [ ] Abre sem erro
- [ ] Perguntas por extenso aparecem
- [ ] Tarefas diretas aparecem
- [ ] Pontuação orientativa aparece
- [ ] Copiar resumo funciona
- [ ] Visual mobile está adequado

Nota visual estimada: 9.0–9.4

### CAA
URL: `comunicacao-alternativa.html`

- [ ] Abre sem erro
- [ ] Cartões funcionam
- [ ] Voz funciona quando navegador permite
- [ ] Busca funciona
- [ ] Favoritos persistem
- [ ] Dock aparece
- [ ] Visual parece app infantil-clínico, não site

Nota visual estimada: 9.0–9.4

### Diário
URL: `diario-escola-terapias-v2.html`

- [ ] Abre sem erro
- [ ] Cadastro funciona
- [ ] Registro funciona
- [ ] Relatório funciona
- [ ] Preparar consulta aparece
- [ ] Dock aparece
- [ ] Visual está coeso

Nota visual estimada: 8.9–9.3

### Assinatura Digital
URL: `assinatura-digital.html`

- [ ] Abre sem erro
- [ ] Topbar/dock aparecem
- [ ] Fluxo visual não parece site antigo
- [ ] Funções principais preservadas

Nota visual estimada: 8.8–9.2

## Checklist PWA

- [ ] `sw.js` contém `neuroped-v56-pwa-95-final-plus`
- [ ] `pwa-app-shell.css` em cache
- [ ] `app-shell-open.js` em cache
- [ ] `pwa-95-experience.js` em cache
- [ ] `pwa-home-feed.js` em cache
- [ ] `pwa-bottom-sheet.js` em cache
- [ ] `manifest.json` aponta para `escalas.html`
- [ ] `display: standalone`
- [ ] `orientation: portrait`
- [ ] shortcuts úteis e sem rótulos antigos

## Strings proibidas em produção

- [ ] CAA Premium
- [ ] placeholder
- [ ] TODO
- [ ] WIP
- [ ] em breve
- [ ] app teste

## Veredito QA

Após a implantação v56, o app alcança um padrão visual estimado entre 9.2 e 9.6 nas rotas principais, com nota global realista de 9.3–9.5 se o cache estiver atualizado e o GitHub Pages entregar a versão nova.

Atingir 9.9 exigiria migração maior para SPA/componentização profunda, animações de rota reais, backend ativo e QA em dispositivos reais.
