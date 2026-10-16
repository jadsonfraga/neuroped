# Correções da auditoria (gravidade alta e média) — 16/10/2026

## O que mudou no código
| Item | Correção |
|---|---|
| Rota inexistente presa em "Verificando acesso seguro…" | `client/src/security/knownRoutes.ts` + `RouteGuard`/`PrivateGate`: endereço que não existe mostra a página 404 de imediato. Rotas conhecidas seguem protegidas como antes. Teste de sincronia: `tests/unit/known-routes-sync.test.mjs`. |
| Primeira carga só com o modal "Aviso importante" | O modal é o aceite legal da primeira visita (intencional). Para a tela não parecer vazia enquanto os chunks carregam, `index.html` agora traz um "Carregando o NeuroPed…" estático dentro de `#root`. |
| Textos internos em /planos, /cadastro e /eletroencefalograma | Reescritos em linguagem de cliente (sem "tenant", "self-service", "/agendar", "intervenção manual no banco"). Nenhum texto clínico foi tocado. |
| `/robots.txt` e `/sitemap.xml` | Arquivos reais em `client/public/`. No espelho Vercel, `scripts/mirror-seo.mjs` (rodado no `buildCommand`) troca o robots por `Disallow: /` e remove o sitemap. Observação: o app usa rotas por hash (`#/...`), que crawlers ignoram; por isso o robots só pode bloquear `/api/` e páginas estáticas. As áreas autenticadas são protegidas por login, não por robots. |
| Canonical / noindex | `<link rel="canonical" href="https://neuroped.pages.dev/">` no `index.html` (vale para os dois builds) e `X-Robots-Tag: noindex, nofollow` no Vercel (`vercel.json`). |
| Meta og/twitter | Acrescentados `og:site_name`, `og:locale`, `og:image:alt/width/height`, `twitter:image` e `twitter:image:alt`. |
| CORS | `/api/*` já restringe a origem à própria origem + `https://superneuroped.vercel.app` (`functions/api/_middleware.ts`). O `*` vinha do padrão do Cloudflare Pages para assets estáticos: `client/public/_headers` agora remove `Access-Control-Allow-Origin` (`! Access-Control-Allow-Origin`). |
| CSP | `img-src` reduzido de `'self' data: blob: https:` para `'self' data: blob:` em `_headers` e `vercel.json` (não há imagem remota no código). `style-src 'unsafe-inline'` permanece (ver abaixo). |
| `<main>` aninhado em /dyslexia-risk (#1077) | Não há mais `<main>` na página nem nos componentes dela (corrigido antes, #1088/#1140); apenas o `<main>` do Layout permanece. Issue pode ser fechada após conferência com axe. |

### Por que `style-src 'unsafe-inline'` permanece
React/Radix/Tailwind e componentes de gráfico aplicam `style="..."` (atributos inline) em runtime, e o próprio `index.html` usa estilo inline. Remover quebra o layout. Caminho futuro: migrar para classes/CSS variables e só então usar `style-src 'self'` (ou nonces/hashes, que exigem servidor gerando o HTML — não disponível no Pages estático).

## Os dois sites: "builds divergentes"
Em 16/10/2026 os dois deploys estavam no **mesmo commit** (`cfe2f6d4657e`, via `deploy-check.json`). Os hashes dos arquivos JS diferem **por construção**: `VITE_API_URL` é embutido no bundle (vazio no Cloudflare; `https://neuroped.pages.dev` no Vercel). As diferenças de menu/imagens vistas no teste vieram de carga tardia (lazy) e estado do navegador, não de versão. Para verificar a qualquer momento: `node scripts/check-deploy-parity.mjs`.
No teste ao vivo com navegador novo, `/#/familia` renderizou igual nos dois sites (o "branco" ocorreu durante o carregamento).

## LGPD — LGPD_BUCKET_NOT_CONFIGURED
Decisão deliberada do repositório (`tests/unit/clinical-lgpd-provisioning-static.test.mjs`): **não** versionar `[[r2_buckets]]` no `wrangler.toml`, para não apontar produção para um recurso inexistente; o workflow `deploy-cloudflare.yml` injeta o binding quando o bucket existe. Este PR mantém essa regra e **não cria recursos**. Passos manuais (conta Cloudflare):

1. Cloudflare → R2 → *Create bucket* `neuroped-lgpd-exports` (privado; sem domínio público nem acesso r2.dev).
2. Opção A (automática): adicionar ao `CLOUDFLARE_API_TOKEN` do GitHub a permissão de conta **Workers R2 Storage: Edit** e rodar de novo o workflow *Deploy Cloudflare*; ele confere o bucket e injeta o binding.
3. Opção B (manual): Pages → projeto `neuroped` → Settings → Functions → R2 bucket bindings → variável `LGPD_EXPORT_BUCKET` → bucket `neuroped-lgpd-exports` (Production) e fazer novo deploy.
4. Conferir: `curl https://neuroped.pages.dev/api/health` não deve conter `LGPD_BUCKET_NOT_CONFIGURED`.

Se a política mudar e o binding puder ser versionado, o trecho é:
```toml
[[r2_buckets]]
binding = "LGPD_EXPORT_BUCKET"
bucket_name = "neuroped-lgpd-exports"
```
(isso exige atualizar o teste estático acima e o `cloudflare-release-bindings.test.py`).
