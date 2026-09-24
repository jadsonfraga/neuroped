# Estado da espiral SaaS

Atualizado em 2026-09-24 (ciclo 2). Este arquivo registra fatos verificados,
não intenções. Revalide `origin/main` e a produção antes de confiar nele.

## Baseline verificada
- main = candidato = produção: `e77bbf7` (Deploy run 1416, success 02:08Z;
  a etapa do workflow que confere o SHA em `deploy-check.json` executou).
  O acesso HTTP direto a `neuroped.pages.dev` é negado pela política de rede
  do container de sessão: a evidência de publicação vem do próprio workflow.
- Suítes SaaS verdes na baseline: `test:saas-self-service` (self-service,
  jornada de aceite, Cliente Zero), `test:quick-wins`, tipos e lint.

## Ciclo 1 (fechado)
- Problema: `pronto: true` de `GET /api/admin/go-live` atestava só
  configuração presente (sandbox aceito) sem declarar o nível nem o que não
  comprova — leitura de "autorização de venda" era possível (§11 do mandato).
- Mudança: campos aditivos `nivelAtestado`, `ambienteCobranca` (só códigos
  reconhecidos ou null) e `naoComprova` com os cinco degraus superiores;
  `nota` nega explicitamente a leitura comercial. `pronto`, `gates`,
  `pendencias` e `ordemInvertida` intocados; nenhum consumidor além do teste.
- Teste: bloco 7 de `tests/unit/go-live-readiness.test.ts`, escrito antes e
  visto falhando pelo motivo certo.

## Hipóteses refutadas (não reabrir sem evidência nova)
1. "Falha de entrega do e-mail de verificação produz falso sucesso" — NÃO:
   `issueEmailVerification` apaga o token e retorna false; signup nunca
   afirma envio; `POST /api/tenants` bloqueia não-verificado com mensagem
   clara que o onboarding exibe; `#/verificar-email` reenvia
   (anti-enumeração deliberada). O `[mail] delivery failed 403` no teste
   verde é o harness exercitando essa tolerância.
2. "Entitlement via redirect de checkout" — NÃO: `billing-retorno.tsx`
   declara processamento e remete ao estado servido pelo servidor;
   Cliente Zero cobre webhook duplicado/tardio.

## Fora da espiral, em andamento
- PR #855 (WAV silencioso): verde em `c76a779`, retida no gate manual de
  áudio do proprietário (microfone real). Check-in silencioso armado.

## Ciclo 1: integração
PR #949 mergeada em `6614fbf`; publicação em verificação no momento deste
commit (o check-in do deploy atualiza aqui se falhar).

## Ciclo 2 (este commit)
S2: a recusa EMAIL_VERIFICATION_REQUIRED no onboarding passa a levar à
página de reenvio (`#/verificar-email`), ancorada no código do backend.
Teste de contrato novo em test:quick-wins, visto falhando antes.

## Próximo passo executável
Ver BACKLOG.md item S3. Retomada: `git fetch origin main && git log -1
origin/main` e reler este arquivo.
