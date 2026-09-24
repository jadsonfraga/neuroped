# Estado da espiral SaaS

Atualizado em 2026-09-24, revisão adversarial do ciclo 1, continuação da PR #949.
Revalide origin/main, HEAD da PR e produção antes de continuar.
Issue rastreadora: #594; esta revisão não satisfaz seu aceite comercial.

## Autoridade e trabalho concorrente
- Arquitetura e regras: AGENTS.md; nenhuma alteração de stack ou provedor.
- A PR #949 surgiu durante a inspeção e foi mesclada por outra sessão às
  10:10:25 UTC. Seus campos e quatro registros foram reaproveitados.
  A branch encerrada não foi modificada; esta é uma correção complementar.
- Base inicial: `e77bbf7942b0e6bc27af4468de0d332929573bbc`.
- Fontes inicialmente testadas: `6d38d98f70c22ef1571a01423bc028c681f052bd`.
- Main reconciliado: `6614fbfc706bb5cbe6eefbe3772bc78dc4037f51`, squash #949.
  A árvore `5ea861b2addf2de67037e8051724a387e0416a1d` é idêntica à de 6d38d98.
- Candidato complementar: HEAD da branch `fix/go-live-incomplete-config-20260924`.
  Resolver seu SHA pelo GitHub; blobs testados estão em EVIDENCE.md.
  Não equiparar candidato e main nem reutilizar aprovação de SHA antigo.
- Nenhum merge/deploy realizado nesta revisão. SHA mesclado desta correção:
  não aplicável; o merge de #949 acima pertence à sessão concorrente.
- Última publicação identificada: status Cloudflare success em e77bbf7,
  run 35945090755, job 107461209937; passos de verificação pública, health,
  CORS e login concluídos. Isso é evidência do workflow, não leitura HTTP atual.
- SHA servido agora: não revalidado por HTTP; a rede da sessão recusou as
  sentinelas Cloudflare e Vercel. Não presumir igualdade com main.
- PRs #840, #855, #877 e #885 preservadas, sem merge ou edição nesta revisão.
  Worktrees/alterações locais do computador do proprietário não inspecionadas:
  Desktop Commander bloqueado por cota, sem reconexão ou mudança de conta.

## S1 — implementação revisada, publicação pendente
- A implementação inicial distingue configuração de comprovação comercial.
- A revisão reproduziu uma contradição: `nivelAtestado` era sempre
  `CONFIGURACAO_PRESENTE`, inclusive sem DB ou com ambiente inteiramente vazio.
- Correção: `CONFIGURACAO_INCOMPLETA` quando há pendências; caso completo
  mantém `CONFIGURACAO_PRESENTE`. Campos legados, restrição a admin,
  ambiente normalizado e todos os cinco itens de `naoComprova` preservados.
- Teste original da PR passou. Regressão nova falhou no código anterior;
  correção passou. Três mutações defeituosas foram rejeitadas; versão final
  restaurada e aprovada. Detalhes, hashes e limites em EVIDENCE.md.
- Sem alteração clínica, de preço, trial, tenant, persistência ou migração.
- CI do novo HEAD precisa ser conferida. Resultados de 6d38d98 não aprovam
  automaticamente o descendente. npm verify/build completos não executados
  no container parcial desta revisão. Não declarar release pronto por isso.

## Histórico do ciclo inicial — não reexecutado nesta revisão
O autor de 6d38d98 registrou testes SaaS, tipos e lint aprovados e refutou:
1. Falso sucesso na entrega de e-mail: token apagado na falha, bloqueio da
   criação de clínica não verificada e reenvio com proteção anti-enumeração.
2. Entitlement por redirect: billing-retorno informa processamento e usa
   estado do servidor; Cliente Zero exercita eventos duplicados/tardios.
Esses registros e sua origem permanecem em EVIDENCE.md e inventory.json;
não constituem nova execução independente nem prova de provedor externo.

## Cobertura e retomada
- Reexaminada nesta revisão: 1 das 3 funcionalidades registradas (admin.go-live).
- Denominador completo do produto desconhecido; 0 dos 13 domínios mínimos
  auditados integralmente. Demais funcionalidades continuam não examinadas.
- Retomada em checkout autorizado: `git fetch origin main fix/go-live-incomplete-config-20260924`; conferir status e worktrees antes
  de mudar de branch. Ler HEAD da PR complementar, executar o teste canônico abaixo
  e validar CI/verify/build do candidato real. Não usar reset ou force-push.
- `node --import tsx tests/unit/go-live-readiness.test.ts`
- Primeiro revalidar a pendência P0 registrada em #926 (S0): criptografia e
  armazenamento não confirmados no health de 22/09. Sua situação atual não
  foi provada por HTTP. Sem acesso externo seguro, avançar no P1 independente
  de inventário Acesso/Comercial (S3), sem liberar LIVE ou fechar #926.
- S2, S4 e S5 continuam abertos; testes de configuração não os resolvem.
- Rollback por PR de revert desta revisão; sem migração ou reparo de dados.
