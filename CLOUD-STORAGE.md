> **NEUROPED_HISTORICAL_DEPLOY_RECORD — NÃO EXECUTAR.**

# Cloud storage — decisão vigente

O guia anterior de Postgres/Supabase/Railway foi descontinuado e não representa
a arquitetura em produção.

- O backend canônico usa Cloudflare Pages Functions com D1.
- Migrações de produção são aplicadas apenas pelos workflows versionados.
- `DATABASE_URL` e `db:push` não são caminhos de produção suportados.
- Object storage externo exige uma proposta revisada de arquitetura, LGPD,
  isolamento, criptografia, retenção, teste e rollback antes de ser ativado.

Não crie contas, buckets, bancos ou credenciais a partir deste arquivo.
Consulte [`docs/DEPLOY_OFICIAL.md`](docs/DEPLOY_OFICIAL.md).
