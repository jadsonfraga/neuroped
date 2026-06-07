# Deploy trigger — final assets alignment

Data: 2026-06-07

Este arquivo existe para acionar os workflows por push na `main` após:

- alinhamento de `package.json` com `package-lock.json` para evitar falha no `npm ci`;
- inclusão de `npm run audit:assets`;
- renderização de todos os assets oficiais em `/qualidade`;
- inclusão da auditoria visual nos workflows de verify, GitHub Pages e Cloudflare Pages.

Rotas pós-deploy:

- `https://jadsonfraga.github.io/neuroped/#/qualidade`
- `https://neuroped.pages.dev/qualidade`
- `https://neuroped.pages.dev/deploy-check.json`
