# BLOCKED_EXTERNAL — smoke funcional do S13 em produção (commit 2dd01b2)

## Sistema
Ambiente de execução (container de sessão Claude Code on the web) — proxy de
saída HTTPS pré-configurado do ambiente.

## Permissão exata necessária
Acesso de rede de saída para `neuroped.pages.dev` (Cloudflare Pages, autoridade
canônica), para chamar `GET /api/public-booking?action=providers&clinic=<slug>`
sem autenticação (rota pública).

Confirmado bloqueio no nível do gateway do ambiente, não do destino:
- `curl` direto: `connect_rejected` / `gateway answered 403 to CONNECT`.
- `WebFetch`: `EGRESS_BLOCKED` para `neuroped.pages.dev`.

Já havia registro do mesmo bloqueio ambiental em
`docs/audits/BLOCKED_EXTERNAL_smoke-producao.md` (commit `9b3a300`); este
documento cobre uma verificação diferente, específica da correção do S13.

## Ação que falta
Após o merge da PR #1015 (commit `2dd01b2`, já publicado com sucesso pelo
workflow `Deploy Cloudflare Pages`, run `36335326437`), confirmar em produção
que o diretório público de agendamento não lista profissional sem membership
ativa e serviço público na clínica solicitada. Faltam dois níveis de smoke,
nenhum executável deste ambiente hoje:

1. **Smoke genérico** (o que o Dr. autorizou nesta rodada): `GET
   https://neuroped.pages.dev/api/public-booking?action=providers&clinic=4126d150`
   (slug de clínica real já usado em `docs/PUBLIC_SERVICOS_SMOKE_2026-08-19.md`)
   e confirmar resposta 200 com JSON `{ providers: [...] }` bem formado, sem
   erro 500.
2. **Reprodução do cenário A/B do bug** (não solicitada nesta rodada, exige
   um par real conhecido): profissional com membership ativa nas clínicas A e
   B mas serviço público ativo só em B; confirmar que `clinic=<slug de A>` não
   o lista. Depende de o Dr. indicar esse par real ou de criar/usar uma
   clínica de QA dedicada — decisão de negócio, não técnica.

## Risco de não executar
A prova que já existe é: 15/15 cenários locais RED→GREEN (SQLite sintético),
15 cenários integrais no bloco 7 de `tests/unit/operations-tenant-isolation.test.ts`
rodando handlers reais + todas as migrations em CI (verde nos 13 checks do
run `36328902365`/`36328902367`/`36328902401` etc.), e os 23 passos verdes do
deploy (`36335326437`), incluindo "Validar health autenticado do backend
publicado" e "Verificar login (auth e2e)". Nenhum desses smoke tests de
deploy exercita especificamente `action=providers` do S13. Sem o smoke
funcional acima, fica sem confirmação direta de que a rota pública responde
em produção exatamente como o teste de CI prevê (por exemplo, erro de binding
de `env.DB`, de roteamento das Pages Functions, ou de cache de edge
específico dessa action, que os testes locais não exercitam).

## Como verificar a conclusão
Fora deste ambiente (ou em um ambiente com política de rede mais permissiva
para `neuroped.pages.dev` — ver `environment.network` nas configurações da
sessão):
1. `curl -s https://neuroped.pages.dev/api/public-booking?action=providers&clinic=4126d150`
   deve retornar HTTP 200 e um JSON `{ "providers": [...] }`.
2. Para o cenário A/B específico, repetir a mesma chamada trocando `clinic`
   para o slug da clínica onde o profissional-teste não deveria aparecer, e
   confirmar sua ausência na lista.
