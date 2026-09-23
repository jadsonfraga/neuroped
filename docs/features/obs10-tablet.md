# OBS-10 Tablet — execução guiada sem kit físico

Revisão de engenharia: 23/09/2026. Família de registro: `obs10-tablet/1.0.0`. Relacionado à issue #931.

## O que foi construído

Modo experimental na preparação da rota OBS-10 existente. O botão **Abrir modo tablet · experimental** abre a jornada no mesmo aplicativo, com o fundo inerte. Não exige papel, impressora, lápis, bonecos, blocos ou bolas. Usa interação com o cuidador, cenas autorais locais, leitura em tela, escolhas, contagem visual e traçado com o dedo. Recursos dependem da idade e da acessibilidade individual. Abaixo de 24 meses, não apresenta estímulos de tela à criança: registra uma amostra reduzida da interação e dos movimentos espontâneos. As condições habituais de segurança, conforto e apoio continuam indispensáveis.

**Não é a conversão equivalente das 145 tarefas presenciais.** Habilidades dependentes de objetos e exame físico são explicitamente não examinadas. O modo presencial permanece disponível e sem mudança de comandos, kit ou esquema de registro. O usuário escolhe conscientemente a modalidade; nenhum resultado digital entra no importador clássico como se tivesse sido obtido com instrumentos físicos.

## Arquitetura

- `tablet/protocol.ts`: catálogo autoral digital versionado; faixas selecionadas pela idade cronológica; tarefas e limitações declaradas. Não contém escore, norma, ponto de corte, diagnóstico ou previsão de inteligência.
- `tablet/engine.ts`: reducer único da modalidade; transições explícitas e fechadas; histórico de abertura/tentativa, categoria declarada, descrição factual, eventos brutos e notas complementadas. Limites de tempo, quantidade de eventos e pontos. Importação estrita com Zod e vínculos de idade/tarefa/cronologia.
- `tablet/TabletWorkspace.tsx`: orquestra o estado, as confirmações, câmera, treinamento, coleta, revisão e entrega. Reutiliza `useLocalRecorder` e `useExitGuard`. Sem backend paralelo ou persistência clínica oculta.
- `tablet/Stimulus.tsx`: única superfície infantil; recebe somente o recurso da tarefa atual. Instruções do adulto são desmontadas, não apenas escondidas visualmente. Cenas não trazem legenda/resposta. Memória é oral, sem pistas visuais.
- `tablet/DrawingPreview.tsx`: traçados existentes em revisão, sem manipuladores de entrada. Não permite nova aplicação após encerrar.
- `tablet/TabletLauncher.tsx`: entrada protegida pela rota original, carregamento tardio e diálogo nativo; não altera autenticação, clínica, papéis ou banco.
- `tablet/style.ts`: estilos locais, fonte ampliável, botões de 60 px ou mais, foco e redução de movimento. Não substitui tokens globais.

### Jornada

Preparar atendimento → conferir câmera → ensaiar sem criança → confirmar prontidão → ler orientação → abrir atividade/interação → registrar resposta → próxima atividade → revisar → guardar arquivos.

Não avança atividade automaticamente enquanto há uma tentativa em curso. A criança não tem que produzir resposta correta para liberar a próxima etapa. Recusas e omissões têm lugar explícito. A nota é preservada no estado mesmo antes de confirmar a categoria, para não desaparecer em encerramento precoce. Categoria isolada não cria narrativa clínica.

Os dez minutos começam somente na coleta, incluem transições e anotações e têm limite absoluto sem pausa. Trocar de aba ou bloquear a tela encerra a coleta, não suspende o relógio. Não aplicar novas tarefas para completar um registro encerrado. Revisão e preparação não têm esse limite.

### Câmera e arquivos

O gravador existente ganhou uma opção de orientação: presencial continua preferindo câmera traseira; tablet solicita câmera frontal. `ideal` é pedido ao navegador, não garantia de escolha; o aplicador confere a prévia. Câmera externa também é permitida e sua preparação/armazenamento são declarações humanas. A mesma câmera do tablet pode não captar rosto e mãos em todas as posições: isso exige teste do equipamento e documentação das limitações, não inferência de normalidade.

Vídeo, JSON e resumo TXT são arquivos separados. O JSON contém eventos e traçados vetoriais; o TXT descreve origem, modalidade e lacunas. Download solicitado não significa arquivo duravelmente salvo. Conferir os arquivos antes de sair. Reabrir JSON é somente revisão; não recupera câmera ou vídeo e não autentica o conteúdo. Edição após exportação invalida a indicação de arquivo atual. Não há envio ao prontuário, IA ou armazenamento automático.

