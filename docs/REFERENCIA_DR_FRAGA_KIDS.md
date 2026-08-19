# Referência visual — Dr. Jadson Fraga / Brincando e Aprendendo

Fonte analisada: https://drfragakids-76wjcfng.manus.space

## Conteúdo observado

Título principal: “Toda mente é um superpoder esperando ser treinado!”.

Texto de apoio: “Entre no parque de treinos do Dr. Jadson Fraga: jogos de lógica, memória, letras, números, ciência e caça aos erros para heróis de todas as idades!”.

Chamada principal: “Começar a missão! 🚀”, apontando para a faixa de 3 a 5 anos.

Bloco de faixas etárias:

| Faixa | Título | Descrição | Rota de referência |
|---|---|---|---|
| 3 a 5 anos | Descobrindo o mundo! | Letras, números, formas e cores. | `/faixa/3-5` |
| 6 a 8 anos | Exploradores em ação! | Leitura, contas e mistérios. | `/faixa/6-8` |
| 9 a 12 anos | Super-heróis da mente! | Desafios de lógica de verdade. | `/faixa/9-12` |

Bloco “As 5 arenas de treino!” com a frase “Todo super-herói precisa treinar tudo um pouco” e as categorias:

| Categoria | Descrição |
|---|---|
| Cérebro de Herói | Raciocínio lógico e padrões |
| Olhos de Águia | Atenção, memória e detalhes |
| Escolinha Divertida | Letras, números e formas |
| Mundo Incrível | Animais, natureza e corpo humano |
| Caça aos 7 Erros | Encontre as 7 diferenças |

Rodapé: “Dr. Jadson Fraga · Neuropediatra · Brincando e Aprendendo 🧠✨”.

## Identidade visual observada

A direção visual é infantil, lúdica e educativa, com fundo creme muito claro, moldura pontilhada vermelha, céu ilustrado, nuvens, colinas suaves e elementos decorativos coloridos espalhados pelo hero. O logotipo aparece no canto superior esquerdo e o mascote do médico, em estilo super-herói com jaleco azul, aparece à direita do hero.

A tipografia é arredondada e pesada em títulos, usando azul-marinho como cor principal e vermelho/coral para destacar palavras-chave. Os cartões de faixa têm fundo claro, bordas azul-marinho grossas, cantos muito arredondados e sombra deslocada, com ícones circulares de broto, foguete e raio. A chamada principal é um botão verde com borda escura, sombra inferior e comportamento de ação destacado.

## Assets observados

As imagens referenciadas pelo site são:

- `/manus-storage/logo_heroi_bb04d936.png`
- `/manus-storage/mascote_final_ab7a790d.png`
- `/manus-storage/categ_intelectual_d4536c57.png`
- `/manus-storage/categ_atencional_4270582e.png`
- `/manus-storage/categ_pedagogico_998502e1.png`
- `/manus-storage/categ_gerais_671f7032.png`
- `/manus-storage/categ_erros_74e34315.png`

A nova aba deve usar esses assets por URL de storage ou cópias hospedadas no storage do projeto, sem adicionar arquivos grandes ao diretório público do app.

## Estrutura proposta para a aba

A aba será apresentada dentro do layout do NeuroPed, com uma entrada de navegação própria. O conteúdo interno manterá a experiência do site de referência: hero com logotipo, mascote e CTA; seleção de faixa etária em três cartões; arenas de treino em cinco cartões ilustrados; e rodapé institucional. As rotas de faixa etária podem apontar inicialmente para âncoras ou estados internos da nova aba, preservando uma saída clara para retornar ao app.

## Páginas internas observadas

### Faixa de 3 a 5 anos

Cabeçalho: “Fase de herói: 🌱 3 a 5 anos”, título “Escolha sua missão de hoje!” e subtítulo “Descobrindo o mundo! Letras, números, formas e cores.”. Há um botão de retorno “🏠 Início”.

As missões são:

