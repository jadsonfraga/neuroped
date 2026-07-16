# Deploy Oficial - NeuroPed

## Regra de seguranca

O frontend publico pode ser publicado em Cloudflare Pages, Vercel ou GitHub Pages, mas dados reais de pacientes so podem trafegar pela API oficial autenticada.

## API oficial

O backend canônico de produção é Cloudflare Pages Functions (`functions/api`) com D1. Ele exige autenticação nominal, sessões refresh revogáveis, autorização por proprietário e auditoria. O provisionamento oficial aplica `db/schema.d1.sql` e todas as migrações em `db/migrations/`.

Secrets mínimos de produção: `NEUROPED_JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_NAME` e `ADMIN_INITIAL_PASSWORD` apenas no primeiro provisionamento. Remova a senha inicial após criar/trocar a conta administrativa.

## Express local

`server/index.ts` é o backend de desenvolvimento/local e usa um único SQLite (`DATABASE_PATH`). Ele não oferece suporte de produção a `DATABASE_URL`/Postgres. Não configure `DATABASE_URL` esperando migração automática e não use SQLite efêmero para dados clínicos.

## Frontend estatico

O frontend deve exibir areas publicas normalmente. Areas clinicas devem exigir login nominal no backend seguro. PIN global/local foi desativado.
