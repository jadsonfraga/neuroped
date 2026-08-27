# Auditoria neutra — Avaliação Cognitiva Infantil

> **Escopo:** este documento audita a ferramenta pedagógica do NeuroPed. Ele não diagnostica nenhuma criança e não substitui avaliação psicopedagógica, neuropsicológica, fonoaudiológica ou médica. Uma criança pode ter um desempenho baixo por escolarização, idioma, acesso, atenção, fadiga, visão, audição, ansiedade, instrução ou formato — não se deve converter o escore desta tela em diagnóstico.

## 1. Diagnóstico executivo da ferramenta

A implementação atual é um **protótipo funcional de triagem pedagógica de habilidades acadêmicas**, não uma avaliação cognitiva abrangente nem um instrumento normatizado. Ela já tem méritos importantes: seleciona conteúdo por idade, separa quatro áreas compreensíveis, alterna as posições das alternativas, registra respostas item a item, diferencia itens objetivos de observação de pré-escrita e apresenta uma advertência de uso educativo.

O problema central não é a existência dos itens; é a distância entre a promessa e o que a tela realmente consegue sustentar. O título “Avaliação Cognitiva Infantil” e a ideia de “perfil por domínio” sugerem uma inferência ampla sobre cognição, enquanto o conteúdo mede principalmente amostras curtas de **reconhecimento visual, leitura, escrita/ortografia e aritmética escolar**. Faltam medidas independentes de linguagem oral, memória de trabalho, atenção, funções executivas, velocidade de processamento, raciocínio não verbal, habilidades visuomotoras e funcionamento adaptativo. Portanto, a ferramenta deve ser apresentada como **triagem pedagógica de conhecimentos acadêmicos gerais por faixa etária e escolarização**.

A BNCC descreve aprendizagens como progressivas e organizadas por etapas, habilidades, objetos de conhecimento e contextos escolares, não como um único escore por idade [1] [2]. A própria referência oficial de marcos do CDC separa desenvolvimento de aprendizagem e informa que seus checklists não substituem instrumentos de triagem padronizados e validados [3]. Isso reforça a decisão de trocar “diagnóstico” por **mapa de habilidades observadas, emergentes e ainda não informadas**.

## 2. O que a implementação faz hoje

| Faixa | Seleção atual | Cobertura efetiva | Leitura neutra |
|---|---|---|---|
| 2–3 anos | Banco A, quatro itens por domínio | 16 respostas; escrita é observação | A observação de pré-escrita é pertinente, mas parte de leitura e aritmética exige habilidades escolares que podem não estar consolidadas nessa idade. |
| 4–5 anos | Banco B, quatro itens por domínio | 16 respostas; escrita é observação | Há bons itens de consciência fonológica e contagem, mas “leitura” e “escrita” misturam exposição escolar com capacidade cognitiva. |
| 6–13 anos | Banco específico por idade, quatro itens em cada um dos quatro domínios | 16 questões de múltipla escolha | Existe progressão aparente, porém quatro itens por área são insuficientes para sustentar um nível de habilidade; não há calibração por ano escolar. |
| 14–15 anos | Banco F por faixa | 16 questões | O banco é mais genérico e pode não representar a etapa escolar, trajetória, idioma ou conteúdo efetivamente ensinado. |
| 16–19 anos | Banco G por faixa | 16 questões | Os itens têm maior abstração, mas continuam sendo uma amostra curta e heterogênea de conhecimentos, não uma avaliação cognitiva de adolescentes. |

A fonte contém bancos graduados para as idades de 6 a 13 e bancos por faixa para as demais idades. O fluxo sempre apresenta quatro domínios, mas a pessoa precisa iniciar cada módulo manualmente. Assim, o tempo real depende de cliques, leitura do adulto e eventual ajuda, e não existe ainda uma política clara para “não sabe”, “não respondeu”, dificuldade de leitura, idioma, deficiência sensorial ou baixa familiaridade escolar.

## 3. Pontos fortes que devem ser preservados

A adaptação etária, a separação entre reconhecimento visual, leitura, escrita e aritmética, a observação para pré-escrita e a confirmação explícita de uso educativo são boas bases. Também é positivo que a posição das alternativas seja embaralhada e que as respostas sejam registradas sem expor um diagnóstico automático. O índice por domínio e o estado de módulo concluído formam uma boa estrutura para uma pré-consulta curta.

## 4. Problemas que impedem uma avaliação razoável hoje

