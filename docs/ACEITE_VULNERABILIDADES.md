# Aceitação consciente de vulnerabilidades (npm audit) — 2026-06-16

> Decisão fundamentada. Reavaliar a cada upgrade de toolchain.

## Estado medido
- **`npm audit` (total): 9** — 6 low, 1 moderate, 2 high.
- **`npm audit --omit=dev` (produção): 6 low.**

## Classificação honesta

### 🟢 Dev-only — NÃO vão para produção (aceitos)
- **2 high + 1 moderate:** cluster **`esbuild` / `vite` / `tsx` / `@esbuild-kit`**.
  - Advisories: esbuild "arbitrary file read **running the development server** on Windows" (GHSA-g7r4-m6w7-qqqr) e RCE via NPM_CONFIG_REGISTRY no módulo Deno (GHSA-gv7w-rqvm-qjhr).
  - **Por que aceitar:** só afetam o **dev server** local. A produção Cloudflare serve **build estático** (sem esbuild/vite em runtime). Não há superfície em produção.
  - **Por que não corrigir agora:** `esbuild@0.28.1` é **breaking change**; vite/tsx fixam versões específicas → risco de quebrar build/dev por vuln que não afeta produção.

### 🟡 Produção (bundle) — 6 low, aceitos com monitoramento
- **6 low:** `elliptic@6.6.1` via `create-ecdh` / `browserify-sign` ← `crypto-browserify` ← `node-stdlib-browser` ← **`vite-plugin-node-polyfills@0.28.0`**.
  - É o **polyfill de crypto do browser** — pode ser bundlado p/ a **assinatura digital P12 client-side**.
  - Severidade **LOW** (questões de timing/validação no `elliptic`).
  - **Por que aceitar por ora:** o fix sugerido (`vite-plugin-node-polyfills@0.2.0`) é **downgrade major breaking** → risco de quebrar a feature de crypto/assinatura. `elliptic` é amplamente usado; sem exploit prático de alto impacto no contexto.
  - **Ação:** monitorar patch **não-breaking** do `vite-plugin-node-polyfills`/`elliptic`; reavaliar no próximo upgrade.

## Veredito
- **Nenhum high/moderate em produção** ✅ (todos dev-only).
- **6 low em produção** (polyfill de crypto) — aceitos conscientemente, baixa severidade, fix é breaking. **NÃO é "0 produção"** — registrado honestamente.
