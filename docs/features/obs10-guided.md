# OBS-10 — execução guiada com recursos integrados

Revisão de interface: 23/09/2026. Issue #929. Base examinada: a256d754091705f2077b945b06cea468b5874452.

## O que mudou

A rota existente continua usando `PracticalTaskGuide`; sua implementação agora é `GuidedTaskCard`, sem rota paralela nem outro protocolo. Cada uma das 145 tarefas possui um quadro autossuficiente e numerado: **1. Pegue e prepare → 2. Diga/faça → 3. Observe → 4. Registre**. O quadro mostra material físico com imagem, quantidade, cuidados e substituto, enquadramento, comando literal da fonte, passos, apoio permitido e categoria. Navegação anterior/próxima, indicação de bloco e posição, ajuda dos sete botões e botão Letras maiores. O acesso direto aos blocos continua disponível para segurança e revisão; não se exige completar todas as tarefas nem se preenchem lacunas ao avançar.

O guia usa uma coluna durante a aplicação, texto maior, botões de pelo menos 56 px, foco de teclado no título após navegação e reflow em tela pequena. Não há avanço automático, pausa extra, novo cronômetro ou alteração da gravação. Aparência acessível e testes automáticos não comprovam que qualquer pessoa idosa conseguirá aplicar; as primeiras aplicações permanecem supervisionadas. A equipe deve observar um usuário iniciante real antes de homologar a facilidade de uso.

## Três naturezas de recurso, sem mistura

- **Já no app:** instrução, comandos, ilustração da aplicadora, câmera, cronômetro, registro e a exibição das cenas e textos em tela inteira.
- **Mostrar na tela ou preparar em papel:** cenas de apontar/descrever e textos de leitura, extraídos das tarefas vigentes. A tela inteira e a impressão individual contêm somente imagem ou texto, sem comandos, resposta ou dados da sessão; a tela inteira mantém apenas o controle de encerrar da aplicadora. O meio utilizado deve ser registrado na tarefa.
- **Objeto físico:** blocos, boneco, bola, recipiente, livro quando se observa folhear, lápis e outros itens do kit. A imagem identifica o material, não o substitui.

A preparação exibe os recursos correspondentes à idade efetivamente selecionada. Consultar o kit de outra faixa não troca os textos da aplicação. Para 24–35 meses, a instrução que pergunta pelo gato oferece a cena com gato, não as outras cenas. Em 12–17 meses, a figura pode usar uma cena impressa, mas **folhear continua exigindo livro físico**. Esse limite agora aparece também no kit e no cartão.

Durante a coleta, o cartão da tarefa oferece a exibição do estímulo em tela inteira (`StimulusStage`): uma superfície dedicada que só consegue renderizar a cena ou o texto permitido, porque não importa comandos, tarefas nem estado da sessão. Ela fecha por botão ou Escape, devolve o foco ao guia e fica indisponível após o encerramento, para não induzir novas tentativas. Não há botão de impressão durante a coleta, que abriria outra janela e encerraria a aplicação. Fora do estímulo, a tela continua sendo da aplicadora. Equivalência papel/tela não é presumida: o meio utilizado é registrado por tarefa e quem interpreta é o médico. Se a gravação usa o mesmo aparelho, o guia avisa que mostrar a tela desloca o enquadramento. Quando o recurso não estiver disponível, documentar a limitação em vez de sair da aba, improvisar ou repetir para completar.

Entre tarefas consecutivas, o cartão antecipa a transição: nome da próxima proposta, aviso de troca de bloco e o que pegar ou guardar, calculado da diferença de materiais das próprias tarefas, sem listar câmera, colchonete, cadeira e trajeto, que permanecem no lugar. Avançar de bloco pelo cartão mantém o foco no título da primeira tarefa seguinte.

Memória casa–gato–pão, história do gato e regra SOL/LUA permanecem orais: nunca recebem cartão imprimível para a criança. Modelos de círculo, cruz e quadrado são identificados com a forma correta e instrução de desenhar na folha da aplicadora; não são oferecidos em desenho livre ou letras espontâneas.

## Verdade documental e clínica preservadas

As fichas, comandos e tarefas de `practical.ts`/`protocol.ts` não mudam. A versão do registro continua 1.6.1 e o esquema JSON não muda: esta é uma revisão da apresentação, não uma nova norma clínica. Quantidades no guia descrevem materiais, nunca um resultado esperado. Omissões por idade, prono sem autorização e equipamento ausente continuam bloqueando a proposta. Marcar resposta não cria descrição literal; avançar sem marcar não vira habilidade ausente. O encerramento aos 600 segundos e a finalização antecipada pertencem ao controlador original.

Não há upload, reconhecimento remoto de voz, nova persistência, alteração de permissões/tenant ou análise de vídeo. Não são prometidos ditado automático ou envio ao prontuário. Os registros continuam sujeitos à exportação e revisão médica existentes.

## Verificação

Workflow `.github/workflows/obs10-guided.yml`: tipos, lint, contrato de recursos das 145 tarefas e jornada de navegador com autenticação e dados sintéticos. Imprime cena/texto isolados, abre e fecha o estímulo em tela inteira conferindo que só o estímulo aparece, verifica fonte ampliada, teclado, mobile, zoom de texto em 200%, ausência de achados fabricados, proteção de tarefa oral, bloqueio da tela após o encerramento, transições anunciadas com pegar/guardar corretos, foco preservado na troca de bloco, cópia versus produção livre, livro físico e omissão etária. O teste unitário adiciona a pureza e a correção de `taskHandoff` em todos os cartões e o isolamento do `StimulusStage`, que não pode importar comandos nem registros. O workflow OBS-10 original continua obrigatório e não teve asserts removidos; ele percorre todas as 145 tarefas e as regressões de mídia/revisão/exportação.

Comandos: `npm ci`; `npm run check`; `npx eslint client/src/features/obs10/*.{ts,tsx} tests/unit/obs10-guided.test.ts --max-warnings=0`; `node --import tsx tests/unit/obs10-guided.test.ts`; `VITE_OPEN_ACCESS=false npm run build:client`; `node tests/e2e/obs10-guided.mjs`.

Resultados, commit final e situação de publicação devem ser lidos na PR, não inferidos deste documento. Build ou PR não equivalem a deploy. Produção canônica continua Cloudflare. Rollback: reverter apenas a PR vinculada à issue #929; nenhuma migração, dado clínico persistido ou mudança de backend.

Referências de acessibilidade: W3C WAI Older Users (https://www.w3.org/WAI/older-users/developing/) e WCAG 2.2 (https://www.w3.org/TR/WCAG22/). Orientam apresentação, não validam o roteiro clinicamente.
