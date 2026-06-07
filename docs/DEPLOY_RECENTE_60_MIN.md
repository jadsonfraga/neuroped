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

---

# Deploy dos PRs prontos — 2026-06-07

Registro operacional da solicitação “Deploy os PRs que estão prontos” em 2026-06-07, executada na branch local `work`.

## PRs/commits considerados prontos

A fila local continha o histórico já consolidado até `HEAD`:

- `0d011c4` — `fix: corrige filtro guiado e endurece aplicação de escalas`
- `7c1a20c` — `chore: registra deploy dos commits recentes (#363)`
- `e1cfef2` — `feat: improve NeuroPed clinical UX audit flow (#362)`
- `781bf2d` — `chore(scorecard): reconhece gate real de API e specs E2E (#361)`

## Validação executada

- `npm run build` concluído com sucesso, gerando `dist/public/` e `dist/index.cjs`.
- `npm run check && npm run test:clinical` concluído com sucesso; o teste clínico reportou 347 casos, 141.314 assertivas e 583 escalas.

## Tentativa de publicação externa

A publicação direta no Cloudflare Pages foi tentada com:

```bash
npx wrangler@3 pages deploy dist/public --project-name neuroped --branch work
```

O ambiente bloqueou a obtenção do pacote `wrangler` no npm (`403 Forbidden`) e o repositório local continua sem remote Git configurado. Portanto, nesta execução, o deploy externo não pôde ser acionado a partir do container; o artefato de produção ficou validado localmente e pronto para publicação pelo provedor configurado.

## Próximo acionamento possível

Assim que o ambiente tiver um remote Git/autenticação ou `wrangler` disponível com credenciais Cloudflare, publicar o artefato validado com uma das rotas abaixo:

- push para `main`, acionando os workflows `.github/workflows/deploy.yml` e `.github/workflows/deploy-cloudflare.yml`; ou
- `wrangler pages deploy dist/public --project-name neuroped --branch main`.

