# OBS-10 Tablet — execução guiada sem kit físico

Revisão de engenharia: 23/09/2026. Família de registro: `obs10-tablet/1.0.0`. Issue #931 / PR #934.

## Entrega e finalidade

Modo experimental na preparação da rota OBS-10 existente. **Abrir modo tablet · experimental** abre uma jornada no mesmo aplicativo, com o fundo inerte. Não exige papel, impressora, lápis, bonecos, blocos ou bolas. Usa interação com o cuidador, cenas autorais locais, leitura em tela, escolhas, contagem visual e traçado com o dedo. Recursos dependem da idade e da acessibilidade individual. Abaixo de 24 meses, não apresenta estímulos de tela à criança: registra uma amostra reduzida da interação e dos movimentos espontâneos. Segurança, conforto e apoios habituais continuam indispensáveis.

**Não é conversão equivalente das 145 tarefas presenciais.** Habilidades dependentes de objetos e exame físico são explicitamente não examinadas. O modo presencial permanece disponível. A escolha de modalidade é explícita, e o JSON tablet não pode ser tratado como um registro clássico.

### Cobertura recuperada sem instrumento (24/09/2026)

Parte do que faltava não dependia de kit, apenas da câmera e da sala. A partir de cinco anos entraram duas propostas do roteiro presencial, com as palavras do próprio roteiro:

- **Quatro movimentos observados pela câmera**, numa única atividade: caminhar até um ponto e voltar, braços à frente, dedo ao nariz e apoio em um pé. O tablet sai da mão e fica apoiado de pé, mostrando o corpo inteiro. Nenhum objeto entra; nada aparece na tela da criança.
- **A regra SOL/LUA, apenas falada.** Nenhuma palavra ou imagem dela chega à superfície infantil, o que o teste verifica lendo o DOM da tela da criança.

Cada movimento carrega o caminho de omissão do presencial: sem marcha estável, dor, recusa ou espaço seguro, omita e registre o motivo. Continua fora: chute e recepção de bola, provas provocadas de postura, medidas formais de equilíbrio ou marcha, manipulação de objetos reais, preensão do lápis, força contra resistência, tônus, reflexos e sensibilidade. Observação descritiva pela câmera não é exame neurológico nem prova de normalidade, e a lista de limitações do registro diz exatamente isso em cada faixa, inclusive declarando quando a proposta motora não existe.

### Ritmo por atividade

Cada tarefa passou a declarar uma duração sugerida, tirada do roteiro presencial, exibida na orientação e somada na tela de prontidão. É orientação de ritmo, nunca prazo, escore ou tempo de reação: o limite absoluto de 600 segundos continua sendo do controlador, não dessa soma. Um teste garante que o total sugerido de cada faixa cabe no limite com folga para recusa, pausa e anotação.

A atualização concorrente #933, commit `f62aeee5db5dc83e7d58a81626f1363ab320f873`, foi integrada por merge de dois pais, sem reescrever histórico. Foram preservados seus estímulos em tela inteira, transições, testes e refinamentos de materiais físicos. A pendência de papel da #930 foi resolvida nessa PR independente; não há nova tentativa sobre o objeto/branch que havia sido bloqueado.

## Arquitetura

