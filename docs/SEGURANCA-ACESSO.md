# Segurança de acesso — produção

## Arquitetura vigente

- `https://neuroped.pages.dev` é o full-stack canônico: frontend, Pages
  Functions e D1.
- `https://neuroped.vercel.app` e `https://superneuroped.vercel.app` executam o
  mesmo cliente em modo `remote` e usam a API canônica com login nominal, JWT
  de curta duração e refresh revogável.
- `https://jadsonfraga.github.io/neuroped/` não executa o aplicativo. Publica
  somente um redirecionador para o domínio canônico e remove estado legado do
  NeuroPed no navegador.

## Por que o GitHub Pages não recebe login remoto

Todo projeto publicado por essa conta compartilha a origin
`https://jadsonfraga.github.io`. Como `sessionStorage` é isolado por origin, e
não por caminho, outro projeto sob o mesmo host poderia ler os tokens do app.
Até existir um domínio exclusivo, o GitHub Pages não entra na allowlist CORS e
jamais recebe o bundle clínico.

## Contrato de produção

- Builds públicos usam `VITE_AUTH_MODE=remote` e API fixa no Cloudflare.
- Os aliases Vercel são autorizados por comparação CORS exata; wildcard,
  previews, esquema HTTP, portas alternativas e hosts parecidos são negados.
- Nenhum verificador PBKDF2 pode aparecer no artefato final. A catraca
  `audit:built-pin` falha a release se encontrar um.
- Rotas clínicas continuam protegidas no backend por autenticação, papel e
  ownership. Uma trava de interface nunca substitui autorização do servidor.
- O modo de PIN permanece apenas para instalação local/offline explicitamente
  configurada e não é usado por nenhum host público oficial.

## Evidência exigida a cada deploy

1. sentinela pública com o SHA exato;
2. health com D1 e autenticação configurados;
3. preflight CORS exato para cada alias Vercel;
4. login inválido rejeitado e login nominal aceito;
5. `/api/auth/me` autenticado;
6. logout com revogação comprovada;
7. ausência de verificador PBKDF2 no bundle.
