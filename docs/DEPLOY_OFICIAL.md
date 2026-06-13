# Deploy Oficial - NeuroPed

## Regra de seguranca

O frontend publico pode ser publicado em Cloudflare Pages, Vercel ou GitHub Pages, mas dados reais de pacientes so podem trafegar pela API oficial autenticada.

## API oficial

Para dados reais, use o backend Express (`server/index.ts`) com:

- `NEUROPED_MASTER_KEY`
- `NEUROPED_JWT_SECRET`
- `DATABASE_URL` de Postgres em producao
- `CORS_ORIGINS` restrito aos dominios oficiais
- storage S3-compatible configurado por secrets do provedor

## Cloudflare Functions

As Functions em `functions/api` sao uma camada demo/compatibilidade. Em `ENVIRONMENT=production`, escritas ficam bloqueadas por padrao quando `DEMO_API_WRITES_ENABLED` nao esta explicitamente `true`.

Nao use essas Functions para dados reais sem implementar autenticacao nominal, autorizacao por dono e auditoria equivalente ao backend Express.

## Frontend estatico

O frontend deve exibir areas publicas normalmente. Areas clinicas devem exigir login nominal no backend seguro. PIN global/local foi desativado.