- `tablet/protocol.ts`: catálogo digital autoral versionado; seleção por idade cronológica; tarefas e limitações explícitas, sem escores, normas, QI ou diagnóstico.
- `tablet/engine.ts`: reducer único da modalidade; transições fechadas; registro de apresentação, categoria declarada, descrição factual e eventos brutos. Limites de tempo, eventos e coordenadas; validação estrutural com Zod.
- `tablet/TabletWorkspace.tsx`: coordenação de preparação, câmera, treino, coleta, revisão e entrega. Reutiliza `useLocalRecorder`, `sessionElapsed` e `useExitGuard`; não introduz um backend paralelo.
- `tablet/Stimulus.tsx`: superfície infantil com somente o recurso atual. As instruções do adulto são desmontadas, não apenas escondidas por CSS. Cenas sem legenda/resposta; memória oral sem pistas visuais.
- `tablet/DrawingPreview.tsx`: apresentação dos traçados registrados, sem entradas ou reaplicação. Entrada e revisão mantêm proporção 2:1; um segundo ponteiro não encerra o traço ativo. Não há análise clínica automática do desenho.
- `tablet/TabletLauncher.tsx`: entrada pela rota autorizada, carregamento tardio e diálogo nativo. Fundo inerte, sem alteração de autorização, clínica, papéis ou banco.
- `tablet/style.ts`: fonte ampliável, controles de 60 px ou mais, foco visível, adaptação de largura e respeito a movimento reduzido. Estilos locais, com os tokens existentes.

### Transições

Preparar atendimento → conferir câmera → ensaiar sem criança → confirmar prontidão → ler orientação → abrir atividade/interação → registrar resposta → próxima atividade → revisar → guardar arquivos.

Não há avanço automático durante a tentativa nem exigência de resposta correta para continuar. Recusa e omissão são registradas. Notas digitadas ficam no estado antes de confirmar a categoria, para sobreviver a encerramento precoce. Categoria isolada não cria narrativa clínica.

Desde 24/09/2026, a categoria avança sozinha e a descrição pode ser completada na revisão, como manda o roteiro presencial ("marque a categoria; detalhe depois"). Isso tira a digitação de prosa de dentro dos dez minutos, com a criança esperando. As garantias compensatórias são explícitas: a categoria continua obrigatória; a descrição nunca é preenchida por suposição; `pendingDescriptions` conta as pendências; a revisão abre esses itens já expandidos e mostra o total; e o resumo entregue ao médico declara quantas atividades estão sem descrição. A omissão segue diferente, porque sem o motivo nada registra por que a proposta não aconteceu: continua exigindo texto. No modo presencial, a troca de tarefa passou a posicionar foco no commit de layout, removendo a corrida de temporização; a transição entre blocos da #933 foi preservada.

A coleta tem limite absoluto de 600 segundos e inclui transições e anotações, sem pausa. Trocar de aba ou bloquear a tela encerra, não suspende. Preparação e revisão ficam fora do cronômetro. Encerramento não autoriza novas tarefas. A leitura e as cenas precedem a apresentação das palavras de memória; entre apresentação e evocação não se oferecem novamente seus alvos. Isso evita uma pista de interface, mas não cria uma tarefa de memória validada ou um intervalo normativo.

### Câmera e arquivos

O gravador compartilhado aceita orientação opcional: presencial continua preferindo câmera traseira; tablet solicita frontal. `ideal` é pedido ao navegador, não garantia: conferir a câmera escolhida. A câmera externa exige preparação e salvamento institucional declarados pelo aplicador. Um tablet pode não captar rosto e mãos em todas as posições; essa limitação requer teste do equipamento e registro, nunca presunção de normalidade.

Vídeo, JSON e TXT são arquivos separados. JSON preserva descrições, eventos e traçados; TXT explicita modalidade e lacunas. Download solicitado não comprova armazenamento durável. Conferir arquivos antes de sair. Edição invalida a indicação de exportação atual. Reabrir JSON permite somente revisão; não recupera vídeo nem autentica origem, autoria ou conteúdo. A última parte de um traço pode ficar parcial se houver interrupção abrupta. Não há envio ao prontuário, IA ou salvamento automático.

## Fronteiras de confiança

Dados temporários em memória; nenhum novo `localStorage`, `sessionStorage`, IndexedDB, endpoint, cookie ou upload clínico. Imagens locais. A leitura opcional do tutorial aceita apenas voz declarada local pelo navegador e texto estático, sem informação pessoal. Se não houver voz disponível, as instruções escritas permanecem. Não foi introduzido reconhecimento remoto de fala.

