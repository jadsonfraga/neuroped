# NeuroPed OBS-10 — guia de aplicação prática

**Versão 1.1.0 · 17/09/2026.** Origem: issue #893 / PR #894. Segunda rodada: issue #895 / PR #896.

Rota: `/#/avaliacao-pre-consulta-faixa-etaria`. Acesso nos destaques e em **PRÉ-CONSULTA GUIADA → Avaliação de Pré-Consulta por Fachetária**. Rótulo preservado conforme solicitação do proprietário. A Sonda Dez permanece independente.

## 1. Antes da criança chegar: idade e kit

Informe anos e meses completos. O primeiro painel seleciona a ficha e mostra materiais ilustrados, quantidades, segurança e substitutos. Consultar outra faixa não altera a idade aplicada. Idade corrigida só quando informada pelo médico, antes de 24 meses e nunca maior que a cronológica.

Todas as faixas precisam de **celular/tablet institucional carregado e suporte fixo**. Em filmagem externa, use um segundo aparelho para ler o roteiro. Prepare o ambiente, autorização e materiais antes do cronômetro. Quantidades são de organização, não critérios clínicos.

| Faixa | Kit, além do dispositivo de filmagem |
|---|---|
| 0–2 meses | 1 colchonete firme; 1 brinquedo grande para olhar e alcançar. |
| 3–5 meses | 1 colchonete firme; 1 brinquedo grande para olhar e alcançar. |
| 6–8 meses | 1 colchonete firme; 1 recipiente largo; 2 brinquedos grandes. |
| 9–11 meses | 1 colchonete firme; 1 brinquedo grande; 1 pano para esconder somente o brinquedo; 2 blocos grandes. |
| 12–17 meses | 1 colchonete firme; 1 copo plástico vazio; 1 boneco; 1 livro com cenas simples; 1 cadeira estável; 2 blocos grandes. |
| 18–23 meses | 1 colchonete firme; 1 boneco; 1 colher grande de brinquedo; 1 carrinho grande; 6 blocos grandes; 2 gizes grossos; 3 folhas. |
| 24–35 meses | 1 boneco; 1 copo plástico vazio; 1 colher de brinquedo; 1 livro; 1 bola grande e macia; 2 gizes grossos; 3 folhas; 1 recipiente largo; 6 blocos grandes. |
| 3 anos | 1 boneco; 1 copo plástico vazio; 1 colher de brinquedo; 1 livro; 3 folhas; 2 gizes grossos; 6 blocos grandes; 1 bola grande e macia. |
| 4 anos | 1 livro; 3 folhas; 1 lápis; 6 blocos grandes; 1 bola grande e macia. |
| 5 anos | 3 folhas; 1 lápis; 5 blocos grandes; 1 cadeira estável; trajeto livre com duas marcas, cerca de 3 m se disponível. |
| 6–8 anos | 3 folhas; 1 lápis; 1 cadeira estável; trajeto livre com duas marcas. Preparar a frase da ficha em papel separado. |
| 9–11 anos | 3 folhas; 1 lápis; 1 cadeira estável; trajeto livre com duas marcas. Preparar as duas frases compatíveis com a escolarização. |
| 12–17 anos | 3 folhas; 1 lápis; 1 cadeira estável; trajeto livre com duas marcas. |

A fonte operacional é `MATERIALS` / `KITS` em `client/src/features/obs10/practical.ts`. Não usar peças pequenas, alimentos, vidro ou objetos com partes destacáveis. Higienizar entre crianças. Colchonete sempre no chão, nunca em mesa/cama/superfície elevada. Não cobrir rosto com o pano.

Marque **Separado/substituído** ou **Ausente**. **Separei o kit completo** é uma declaração da aplicadora, não inspeção automática. Dispositivo ausente bloqueia o início. Outros itens ausentes sinalizam omissão das tarefas dependentes; não improvisar material inseguro. Registre o substituto utilizado em adaptações.

**Imprimir kit e cenas** abre documento independente com lista ilustrada e três cenas simples alternativas ao livro. São estímulos autorais não padronizados. Mostre somente o desenho escolhido, sem legenda/resposta. Não usar essas figuras para ensinar respostas de memória.

## 2. Conferir segurança e enquadramento

Registre código institucional sem nome, escolaridade sem nome da escola, idioma/comunicação, apoios habituais, condições do dia e relato familiar separado. Confirme autorização institucional, participação/conforto, treinamento, médico disponível, piso/apoios seguros, materiais e captação.

