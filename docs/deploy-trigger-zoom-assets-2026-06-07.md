# Deploy trigger — zoom/proporção e uso de assets

Data: 2026-06-07

Este commit aciona deploy após nova correção fina de zoom, proporção de telas e reaproveitamento de imagens/mascotes oficiais do repositório.

Incluído:

- `client/src/styles/proportion-guards.css` com guardas globais de viewport, zoom visual, imagens e overlays;
- import global dos guardas em `client/src/main.tsx`;
- `AssetShowcase` reutilizável em `BrandAssets.tsx`;
- vitrine de assets clínicos na home;
- vitrine compacta de assets familiares no Portal da Família;
- uso de `object-contain`, `aspect-ratio` e `no-zoom-media` para reduzir cortes e distorções.

Rotas pós-deploy:

- `https://jadsonfraga.github.io/neuroped/#/`
- `https://jadsonfraga.github.io/neuroped/#/portal-familia`
- `https://jadsonfraga.github.io/neuroped/#/qualidade`
- `https://neuroped.pages.dev/deploy-check.json`