| Prioridade | Problema | Impacto | Decisão recomendada |
|---|---|---|---|
| P0 | O rótulo cognitivo é mais amplo que os construtos medidos | Pode induzir interpretação clínica indevida | Renomear a experiência como triagem pedagógica/academic screening e explicitar limites no resultado. |
| P0 | Não há contexto de escolarização, ano/série, idioma, oportunidade de aprendizagem ou informante | Um erro pode refletir contexto e não habilidade | Coletar contexto mínimo antes da bateria e separar “não informado” de “incorreto”. |
| P0 | Escores de 0–4 por domínio não são normativos | Não permitem dizer normal, atraso, percentil ou diagnóstico | Usar descritores qualitativos e uma faixa de confiança/necessidade de aprofundamento, sem corte diagnóstico. |
| P1 | Quatro itens por domínio são poucos | Alta instabilidade: um erro altera 25% da área | Usar itens-âncora, follow-up adaptativo e marcar o resultado como amostra curta. |
| P1 | O formulário é sequencial e não orienta claramente os próximos passos | A pré-consulta pode estourar 15 minutos | Cronometrar a sessão, mostrar progresso global e autoavançar para o próximo domínio. |
| P1 | Múltipla escolha mistura leitura, linguagem, visão e conhecimento escolar | Pode medir o formato da questão em vez do construto | Classificar cada item por habilidade-alvo e oferecer “não sabe/não respondeu” sem penalizar como erro interpretativo. |
| P1 | Não há bloco de observação para 6–19 nem medida de processo | Perde estratégias, tempo, autocorreção e necessidade de ajuda | Registrar pistas, autonomia, tempo aproximado e observações do adulto/profissional. |
| P2 | O relatório aparece depois de apenas um domínio concluído | Um resultado parcial pode parecer bateria completa | Separar claramente resumo parcial de bateria concluída e bloquear salvamento como avaliação completa. |
| P2 | O conteúdo não é uma representação completa da BNCC | “Conhecimento geral escolar” fica reduzido a quatro áreas | Mapear cada item a descritor pedagógico local e deixar explícito que é uma amostra, não cobertura curricular. |

Há ainda problemas de conteúdo que precisam de revisão pedagógica por especialista: algumas tarefas de leitura para 2–3 anos pressupõem direção de leitura, letra maiúscula e uso de escrita convencional; isso não é um bom teste de conhecimento geral dessa faixa. Para crianças pequenas, o eixo deve ser linguagem oral emergente, atenção compartilhada, compreensão de instruções, reconhecimento funcional, noções de quantidade e observação de desenho/pré-escrita — sempre com resposta mediada e sem transformar não escolarização em déficit.

## 5. Plano realista de pré-consulta — teto de 15 minutos

O objetivo deve ser **chegar à consulta com um mapa inicial**, não concluir um diagnóstico. A bateria precisa ser curta, interrompível e interpretável mesmo quando incompleta.

| Janela | Ação | Saída |
|---|---|---|
| 0:00–1:30 | Contexto mínimo: idade, ano/série ou “não frequenta”, idioma principal, quem respondeu e se houve ajuda | Permite interpretar oportunidade de aprendizagem e contexto. |
| 1:30–2:30 | Instrução simples e um item de prática por formato | Confirma compreensão do formato antes de contar desempenho. |
| 2:30–10:30 | Oito a doze itens curtos, distribuídos entre visual/raciocínio, linguagem/leitura, escrita emergente ou convencional e matemática | Amostra equilibrada com progresso global visível. |
| 10:30–13:00 | Até dois itens de aprofundamento escolhidos pelas respostas ou pela idade/série | Aumenta informação onde há sinal de habilidade emergente, sem transformar em prova longa. |
| 13:00–14:30 | Observação estruturada: autonomia, necessidade de repetição, estratégia, tempo, frustração e autocorreção | Contextualiza o acerto/erro. |
| 14:30–15:00 | Resumo seguro e preparação da consulta | Mostra forças, habilidades emergentes, lacunas de informação e perguntas para o profissional. |

Para 2–5 anos, o formato deve privilegiar interação do adulto com a criança, apontar, nomear, combinar, contar pequenas quantidades, compreender instruções e observar traços/desenho. Para 6–10 anos, deve priorizar leitura funcional, compreensão curta, escrita/ortografia inicial, número/operação e raciocínio visual. Para 11–19 anos, deve incluir compreensão de texto, produção/revisão de linguagem, proporcionalidade/álgebra inicial e raciocínio, sempre calibrado por ano escolar e exposição curricular.

