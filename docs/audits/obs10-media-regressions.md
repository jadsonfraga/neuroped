# OBS-10 — correção de integridade de mídia e regressões

Issue #902. Base: `f4e5ebc46f88cbd977a9764eea68fb2289bdf62f`.
Escopo: corrigir comportamento de mídia já existente, sem acrescentar tarefas,
critérios diagnósticos, armazenamento, upload ou permissões clínicas.

## Cenários e correções

| Cenário reproduzido pelos testes | Comportamento exigido |
| --- | --- |
| A permissão da câmera termina depois de a aba ficar oculta. | Cancelar a tentativa, liberar as tracks recebidas tardiamente e não iniciar o cronômetro. Voltar à aba não autoriza reinício automático. |
| A permissão do teste de áudio chega depois da saída da aba. | Cancelar o teste e liberar o microfone, sem gravar ocultamente. |
| O gravador nativo encerra sem comando da aplicadora. | Encerrar a coleta, informar interrupção técnica e preservar o arquivo parcial produzido. |
| Um trecho de outro clipe é aberto enquanto o anterior está carregado. | Descarregar o vídeo anterior e bloquear marcação até carregar e confirmar o arquivo solicitado. |
| Arredondamento na virada de minuto: 59,96 segundos. | Mostrar `01:00.0`, nunca `00:60.0`, sem alterar as posições numéricas da evidência. |

A tentativa de início da página e o pedido de câmera têm donos e cancelamento
independentes. Ambos precisam respeitar a visibilidade. A liberação tardia de uma
permissão cancelada não pode reabrir recursos nem iniciar uma avaliação.
O teste usa getUserMedia/MediaRecorder reais com dispositivos sintéticos; adia a
resposta da permissão e aciona eventos nativos na fronteira do navegador, sem
injetar estado React ou substituir regras do aplicativo.

## Verificação

```sh
npm ci
npm run check
node --import tsx tests/unit/obs10-media-regressions.test.ts
VITE_OPEN_ACCESS=false npm run build:client
node tests/e2e/obs10-media-regressions.mjs
```

A suíte nova exerce os quatro cenários de mídia, inclusive duas associações com
arquivos sintéticos diferentes, além de capturas desktop/celular e verificação
axe. A unidade testa a formatação na virada de minuto e ao longo de uma hora.
As quatro jornadas anteriores permanecem obrigatórias em `.github/workflows/obs10.yml`.

O controle negativo usa o código da base, não altera o teste, exige as quatro
falhas específicas esperadas e rejeita erros inesperados de login/JavaScript.
A versão corrigida deve passar pelo MESMO teste sem falhas. O mecanismo temporário
de prova/integração é removido antes da entrega; resultados são registrados na PR.

O navegador do ambiente local negou a navegação com `ERR_BLOCKED_BY_ADMINISTRATOR`.
A restrição não foi contornada: as jornadas são realizadas no GitHub Actions
já autorizado para este repositório. Testes de software/mídia sintética não são
validação clínica, ensaio com crianças reais nem homologação de Safari/iPhone.

## Operação e rollback

Após sair da aba durante a preparação da câmera, volte e inicie explicitamente
uma nova tentativa. Se a gravação parar inesperadamente, preserve o arquivo
parcial, confira áudio/imagem e registre a limitação; não continue supondo que a
câmera permaneceu gravando. Ao trocar de clipe, confirme o arquivo correspondente
antes de marcar um novo intervalo.

Continuam obrigatórios exportar e conferir os registros/vídeos, separados do JSON,
e respeitar treinamento, autorização e revisão médica. Sem novo salvamento
automático ou interpretação por IA. Rollback: reverter somente a PR ligada à
issue #902; nenhuma migração ou nova persistência a desfazer.
