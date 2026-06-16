# Decisão: NÃO ativar mirrors full-stack cross-origin — 2026-06-16

## Contexto
- GitHub Pages / Vercel servem o FE como **mirror estático** (`vite base: "./"`, `/api` relativo). Sem backend nessas origens, os endpoints de API não respondem ali.
- Tentação: torná-los funcionais apontando o FE para o backend Cloudflare via `VITE_API_URL` + liberando essas origens em `CORS_ORIGINS`.

## Por que NÃO fazer (risco de auth cross-origin)
1. **Cookies httpOnly cross-site:** exigiriam `SameSite=None; Secure` + CORS **credenciado** → abre **superfície de CSRF** e esbarra no bloqueio de cookies de terceiros dos browsers.
2. **JWT em header:** evita cookie, mas exige CORS credenciado **por origem específica** (jamais `*` com `Allow-Credentials`) e mantém o token em storage acessível a JS (**risco XSS**).
3. **Erro de configuração** = ou a auth quebra, ou o CORS abre demais (exposição).
4. **Ganho marginal** vs. complexidade/risco de segurança: não compensa.

## Decisão
- **Manter a arquitetura single-origin Cloudflare** (FE + Functions na mesma origem): zero cross-origin auth, zero CORS credenciado, zero superfície de CSRF.
- GitHub Pages / Vercel ficam como **mirror estático** (ou são aposentados) — **não** viram full-stack cross-origin.
- Se um dia precisar de outra instância funcional, que seja **single-origin própria** (backend na mesma origem), nunca cross-origin apontando para o Cloudflare.

**Ação de código: nenhuma.** Decisão registrada.
