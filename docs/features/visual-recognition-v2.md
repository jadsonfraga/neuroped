# Reconhecimento Visual — versão 2026-09-23.2

Relacionado à issue #932. Escopo exclusivo do reconhecimento visual; não modifica o protocolo Sonda Dez nem o OBS-10. Rota canônica: `/testes-reconhecimento`. A entrada da sidebar é preservada e promovida também aos atalhos clínicos.

## Antes e depois verificáveis

Baseline `8486fd76bb696440ca164e510af5892c46118328`: página informativa de 93 linhas, com nomes de faixas e categorias, mas sem figuras apresentáveis, aplicação ou registro.

A implementação substitui essa página por 89 estímulos: 58 ilustrações locais (18 animais, 12 frutas, 10 transportes e 18 objetos cotidianos), 11 manchas de cor e 20 estados em 10 pares de conceitos. A quantidade não significa 89 itens normatizados nem mede qualidade psicométrica. Não é justificável afirmar “100% melhor” em validade clínica sem estudo comparativo; a comparação técnica adequada é ausência de aplicação versus fluxo executável com testes de integridade.

## Natureza e limites

Registro observacional autoral, não padronizado, para uso profissional. Não mede acuidade ou visão cromática, não estima inteligência ou idade mental e não produz diagnóstico, percentil, ponto de corte ou idade equivalente. Uma resposta depende de visão, compreensão verbal, atenção, motricidade, linguagem expressiva, familiaridade e qualidade da representação. Não interpretar desconhecimento cultural ou uma figura ambígua como falha infantil.

As faixas etárias são roteiros operacionais conservadores, não idades mínimas validadas para cada palavra. A idade exata em meses é obrigatória para iniciar; a navegação de prévia não preenche nem inventa essa idade. Os oito roteiros abrangem 12–23 meses, 2 anos, 3 anos, 4 anos, 5–6 anos, 7–9 anos, 10–12 anos e 13–17 anos. Crianças mais velhas podem necessitar de itens básicos sem que isso defina idade de desenvolvimento. A apresentação fica mais sóbria a partir de 7 anos.

Aos 12–23 meses a prioridade é exploração compartilhada e respostas gestuais, preferindo objetos reais quando a representação bidimensional não fizer sentido. A tela não substitui o objeto ou a interação presencial. A tarefa de nomeação não é exigida nessa faixa. Cores receptivas entram no roteiro a partir de 30 meses; nomeação de cores, a partir de 48 meses. Essas opções seguem orientação geral de marcos e não constituem normas para o banco.

## Três modalidades distintas

**Reconhecimento receptivo:** o adulto lê “Mostre…”, a criança pode tocar, apontar, olhar de forma interpretada pelo examinador, falar ou usar comunicação alternativa. O aplicativo não exige fala para demonstrar reconhecimento.

**Nomeação:** uma figura permanece visível e o adulto pergunta “O que é isto?” ou “Que cor é esta?”. Nos pares, os dois estados permanecem visíveis e o alvo recebe contorno neutro. É obrigatória a transcrição literal; variações linguísticas e onomatopeias são contextualizadas, não corrigidas por um algoritmo.

**Pareamento de identidade:** o modelo permanece visível junto às opções. Não é memória nem prova de conhecimento semântico. Seu registro fica separado das outras modalidades.

A nomeação deve anteceder o fornecimento do nome. É possível registrar uma tentativa de nomeação e depois criar uma oportunidade receptiva complementar. A primeira resposta não é sobrescrita. Exposição anterior ao nome ou ajuda registrada é sinalizada e não entra na contagem de respostas independentes sem exposição.

## Seleção e apresentação

O profissional escolhe categorias, até 2/3/4 alternativas, sessão de até 6/12/20 oportunidades ou todo o conjunto e alternativas da mesma categoria ou do banco selecionado. A sessão curta intercala categorias, em vez de consumir apenas o primeiro bloco. Seleção e ordenação usam semente registrada e permitem reconstituir o que foi apresentado. A posição-alvo é balanceada em conjuntos comparáveis; não fica sistematicamente na primeira opção.