## Fronteiras de confiança

Dados temporários em memória; nenhum novo `localStorage`, `sessionStorage`, IndexedDB, endpoint, cookie ou upload clínico. Os recursos visuais estão no pacote local. A leitura opcional do tutorial usa somente voz marcada pelo navegador como local e texto estático, sem informação pessoal; indisponibilidade mantém instruções escritas. Não foi introduzido reconhecimento remoto de fala.

Importação limitada a 4 MiB, com campos estritos, família de registro explícita, IDs válidos, ausência de duplicatas, relógio não decrescente, coordenadas entre 0 e 1 e limites de eventos. Isso é validação estrutural, não prova de autoria, veracidade ou assinatura. Dados locais exportados continuam sensíveis; a clínica decide acesso, retenção, base legal e destino autorizado.

Nenhum conteúdo licenciado de CANTAB, Q-interactive ou NIH Toolbox foi copiado. Não há pontuação projetiva de desenhos, comparação automática com normas presenciais ou análise semiológica de vídeo.

## Referências de produto e escolhas de design

As referências abaixo orientam arquitetura/usabilidade, não validam este protocolo:

1. W3C WAI, **Use Clear Step-by-step Instructions**: instruções junto da ação, passos curtos, exemplos e prevenção de erros. https://www.w3.org/WAI/WCAG2/supplemental/patterns/o4p07-step-instructions/
2. W3C WAI, **Make Each Step Clear**: orientação de etapa atual, anteriores e seguintes. https://www.w3.org/WAI/WCAG2/supplemental/patterns/o1p04-clear-steps/
3. W3C WAI, **Separate Each Instruction**: redução de demanda de memória operacional. https://www.w3.org/WAI/WCAG2/supplemental/patterns/o3p09-separated-instructions/
4. Pearson, **Q-interactive**: separação de superfícies do profissional e do examinando e integração dos recursos. O produto ainda requer manipulativos em diversos subtestes; ele não sustenta equivalência universal entre objeto e tela. https://www.pearsonassessments.com/store/usassessments/en/p/q-interactive-pearson-s-1-1-ipad-based-assessment-system/100000773
5. Cambridge Cognition, **Technology & study delivery**: entrega organizada de tarefas em touchscreen e instruções consistentes. O OBS-10 não herda as normas, evidência ou métricas de CANTAB. https://cambridgecognition.com/technology-study-delivery/

## Verificação e critérios de liberação

Executar `npm run check`, lint, `node --import tsx tests/unit/obs10-tablet.test.ts`, build sem bypass de autorização e `node tests/e2e/obs10-tablet.mjs`. O workflow `obs10-tablet.yml` mantém prova sintética e falhas. As suítes OBS-10 original e guiada continuam obrigatórias.

O teste de navegador percorre a rota real com conta e dados sintéticos: preparação, treino, apresentação, desenho, leitura, registro, revisão, exportação/importação, diferença de modalidades e invalidação por edição. Capturas e axe não constituem validação humana ou clínica. A publicação precisa ser comprovada separadamente pelo SHA no Cloudflare; Vercel continua espelho.

## O que falta para demonstrar qualidade comercial, não apenas afirmá-la

Não declarar sucesso mundial, interesse empresarial, certificação, economia de tempo ou acurácia sem dados. A fase seguinte de evidência deve incluir aplicadores iniciantes (inclusive idosos, quando representativos), teste no tablet/câmera reais, avaliação do entendimento das omissões, perdas de arquivos e necessidade de ajuda. Métricas-alvo, não resultados obtidos: zero erro crítico de segurança; nenhuma troca de identidade/modalidade; tentativas e ajuda rastreáveis; exportações utilizáveis; tempo e esforço reportados por usuários reais.

Pesquisa de equivalência por domínio/faixa etária, concordância entre observadores, confiabilidade longitudinal e impacto clínico exigem desenho próprio, supervisão especializada e governança ética. Revisar enquadramento regulatório de acordo com a finalidade efetiva antes de fazer alegações diagnósticas ou comercialização como dispositivo. Não iniciou pesquisa com pacientes nem novas transmissões de dados.

## Rollback

Reverter exclusivamente a PR vinculada à issue #931, incluindo launcher, subpasta tablet, testes e opção de orientação do gravador. Sem migrações, novos segredos, dados persistidos ou alterações financeiras. Não reverter a PR #930. A pendência textual de quantidade de papel do modo presencial segue separada e não foi contornada nesta mudança.
