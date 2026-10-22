# Login de visitante: abre só as escalas

Usuário `visitante`, com a senha definida por você num segredo do ambiente. A
conta existe e só autentica enquanto o segredo existir. Nenhuma senha está no
repositório nem no banco.

## Ligar

1. Defina o segredo `NEUROPED_VISITOR_PASSWORD` (mínimo 8 caracteres) em um
   destes lugares:
   - **GitHub** → Settings → Secrets → Actions → `NEUROPED_VISITOR_PASSWORD`.
     O próximo deploy da `main` o grava no Cloudflare Pages
     (`deploy-cloudflare.yml`, passo "Configurar secrets/vars de auth"). Se a
     senha tiver menos de 8 caracteres o deploy avisa e não a grava.
   - **Cloudflare** → Pages → neuroped → Settings → Variables and Secrets →
     `NEUROPED_VISITOR_PASSWORD`. Segredos do Pages valem a partir do **próximo
     deploy** (rode o workflow de deploy ou "Retry deployment").
2. Na tela de login, usuário `visitante` e a senha escolhida.

A conta `visitante` é criada no primeiro login correto e sem clínica. No banco
ela tem o papel mínimo `reader` (a tabela `users` só aceita
admin/professional/reader/operator) e o e-mail reservado `visitante`; a API
expõe o papel `visitor`. O cadastro exige "@", então ninguém consegue criar essa
identidade pelo site. A coluna `password_hash` guarda só uma impressão digital
do segredo vigente (`visitor-fp:...`), nunca a senha nem um hash verificável.

## Desligar ou trocar a senha

- **Trocar ou remover o segredo e fazer novo deploy** invalida as sessões
  emitidas sob o segredo anterior na próxima chamada de API delas (o middleware
  e o refresh comparam a impressão digital e revogam a família). Isso vale
  também para "remover e recolocar": sessões revogadas não voltam. Se o mesmo
  segredo for restaurado sem que nenhuma sessão tenha feito chamada no
  intervalo, ela continua válida (é o mesmo segredo).
- Se o segredo também existir no GitHub, **apague-o lá**: senão o próximo
  deploy o recoloca.
- **Corte imediato, sem deploy:** `UPDATE users SET is_active = 0 WHERE
  lower(email) = 'visitante';` no D1. O login não reativa a conta.
- Abas já abertas continuam navegando nas páginas de escala (que não chamam a
  API) até recarregar; o corte vale para a API e para o próximo carregamento.

## O que o visitante pode

- Abrir as páginas de escala e o catálogo (lista exata em `VISITOR_ROUTES`,
  `client/src/security/routeGuardPolicy.ts`): biblioteca e instrumentos
  padronizados, filtro de escalas, `/generic-scale/:id` e as páginas de
  instrumento (M-CHAT, CARS, SNAP etc.).
- Ler a própria sessão: `GET /api/auth/me`.

## O que o visitante não pode

Tudo o mais é `403 VISITOR_RESTRICTED` no servidor, qualquer método: pacientes,
prontuário, clínicas, perfil, documentos, receitas, agenda, cobrança, convites,
consentimentos, troca de senha, auditoria e administração. O papel `visitor`
não está em `KNOWN_ROLES`, então os handlers que usam `getContextUser` já o
recusam por construção. Na interface, qualquer rota fora da lista (inclusive
páginas públicas e `/`) redireciona ao catálogo; menus, paleta de comandos e
dock mostram só as escalas.

## Limites honestos

- **Senha compartilhada por definição.** Quem a tiver entra. O que protege é o
  escopo (sem paciente, sem clínica, somente leitura) e o interruptor do
  segredo. Não use para nada que precise de privacidade.
- **Não esconde o conteúdo do bundle.** O site é estático e público: o código
  das escalas já vai ao navegador de qualquer pessoa (ver
  `client/src/lib/publicRoutes.ts`). O login de visitante controla navegação e
  API, não impede ler o JavaScript publicado.
- Sem lockout por conta: uma conta compartilhada trancada por terceiros negaria
  acesso a todos. O limite distribuído de tentativas por IP continua valendo.
- Sessões de visitante não entram nas métricas de clientes (o papel `reader` do
  banco já é excluído de `_productMetrics`).

## Verificação

`node --import tsx tests/unit/visitor-login.test.ts` (login, sem lockout,
deny-by-default no middleware, interruptores, sem sequestro de identidade) e
`node --import tsx tests/unit/route-guard-policy.test.ts` (rotas do visitante).
Ambos fazem parte de `npm run test:quick-wins`.
