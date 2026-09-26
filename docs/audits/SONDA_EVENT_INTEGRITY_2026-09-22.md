# Sonda Dez — integridade de eventos, contagens e relatório

Issue: https://github.com/jadsonfraga/neuroped/issues/920

Base auditada: `74abe8efcb95735fc28b17a1bc968179fe6d38d2`.
Adaptação digital: `2026-09-22.1`. Fonte presencial preservada.
Todos os exemplos são sintéticos. Não houve acesso a prontuários reais.

## História verificada

A aplicadora apresenta estímulos na rota `/testes-diretos`, registra as respostas,
confere contagens derivadas da tentativa atual e exporta o mesmo registro para
revisão médica. A Sonda não tem API clínica nem persistência automática; os testes
de navegador usam apenas o login sintético já existente, com o bundle real.

## Correções

- Atenção sustentada e grades: acertos/alvos, omissões e comissões/falsos positivos
  são derivados dos eventos, não de entrada numérica manual. Sem toque após cinco
  alvos apresentados: **0/5/0**, nunca **0/0/0**.
- Inibição e troca de regra: respostas explícitas por cartão geram contagens.
  Ausência de anotação ou “Não observado” impede derivação. “Sem resposta” verbal
  é observação explícita; “Esperar” motor significa ausência de palma observada.
- Nas palmas, a aplicadora pode registrar durante a série pelas teclas 1–4, sem
  feedback de acerto na tela da criança. Sem teclado, precisa de anotação
  contemporânea; não deve reconstruir a sequência de memória. O sistema não
  reconhece voz ou movimento e não verifica se o relato humano corresponde ao fato.
- Conferência por cartão preserva eventos anteriores e marca a origem da
  correção. Apenas a última resposta explícita daquela tentativa compõe o total.
- Totais indisponíveis são removidos ao reabrir ou interromper. NA continua
  disponível com motivo obrigatório; não apaga os eventos digitais.
- A validação central rejeita números divergentes mesmo fora da UI. A exportação
  mostra a fonte e a contagem verificável; valores incompatíveis são identificados
  como **DADO INCONSISTENTE**, com bloqueio de síntese interpretativa.
- Séries exigem índices apresentados completos e válidos, duração e conclusão;
  toques fora da janela e grades malformadas não produzem totais válidos.
- “Erros impulsivos” foi substituído por “Respostas diferentes da regra” na
  adaptação digital: uma contagem não permite atribuir causalidade clínica.

## Idade: resolução segura, não validação clínica

O agrupamento 36–59 meses, isoladamente, não demonstra um bug clínico. Preparação
e relatório agora explicitam idade em anos/meses e que a mesma trilha não implica
expectativas equivalentes para 3 e 4 anos. Compreensão e conforto determinam se a
oportunidade é avaliável; a inversão depende de compreensão da regra inicial.
Não foram criados normas, pontos de corte, tarefas supostamente validadas nem
diagnósticos automáticos. Validação etária clínica continua fora do que testes de
software podem demonstrar.

## Testes e evidências

- `npm run test:sonda`: 35 testes (8 consolidação + 27 digitais), exit 0.
- `npm run check`: exit 0.
- `npm run lint`: exit 0.
- `npm run build:client`: exit 0; avisos preexistentes de chunks grandes/PostCSS.
- `npm run test:cognitive`: exit 0 (Cognitive Lab e Sonda).
- Casos unitários completos: 36, 47, 48, 59, 60, 96 e 144 meses.
- Regressões negativas: valores contraditórios, dados ausentes, respostas verbais,
  palmas, inversão, NA, alterações por cartão, reapresentação, séries incompletas,
  eventos inválidos e exportação sem afirmações contraditórias.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/tmp/sonda-chromium/chromium npm run test:e2e:sonda`:
  exit 0; seis trilhas, 42 missões, 76 etapas e seis downloads conferidos byte a
  byte contra o texto exibido. Cenário adicional aos 36 meses verifica 0/5/0
  bloqueado para digitação, falta de observação, correção por cartão e retirada
  de total antes calculado. Pausa, reapresentação, NA, clipboard indisponível,
  vista móvel e tema escuro permanecem cobertos.
- Acessibilidade: 16 varreduras axe com zero violações dentro do escopo Sonda,
  além da verificação inicial de preparação; não é certificação do app inteiro.
- O download convencional do Chromium estava truncado neste ambiente. O navegador
  local foi obtido do pacote `@sparticuz/chromium`, isolado em `/tmp`, sem alterar
  dependências do produto. CI conserva seu Chromium gerenciado por Playwright.

O workflow específico preserva capturas, relatórios sintéticos exportados e
resultados de acessibilidade como artefatos da execução, inclusive em falhas.

## Rollback e limites

Reverter somente o commit/PR desta correção. Não há migração de banco, alteração
de tenant, API, protocolo presencial ou registros persistidos. A versão deve
acompanhar os arquivos gerados. Reverter reabre a possibilidade de divergência
manual; não é seguro reinterpretar registros antigos como se tivessem sido
conferidos pelo novo contrato.

Testes automatizados não demonstram validade clínica, validade psicométrica,
acurácia diagnóstica ou duração real de uma consulta. Não há salvamento clínico
automático e a revisão médica permanece necessária.
