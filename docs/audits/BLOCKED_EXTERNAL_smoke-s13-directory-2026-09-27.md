# S13 — smoke genérico RESOLVIDO; prova A/B de produção ainda pendente

## Atualização verificada em 27 de setembro de 2026

O bloqueio de saída do ambiente original não foi contornado nem removido.
A chamada pública foi executada em um runner autorizado do GitHub Actions,
pela implementação da PR #1024 (`fix/s13-production-directory-smoke`).

Evidência remota: [run 36340052955](https://github.com/jadsonfraga/neuroped/actions/runs/36340052955),
job `108678243782`, concluído com sucesso. Os 25 contratos offline passaram
antes das quatro chamadas HTTP reais; contratos offline não são a prova de
produção. O resultado remoto foi registrado às `2026-09-27T18:16:57.264Z`:

```json
{
  "status": "PASSED",
  "origin": "https://neuroped.pages.dev",
  "deployedSha": "b9a2b5f583659eca1ba4644554b343a4cd49efa2",
  "deploymentRunId": "36338552010",
  "knownClinicHttp": 200,
  "knownClinicProviders": 0,
  "unknownClinicHttp": 200,
  "unknownClinicProviders": 0,
  "abProof": "NOT_RUN_NO_AUTHORIZED_FIXTURE",
  "evidenceKind": "remote-http"
}
```

O SHA e o run acima vieram de `/deploy-check.json`, lido antes e depois
do diretório, sem alteração durante o smoke. A consulta da clínica
`4126d150` retornou JSON válido com `providers: []`; uma clínica inexistente
aleatória também retornou uma lista vazia. Nenhum corpo contendo nomes,
identificadores de pacientes, token ou dado clínico foi gravado.
Artifact metadata-only: `s13-directory-smoke-36340052955-1`, ID
`10938198396`, SHA-256 do ZIP
`94be24963e68118ffb6098762c872cd8dcc0afd5041c4e9aabfb051a00b5e182`.

### Limites que permanecem

- A lista vazia satisfaz apenas o smoke genérico solicitado na #1020.
  Não demonstra a existência de um profissional elegível, não prova que o
  slug histórico ainda corresponde a uma clínica ativa e não é prova A/B.
- O A/B requer estado conhecido e autorizado: o mesmo profissional com
  membership ativa em A e B, serviço público ativo somente em B, ausência
  em A e presença em B. Não foram inventadas memberships, alterados serviços
  reais ou criadas reservas/waitlists para fabricar essa condição.
- A nova rotina faz somente GETs públicos, sem credenciais ou comandos D1;
  não afirma testar escritas de reserva/waitlist ou restaurar dados.
- O run acima testa a produção já publicada em `b9a2b5f`, não o deploy da
  PR #1024. A recorrência automática pós-deploy depende do merge dessa PR.
- A PR #1014 trata de S5 (backup/restore), não do mapeamento legado S9.

### Verificação reproduzível e rollback

`node --test tests/unit/s13-directory-smoke.test.mjs` verifica o contrato
local; `node scripts/smoke-s13-directory.mjs` executa o smoke real. O workflow
`.github/workflows/s13-directory-smoke.yml` executa na PR, manualmente e após
`Deploy Cloudflare Pages` de `main`; na execução pós-deploy exige o SHA do
run disparador. HTTP inesperado, HTML, JSON inválido, mudança de deploy,
origem não canônica e fallback da clínica inexistente falham fechado.

Reverter a PR #1024 remove apenas o workflow, script, testes e esta
atualização documental; não exige rollback de banco ou aplicação.

---

## Registro histórico da #1020 — preservado, anterior à prova acima

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
