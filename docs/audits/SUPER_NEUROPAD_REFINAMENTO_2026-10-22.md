# Super NeuroPad — integridade da sessão e do circuito

Base: `27d6cb5` de `main`. Escopo fechado após o pedido de finalizar rapidamente os trabalhos iniciados.

## Correções

- O encerramento passa à saída familiar um retrato explícito com a última resposta, os mundos não aplicados, a data final e o tempo de pausa atualizado. O lote de atualizações do React não deixa mais a saída presa ao render anterior.
- Registros parciais do circuito, inclusive somente uma anotação, fonte ou marcador, passam a proteger troca de idade, nova partida, navegação e fechamento da aba. Cancelar a troca mantém a idade e o rascunho; confirmar inicia um circuito vazio. Não há persistência nova.
- Uma descrição fornecida não aparece mais como ausente no relatório. Ausência de exame presencial continua indicada independentemente da descrição.
- Um item dos guias de coleta só aparece como coletado quando todas as estações aplicáveis estão registradas; estações presenciais exigem fonte do examinador. Achados continuam a esclarecer.
- Relato escolar só contribui quando vem de estação aplicável à idade e com registro obtido. Não realização, falta de colaboração e IDs estranhos à faixa não completam essa fonte.
- Guias respeitam idades inteiras, de 2 a 17 anos.

Preservados: 50 desafios disponíveis por idade, IDs, ordem, bancos de origem, critérios, contagens e limites do núcleo, desenhos, temas, XP e distinção entre observação e diagnóstico. Nenhuma norma, escore, ponto de corte ou validação psicométrica foi acrescentada.

## Verificação local — Windows

| Verificação | Resultado |
|---|---|
| `npm run test:super-neuropad` | exit 0; 146 testes, 146 aprovados, sem skips |
| `npm run check` | exit 0; cliente e Functions |
| `npm run build:client` | exit 0; `VITE_AUTH_MODE=remote`, `VITE_OPEN_ACCESS=false` |
| ESLint nos cinco arquivos de produto alterados e teste de encerramento | exit 0, sem alertas |
| `npm run test:e2e:super-neuropad` | exit 0; 30 desafios, resultado completo/parcial, navegação, PDF local de 55.840 bytes |
| `npm run test:e2e:super-neuropad-circuit` | exit 0; 16 idades, circuito obrigatório completo aos 9 anos, exportação, integração documental, axe e celular |
| `npm run test:e2e:super-neuropad-opcionais` | exit 0; 16 idades, 50 desafios por idade, pausa, cópia, preservação de registros, axe e celular |
| `npm run test:e2e:super-neuropad-draft` | exit 0; rascunho parcial, cancelamento de troca, menores de 2, beforeunload e limpeza confirmada |

As novas regressões foram reproduzidas antes da correção: quatro testes de integridade do relatório, dois testes dos handlers reais de encerramento e a perda de rascunho no Chromium. Os E2E usam somente API e dados sintéticos, sem conexão clínica real. Nenhuma mensagem foi enviada à família.

Capturas focais do jogo, opcionais e circuito foram inspecionadas. As provas de circuito e opcionais registraram zero erro de console e zero excesso horizontal em celular. Não houve alteração de CSS. A matriz visual global não foi regenerada nesta correção; não se afirma ausência universal de regressões.

Execuções simultâneas de Chromium pressionaram a memória da máquina; a prova final foi concluída em sequência. Logs e capturas estão em `C:\NeuroPed\2026-09-07\agora-sim-conectado-tanto-no-windows\outputs\superneuropad-*`.

## Limitação da suíte geral

`npm run test:quick-wins` não terminou verde neste Windows: após disponibilizar Git Bash no PATH do processo e normalizar temporariamente leituras locais para LF, `tests/unit/dr-rehearsal-safety.test.mjs:133` falhou ao extrair o bookmark de uma fixture temporária. O teste interpola um caminho Windows com barras invertidas em um comando Bash, retornando vazio. Esse teste e o workflow de DR não foram alterados; a falha não foi ocultada nem uma assertiva removida. A suíte específica do módulo e os quatro E2E passaram. A suíte geral exige tratamento de portabilidade ou execução no ambiente Linux da CI antes de um release global.

## Entrega e rollback

Mudança local, sem publicação, merge, migração ou alteração de banco. Reverter o commit desta entrega restaura os comportamentos anteriores. Publicação exige revisão e autorização específica conforme as instruções operacionais do projeto.
