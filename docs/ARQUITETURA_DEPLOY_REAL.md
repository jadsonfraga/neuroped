# Arquitetura de deploy — REAL (fonte da verdade)

> Atualizado em 2026-06-16. Substitui referências enganosas a Render/Railway/Vercel.

## Produção = Cloudflare Pages (único full-stack)
- **Frontend** (Vite build estático) **+ Functions** (`functions/api/*`) **+ D1** servidos pela **mesma origem** Cloudflare Pages.
- URL: `https://neuroped.pages.dev` (projeto `neuroped`).
- FE→BE: `API_BASE = ""` → `fetch("/api/...")` **mesma origem** (sem CORS, sem proxy externo).
- Catch-all `/api/*` não-coberto por Function dedicada → **404 JSON seguro** (sem proxy).
- Estado atual: **`mode: DEMO_HOMOLOGACAO`, `realPatientsEnabled: false`** (sem dado real de paciente).

## Express (`server/`) = DEV LOCAL apenas
- `npm run dev` = `tsx server/index.ts` (Express). **É a única função do `server/`: desenvolvimento local.**
- **NÃO é produção.** Produção não usa Express — usa Functions Cloudflare.
- Por isso `server/` é mantido (não remover — quebraria o `npm run dev`).

## Removido (refs órfãs/enganosas — não eram produção)
- `render.yaml` — deployava um Express `neuroped-api` no Render (órfão; prod é Cloudflare).
- `railway.json`, `railway.toml`, `nixpacks.toml` — configs Railway/build órfãs (o serviço Railway `neuroped-api-production` é de OUTRO repo, não deste).
- Preservados no histórico git; removidos do tree para não confundir.

## Mirrors estáticos (GitHub Pages / Vercel)
- `vite base: "./"` (caminhos relativos) → o FE roda como **mirror estático** em qualquer subpath.
- Nesses mirrors, `/api/*` é relativo e **não tem backend** → endpoints de API não respondem ali.
- **Decisão: NÃO transformar em full-stack cross-origin** — ver `docs/DECISAO_MIRRORS.md`.
