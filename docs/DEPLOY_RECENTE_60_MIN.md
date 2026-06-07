# Deploy recente — janela de 60 minutos

Registro operacional da consolidacao solicitada em 2026-06-06 para os commits recentes na branch `work`.

## Escopo incluido

Commits encontrados nos 60 minutos anteriores a validacao local:

- `e1cfef2` — feat: improve NeuroPed clinical UX audit flow (#362)
- `781bf2d` — chore(scorecard): reconhece gate real de API e specs E2E (#361)

## Resultado do merge

A branch `work` ja continha os commits recentes listados acima no `HEAD` local. Nao havia remotes configurados no repositorio local, portanto nao foi possivel buscar ou integrar alteracoes externas adicionais.

## Resultado do deploy local

O deploy foi validado por build local de producao com `npm run build`. O pacote gerado em `dist/` confirma que os commits recentes estao prontos para publicacao pelo provedor configurado.

## Observacoes

- Sem remotes Git configurados, o envio para GitHub/Render/Railway/Fly/VPS nao pode ser executado a partir deste ambiente.
- Para deploy automatico externo, configure um remote Git e o provedor para publicar o ultimo commit da branch `work`.

---

# Deploy dos PRs prontos — 2026-06-07

Registro operacional da solicitacao "Deploy os PRs que estao prontos" em 2026-06-07, executada na branch local `work`.

## PRs/commits considerados prontos

A fila local continha o historico ja consolidado ate `HEAD`:

- `0d011c4` — `fix: corrige filtro guiado e endurece aplicacao de escalas`
- `7c1a20c` — `chore: registra deploy dos commits recentes (#363)`
- `e1cfef2` — `feat: improve NeuroPed clinical UX audit flow (#362)`
- `781bf2d` — `chore(scorecard): reconhece gate real de API e specs E2E (#361)`

## Validacao executada

- `npm run build` concluido com sucesso, gerando `dist/public/` e `dist/index.cjs`.
- `npm run check && npm run test:clinical` concluido com sucesso; o teste clinico reportou 347 casos, 141.314 assertivas e 583 escalas.

## Tentativa de publicacao externa

A publicacao direta no Cloudflare Pages foi tentada com:

```bash
npx wrangler@3 pages deploy dist/public --project-name neuroped --branch work
```

O ambiente bloqueou a obtencao do pacote `wrangler` no npm (`403 Forbidden`) e o repositorio local continua sem remote Git configurado. Portanto, nesta execucao, o deploy externo nao pode ser acionado a partir do container; o artefato de producao ficou validado localmente e pronto para publicacao pelo provedor configurado.

## Proximo acionamento possivel

Assim que o ambiente tiver um remote Git/autenticacao ou `wrangler` disponivel com credenciais Cloudflare, publicar o artefato validado com uma das rotas abaixo:

- push para `main`, acionando os workflows `.github/workflows/deploy.yml` e `.github/workflows/deploy-cloudflare.yml`; ou
- `wrangler pages deploy dist/public --project-name neuroped --branch main`.

---

# Deploy acionado — 2026-06-07

Deploy acionado diretamente na branch `main` para publicar todos os commits ja integrados no ramo principal.

## Metodo

- Commit operacional minimo em documentacao para gerar evento `push` em `main`.
- O workflow `.github/workflows/deploy-cloudflare.yml` esta configurado para executar em `push` na branch `main` e tambem por `workflow_dispatch`.
- O build de producao usa `npx vite build` e publica `dist/public` no projeto Cloudflare Pages `neuroped`.

## Resolucao de conflitos

- Conflito documental do PR #366 consolidado no `main`.
- PR #366 sincronizado em branch separada com o mesmo conteudo consolidado.
- PRs #365, #367, #368, #369 e #370 seguem como conflitos funcionais/visuais a consolidar.

---

# Deploy acionado apos PR #381 — 2026-06-07

Commit operacional minimo para gerar novo evento `push` em `main` apos o merge da PR #381.

## Escopo

- Publicar a correcao de PWA/subpath do GitHub Pages.
- Garantir que `manifest.json`, icones e `sw.js` passem a usar caminhos relativos no artefato publicado.

## Commit-alvo da correcao

- `815e04d6c1432ce11f6e6e20f8b578052b40fbfc` — `fix(pwa): use relative asset paths for GitHub Pages (#381)`.

## Workflows esperados

- `.github/workflows/test.yml` — Verify (catraca).
- `.github/workflows/deploy.yml` — GitHub Pages.
- `.github/workflows/deploy-cloudflare.yml` — Cloudflare Pages.

---

# Deploy acionado apos PR #394 — 2026-06-07

Commit operacional minimo para gerar novo evento `push` em `main` apos a entrada do recurso de relatorio final das escalas.

## Escopo

- Publicar o bloco final das escalas com PDF/impressao contendo todas as respostas.
- Publicar o botao de encaminhamento pelo WhatsApp/Zap.
- Manter a fila de PRs limpa apos fechamento da PR duplicada #395.

## Commit-alvo da correcao

- `8933eb139dbca7ca331245030854ef4242f4710c` — `feat(scales): PDF completo e WhatsApp estaveis (#394)`.

## Workflows esperados

- `.github/workflows/test.yml` — Verify (catraca).
- `.github/workflows/deploy.yml` — GitHub Pages.
- `.github/workflows/deploy-cloudflare.yml` — Cloudflare Pages.
