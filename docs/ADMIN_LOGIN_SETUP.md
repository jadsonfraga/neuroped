# Configuração do login de administrador

O NeuroPed **não tem senha embutida no código**. O acesso às áreas clínicas
(dados identificáveis) usa **autenticação nominal no backend**, com senha
gravada como **hash** no banco. O usuário admin inicial é criado no _boot_ do
servidor a partir de variáveis de ambiente.

> ⚠️ **Nunca** coloque a senha em arquivos versionados (`.env.example`, código,
> docs). Ela iria para o histórico do git em texto puro. Use sempre o painel de
> _secrets_ da plataforma de hospedagem.

## Caminho automático (CI — Cloudflare)

O workflow **Deploy Cloudflare Pages** (`.github/workflows/deploy-cloudflare.yml`)
faz tudo a cada push em `main`: migra o D1, publica os secrets no Pages e faz o
deploy, terminando com uma **verificação e2e do login**. Para ativar, crie estes
**GitHub Secrets** no repositório (Settings → Secrets and variables → Actions):

| GitHub Secret | Conteúdo |
|---|---|
| `NEUROPED_JWT_SECRET` | 64 bytes base64 estáveis (gere uma vez; **não troque** entre deploys, senão invalida sessões). |
| `ADMIN_INITIAL_PASSWORD` | Senha inicial do admin. |
| `ADMIN_EMAIL` | E-mail do admin (ex.: `jadsonfraga@hotmail.com`). |
| `ADMIN_NAME` | (opcional) Nome exibido. |

> Os secrets do Cloudflare (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) já
> existem no repositório. Sem os secrets de auth acima, o deploy continua
> funcionando e os passos de auth são **pulados** com aviso (não quebram o build).

Gerar o `NEUROPED_JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## Variáveis envolvidas
| Variável | Obrigatória | Descrição |
|---|---|---|
| `ADMIN_EMAIL` | sim | E-mail de login do admin inicial. |
| `ADMIN_INITIAL_PASSWORD` | sim | Senha **inicial** (o app exige troca no 1º login). |
| `ADMIN_NAME` | não | Nome exibido (default: "Administrador"). |
| `NEUROPED_JWT_SECRET` | sim | Assina os tokens de sessão. Gere 64 bytes aleatórios. |

Geração de um segredo forte:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## Comportamento do bootstrap (`server/storage.ts → bootstrapAdmin`)

1. Só roda se `ADMIN_EMAIL` **e** `ADMIN_INITIAL_PASSWORD` estiverem definidos.
2. **Só cria se o e-mail ainda não existir** no banco. Se o usuário já existe, a
   variável é ignorada — **não reseta** a senha.
3. O admin nasce com `must_change_password = 1`: a senha inicial vale só para a
   primeira entrada e o app **obriga a troca** em seguida.

## Onde definir (por plataforma)

O login é servido pelo **backend Node/Express** (`npm start`). Defina as
variáveis onde esse backend roda:

### Railway (backend principal)
1. Projeto → aba **Variables**.
2. Adicione `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `ADMIN_NAME` (opcional) e
   `NEUROPED_JWT_SECRET`.
3. **Redeploy** para o bootstrap rodar.

### Cloudflare Pages — auth nativo no D1 (implementado)

O login em produção (`neuroped.pages.dev`) é servido por **Pages Functions sobre
D1** (`functions/api/auth/*`), com hash PBKDF2 (Web Crypto) e JWT HS256. Para
ativar, faça **uma vez**:

1. **Migrar o D1** (adiciona colunas de auth em `users`, sem perder dados):
   ```bash
   npx wrangler d1 execute neuroped-db --remote --file=./db/migrations/0001_users_auth.sql --yes
   ```
2. **Definir os secrets** do projeto Pages:
   ```bash
   npx wrangler pages secret put NEUROPED_JWT_SECRET     # gere 64 bytes aleatórios
   npx wrangler pages secret put ADMIN_INITIAL_PASSWORD  # senha inicial do admin
   ```
3. **Definir as vars não-secretas** (em `[vars]` do `wrangler.toml` ou no painel):
   `ADMIN_EMAIL`, `ADMIN_NAME` (opcional).
4. **Redeploy.** No primeiro `POST /api/auth/login`, o admin é criado de forma
   idempotente a partir de `ADMIN_EMAIL`/`ADMIN_INITIAL_PASSWORD`.

Notas:
- O middleware libera `/api/auth/*` do bloqueio _demo read-only_; as demais
  escritas clínicas continuam bloqueadas em produção (por design).
- Tokens são _stateless_ nesta versão (logout descarta no client; sem revogação
  server-side). Há _lockout_ de 15 min após 5 tentativas falhas por conta.
- Se o e-mail já existir **com** senha, o bootstrap não sobrescreve. Sem senha
  (ex.: seed só com PIN), ele faz _backfill_ do hash.

### Vercel (se hospedar o backend/API)
Settings → **Environment Variables** → adicione as mesmas chaves para o ambiente
**Production** → _Redeploy_.

### Local (desenvolvimento)
Crie um `.env` (já ignorado pelo git) na raiz com as chaves acima e rode
`npm start`. Veja os nomes em `.env.example`.

## Resetar a senha de um admin que já existe

Como o bootstrap não sobrescreve, para trocar a senha de um e-mail já cadastrado:

- **Logado:** use o fluxo "Trocar senha" no app; **ou**
- **No banco:** remova o registro do usuário e redeploy com as variáveis para
  recriar; **ou** atualize o `password_hash` manualmente com um hash válido.

## Segurança

- Trate a senha como segredo: defina-a **só** via painel de _secrets_.
- Prefira uma senha forte e troque-a logo no primeiro login.
- O `NEUROPED_JWT_SECRET` deve ser único por ambiente e nunca commitado.