A câmera deve mostrar rosto, mãos e interlocutor na interação; corpo inteiro e pés nas tarefas motoras; as duas mãos, lápis e folha no grafismo. Celular fixo e horizontal, luz adequada e áudio compreensível, sem filtros. Gravar tentativas e ajuda, não somente o acerto.

A opção **Testar câmera antes de iniciar** permite prévia de enquadramento sem gravar nem consumir os dez minutos. A prévia é silenciosa para evitar retorno de áudio: ela não confirma inteligibilidade das vozes. Confira a captação no dispositivo institucional antes do uso e a integridade do arquivo ao final.

**Treinar o registro sem criança nem câmera** apresenta três exemplos fictícios de repetição, recusa e trecho não avaliável. Não certifica competência nem substitui aplicações supervisionadas.

## 3. Aplicar uma tarefa por vez

Os **145 cartões estão distribuídos entre as 13 fichas**, não são 145 tarefas por criança. Cada cartão tem ilustração, comando curto, até três passos, tempo operacional, orientação do que registrar e cuidados/omissões. São 17 tipos de material ilustrados e diagramas reutilizados quando apropriado; não são fotografias clínicas.

As imagens servem à aplicadora. Manter a tela fora da visão da criança em memória/regras e nas tarefas em que o modelo não faz parte da proposta. Braços à frente usam representação lateral; salto com dois pés tem imagem própria, distinta do equilíbrio em um pé.

| Janela | Bloco |
|---|---|
| 00:00–00:30 | Acolher e observar. |
| 00:30–02:00 | Interagir e conversar. |
| 02:00–04:00 | Linguagem e raciocínio. |
| 04:00–06:30 | Movimentar com segurança. |
| 06:30–08:30 | Mãos, desenho e escrita. |
| 08:30–10:00 | Retomar e encerrar. |

Dar comando, aguardar cerca de cinco segundos, repetir uma vez e demonstrar somente quando previsto. Registrar ajuda e seguir. Não treinar até acertar, pressionar, retirar apoios ou exigir olhar nos olhos. Pausas e transições após o início contam no limite. A janela é operacional, não norma de desempenho. Não prolongar para preencher todos os cartões.

A indicação de prono depende de autorização médica, vigília, supervisão e tolerância. Desafios adicionais de dois passos e salto da ficha de 24–35 meses são omitidos antes de 30 meses. Dor, instabilidade, recusa ou falta de proteção/espaço seguro impedem a tarefa motora. Não realizar manobras médicas, força contra resistência, reflexos, estímulo doloroso, tração, mobilização passiva, olhos fechados, escadas, sustos ou hiperventilação.

## 4. Registrar sem inventar achados

Durante a coleta, marque uma categoria no cartão; detalhe o fato depois de encerrar. As categorias são **Na proposta inicial, Após repetição, Após gesto/modelo, Com apoio habitual, Não demonstrado, Recusou, Não aplicado**. Não há soma de pontos.

“Na proposta inicial” substitui o rótulo antigo “Espontâneo”: algumas propostas incluem modelo. Copiar após modelo previsto não é produção espontânea. Descreva ajuda extra separadamente.

**Categoria sozinha não gera descrição clínica.** Tarefa, resposta literal e categoria incompletas continuam sinalizadas. Não demonstrar aqui não prova incapacidade; recusa não equivale a alteração. Não preencher lacunas como “normal”. Relato familiar não é achado diretamente observado.

A tarefa de memória tem marcação de registro inicial e evocação; apenas o intervalo efetivamente marcado é calculado. Sem aprendizagem inicial documentada não se interpreta retenção. Horário da anotação não é timestamp verificado do vídeo. Anotações posteriores ao encerramento são identificadas; não reaplicar tarefas para completá-las.

## 5. Encerrar, revisar e entregar

A coleta pode terminar antes e é encerrada aos dez minutos ou ao sair da aba. Não continuar tarefas depois. Revisão e entrega ocorrem fora do cronômetro.

Abra os registros, complete fatos que possam ser sustentados, confira omissões e exporte TXT/JSON ou imprima o resumo em documento isolado. Na câmera integrada, aguarde finalização; confira som, enquadramento e integridade, então salve o vídeo. Nome do arquivo inclui identificador de sessão para reduzir colisões. A versão exportada é a do registro.

**Tudo permanece em memória: exportar e conferir antes de sair, recarregar ou começar outra sessão.** Não há upload, gravação automática no prontuário, Drive, e-mail ou IA. A marcação de entrega é declaração da aplicadora, não recibo automático de transmissão.

