# Gate manual da PR #855 (Escuta Clínica): roteiro de execução

Revisão: 24 de setembro de 2026, 18h, Recife.
PR: https://github.com/jadsonfraga/neuroped/pull/855 (fix(escuta): impedir gravações WAV silenciosas).
HEAD confirmado: `c76a77987763c4a35179f23f9b3a47eaffca3630`, aberta, não mesclada, mergeável.
Referência temporal: o commit foi registrado em 24/09/2026 às 02h06 UTC, equivalente a 23/09/2026 às 23h06 em Recife.

Esta confirmação não substitui a validação com hardware real. O gate permanece
pendente até a ficha estar preenchida com evidências e escuta humana assinada.

## O que a correção exige do teste

O commit `c76a779` moveu o portão de sinal da construção do blob para as ações de
saída. Portanto, um áudio reprovado deve continuar disponível no player local,
enquanto exportação e transcrição devem apresentar o bloqueio por sinal
insuficiente. Player bloqueado é falha; saída sem bloqueio é falha.

## Material deste gate

- Roteiro: este arquivo.
- Ficha preenchível: `docs/audits/20260924-escuta-gate-manual-pr855-ficha.md`.
- WAV de silêncio digital: `tests/fixtures/escuta/controle-silencio-digital-30s.wav`.
- WAV de pico isolado: `tests/fixtures/escuta/controle-pico-isolado-30s.wav`.
- Gerador determinístico: `node scripts/escuta-gate-wav-controle.mjs` (`--check` confere os bytes).
- Regressão dos controles: `node tests/unit/escuta-gate-wav-controle-static.test.mjs`.

Os dois WAVs têm 30 segundos, mono, 16 bits, 16 kHz (mesma taxa do gravador,
para que o pico não sofra ringing de resampling ao ser importado). O de silêncio
tem todas as amostras em zero. O de pico tem uma única amostra em fundo de escala
aos 15 segundos. Pelos limiares descritos na PR, nenhum dos dois contém janela
ativa; ambos devem cair em "sinal insuficiente".

## Antes de começar

1. Use preview já existente e comprovadamente vinculado ao SHA acima. Sem
   comprovação do preview/SHA, o gate permanece pendente.
2. Use o equipamento e o microfone físicos da consulta, conta de teste e fala
   sem nomes nem dados clínicos.
3. Registre modelo, sistema e navegador na ficha.
4. Não recarregue nem feche a aba antes de conferir e guardar as evidências: a
   gravação permanece na memória da aba.

## Roteiro de execução

Os 60 minutos e a tolerância de um segundo são critérios propostos para esta
rodada; não representam testes já realizados.

### 1. Captura prolongada

Ação: grave 60 minutos ativos. Fale por 15 segundos no início, a cada cinco
minutos e ao encerrar, anunciando o marcador. Finalize e exporte.

Aprova: player e WAV abrem; marcadores e frase final preservados; duração do WAV
corresponde ao contador, com diferença de no máximo 1 s.
Falha: silêncio inesperado, truncamento, repetição ou travamento.

### 2. Pausa e retomada

Ação: em nova gravação, fale 15 segundos, pause por 30 segundos e diga "não deve
gravar" durante a pausa. Retome falando mais 15 segundos.

Aprova: estado "Pausado", contador estabilizado, nenhum novo alerta durante a
pausa; fala da pausa ausente; trechos anterior e posterior preservados.
Falha: grava durante a pausa, perde áudio ou não retoma.

### 3. Perda de sinal e troca

Ação: faça testes separados: mute físico por 20 segundos, quando disponível, e
troca ou desconexão da entrada. Grave uma frase imediatamente antes de cada
evento.

Aprova: perda de sinal gera aviso; troca mantém captura comprovada ou interrompe
claramente, preservando acesso ao áudio anterior.
Falha: perda sem aviso, indicação enganosa de gravação ou trecho "preservado"
inacessível.

Observe o aviso até dez segundos após a perda efetiva de sinal, com a aba
visível: o código usa uma janela de oito segundos, verificada a cada segundo.

### 4. Bloqueio e segundo plano

Ação: em registros separados, bloqueie a tela por 30 segundos e deixe o
aplicativo em segundo plano por 30 segundos. Fale antes, durante e depois.

Aprova: continuidade comprovada ou interrupção informada, estado coerente e
áudio anterior acessível.
Falha: lacuna não sinalizada ou perda do trecho anterior.
Registre expressamente se houve captura durante o intervalo.

### 5. Regressão do c76a779

Ação: depois de salvar uma gravação audível, substitua-a pelo WAV de silêncio
digital fornecido. Repita com o WAV de pico isolado. Tente reproduzir, exportar
e transcrever.

Aprova: player local funciona; ambas as saídas mostram erro de sinal
insuficiente, sem gerar saída nem apagar o player.
Falha: player bloqueado, erro sem mensagem ou aprovação herdada do áudio
anterior.

### 6. Conferência auditiva

Ação: abra os WAVs exportados em outro reprodutor. Ouça integralmente a captura
prolongada e confira os registros dos eventos.

Aprova: conteúdo inteligível, marcadores em ordem e ausência de perdas
inexplicadas.
Falha: divergência entre player e WAV, silêncio onde houve fala ou corte de
trechos.

## Dois cuidados

- Ruído ambiente não equivale a silêncio digital. Use os WAVs de controle
  fornecidos no teste 5.
- Botão de transcrição desabilitado por serviço indisponível não comprova o
  bloqueio por sinal. O bloqueio válido é a mensagem de sinal insuficiente
  exibida ao acionar a saída.

O detector verifica presença de sinal, não inteligibilidade.

## Registro e decisão

Para cada teste, preencha a ficha com: executor, data e horário; preview e SHA
comprovado; equipamento, sistema, navegador e microfone; teste e ação
realizada; resultado (APROVADO, FALHOU ou NÃO EXECUTADO); evidência (arquivo,
captura de tela e horário do evento); achado ou limitação; revisor que ouviu o
WAV.

- Aprovado: todos os testes exigidos passaram, com evidências e escuta humana
  assinada.
- Falhou: qualquer critério de falha foi observado.
- Pendente: faltou execução, hardware, ambiente ou evidência. "Não executado"
  nunca vira aprovação.

O aceite vale somente para a versão e os ambientes testados; não autoriza merge
nem publicação.

## Privacidade

Nenhum áudio real nem dado de paciente entra neste gate. As evidências anexadas
à ficha devem conter apenas voz de teste sem nomes nem dados clínicos.
