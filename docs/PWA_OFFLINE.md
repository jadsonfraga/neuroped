# PWA e Offline — NeuroPed

## Problema

O app precisava comunicar claramente o que funciona offline e manter dados clínicos fora de cache.

## Solução aplicada

- Service worker atualizado para cache `neuroped-v6`.
- `offline.html` adicionado ao app shell.
- Fallback offline explica limites: app shell pode abrir, APIs clínicas não são cacheadas.

## Arquivos alterados

- `client/public/sw.js`
- `client/public/offline.html`

## Critério de aceitação

- PWA possui manifesto e service worker.
- Offline possui tela amigável.
- Pacientes, consultas e documentos não são cacheados.

## Evidência

- `client/public/manifest.json` já existente.
- `client/public/sw.js` agora inclui `offline.html` no app shell.
- `npm run build:client` executado.

## Pendências honestas

- Teste offline real em Chromium/DevTools deve ser feito após deploy.
- Métricas Lighthouse PWA mobile devem ser coletadas no ambiente publicado.
