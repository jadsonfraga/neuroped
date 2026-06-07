# Deploy recente — janela de 60 minutos

Registro operacional da consolidação solicitada em 2026-06-06 para os commits recentes na branch `work`.

## Escopo incluído

Commits encontrados nos 60 minutos anteriores à validação local:

- `e1cfef2` — feat: improve NeuroPed clinical UX audit flow (#362)
- `781bf2d` — chore(scorecard): reconhece gate real de API e specs E2E (#361)

## Resultado do merge

A branch `work` já continha os commits recentes listados acima no `HEAD` local. Não havia remotes configurados no repositório local, portanto não foi possível buscar ou integrar alterações externas adicionais.

## Resultado do deploy local

O deploy foi validado por build local de produção com `npm run build`. O pacote gerado em `dist/` confirma que os commits recentes estão prontos para publicação pelo provedor configurado.

## Observações

- Sem remotes Git configurados, o envio para GitHub/Render/Railway/Fly/VPS não pode ser executado a partir deste ambiente.
- Para deploy automático externo, configure um remote Git e o provedor para publicar o último commit da branch `work`.

## Deploy acionado — 2026-06-07

Deploy acionado diretamente na branch `main` para publicar todos os commits já integrados no ramo principal.

### Método

- Commit operacional mínimo em documentação para gerar evento `push` em `main`.
- O workflow `.github/workflows/deploy-cloudflare.yml` está configurado para executar em `push` na branch `main` e também por `workflow_dispatch`.
- O build de produção usa `npx vite build` e publica `dist/public` no projeto Cloudflare Pages `neuroped`.

### PRs abertos não integrados neste disparo

Os PRs recentes #365, #366, #367, #368, #369 e #370 foram identificados como abertos, porém aparecem como `mergeable: false` na API do GitHub. Portanto, não foram mesclados automaticamente neste deploy para evitar conflito silencioso ou perda de trabalho.

### Resultado esperado

Este commit força novo deploy de produção com o conteúdo atual de `main`, mantendo rastreabilidade do acionamento.
