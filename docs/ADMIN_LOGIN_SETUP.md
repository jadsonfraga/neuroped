# Configuração do login administrativo

O backend de autenticação oficial é a API Cloudflare Pages com D1. Vercel serve
somente o cliente do mirror público e não hospeda um backend alternativo.

## Secrets do workflow

Configure em **GitHub → Settings → Secrets and variables → Actions**:

- `NEUROPED_JWT_SECRET`: segredo estável e forte para assinatura de JWT;
- `ADMIN_INITIAL_PASSWORD`: senha inicial do administrador;
- `ADMIN_EMAIL`: e-mail do administrador;
- `ADMIN_NAME`: nome de exibição opcional;
- `NEUROPED_E2E_EMAIL` e `NEUROPED_E2E_PASSWORD` (`NEUROPED_E2E_NAME`
  opcional): conta sentinela sintética, ativa e obrigatória para os deploys
  automáticos. O workflow de deploy publica os dois primeiros como secret do
  Cloudflare Pages e o backend provisiona a conta (role `reader`, sem
  membership de clínica) no primeiro login bem-sucedido, sem exigir troca de
  senha — igual ao bootstrap do admin, nunca sobrescreve uma conta já
  existente. Sem esse provisionamento a conta nunca existe em produção e o
  gate "Dedicated E2E account readiness" falha com 401 em qualquer PR;
- credenciais Cloudflare e Vercel exigidas pelos workflows oficiais.

Nunca registre os valores em arquivos, commits, logs ou documentação.

## Publicação e verificação

Não execute deploy manual. Após PR aprovado e merge em `main`, os workflows:

1. aplicam as migrações D1;
2. publicam o backend e os frontends;
3. validam health, CORS exato, login, `/api/auth/me`, logout e revogação;
4. confirmam a sentinela do mesmo commit.

O bootstrap administrativo é idempotente e não sobrescreve uma conta já
existente. Ele serve ao provisionamento manual e não é fallback da sentinela E2E.
Trocas de senha devem usar o fluxo autenticado do aplicativo; a senha criada por
bootstrap fica marcada para troca no primeiro acesso nominal.

Consulte [`DEPLOY_OFICIAL.md`](DEPLOY_OFICIAL.md) e
[`SEGURANCA-ACESSO.md`](SEGURANCA-ACESSO.md).