Importação: até 4 MiB, campos estritos, versão própria, IDs válidos, observações únicas, abertura rastreável, eventos cronológicos, coordenadas entre 0 e 1, teto de 1500 eventos e 12000 pontos. Atingir limites é declarado; não há truncamento apresentado como captura completa. Validação estrutural não é assinatura nem prova clínica. A clínica permanece responsável pelo acesso, destino, retenção e governança dos arquivos.

Nenhum item proprietário de CANTAB, Q-interactive ou NIH Toolbox foi copiado. Não há pontuação projetiva, comparação com normas presenciais ou análise semiológica de vídeo.

## Inspirações de produto, não validação do protocolo

1. W3C WAI, Use Clear Step-by-step Instructions: instrução junto à ação, passos curtos, exemplos e prevenção de erros. https://www.w3.org/WAI/WCAG2/supplemental/patterns/o4p07-step-instructions/
2. W3C WAI, Make Each Step Clear: etapa atual e orientação de sequência. https://www.w3.org/WAI/WCAG2/supplemental/patterns/o1p04-clear-steps/
3. W3C WAI, Separate Each Instruction: diminuir demandas de memória operacional. https://www.w3.org/WAI/WCAG2/supplemental/patterns/o3p09-separated-instructions/
4. Pearson Q-interactive: separar superfícies de profissional e examinando, integrando materiais. Vários subtestes ainda exigem manipulativos; não sustenta equivalência universal objeto/tela. https://www.pearsonassessments.com/store/usassessments/en/p/q-interactive-pearson-s-1-1-ipad-based-assessment-system/100000773
5. Cambridge Cognition: entrega consistente de atividades em touchscreen. O OBS-10 não herda normas, evidência ou métricas de CANTAB. https://cambridgecognition.com/technology-study-delivery/

## Verificações executáveis

`npm run check`; lint sem avisos; `node --import tsx tests/unit/obs10-tablet.test.ts`; build com `VITE_OPEN_ACCESS=false`; `node tests/e2e/obs10-tablet.mjs`; `node tests/e2e/obs10-tablet-media.mjs`. Workflow `.github/workflows/obs10-tablet.yml`, com artefatos sintéticos e falhas preservados. Suítes anteriores OBS-10 continuam obrigatórias.

Contrato unitário: faixas, sequência sem pistas, estados, tempo, tipos de entrada, notas parciais, importação, tamanho e ausência de persistência/upload. Navegador: rota real autenticada com conta sintética, preparação, treino, desenho, segundo ponteiro, leitura, revisão, reexportação, teclado, largura de celular, letras maiores e axe. Mídia: permissão negada, pedido frontal, liberação da prévia, interrupção de trilha, vídeo real sintético, aba oculta e limite de dez minutos.

Resultados, SHA exato e artefatos ficam na PR. Esta documentação não afirma que testes já concluíram nem que houve publicação. Publicação é verificada separadamente no Cloudflare; Vercel é espelho.

## Evidência humana e comercial ainda necessária

Não declarar sucesso mundial, interesse empresarial, certificação, economia de tempo ou acurácia sem dados. Avaliar aplicadores iniciantes, incluindo idosos quando representativos, em tablets/câmeras reais. Medir erros críticos, ajuda solicitada, perdas de arquivos, entendimento das omissões, conclusão e esforço. Metas não são resultados obtidos.

Concordância entre observadores, confiabilidade longitudinal, equivalência por domínio/faixa e impacto clínico exigem estudos próprios, supervisão e governança ética. Revisar enquadramento regulatório pela finalidade efetiva antes de alegações diagnósticas/comercialização como dispositivo. Nenhuma pesquisa com pacientes ou transmissão externa nova foi iniciada.

## Rollback

Reverter apenas a PR #934. Preservar #930 e #933. Sem migrações, segredos novos ou dados persistidos; nenhum pagamento foi alterado. A remoção do modo tablet deve manter o modo presencial e o padrão anterior de orientação da câmera.
