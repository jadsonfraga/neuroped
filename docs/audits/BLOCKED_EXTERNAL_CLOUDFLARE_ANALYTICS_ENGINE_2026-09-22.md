# Bloqueio externo — Cloudflare Analytics Engine

Status: **BLOCKED_EXTERNAL_CLOUDFLARE_ANALYTICS_ENGINE**.
Atualização: 22 de setembro de 2026, após a tentativa de publicação da PR #923.

## Entrega e execução efetivamente verificadas

- Repositório: `jadsonfraga/neuroped`.
- PR #923: mesclada por squash em 22/09/2026 às 17:10:48 UTC.
- SHA efetivamente mesclado: `f41a26eb2e7c235b50b03fb4cb683b5cc3c722fa`.
- Projeto Cloudflare Pages: `neuroped`; produção canônica: `https://neuroped.pages.dev`.
- Workflow canônico: `Deploy Cloudflare Pages`, execução `35758986629`.
- Job de publicação: `106852007724` (`deploy-cloudflare`).
- Evidência: https://github.com/jadsonfraga/neuroped/actions/runs/35758986629

As 15 verificações da PR passaram no HEAD `76a1057b758b454ac62ed73ea438ed66758d01fc` antes do merge. A execução de publicação também aprovou a verificação técnica completa de release no SHA efetivamente mesclado, auditoria de dependências, compilação do frontend, carga inicial de JavaScript e verificação dos arquivos gerados.

As etapas rotineiras de migração idempotente D1 e configuração de secrets/vars terminaram com sucesso antes da tentativa de publicação. Portanto, não se deve descrever esta execução como uma operação que não realizou nenhuma ação no ambiente remoto. A PR Sonda não acrescentou migrações de banco.

## Bloqueio reproduzido no SHA mesclado

O envio de arquivos não comprova publicação bem-sucedida das Functions. A etapa `Deploy para Cloudflare Pages` terminou com falha, com a seguinte resposta do provedor:

> You need to enable Workers Analytics Engine in the Cloudflare dashboard to use this API. [code: 8000077]

As verificações subsequentes de SHA público, saúde autenticada, CORS e login E2E não executaram nesta tentativa. A release `f41a26eb2e7c235b50b03fb4cb683b5cc3c722fa` NÃO está confirmada em produção. Não foi possível determinar independentemente o SHA atualmente servido pelas ferramentas de consulta disponíveis; não presumir indisponibilidade nem declarar qual versão está no ar.

A falha já havia ocorrido na execução `35749640633` da PR #922, SHA `20c14db0f8a123d64b9f3982cd3e80f6b1511b48`. Esse SHA é anterior à PR #923 e NÃO deve ser republicado como se contivesse a entrega atual.

## Configuração a preservar

Em `wrangler.toml`, `API_METRICS` é o nome do binding; `neuroped_api_metrics` é o nome do dataset de Analytics Engine. Não confundir os dois. Nenhum desses elementos, teste, política de acesso ou condição de aprovação foi removido para contornar a recusa do provedor. Vercel permanece espelho, não autoridade alternativa de backend.

## Permissão e ação externas necessárias

Um administrador autorizado da conta Cloudflare vinculada ao projeto `neuroped` precisa verificar e habilitar o acesso a **Workers Analytics Engine** no painel dessa mesma conta, observando os termos e a eventual cobrança apresentados pelo provedor. Não é necessário compartilhar senhas, tokens ou segredos em arquivos, issues ou chats.

Se o recurso já estiver habilitado, verificar a conta selecionada e solicitar à Cloudflare a correção do acesso/entitlement associado ao erro `8000077`; não alterar bindings ou ampliar permissões indiscriminadamente.

Nesta sessão não foi encontrado conector Cloudflare disponível. O conector de acesso remoto ao computador retornou suspensão por cota mensal e orientou não repetir nem reconectar. Não houve acesso autenticado ao painel para realizar a habilitação.

## Recuperação sem publicar a versão errada

1. Depois da correção externa, conferir o HEAD de `main`. Se ainda for `f41a26eb2e7c235b50b03fb4cb683b5cc3c722fa`, reexecutar os jobs com falha da execução `35758986629`. Se `main` tiver avançado, verificar e publicar a revisão atual aprovada que contenha a PR #923, sem regressão silenciosa para um SHA anterior.
2. Exigir sucesso da publicação das Functions e das verificações pós-deploy do workflow canônico.
3. Consultar `https://neuroped.pages.dev/deploy-check.json` sem cache e conferir `provider = cloudflare-pages`, `branch = main` e `commit` igual ao SHA efetivamente publicado. O gerador canônico desta versão não define um campo `status`; não exigir um `status=deployed` inexistente nem criar sinal artificial de sucesso.
4. Exigir saúde autenticada do backend, CORS restrito e login E2E dedicado aprovados.
5. Somente após a confirmação canônica, publicar/verificar o espelho oficial `https://superneuroped.vercel.app` com o mesmo SHA.

## Risco e encerramento

Merge e testes aprovados não resolvem a recusa de publicação do provedor. Repetir o deploy sem corrigir o acesso externo não é uma remediação. Manter o bloqueio aberto até haver evidência pública de SHA e saúde do backend, sem alegação de conclusão antecipada.