| Arena | Ação | Rota de referência |
|---|---|---|
| Cérebro de Herói | Treinar | `/atividade/intelectual/3-5` |
| Olhos de Águia | Jogo da memória | `/atividade/atencional/3-5` |
| Olhos de Águia | Encontre o diferente | `/atividade/detetive/3-5` |
| Escolinha Divertida | Aprender | `/atividade/pedagogico/3-5` |
| Mundo Incrível | Explorar | `/atividade/gerais/3-5` |
| Caça aos 7 Erros | O quarto do herói (Fácil) | `/atividade/erros/3-5/quarto` |
| Caça aos 7 Erros | Diversão no parque (Fácil) | `/atividade/erros/3-5/parque` |

Mensagem final: “Você escolheu muito bem! Que comece o treino, herói!” — Dr. Jadson.

### Faixa de 6 a 8 anos

Cabeçalho: “Fase de herói: 🚀 6 a 8 anos”, título “Escolha sua missão de hoje!” e subtítulo “Exploradores em ação! Leitura, contas e mistérios.”. A composição visual é a mesma, com fundo azul-claro, mascote no lado esquerdo, moldura inferior azul-marinho, cartões arredondados e botões coloridos.

As missões são:

| Arena | Ação | Rota de referência |
|---|---|---|
| Cérebro de Herói | Treinar | `/atividade/intelectual/6-8` |
| Olhos de Águia | Jogo da memória | `/atividade/atencional/6-8` |
| Olhos de Águia | Encontre o diferente | `/atividade/detetive/6-8` |
| Escolinha Divertida | Aprender | `/atividade/pedagogico/6-8` |
| Mundo Incrível | Explorar | `/atividade/gerais/6-8` |
| Caça aos 7 Erros | A sala de aula (Médio) | `/atividade/erros/6-8/escola` |
| Caça aos 7 Erros | Dia de praia (Médio) | `/atividade/erros/6-8/praia` |

Mensagem final: “Você escolheu muito bem! Que comece o treino, herói!” — Dr. Jadson.

## Faixa de 9 a 12 anos e atividades

### Faixa de 9 a 12 anos

Cabeçalho: “Fase de herói: ⚡ 9 a 12 anos”, título “Escolha sua missão de hoje!” e subtítulo “Super-heróis da mente! Desafios de lógica de verdade.”. O layout é o mesmo das faixas anteriores, com hero, mascote, cartões em grid, bordas azul-marinho e botões de ação.

As missões de caça aos erros mudam para:

| Arena | Ação | Rota de referência |
|---|---|---|
| Cérebro de Herói | Treinar | `/atividade/intelectual/9-12` |
| Olhos de Águia | Jogo da memória | `/atividade/atencional/9-12` |
| Olhos de Águia | Encontre o diferente | `/atividade/detetive/9-12` |
| Escolinha Divertida | Aprender | `/atividade/pedagogico/9-12` |
| Mundo Incrível | Explorar | `/atividade/gerais/9-12` |
| Caça aos 7 Erros | Base espacial (Difícil) | `/atividade/erros/9-12/foguete` |
| Caça aos 7 Erros | Aventura na floresta (Difícil) | `/atividade/erros/9-12/floresta` |

### Atividade observada

A rota `/atividade/intelectual/3-5` é uma atividade funcional, não apenas uma página estática. Ela apresenta uma barra superior com saída e contexto de faixa/arena, título “Cérebro de Herói”, subtítulo “Raciocínio lógico e padrões”, progresso “Pergunta 1 de 5”, estrelas de progresso, mascote e uma pergunta com três opções visuais. O exemplo observado pergunta “Qual destes voa?” com as opções peixe, borboleta e tartaruga. A estética usa fundo creme, amarelo de acento, azul-marinho, cartão central com moldura grossa e botões grandes para toque.

Para a primeira entrega dentro do NeuroPed, a aba deve reproduzir integralmente a landing page e as três telas de missão com navegação entre as arenas e os estados de seleção. As atividades podem permanecer como módulos internos da nova aba, com uma implementação inicial jogável e sem qualquer escrita clínica ou vínculo automático a prontuário.
