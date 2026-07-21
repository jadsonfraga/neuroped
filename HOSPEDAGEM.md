# Hospedagem do NeuroPed — fluxo vigente

Este arquivo substitui as opções antigas de hospedagem manual.

A topologia oficial é:

- Cloudflare Pages em `https://neuroped.pages.dev`: aplicação e API canônicas;
- Vercel em `https://superneuroped.vercel.app`: único mirror público;
- GitHub Pages: redirecionador mínimo para o endereço canônico.

Não crie nem publique projetos manualmente. Toda alteração de produção deve
passar por pull request, gates verdes, merge em `main` e workflows versionados.

Consulte [`docs/DEPLOY_OFICIAL.md`](docs/DEPLOY_OFICIAL.md).