Cada figura pode ser retirada após inspeção. Pares são incluídos/excluídos juntos. Se uma comparação ficar sem alternativa compatível, o início é bloqueado; uma tela de escolha não pode conter somente a resposta correta.

A tela infantil usa diálogo modal nativo, em primeiro plano, com o restante da interface inerte. Não apresenta nomes, gabaritos, pontuação, comemoração de acerto, áudio de nomeação ou contagem regressiva. O toque só deixa uma borda neutra, sem revelar se a resposta corresponde. Figuras não desaparecem depois da resposta. Interrupção por ocultação da janela e falhas de imagem são registradas, sem inventar desempenho.

## Conceitos e opostos

Grande/pequeno, comprido/curto, cheio/vazio, aberto/fechado, em cima/embaixo, dentro/fora, muitos/poucos e alto/baixo usam elementos geométricos controlados e o mesmo referencial.

Quente/frio e mais pesado/mais leve são opcionais e contextualizados. O adulto precisa reconhecer os limites antes de incluí-los e recebe o contexto a ler. Para massa, as duas caixas têm o mesmo tamanho, mas conteúdos declarados distintos. O resultado descreve inferência semântica dependente de repertório; não mede massa, força, temperatura ou sensibilidade. Pode ser necessário observar objetos reais seguros. Nunca apresentar líquidos quentes à criança.

## Registro e histórico

Situações separadas: resposta correspondente, diferente, ausência de resposta, recusa, não aplicado, figura ambígua e problema técnico. Há campos para resposta literal, via comunicativa, familiaridade, ajuda e interferentes. Recusa, ambiguidade, problema técnico e não aplicação exigem motivo. Uma imagem não apresentada não pode produzir acerto/erro ou “não respondeu”. Falha de imagem bloqueia interpretação de desempenho naquele registro.

Quando a via declarada é toque, a classificação precisa coincidir com o último toque registrado. Respostas observadas por outra via devem ser declaradas como tal. Isso não substitui o julgamento do examinador nem detecta falsidade de um relato manual.

Correções são append-only: preservam registro anterior, novo registro, vínculo de substituição e justificativa. Uma oportunidade não pode ser registrada duas vezes como se fossem duas aplicações. A revisão de um registro anterior não mistura respostas com o rascunho da oportunidade corrente.

O relatório informa cobertura real, pergunta, contexto, ordem de alternativas, resposta, ajuda, familiaridade e limitações. Contagens são descritivas, separadas por modalidade, sem classificação diagnóstica. JSON inclui a semente, configuração, plano, hashes e histórico integral. Texto, cópia e impressão ficam disponíveis para revisão e transferência manual ao sistema institucional.

## Persistência e operação offline

Não há cadastro, nome, foto, câmera ou gravação de voz infantil neste módulo. Não se escreve no prontuário nem em localStorage/sessionStorage. Os dados da aplicação ficam em memória. Há aviso de saída e confirmação de nova sessão; encerramento forçado do navegador ou do sistema operacional ainda pode perder dados. Exportar os registros necessários antes de encerrar é responsabilidade operacional do aplicador.

Antes de iniciar, cada símbolo selecionado é carregado do próprio aplicativo, conferido por SHA-256 e decodificado. Durante a sessão, as figuras usam URLs de blobs em memória e não dependem de servidores externos. Isso permite continuar a sessão se a rede cair, mas não promete abertura a frio offline após fechar o navegador. O carregamento exige contexto seguro HTTPS/localhost.

## Origem e direitos

Fonte: Mulberry Symbols, repositório https://github.com/mulberrysymbols/mulberry-symbols, revisão `9cbab9f400c5de44e2bc58839cca07294aadb086`. O LICENSE.txt dessa revisão estabelece © 2018–2026 Steve Lee, Creative Commons Attribution-Share Alike 4.0: https://creativecommons.org/licenses/by-sa/4.0/.