Permissão negada não inicia silenciosamente a sessão. Falha tardia de uma tentativa cancelada não pode fechar a nova câmera. Desconexão inesperada interrompe a coleta, encerra os recursos e sinaliza possível vídeo parcial. A finalização aguarda o último bloco de mídia, com falha explícita se não concluir. O botão de emergência após o encerramento preserva vídeo já finalizado.

A navegação interna e o fechamento normal pedem confirmação quando há dados. Encerramento forçado, falha do aparelho ou sistema operacional podem impedir qualquer aviso; não presumir recuperação. Navegação de autenticação/expiração/consentimento não é bloqueada por essa proteção.

## Intercorrências e confidencialidade

Alteração de consciência, crise, dificuldade respiratória, fraqueza súbita, instabilidade nova, dor intensa ou risco imediato: interromper e chamar a equipe presencial; emergência, SAMU 192. Em crise, proteger de lesões, não conter e não colocar nada na boca. Não aguardar vídeo ou IA.

Conteúdos sensíveis devem sair da gravação e seguir avaliação médica confidencial. Aparência tranquila não exclui sofrimento ou risco. O roteiro não substitui investigação de risco suicida pela equipe treinada.

Rosto e voz identificam a criança; código não anonimiza vídeo. As confirmações na tela não substituem autorização/base legal, controle de acesso, armazenamento, retenção e eventual processamento externo definidos pela clínica.

## Natureza, acesso e origem

Proposta autoral **observacional não validada**, originada do manual OBS-10 e do guia operacional discutidos com o proprietário em 17/09/2026. As referências CDC/AAP, NIMH e LGPD estão no rodapé; não validam o conjunto como teste diagnóstico.

Sem sensibilidade/especificidade próprias, escore, percentil, QI, idade cognitiva, ponto de corte ou diagnóstico. Não inferir força 5/5, tônus/reflexos/sensibilidade preservados nem exame neurológico completo normal pelo roteiro. **O resumo utiliza os registros da aplicadora: não há análise semiológica automática de vídeo por IA.** Interpretação e decisão permanecem médicas.

Acesso remoto: admin/professional/operator; reader e anônimo bloqueados. Modo local mantém as exigências existentes. Não há alteração de autenticação/PIN, tenant, banco, dados de pacientes ou segredos. Testes com mídia sintética em Chromium não homologam todos os aparelhos: conferir o dispositivo real e fazer as primeiras aplicações supervisionadas.

## Verificação e manutenção

```sh
npm ci
npm run check
npx eslint client/src/features/obs10/*.{ts,tsx} client/src/pages/pre-consulta-obs10.tsx tests/unit/obs10*.test.ts --max-warnings=0
node --import tsx tests/unit/obs10.test.ts
node --import tsx tests/unit/obs10-practical.test.ts
npm run test:sonda
npm run audit:navigation
npm run test:operations
VITE_OPEN_ACCESS=false npm run build:client
npx playwright install --with-deps chromium
node tests/e2e/obs10.mjs
node tests/e2e/obs10-practical.mjs
```

A suíte original permanece; a nova cobre materiais/omissões, cartões, ausência de achados fabricados, navegação cancelada, impressão isolada, prévia de câmera, resposta tardia de permissão, desconexão, retenção do vídeo, treino e percurso pelas treze faixas. Todas as 145 tarefas devem renderizar pela interface real. Mídia/autenticação de teste são sintéticas; não há dados de pacientes nem substituição de lógica clínica.

Primeira execução integral desta rodada: run `35239850769`, artefato `10505021313`, dois resultados `passed: true`, onze capturas com zero violações detectadas pelo axe e nenhuma exceção JavaScript. A correção das duas figuras e a ampliação para todas as faixas têm verificação adicional. Resultados finais do HEAD e publicação devem ser consultados na PR #896.

Workflow permanente `.github/workflows/obs10.yml` é somente leitura. Ferramentas temporárias de transferência/integração não fazem parte da entrega. Não remover assertivas, aumentar baseline ou usar saltos para aparentar aprovação.

Publicação segue os gates existentes: Cloudflare Pages/Functions é canônico, Vercel é espelho. Branch/PR/build não equivalem a publicação; confirmar merge, deploy e SHA servido. **Rollback:** reverter exclusivamente a PR #896; nenhuma migração ou persistência nova a desfazer. Arquivos exportados permanecem sob a política da clínica.
