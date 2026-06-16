# Segurança de dependências — residuais aceitos

_Última auditoria: 2026-06-16 (commit pós-58607f3)._

Estado: **8 vulnerabilidades npm** (2 high · 6 low), **todas em ferramentas de
build/desenvolvimento** — **nenhuma com superfície de ataque em produção**.

O bundle publicado (Cloudflare Pages / GitHub Pages / Vercel) é **estático** e o
backend roda como **Cloudflare Functions + D1**; nenhuma dessas dependências
vulneráveis é executada em produção.

## Por que NÃO migramos agora

Todas as correções restantes exigem **majors quebráveis**. Já validamos que
subir esse cluster quebra a build (vite 8 → rolldown) ou a migração de banco
(drizzle-kit). O risco de regressão supera o benefício para vulnerabilidades que
**só afetam o ambiente local de desenvolvimento**.

| Pacote | Sev | Natureza | Por que é aceitável |
|---|---|---|---|
| `esbuild` (transitiva) | high | Advisory do **dev-server** (GHSA): um site pode falar com o `vite dev`. | Só vale com `npm run dev` rodando localmente; o dev-server **não é exposto** em produção. |
| `drizzle-kit` (dev) | high | Puxa esbuild antigo; ferramenta de migração (`db:push`/`db:generate`). | Dev-only; não vai para o bundle nem para as Functions. |
| `elliptic`, `crypto-browserify`, `create-ecdh`, `browserify-sign`, `node-stdlib-browser`, `vite-plugin-node-polyfills` | low | Cadeia de **polyfills de cripto** do build do browser. | Severidade baixa; uso restrito ao processo de build. |

Já resolvidos sem quebrar (histórico recente):
`bcrypt` 5→6, `nodemailer` 6→8, `drizzle-orm` 0.39→0.45, `js-yaml` (patch), e o
cluster vite/esbuild de produção via vite 8.

## Gatilho de revisão

Revisitar quando:
1. `vite-plugin-node-polyfills` publicar major compatível com a build atual, **ou**
2. `drizzle-kit` lançar versão sem o esbuild vulnerável, **ou**
3. qualquer advisory passar a ter **superfície em produção/runtime** (ex.: deixar
   de ser dev-only) — neste caso, **migrar imediatamente**, mesmo que quebre.

Como reauditar: `npm audit` (visão geral) e `npm audit --json` (detalhe por pacote).
