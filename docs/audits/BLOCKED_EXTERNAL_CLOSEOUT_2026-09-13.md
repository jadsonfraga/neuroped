# Fechamento pós-espiral — evidência e bloqueios

Data local: 13 de setembro de 2026 (America/Recife). Rastreio: #875. Correção de contagem: #877.

## Estado verificável

Não declarar READY global nem encerramento ponta a ponta enquanto os itens abaixo estiverem abertos. A correção de censo está publicada em PR, não em produção. Os 110 instrumentos com validação psicométrica pendente continuam pendentes; nenhum foi promovido a validado.

A árvore de código `c86ae5eb5883d264e6cab0b3fe2ddb258aba548f`, publicada no commit `fcaac1ae864fc04e52cc35686aa64324ca1238f8`, é exatamente a árvore do commit local testado `89891440f8e4e4dee5563870fec0f9127354793d`. Este adendo altera apenas documentação. Provas locais: 4/4 regressões do censo, validador, baseline, lint, TypeScript e build completo com exit 0. O cenário sintético 111 termina deliberadamente com exit 1 no CLI real, impedindo a regressão.

## BLOCKED_EXTERNAL_WINDOWS_RELEASE_HARNESS

Sistema: computador remoto Windows, Node 24.20.0. A suíte `test:quick-wins` passou pelos testes novos e pelos contratos de autenticação, mas parou em `tests/unit/dr-rehearsal-safety.test.mjs`. Primeiro erro: `spawnSync bash ENOENT`. Repetida com Git Bash instalado incluído somente no PATH do processo, falhou na extração do bookmark porque o caminho temporário Windows chega sem quoting/conversão ao `sed`. Nenhuma assertiva foi removida ou enfraquecida.

Ação faltante: completar os checks Linux da CI no HEAD do PR ou corrigir a portabilidade do harness em PR própria. Permissão adicional não demonstrada como necessária: trata-se de incompatibilidade do ambiente local. Risco: declarar uma suíte parcial como verde. Aceite: jobs completos e verdes no HEAD exato, mais revisão; `verify:release` completo não foi executado nesta sessão local.

## BLOCKED_EXTERNAL_COGNITIVE_ARCHIVE_EXECUTION

Sistema: ferramenta de execução remota. A operação de arquivamento reversível foi recusada duas vezes com: "não foi possível determinar o status de segurança da solicitação". O diretório original permanece intacto, sem reativação clínica, remoção de arquivos ou mudança nos testes. A worktree preparada para arquivo permaneceu limpa.

Ação faltante: execução autorizada do arquivamento, preservando arquivos e testes, com manifesto de integridade; atualização nominal dos imports dos testes e dos gates; proteção contra importação do arquivo pelo runtime; manutenção dos redirects da Sonda Dez. A permissão específica não foi informada pela ferramenta e não deve ser inventada. Risco de não executar: manutenção de código órfão, não perda atual de uma rota clínica ativa. Aceite: manifesto conferido, testes existentes preservados/verdes, inventário sem exceção órfã, typecheck e build, revisão e merge próprios. Nenhuma rota deve ser reativada automaticamente.

## Produção: evidência concluída e limite visual

Leituras HTTP no computador remoto retornaram 200:

- Cloudflare `deploy-check.json`: SHA `b006b5c6911fad4c71af01fef98dd58318e18dec`, run `34793262484`, publicação `2026-09-14T00:46:27Z`.
- Vercel `deploy-check.json`: SHA abreviado correspondente `b006b5c6911f`, publicação `2026-09-14T00:48:38.371Z`.
- Cloudflare `/api/health`: status e banco `ok`, autenticação exigida e configurada.

O job `103821456482` do run Cloudflare `34793262484`, relido pelo conector GitHub, terminou com sucesso, inclusive os passos de catraca técnica, publicação pública, health, CORS restrito e login E2E. Isso não equivale à prova visual autenticada do plano de avaliação e dos redirects.

## BLOCKED_EXTERNAL_PRODUCTION_VISUAL_PROOF

O navegador abriu `/#/filtro` e reconheceu o título NeuroPed. As chamadas seguintes para snapshot, URL e screenshot falharam por timeout do controlador (erro 10060). Não há screenshot aprovado nem comprovação visual da navegação autenticada nesta execução. A tentativa alternativa de execução de smoke foi bloqueada pela ferramenta e não foi contornada.

No ambiente remoto desta sessão, `NEUROPED_E2E_EMAIL` e `NEUROPED_E2E_PASSWORD` não estão disponíveis; apenas a presença foi consultada, sem ler valores. A CI possui seu próprio gate de conta dedicada — não presumir ausência global de credenciais nem usar conta clínica real em substituição.

Ação faltante: controlador de navegador autorizado e funcional, com acesso à identidade dedicada E2E no ambiente de teste aprovado. Aceite: evidência sem PHI, vinculada ao SHA publicado, de `/#/vineland`, `/#/filtro` e `/#/atencao-concentracao`, incluindo finalidade e tempo do plano, destino canônico dos redirects e proteção de sessão. Risco: confundir HTTP 200/login de API com UI verificada.

## Observação operacional fora da correção

O health publicado também declarou `escuta.enabled=true`, `escuta.configured=false` e `escuta.clinicalCryptoConfigured=false`; busca semântica declarou fallback textual. Não foi alterado segredo, binding ou configuração de produção. O status geral `ok` não comprova disponibilidade integral dessas capacidades; não afirmar o contrário no aceite.

## Critério de encerramento

#875 permanece aberta até resolver os bloqueios, revisar e mesclar a correção com CI do HEAD, confirmar o SHA posterior publicado e completar a evidência visual. Não houve merge, deploy manual, mudança de credenciais ou acesso a dados de pacientes nesta execução.
