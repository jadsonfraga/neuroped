# Deploy do NeuroPed — fluxo vigente

Este documento substitui o procedimento legado de criação manual de projetos
Vercel/Railway. Esse procedimento não corresponde à arquitetura atual e não deve
ser executado.

## Produção oficial

- `https://neuroped.pages.dev`: aplicação e API canônicas em Cloudflare Pages,
  com D1 e autenticação nominal.
- `https://superneuroped.vercel.app`: único mirror Vercel público autorizado.
- `https://jadsonfraga.github.io/neuroped/`: redirecionador mínimo para o
  endereço canônico.

`https://neuroped.vercel.app` pertence a outro aplicativo e não é uma origem do
NeuroPed.

## Como publicar

1. Abra um pull request para `main`.
2. Aguarde PR Check, Verify NeuroPed, Test/Lint/Build e previews obrigatórios.
3. Faça merge somente com todos os gates verdes.
4. Confirme os workflows de produção e as sentinelas públicas do mesmo commit.

Não use `deploy-production.sh`, `vercel --prod`, `railway up` nem criação manual
de projetos. O script legado permanece no repositório apenas como trava
fail-closed e sempre termina com erro.

A configuração completa, os secrets necessários e os contratos de verificação
estão em [`docs/DEPLOY_OFICIAL.md`](docs/DEPLOY_OFICIAL.md).
