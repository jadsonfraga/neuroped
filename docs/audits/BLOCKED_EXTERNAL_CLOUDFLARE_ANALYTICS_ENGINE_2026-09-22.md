# Cloudflare Analytics Engine não habilitado na conta — bloqueio externo

Verificação em 22/09/2026. O bloqueio impede publicar as Functions, não o build
nem os testes. A catraca de release passa; a publicação é recusada depois.

## Sistema e erro exato

Sistema: conta Cloudflare canônica do projeto Pages `neuroped`.

O passo "Deploy para Cloudflare Pages" do workflow `deploy-cloudflare.yml`
executa `wrangler pages deploy` com `CLOUDFLARE_API_TOKEN` e
`CLOUDFLARE_ACCOUNT_ID` presentes. O upload dos assets conclui e o Worker
compila. A publicação das Functions é recusada:

```
✘ [ERROR] Deployment failed!
  Failed to publish your Function. Got error: You need to enable Analytics Engine.
  Head to the Cloudflare Dashboard to enable: https://dash.cloudflare.com/<conta>/workers/analytics-engine
```

Upload de arquivos com sucesso não significa Functions publicadas. As etapas
seguintes de verificação pública, health autenticado, CORS e login ficam
`skipped`, então nenhum SHA foi confirmado no ar por essas execuções.

## Causa e alcance

O binding `[[analytics_engine_datasets]]` / `API_METRICS` entrou no
`wrangler.toml` com #882 (`a63cf8d`, 19/09/2026). Desde então toda publicação em
`main` falha com o mesmo erro, de forma reprodutível:

| Run | SHA | PR |
| --- | --- | --- |
| 35418416833 | `2be322f2` | #913 |
| 35419590820 | `46dfaf38` | #879 |
| 35526581126 | `74abe8ef` | #914 |
| 35749640633 | `20c14db0` | #922 |
| 35758986629 | `f41a26eb` | #923 |

Último deploy publicado com sucesso: run 35414293396, SHA
`6e52d44a0da06fdf5e7abafaf27dbde5fc1d3e55` (#911), 19/09/2026 02:11 UTC. Tudo que
foi mesclado depois disso permanece fora de produção.

## Ação necessária (externa, não executável por agente)

Um administrador da conta Cloudflare precisa habilitar Workers → Analytics
Engine no painel. Não existe endpoint público de API para essa habilitação, e o
token de deploy não a substitui: o erro é de recurso desabilitado na conta, não
de escopo de token. Nenhuma senha ou token deve ser enviada ao agente.

Se o painel já indicar o recurso habilitado, conferir se a conta selecionada é a
mesma de `CLOUDFLARE_ACCOUNT_ID` antes de concluir que a habilitação existe.

## Decisão tomada enquanto o bloqueio persiste

O binding foi comentado no `wrangler.toml` para que a publicação volte a
ocorrer. Isso desliga apenas a telemetria técnica de metadados, que já era
opcional por construção: `writeApiMetric` verifica `context.env.API_METRICS` e
vira no-op sem o binding, e `GET /api/tenants/:id/metrics` passa a reportar
`apiInstrumentationBindingPresent: false`, estado que a UI mostra como "binding
ausente neste ambiente". Nenhum dado clínico, auditoria legal, migração ou
schema depende desse binding.

O risco assumido é declarado: enquanto o binding estiver comentado não há
métricas de duração e status por categoria de API. O risco de não agir era
maior, porque mantinha oito merges de correção clínica fora de produção por
tempo indeterminado.

## Como verificar o fechamento

1. Habilitar Analytics Engine na conta.
2. Descomentar o bloco `[[analytics_engine_datasets]]` no `wrangler.toml` e
   publicar pelo workflow oficial.
3. O deploy precisa concluir com as etapas de verificação pública, health
   autenticado, CORS e login executadas, não `skipped`.
4. `GET /api/tenants/:id/metrics` de uma clínica autorizada precisa devolver
   `apiInstrumentationBindingPresent: true`.

Aparecer o binding configurado no painel não encerra o bloqueio por si só. O
fechamento exige o deploy verde e a resposta autenticada acima.
