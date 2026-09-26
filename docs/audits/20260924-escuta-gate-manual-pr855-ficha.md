# Ficha do gate manual da PR #855 (Escuta Clínica)

Roteiro: `docs/audits/20260924-escuta-gate-manual-pr855.md`.
Preencha uma cópia desta ficha por rodada. Não apague campos; use "NÃO EXECUTADO"
quando faltar execução. "Não executado" nunca vira aprovação.

## Identificação da rodada

- Executor:
- Data e horário (Recife):
- Preview (URL):
- SHA comprovado no preview (esperado `c76a77987763c4a35179f23f9b3a47eaffca3630`):
- Como o SHA foi comprovado (build info, cabeçalho, commit do deploy):
- Equipamento (modelo):
- Sistema operacional e versão:
- Navegador e versão:
- Microfone (modelo e conexão):
- Conta de teste utilizada:

## Controles utilizados no teste 5

- Silêncio digital: `controle-silencio-digital-30s.wav`, SHA-256 `40abc924dc63f75aafb2400bb99fd66741e22eb9ff2450973a18db53a06286ac`
- Pico isolado: `controle-pico-isolado-30s.wav`, SHA-256 `4e15baade4728e3455940406d2228ee4ef5cfa67296d1420130eae7dba820e0c`
- Hash conferido antes do uso (sim/não):

## Teste 1. Captura prolongada

- Executor / data e horário:
- Preview / SHA comprovado:
- Equipamento / sistema / navegador / microfone:
- Teste e ação realizada:
- Duração no contador (s):
- Duração do WAV exportado (s):
- Diferença (s, aprova até 1 s):
- Marcadores anunciados e conferidos (lista com horário):
- Resultado: APROVADO | FALHOU | NÃO EXECUTADO
- Evidência (arquivo, captura de tela e horário do evento):
- Achado ou limitação:
- Revisor que ouviu o WAV:

## Teste 2. Pausa e retomada

- Executor / data e horário:
- Preview / SHA comprovado:
- Equipamento / sistema / navegador / microfone:
- Teste e ação realizada:
- Estado "Pausado" exibido e contador estabilizado (sim/não):
- Novo alerta durante a pausa (sim/não):
- Frase "não deve gravar" ausente do áudio (sim/não):
- Trechos anterior e posterior preservados (sim/não):
- Resultado: APROVADO | FALHOU | NÃO EXECUTADO
- Evidência (arquivo, captura de tela e horário do evento):
- Achado ou limitação:
- Revisor que ouviu o WAV:

## Teste 3a. Perda de sinal (mute físico por 20 s)

- Executor / data e horário:
- Preview / SHA comprovado:
- Equipamento / sistema / navegador / microfone:
- Mute físico disponível (sim/não):
- Teste e ação realizada:
- Horário do mute e horário do aviso (aprova até 10 s, aba visível):
- Texto do aviso exibido:
- Frase anterior ao evento preservada (sim/não):
- Resultado: APROVADO | FALHOU | NÃO EXECUTADO
- Evidência (arquivo, captura de tela e horário do evento):
- Achado ou limitação:
- Revisor que ouviu o WAV:

## Teste 3b. Troca ou desconexão da entrada

- Executor / data e horário:
- Preview / SHA comprovado:
- Equipamento / sistema / navegador / microfone:
- Teste e ação realizada:
- Comportamento observado (captura mantida comprovada | interrupção clara | outro):
- Áudio anterior acessível no player (sim/não):
- Resultado: APROVADO | FALHOU | NÃO EXECUTADO
- Evidência (arquivo, captura de tela e horário do evento):
- Achado ou limitação:
- Revisor que ouviu o WAV:

## Teste 4a. Bloqueio de tela por 30 s

- Executor / data e horário:
- Preview / SHA comprovado:
- Equipamento / sistema / navegador / microfone:
- Teste e ação realizada:
- Houve captura durante o intervalo (sim/não, registrar expressamente):
- Lacuna sinalizada ao usuário (sim/não/não houve lacuna):
- Estado coerente ao retornar (sim/não):
- Áudio anterior acessível (sim/não):
- Resultado: APROVADO | FALHOU | NÃO EXECUTADO
- Evidência (arquivo, captura de tela e horário do evento):
- Achado ou limitação:
- Revisor que ouviu o WAV:

## Teste 4b. Aplicativo em segundo plano por 30 s

- Executor / data e horário:
- Preview / SHA comprovado:
- Equipamento / sistema / navegador / microfone:
- Teste e ação realizada:
- Houve captura durante o intervalo (sim/não, registrar expressamente):
- Lacuna sinalizada ao usuário (sim/não/não houve lacuna):
- Estado coerente ao retornar (sim/não):
- Áudio anterior acessível (sim/não):
- Resultado: APROVADO | FALHOU | NÃO EXECUTADO
- Evidência (arquivo, captura de tela e horário do evento):
- Achado ou limitação:
- Revisor que ouviu o WAV:

## Teste 5a. Regressão do c76a779 com silêncio digital

- Executor / data e horário:
- Preview / SHA comprovado:
- Equipamento / sistema / navegador / microfone:
- Gravação audível salva antes da substituição (sim/não):
- Player local reproduz após a substituição (sim/não):
- Exportar: mensagem exibida (transcrever o texto):
- Exportar gerou arquivo (sim/não, esperado não):
- Transcrever: mensagem exibida (transcrever o texto):
- Transcrever gerou saída (sim/não, esperado não):
- Botão de transcrição estava habilitado antes do clique (sim/não; desabilitado por serviço indisponível não comprova o bloqueio):
- Player permaneceu após os erros (sim/não):
- Resultado: APROVADO | FALHOU | NÃO EXECUTADO
- Evidência (arquivo, captura de tela e horário do evento):
- Achado ou limitação:

## Teste 5b. Regressão do c76a779 com pico isolado

- Executor / data e horário:
- Preview / SHA comprovado:
- Equipamento / sistema / navegador / microfone:
- Gravação audível salva antes da substituição (sim/não):
- Player local reproduz após a substituição (sim/não):
- Exportar: mensagem exibida (transcrever o texto):
- Exportar gerou arquivo (sim/não, esperado não):
- Transcrever: mensagem exibida (transcrever o texto):
- Transcrever gerou saída (sim/não, esperado não):
- Botão de transcrição estava habilitado antes do clique (sim/não):
- Player permaneceu após os erros (sim/não):
- Resultado: APROVADO | FALHOU | NÃO EXECUTADO
- Evidência (arquivo, captura de tela e horário do evento):
- Achado ou limitação:

## Teste 6. Conferência auditiva

- Executor / data e horário:
- Reprodutor externo utilizado:
- WAVs ouvidos (lista):
- Captura prolongada ouvida integralmente (sim/não):
- Marcadores em ordem (sim/não):
- Perdas inexplicadas (descrever ou "nenhuma"):
- Divergência entre player e WAV (descrever ou "nenhuma"):
- Resultado: APROVADO | FALHOU | NÃO EXECUTADO
- Evidência (arquivo, captura de tela e horário do evento):
- Achado ou limitação:
- Revisor que ouviu o WAV (nome e assinatura):

## Decisão da rodada

- Testes APROVADOS:
- Testes FALHOS:
- Testes NÃO EXECUTADOS:
- Decisão: APROVADO | FALHOU | PENDENTE
- Justificativa:
- Versão e ambientes cobertos pelo aceite:
- Assinatura do executor:
- Assinatura do revisor da escuta:

O aceite vale somente para a versão e os ambientes testados; não autoriza merge
nem publicação.
