# BLOCKED_EXTERNAL — smoke de produção pós-deploy (commit 9b3a300)

## Sistema
Ambiente de execução (container de sessão Claude Code on the web) — proxy de
saída HTTPS pré-configurado do ambiente.

## Permissão exata necessária
Acesso de rede de saída para os hosts públicos de produção/espelho:
- `neuroped.pages.dev` (Cloudflare Pages, autoridade canônica)
- `superneuroped.vercel.app` (espelho Vercel)
- `jadsonfraga.github.io` (redirecionador GitHub Pages)

Hoje a política de rede do ambiente nega essas conexões no nível do gateway
(`gateway answered 403 to CONNECT (policy denial or upstream failure)`,
confirmado também contra `www.google.com:443` — ou seja, é bloqueio de
política do ambiente, não falha específica desses domínios nem dos deploys).

## Ação que falta
Rodar `npm run test:e2e:published-health` (script
`tests/e2e/published-health.mjs`, já existente no repo) com
`EXPECTED_COMMIT=9b3a300` (ou o SHA de `main` vigente no momento da checagem)
contra os três alvos acima, mais a inspeção manual de `/api/health` e das
quatro aplicações (Sonda 10, OBS-10, Reconhecimento Visual, Testes
Cognitivos) na URL pública do Cloudflare Pages.

## Risco de não executar
Sem esse smoke, a espiral fecha com evidência de que o código em `main`
(commit `9b3a300`) passa em todos os checkpoints locais (`verify:release`,
bateria completa — ver estado vivo em
`docs/audits/neuroped-spiral-state.md`), mas **sem confirmação de que o
deploy real corresponde a esse commit** nem de que a aplicação publicada
responde como esperado. Regressão de infraestrutura de deploy (build
quebrado no Cloudflare, variável de ambiente/segredo ausente em produção,
migração D1 não aplicada) não seria detectada por esta espiral.

## Como verificar a conclusão
Fora deste ambiente (ou em um ambiente com política de rede mais permissiva
— ver `environment.network` nas configurações da sessão):
1. `EXPECTED_COMMIT=<sha-de-main> npm run test:e2e:published-health` — deve
   sair com exit 0 e todas as 5 checagens `✓`.
2. Abrir `https://neuroped.pages.dev/api/health` manualmente e confirmar
   `status:"ok"`, `authentication.required:true`, `authentication.configured:true`,
   `database:"ok"`.
3. Login sintético + uma passada rápida nas quatro aplicações
   (Sonda 10, OBS-10, Reconhecimento Visual, Testes Cognitivos) na URL
   pública, confirmando que cada uma carrega e completa um ciclo mínimo.
