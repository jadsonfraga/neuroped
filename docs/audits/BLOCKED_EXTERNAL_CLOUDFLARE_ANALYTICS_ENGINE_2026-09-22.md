# Bloqueio externo — Cloudflare Analytics Engine

## Entrega afetada

- PR incorporada: `#922`.
- Commit de produção: `20c14db0f8a123d64b9f3982cd3e80f6b1511b48`.
- Workflow: `Deploy Cloudflare Pages`, execução `35749640633`.
- Etapa: `Deploy para Cloudflare Pages`.

## Bloqueio

O Cloudflare aceitou o bundle e enviou os arquivos, mas recusou a publicação da
Function porque o Analytics Engine está desativado na conta. O projeto declara o
dataset `API_METRICS` em `wrangler.toml`; retirar esse binding apenas para concluir
o deploy eliminaria telemetria operacional já contratada pelo código e não é um
rollback seguro da correção do Sonda Dez.

Mensagem verificável do provedor:

> Failed to publish your Function. Got error: You need to enable Analytics Engine.

## Permissão e ação necessárias

É necessária autorização do titular da conta Cloudflare para habilitar
**Workers Analytics Engine** no painel da conta vinculada ao projeto `neuroped`.
Essa configuração é externa ao repositório e pode estar sujeita aos termos e à
cobrança vigentes do provedor.

Depois da habilitação, reexecutar somente os jobs com falha da execução
`35749640633`. O espelho Vercel deve permanecer aguardando o mesmo SHA no backend
canônico e só deve publicar depois da confirmação do Cloudflare.

## Risco de não executar

O `main` contém a correção, mas produção continua servindo o release anterior.
Portanto, a falha de integridade corrigida pela PR #922 não deve ser considerada
resolvida no ambiente público até a verificação pós-deploy.

## Como verificar a conclusão

1. O workflow `Deploy Cloudflare Pages` termina com sucesso.
2. `https://neuroped.pages.dev/deploy-check.json` informa `provider` igual a
   `cloudflare-pages`, `status` igual a `deployed` e `commit` igual a
   `20c14db0f8a123d64b9f3982cd3e80f6b1511b48`.
3. O endpoint de saúde autenticado, o CORS e o login sintético do workflow passam.
4. O workflow `Deploy Vercel` confirma o mesmo SHA no espelho oficial.

Não há evidência de publicação parcial da Function; o workflow marcou o status
de produção como falha e não declarou o deploy concluído.
