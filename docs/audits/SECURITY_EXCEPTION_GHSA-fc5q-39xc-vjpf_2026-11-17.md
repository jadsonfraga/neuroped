# Exceção temporária de auditoria — GHSA-fc5q-39xc-vjpf (picomatch)

- **Data da decisão:** 17/11/2026, pelo responsável pelo repositório.
- **Validade:** até 01/12/2026 (`expiresOn: "2026-12-01"` em `scripts/guards/npm-audit-gate.mjs`). Vencida, o portão volta a bloquear a CI e o deploy.
- **Escopo:** somente o advisory `GHSA-fc5q-39xc-vjpf` no pacote `picomatch`. Pacotes que só herdam a falha (anymatch, chokidar, micromatch, fast-glob, readdirp, fdir, tinyglobby, sucrase, tailwindcss, vite, @vitejs/plugin-react, @typescript-eslint/typescript-estree) passam por herança transitiva, conforme a regra já existente do portão. Qualquer outro advisory high/critical continua bloqueando.

## Motivo

O advisory (ReDoS por extglobs repetidos, severidade high) atinge todas as versões publicadas do `picomatch` (≤ 4.0.7); `npm audit` informa `fixAvailable: false`. Sem exceção, o portão `npm-audit-gate` bloqueia toda a CI e o passo de deploy de `deploy-cloudflare.yml` para qualquer commit da `main`.

## Exposição analisada

- `picomatch` 2.3.2 / 4.0.4 / 4.0.7 entra apenas por ferramentas de build e desenvolvimento: Tailwind (chokidar, micromatch, sucrase/tinyglobby), Vite (tinyglobby), ESLint (`@typescript-eslint/typescript-estree`).
- Ausente do bundle publicado (`dist/public/assets`, verificado por busca) e não importado por `functions/`, `server/`, `shared/` ou `client/src`.
- Os padrões de glob avaliados vêm da configuração do próprio repositório (conteúdo do Tailwind, Vite, ESLint), não de entrada de usuário. O ReDoS exige padrão controlado por atacante.

## Saída

Remover a entrada da allowlist e o teste que a fixa assim que houver versão corrigida do `picomatch` (atualizar o lockfile) ou, no mais tardar, rever a decisão em 01/12/2026.

## Verificação

`node scripts/guards/npm-audit-gate.mjs` → "nenhuma vulnerabilidade high/critical fora da allowlist ativa" com a exceção listada; `node --test tests/unit/npm-audit-gate.test.mjs` verde.
