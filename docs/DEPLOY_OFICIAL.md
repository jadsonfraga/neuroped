# Deploy Oficial - NeuroPed

## Regra de seguranca

O aplicativo completo pode ser publicado apenas em origens exclusivas. Dados
clínicos trafegam somente pela API oficial autenticada. O GitHub Pages da conta
é uma origin compartilhada e publica apenas um redirecionador sem bundle.

## API oficial

O backend canônico de produção é Cloudflare Pages Functions (`functions/api`) com D1. Ele exige autenticação nominal, sessões refresh revogáveis, autorização por proprietário e auditoria. O provisionamento oficial aplica `db/schema.d1.sql` e todas as migrações em `db/migrations/`.

Secrets de bootstrap: `NEUROPED_JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_NAME` e
`ADMIN_INITIAL_PASSWORD`. O par administrativo nunca é sobrescrito quando a
conta já possui senha. Para a jornada sentinela de cada deploy, prefira uma
conta técnica ativa e sem dados clínicos, configurada em
`NEUROPED_E2E_EMAIL` e `NEUROPED_E2E_PASSWORD`; enquanto ela não existir, o
workflow usa o par administrativo como compatibilidade. Depois de validar a
conta sentinela, remova `ADMIN_INITIAL_PASSWORD` do GitHub e do Cloudflare — o
deploy deixa de depender dele quando os dois secrets E2E estiverem presentes.

Toda senha criada ou redefinida pelo bootstrap é temporária. O usuário precisa
concluir `/alterar-senha`; a operação exige a senha atual, aplica a política
forte, revoga todas as sessões e só então libera as demais APIs protegidas.

## Cobrança comercial

O plano canônico é `NeuroPed Profissional`, R$ 99 por assento/mês, com uma
avaliação de 14 dias por conta. Configure no GitHub Actions e no projeto
Cloudflare Pages:

- `STRIPE_SECRET_KEY`: chave secreta do ambiente de produção;
- `STRIPE_PRICE_ID`: Price ativo, recorrente mensal, moeda BRL e valor unitário
  de 9900 centavos;
- `STRIPE_WEBHOOK_SECRET`: signing secret exclusivo de
  `https://neuroped.pages.dev/api/billing/webhook`.

O workflow sincroniza esses secrets sem imprimir valores. A API confirma o
contrato do Price antes de abrir Checkout, valida o corpo bruto e a assinatura
do webhook, deduplica eventos, reconcilia o snapshot atual e suspende escrita se
o Price ou a quantidade deixarem de ser canônicos. Se qualquer secret estiver
ausente, checkout e portal falham fechados; nenhum estado do frontend ativa o
plano. Uma lease atômica no D1 reutiliza a sessão Checkout aberta e impede duas
assinaturas concorrentes para a mesma clínica. Cancelamento ou inadimplência
bloqueiam novas gravações, mas preservam leitura e exportação dos dados.

Gestores adicionam pessoas por convite de uso único, com 32 bytes aleatórios e
validade de 7 dias. Apenas o SHA-256 do token fica no D1. Convites pendentes
reservam assento; índices e triggers impedem duplicidade e excesso inclusive em
requisições concorrentes. Contas existentes confirmam a própria senha e contas
novas precisam cumprir a política forte antes de receber a membership.

## Express local

`server/index.ts` é o backend de desenvolvimento/local e usa um único SQLite (`DATABASE_PATH`). Ele não oferece suporte de produção a `DATABASE_URL`/Postgres. Não configure `DATABASE_URL` esperando migração automática e não use SQLite efêmero para dados clínicos.

## Frontends oficiais

- Cloudflare Pages: frontend e API na mesma origin, em modo remoto.
- Vercel (`https://superneuroped.vercel.app`): mirror público em modo remoto com
  `VITE_API_URL=https://neuroped.pages.dev`; é o único alias Vercel aceito pelo
  CORS. `https://neuroped.vercel.app` pertence a outro aplicativo e não é uma
  origem oficial do NeuroPed.
- GitHub Pages: redirecionador para o Cloudflare. Não contém React, assets do
  app, PIN ou tokens.

O modo local/PIN existe somente para instalação local ou offline explicitamente
configurada. Nenhum pipeline público depende de `VITE_PIN_HASH`.
