# Eliminação LGPD — pré-condições atômicas

Checkpoint de 26/09/2026. Issue #1001, PR #1002. Relacionado a #594 e #685.
Escopo: uma correção de concorrência no executor; não certifica LGPD, prontidão comercial nem as 30 camadas do produto.

## Antes e reprodução

Baseline `0b4f74fb49214d00944fc2a366d3b4454363601a`. O executor lia política e contagens antes do batch de escrita. Uma mudança depois dessas leituras permitia apagar dados sob pré-condições vencidas.

O primeiro run `36278104878` demonstrou duas falhas reais e também revelou erro nas fixtures de encerramento: faltava `reason_code`, obrigatório pelo CHECK do schema. As falhas de preparação não foram contabilizadas como defeitos do aplicativo. As fixtures foram corrigidas sem desabilitar constraints; o cenário impossível de retenção nula foi substituído por extensão válida da retenção.

Reprodução definitiva RED, antes de alterar o runtime:

- HEAD de teste: `aeb44c07d3bf584271411ba766c136eff184623d`.
- [Run 36278364608](https://github.com/jadsonfraga/neuroped/actions/runs/36278364608), job `108505352441`.
- Checkout combinado do GitHub: `a451b0b1f74a8d7fe6bd14469bc573d105fdb594`.
- Resultado: seis falhas comportamentais e três controles aprovados; nenhuma falha de fixture.
- Artefato `10917991363`, baixado e inspecionado; SHA-256 do ZIP recalculado: `4f9a7d190c2412978cf7745883a9c2d4abbbd238d667d0a05229b7e5fea8dd2b`.

## Correção

Commit de runtime `89c62c484b9a1bcb3d2e559c3f807f81cdbfdcb1`.
Blob de `_purge.ts`: `3095f27de292d3bc722e71bd3d416bd0860dbc7f`.
O arquivo foi comparado com a cópia local preparada a partir do blob-base `a9820adc0a739e7b8f71e9215f075b157c794db8`; os hashes Git coincidem.

O executor conserva o snapshot bruto que aprovou a operação e o compara novamente na primeira instrução do MESMO batch de exclusão, usando igualdade NULL-safe. Revalida também a ausência das categorias ainda não exportadas e das referências não alcançáveis nas tabelas presentes no preflight. A regra de elegibilidade continua centralizada em `evaluateDeletionEligibility`; nenhuma duração de retenção foi inventada ou alterada.

A barreira SQL usa CASE e o overflow documentado de `abs(-9223372036854775808)` apenas quando as condições não são satisfeitas. D1 executa o batch transacionalmente: falha da barreira aborta antes de DELETE e do desacoplamento das referências. Isso evita tabelas temporárias, migrações ou escritas artificiais. O executor mantém a recusa explícita `PURGE_EXECUTION_FAILED` e não registra conclusão.

Resultados ausentes, com falha ou contagens inválidas também deixam de virar zero presumido. A ordem filha→mãe, o isolamento, as referências de governança, o replay idempotente e a trava de exportação incompleta permanecem.

Fontes primárias do mecanismo:
- [Cloudflare D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/): sequência transacional e rollback em falha.
- [SQLite abs](https://www.sqlite.org/lang_corefunc.html): overflow de INT64_MIN.
- [SQLite CASE](https://www.sqlite.org/lang_expr.html#the_case_expression): avaliação lazy dos ramos.

## Depois e validação GREEN

- [Run 36278482341](https://github.com/jadsonfraga/neuroped/actions/runs/36278482341), job `108505680502`, concluído com `success`.
- HEAD: `89c62c484b9a1bcb3d2e559c3f807f81cdbfdcb1`.
- Checkout combinado: `20ebd8cf49ced7c84e94a35b59166bdd7feeaaa0`.
- Artefato `10918051546`, baixado e inspecionado; SHA-256 do ZIP recalculado: `c7412768d7fe8fbf96ad8f2e1ba09d53bcb56682bd21fedd35c6761b03ef9cc8`.

| Cenário | Antes | Depois |
| --- | --- | --- |
| Legal hold inserido entre preflight e batch | Excluía indevidamente | Preserva todos os dados e recusa |
| Retenção individual estendida nesse intervalo | Excluía indevidamente | Preserva todos os dados e recusa |
| Clínica reativada nesse intervalo | Excluía indevidamente | Preserva todos os dados e recusa |
| Retenção da clínica estendida nesse intervalo | Excluía indevidamente | Preserva todos os dados e recusa |
| Lifecycle removido nesse intervalo | Excluía indevidamente | Preserva todos os dados e recusa |
| Documento não coberto chega após contagem | Excluía documento não exportado | Preserva todos os dados e recusa |
| Exclusão autorizada por paciente e replay | Passava | Continua passando |
| Exclusão autorizada por clínica e replay | Passava | Continua passando |
| Erro tardio de DELETE | Rollback | Rollback preservado |

Os nove testes passaram. Cada corrida compara conteúdo de todas as tabelas alcançadas e referências de governança de RED, não somente contagens; BLUE deve permanecer inalterada. São SQLite e handlers reais, com adaptador de D1 e dados exclusivamente sintéticos; não são testes destrutivos em produção.

O mesmo job concluiu com sucesso os contratos existentes `lgpd-purge-executor`, `lgpd-run-deletion-endpoint`, `lgpd-run-export-endpoint`, `test:saas-self-service`, `check`, `lint` e `test:quick-wins`.

A frase histórica "pagamento real por webhook" aparece no console da jornada Cliente Zero. Nesta evidência, ela NÃO comprova cobrança real: o cenário é sintético e provedores externos não foram validados. Storage simulado nos testes de exportação não é prova de R2 em produção. Um teste de rollback também não é exercício de recuperação de desastre.

## Implantação e limites

Na gravação deste checkpoint, o runtime estava em PR, sem merge/deploy desta rodada. Os gates do HEAD final, a revisão e o SHA servido após uma eventual publicação precisam ser conferidos separadamente; resultados acima são vinculados ao commit indicado, não a qualquer revisão futura.

Não fecha S9, S10, S12B ou S13. Não demonstra cobrança LIVE, entregabilidade de e-mail, restauração operacional, auditoria jurídica ou a jornada comercial inteira. Não houve acesso a conteúdo clínico real, alteração de chaves, pagamentos ou migração de dados.

A proteção cobre o intervalo entre preflight e a transação, não pretende resolver todos os cenários do lifecycle ou fencing de lease. Mudanças de schema precisam continuar serializadas com a operação; não se presume migração concorrente segura. Novos domínios devem entrar no inventário de cobertura antes de serem elimináveis.

## Bloqueios de ambiente e rollback

Clonagem local falhou por resolução de rede. Desktop Commander informou franquia esgotada; não houve tentativa de contornar a conexão. Edição pela API GitHub e execução real no CI foram possíveis. A transpilação local e um experimento SQL isolado foram apenas verificações complementares; os resultados integrais vêm dos runs acima.

Sem migração de schema. Rollback de código deve ocorrer por PR, não por force-push. Reverter esta correção reintroduz a corrida conhecida: em regressão operacional, a eliminação deve permanecer suspensa até revisão, sem reativar silenciosamente o executor antigo. Nenhum rollback de código recupera dados já apagados.