Cada figura mantém caminho de origem, SHA do blob original, SHA-256 da representação local, autor e licença em `client/public/recognition-v2/manifest.json`. Foram removidos metadados, títulos/descrições XML e inscrições textuais, como AMBULANCE, para não revelar a resposta. As demais formas são preservadas. As versões adaptadas seguem CC BY-SA 4.0; o crédito e a licença estão acessíveis na interface e no relatório. O código da aplicação não é uma adaptação gráfica das ilustrações e permanece separado. Cores e pares geométricos são implementação autoral do NeuroPed.

O script de manutenção `scripts/vendor-visual-recognition.mjs` só baixa dados da revisão fixa e confere integridade; não executa código remoto. Build e aplicação usam arquivos já incorporados ao repositório. Não há busca dinâmica de imagens, CDN ou fallback para texto/emoji na aplicação.

## Referências de interação e desenvolvimento

- Tactus Therapy Naming: https://tactustherapy.com/app/naming/ — organização por categorias e registro explícito de ajuda. O produto é voltado a afasia; sua evidência não foi transferida para este banco pediátrico.
- Tactus Therapy Comprehension: https://tactustherapy.com/app/comprehension/ — ajuste de alternativas e controle de progressão. Não se copiaram itens ou normas.
- Bitsboard: https://www.bitsboard.com/ — organização de conjuntos visuais; referência educacional, não normativa.
- Speak Out Kids: https://speakoutkids.com/ — relevância de vocabulário familiar; referência de experiência, sem integração de contas ou dados.
- CDC 30 meses: https://www.cdc.gov/act-early/milestones/30-months.html — reconhecimento receptivo de pelo menos uma cor e nomeação de figuras como marcos gerais.
- CDC 4 anos: https://www.cdc.gov/act-early/milestones/4-years.html — nomeação de algumas cores. Checklists de marcos não validam este instrumento nem substituem rastreio padronizado.

A pesquisa utilizou material público. Não foram contratados serviços, feitas compras ou abertas assinaturas em nome do usuário.

## Verificação e liberação

Comandos específicos: `node --import tsx --test tests/unit/visual-recognition.test.ts`; `npm run check`; `npm run lint`; `npm run audit:navigation`; `node --import tsx tests/unit/route-guard-policy.test.ts`; `npm run build:client`; `node tests/e2e/visual-recognition.mjs`. A suíte geral `npm run verify:release` continua obrigatória e não foi enfraquecida.

O workflow `Visual recognition contracts and tablet proof` exercita a aplicação real com API/credenciais sintéticas do harness existente. Verifica idades, manifestações locais, modal sem pistas, tablet/celular, pareamento persistente, sessão sem rede, toque, não aplicação, correção e exportação. Prova técnica não equivale a estudo psicométrico ou piloto com crianças.

A inspeção visual das imagens e os resultados finais da CI precisam estar documentados na PR antes do merge. O banco ainda necessita avaliação empírica de reconhecibilidade/familiaridade com crianças brasileiras e revisão humana do profissional antes de cada aplicação. Não afirmar validação já realizada.

## Reconciliação e rollback

Preserva o SHA baseline e as alterações de OBS-10 existentes; só acrescenta a feature visual, ativos próprios, navegação e testes. Não altera API, D1, schema, autenticação ou o contrato dos protocolos adjacentes. Nenhuma migração de dados é necessária.

Rollback: reverter o commit de merge da PR em nova PR, executar os gates e publicar o SHA revertido pelo fluxo canônico Cloudflare. Isso restaura a página informativa anterior; registros já exportados permanecem com o usuário. Não usar force-push, apagar histórico ou alterar proteções. Uma publicação só é confirmada com sucesso do workflow canônico e sentinela do SHA servido, não apenas com merge ou build verde.

## Refinamentos após inspeção visual de todos os estímulos

A ilustração de frango preparado foi rejeitada no pré-release e substituída por um galo vivo, com nome correto e origem EN/cockerel.svg. Prato e garrafa foram recortados para remover figuras secundárias (talheres/prato menor e uma vaca). Nenhum item preparado como alimento é apresentado como ave viva. O manifesto registra recorte e novo hash; a licença CC BY-SA 4.0 é preservada. Esses controles são inspeção técnica/visual, não estudo de reconhecibilidade com crianças.
