# BLOCKED_EXTERNAL — login de visitante (PR #1207)

Data: 2026-10-22. Branch: `claude/visitor-scales-login`. Código validado em
`473f45b` (`npm run verify:release` exit 0). A correção de documentação
posterior a esse SHA não altera código executado pela suíte.

## Sistema e permissão exata faltante

- **GitHub Actions** (`jadsonfraga/neuroped` → Settings → Secrets → Actions):
  escrita do segredo `NEUROPED_VISITOR_PASSWORD`. Esta sessão não tem acesso
  a segredos do repositório.
- **Cloudflare Pages** (projeto `neuroped`): confirmação pós-deploy com o
  token do workflow (`pages secret list`). Não há credencial Cloudflare nesta
  sessão.
- **Autorização de merge e de deploy**: reservadas ao dono do repositório.

## Ação que falta

1. Escolher e definir a senha do visitante (`NEUROPED_VISITOR_PASSWORD`).
   Mínimo técnico de 8 caracteres; recomendado 16 ou mais, com gerador de
   senhas. A senha não deve ir a chat, issue, PR nem commit.
2. Autorizar o merge da PR #1207 e o deploy da `main`.
3. Após o deploy, validar o login em produção: usuário `guest2027`, a senha
   definida, e confirmar que o acesso fica restrito às escalas.
4. Confirmar no Cloudflare que o segredo existe com o valor esperado (ou que
   foi removido, se o segredo ficou vazio).

## Risco de não executar

- Sem segredo, o login de visitante não existe (fail-closed). Nenhum acesso
  indevido ocorre nesse estado.
- Se a senha for definida com menos de 8 caracteres, o passo de secrets
  remove o valor do Pages e o login fica desligado. Isso é fail-closed, mas
  não entrega o acesso pretendido.
- Mesclar a PR sem a senha não ativa nada. O acesso só existe após definir o
  segredo e fazer deploy.

## Como verificar a conclusão

- Log do passo "Configurar secrets/vars de auth no Pages" do deploy: linha
  `secret NEUROPED_VISITOR_PASSWORD: definido no Pages`.
- `npx wrangler@4 pages secret list --project-name neuroped` lista
  `NEUROPED_VISITOR_PASSWORD` (quando definido).
- Login em produção com `guest2027` abre só as escalas; `GET /api/auth/me`
  retorna papel `visitor`; rotas de clínica retornam `403 VISITOR_RESTRICTED`.

## Limite desta verificação

O comportamento real de `wrangler pages secret delete` contra a API da
Cloudflare não foi exercitado nesta sessão (sem credencial). O script
`scripts/visitor-secret-sync.sh` foi provado com um dublê do wrangler em
`tests/unit/visitor-secret-sync.test.mjs`. A primeira execução real do passo
de deploy deve confirmar a remoção pela listagem, que o próprio script
verifica.

Rollback: reverter a PR. Desligamento imediato sem deploy:
`UPDATE users SET is_active = 0 WHERE lower(email) = 'guest2027';` no D1.