## 6. Resultado que a tela deve entregar

O relatório recomendado é qualitativo e contextualizado:

> **Amostra pedagógica curta — não diagnóstica.** A criança respondeu a X de Y itens, com melhor desempenho observado em [áreas]. Em [áreas], há sinais de habilidade emergente ou a informação é insuficiente. O resultado pode ser influenciado por escolarização, idioma, atenção, fadiga, visão, audição, ajuda e familiaridade com o formato. Levar estas observações para a consulta; não interpretar como quociente intelectual, atraso ou diagnóstico.

O relatório deve separar quatro estados: **observado com autonomia**, **observado com ajuda**, **emergente/instável** e **não informado**. “Não respondeu” não deve ser convertido automaticamente em erro. A consulta deve receber também o contexto, o tempo total, o número de módulos concluídos e observações de processo.

## 7. Roadmap de implementação

**Lote 1 — segurança interpretativa e tempo:** renomear a promessa da tela, coletar contexto mínimo, mostrar relógio/progresso de 15 minutos, separar bateria parcial de completa, adicionar “não sabe/não respondeu” e impedir que um domínio parcial seja apresentado como conclusão global.

**Lote 2 — conteúdo por etapa:** substituir itens inadequados de 2–3 anos por tarefas de desenvolvimento/aprendizagem emergente, calibrar 4–5 e 6–10 por etapa escolar, e revisar 11–19 com consultoria pedagógica. Cada item deverá ter habilidade-alvo, faixa, formato, grau de ajuda e justificativa.

**Lote 3 — adaptatividade:** iniciar com itens-âncora, escolher até dois aprofundamentos por área e encerrar quando já houver informação suficiente ou ao atingir o teto de 15 minutos. O encerramento deve ser honesto e permitir retomar sem perder o contexto.

**Lote 4 — validade:** fazer revisão independente com pedagogo/psicopedagogo, teste cognitivo de compreensão das instruções, piloto por faixa e estudo de concordância. Só depois de dados reais deve-se discutir qualquer corte ou indicador comparativo; até lá, não usar percentis, “normalidade” ou diagnóstico.

## Referências

[1]: https://basenacionalcomum.mec.gov.br/images/BNCC_20dez_site.pdf "Base Nacional Comum Curricular — Ministério da Educação"

[2]: https://basenacionalcomum.mec.gov.br/abase/ "Base Nacional Comum Curricular — Educação é a base"

[3]: https://www.cdc.gov/act-early/milestones/index.html "CDC's Developmental Milestones"

## Validação visual do novo início — mobile

Os prints de início e contexto preenchido mostram boa hierarquia do título, da promessa pedagógica e do aviso de limites. O formulário de três campos cabe em uma coluna sem overflow e o botão fica desabilitado até o contexto mínimo existir. O dock móvel, entretanto, continua ocupando uma faixa sobre o conteúdo e usa um destaque central forte para Nesplora; esse elemento é do shell global e deve ser considerado em uma rodada visual própria, não confundido com problema da avaliação.

O estado preenchido comunica claramente idade, etapa e informante. A primeira dobra ainda é longa por causa do texto de segurança; em uma próxima iteração visual, o aviso pode virar uma seção colapsável após a primeira leitura, mantendo o texto acessível sem empurrar o botão para baixo.

## Validação visual do módulo ativo — mobile

O feedback “Resposta não informada — não será interpretada como erro” ficou claro e o timer mostra 00:00, 15 minutos restantes e encerramento manual. O ponto de atrito visual mais importante é o shell móvel fixo: o cabeçalho e o dock aparecem sobrepostos à jornada longa e podem cobrir a leitura ou as alternativas quando a pessoa rola. Isso não é falha do instrumento, mas pode prejudicar a validade da aplicação remota. A correção recomendada é reservar `scroll-padding-top` e `scroll-padding-bottom` e garantir que o cartão ativo tenha margem segura para não ficar atrás do header/dock.

Outro achado é que as opções ficam muito altas e separadas em tela estreita quando o enunciado quebra linha. O layout preserva toque confortável, mas pode reduzir a sensação de continuidade; um cartão por pergunta com opções em grid compacto para itens textuais e modo 2x2 apenas para emojis tende a ser mais adequado ao teto de 15 minutos.
