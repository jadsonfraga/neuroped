// Descrições Detalhadas com Exemplos de Perguntas para Pais e Professores
// Objetivo: Pais/professores conseguem marcar corretamente baseado em exemplos reais
// Estrutura: Cada descrição inclui "Exemplo: ..." com pergunta específica

export const descricaoComExemplos = {
  // ============ TDAH - SNAP-IV ============
  "snap-iv": {
    titulo: "SNAP-IV — Escala de Desatenção e Hiperatividade",
    descricaoDetalhada: `
Avalia sintomas de desatenção e hiperatividade/impulsividade em crianças de 6-18 anos.
Respondente: Pais (casa) e Professor (escola). Cada item é respondido: 0=Nunca, 1=Às vezes, 2=Frequentemente, 3=Muito frequentemente.

EXEMPLOS DE PERGUNTAS PARA PAIS MARCAR:
1. Desatenção — "Seu filho deixa tarefas de casa incompletas?"
   - Nunca (não acontece)
   - Às vezes (talvez 1-2 vezes por semana)
   - Frequentemente (3-4 vezes por semana)
   - Muito frequentemente (quase diariamente)

2. Desorganização — "Seu filho perde materiais necessários para tarefas?"
   - Exemplo: Esquece o uniforme da escola, perde a mochila, não encontra a lição de casa

3. Hiperatividade — "Seu filho está sempre em movimento, não consegue ficar parado?"
   - Exemplo: Pula da cadeira durante refeições, corre sem motivo em casa, mexe constantemente em objetos

4. Impulsividade — "Seu filho bloqueia frequentemente durante conversas?"
   - Exemplo: Interrompe outras pessoas, não espera a vez de falar, responde antes da pergunta acabar

EXEMPLOS DE PERGUNTAS PARA PROFESSOR MARCAR (CONTEXTO ESCOLAR):
- "O aluno desorganiza sua carteira/mesa?"
- "O aluno sai do lugar sem permissão durante a aula?"
- "O aluno tem dificuldade em esperar sua vez?"
- "O aluno presta atenção ao que é dito em aula?"
    `,
    respondentes: ["pais", "professor"],
    exemploContexto: "Casa: Não consegue fazer lição sem avisos. Escola: Sai da cadeira frequentemente, distrai colegas.",
  },

  // ============ ANSIEDADE - SCARED ============
  "scared": {
    titulo: "SCARED — Escala de Ansiedade Infantil",
    descricaoDetalhada: `
Avalia sintomas de ansiedade generalizada, fobia social, pânico e agorafobia em crianças/adolescentes 8-18 anos.
41 perguntas respondidas: 0=Não, 1=Um pouco, 2=Muito.

EXEMPLOS PARA PAIS MARCAR PREOCUPAÇÃO EXCESSIVA:
1. Preocupação com Separação — "Seu filho sente medo quando você sai de perto?"
   - Exemplo: Chora ao sair para trabalho, liga várias vezes no telefone, dificuldade de dormir sem pais

2. Preocupação Generalizada — "Seu filho se preocupa muito com coisas ruins acontecerem?"
   - Exemplo: Medo de acidentes, sequestro, doenças, morte de familiares mesmo sem motivo

3. Fobia Social — "Seu filho fica nervoso ao falar com pessoas desconhecidas?"
   - Exemplo: Não quer fazer apresentação na escola, evita ir em festas, não participa em aula

4. Ansiedade Somática — "Seu filho sente dor de barriga ou náusea quando ansioso?"
   - Exemplo: Dor de cabeça antes de prova, dor na barriga antes de evento social, tremores

EXEMPLOS PARA AUTOAPLICÁVEL (8-18 ANOS):
- "Eu me preocupo com coisas ruins que possam me acontecer?"
- "Eu fico nervoso quando longe de meus pais?"
- "Eu tenho dificuldade em dormir porque estou preocupado?"

CONTEXTO ESCOLAR (PROFESSOR PODE OBSERVAR):
- Aluno evita participação na aula
- Recusa fazer trabalhos em grupo
- Solicita frequentemente ir ao banheiro (evitação)
- Tremor nas mãos ao ler em voz alta
    `,
    respondentes: ["autoaplicavel", "pais"],
    exemploContexto: "Medo de apresentação escolar, recusa ir a escola no dia de prova, preocupação com notas",
  },

  // ============ COMPORTAMENTO - ECBI ============
  "ecbi": {
    titulo: "ECBI — Escala de Comportamento Infantil Eyberg",
    descricaoDetalhada: `
Avalia comportamento disruptivo em casa (36 itens). Respondente: Pais de crianças 2-12 anos.
Escala: 1-7 (Nunca a Sempre) e Se ocorre (Sim/Não).

EXEMPLOS PARA PAIS MARCAR COMPORTAMENTO EM CASA:
1. Agressão — "Seu filho bate, chuta ou agride fisicamente?"
   - Exemplo: Bate nos pais quando contrariado, agride irmão durante brincadeira, chutas em parede

2. Desafio/Oposição — "Seu filho desobedece suas ordens?"
   - Exemplo: Recusa fazer lição, não quer ir dormir, ignora quando chama, faz o oposto do pedido

3. Temperamento/Birra — "Seu filho chora ou faz birra?"
   - Exemplo: Grita quando não consegue o que quer, chora por tudo, enraivecido facilmente, birra longa

4. Comportamento Destrutivo — "Seu filho quebra ou danifica coisas intencionalmente?"
   - Exemplo: Quebra brinquedo, rasga livro, joga coisas no chão, escreve na parede

ESCALA DE INTENSIDADE PARA CADA COMPORTAMENTO:
1 = Nunca ocorre (comportamento típico da idade)
3 = Às vezes (1-2 vezes por semana)
5 = Frequentemente (3-4 vezes por semana)
7 = Sempre (diariamente)

FREQUÊNCIA: Depois de indicar a intensidade, marcar SIM se o comportamento é problema em casa.

PADRÃO ESPERADO:
- Comportamento típico 2-4 anos: birra, desafio (normal)
- Comportamento atípico 6+ anos: agressão física frequente, desobediência extrema (preocupante)
    `,
    respondentes: ["pais"],
    exemploContexto: "Criança de 5 anos: birra frequente com choro (normal); agressão física contra irmão (problema)",
  },

  // ============ DESENVOLVIMENTO - BAYLEY-III ============
  "bayley": {
    titulo: "Bayley-III — Avaliação do Desenvolvimento Infantil",
    descricaoDetalhada: `
Padrão-ouro para avaliação de desenvolvimento em lactentes/toddlers (1-42 meses).
Clínico avalia: Cognitivo, Linguagem (receptiva/expressiva), Motor (fino/grosso).
Resultado: Score composto (média 100±15). <70 = atraso significativo, 85-115 = normal.

O QUE OS PAIS OBSERVAM EM CADA DOMÍNIO:

COGNITIVO (Como a criança aprende e pensa):
- 6 meses: Segura objetos, leva à boca, bate em brinquedos?
- 12 meses: Aponta para objetos, imitação simples, procura objeto escondido?
- 18 meses: Empilha 2-3 blocos, aponta figuras em livro?
- 24 meses: Identifica cores simples, segue instruções de 2 passos?

LINGUAGEM RECEPTIVA (Compreensão):
- 6 meses: Vira para sons, responde ao nome?
- 12 meses: Entende "não", segue comando simples como "tchau"?
- 18 meses: Aponta partes do corpo quando pergunta?
- 24 meses: Segue instruções de 2-3 passos ("Pegue a boneca e sente")?

LINGUAGEM EXPRESSIVA (Fala):
- 6 meses: Balbucio com sons duplicados ("ba-ba", "da-da")?
- 12 meses: Primeira palavra com significado ("mamã", "papá")?
- 18 meses: 10-20 palavras isoladas?
- 24 meses: 2+ palavra juntas ("mamã água")?

MOTOR FINO (Mãos/dedos):
- 3 meses: Segura objeto por segundos?
- 6 meses: Pega objetos com toda mão (palmar)?
- 12 meses: Pinça com polegar+índice (pinça superior)?
- 18 meses: Scribble espontâneo?
- 24 meses: Vira páginas de livro?

MOTOR GROSSO (Corpo/postura):
- 2 meses: Levanta cabeça prono?
- 4 meses: Rola ventral-dorsal?
- 6 meses: Senta com apoio?
- 9 meses: Senta sem apoio?
- 12 meses: De pé com apoio, alguns passos?
- 18 meses: Anda sem apoio, sobe escada?
- 24 meses: Corre, sobe/desce móvel?

SINAIS DE PREOCUPAÇÃO para pedir avaliação formal:
- 6 meses: Não segura objetos, não responde a sons
- 12 meses: Sem balbucio, não senta
- 18 meses: Menos de 10 palavras, não anda
- 24 meses: Menos de 50 palavras, não segue comandos simples, atraso motor
    `,
    respondentes: ["clinico"],
    exemploContexto: "Criança 18 meses: 15 palavras, caminha bem, enxerga bem = desenvolvimento típico. Se apenas 5 palavras = atraso linguagem",
  },

  // ============ AUTISMO - M-CHAT-R/F ============
  "mchat": {
    titulo: "M-CHAT-R/F — Triagem de Autismo para Lactentes",
    descricaoDetalhada: `
20 perguntas para triagem de TEA em crianças 16-30 meses. Respondente: Pais.
Objetivo: Identificar crianças que precisam avaliação diagnóstica (ADOS-2).

PERGUNTAS MAIS IMPORTANTES (Exemplos para pais):

COMPORTAMENTO SOCIAL:
1. "Seu filho pede para você olhar para algo apontando?"
   - Exemplo: Aponta para avião no céu, diz "Olha!" ou aponta mostrando interesse

2. "Seu filho imita você?" (Simples: imitação de som, gesto)
   - Exemplo: Bate palmas quando você bate, faz som de carro, imita seu gesto

3. "Seu filho consegue brincar com brinquedo fazendo fingimento?"
   - Exemplo: Finge alimentar boneca com colher, brinca com telefone de brinquedo, simula pôr sapato

COMUNICAÇÃO:
4. "Seu filho compreende quando você diz 'não'?"
   - Exemplo: Para quando diz não, olha para seu rosto quando chama

5. "Seu filho consegue apontar para partes do corpo quando você pergunta?"
   - Exemplo: "Onde está o nariz? Olhos? Boca?"

6. "Seu filho balbucia com som de palavras (ex: 'ba ba', 'pa pa')?"
   - Exemplo: Faz sons que parecem palavras, balbucio contínuo com variação

COMPORTAMENTO:
7. "Seu filho consegue manter contato visual com você?"
   - Exemplo: Olha para seu rosto durante interação, mantém olhar quando fala

8. "Seu filho faz movimento repetitivo ou comportamento inusitado?"
   - Exemplo: Alinha brinquedos, girar os dedos, especie movimentos (flapping), interesse intenso em objetos

INTERPRETAÇÃO DO RESULTADO:
Escore 0-2: Desenvolvimento típico (risco baixo)
Escore 3+: Risco aumentado (precisar ADOS-2 diagnóstica)

SEGUIMENTO RECOMENDADO:
- Risco baixo: Monitorar, reavalie em 6 meses
- Risco aumentado: Referir para ADOS-2 com urgência
    `,
    respondentes: ["pais"],
    exemploContexto: "Criança 20 meses: aponta, imita, brinca de faz-de-conta = risco baixo. Se não faz contato visual, não imita, alinha objetos = risco alto (ADOS)",
  },

  // ============ SONO - CSHQ (existente) ============
  "cshq": {
    titulo: "CSHQ — Questionário de Hábitos de Sono Infantil",
    descricaoDetalhada: `
33 perguntas sobre hábitos e problemas de sono. Respondente: Pais. Crianças 4-10 anos.
Escala: Raramente (1), Às vezes (2), Frequentemente (3).

ÁREAS AVALIADAS:

INSÔNIA (Dificuldade para adormecer/manter sono):
- "Seu filho tem dificuldade em adormecer?"
  Exemplos: Leva >30 min para dormir, acorda frequentemente, não consegue voltar a dormir

- "Seu filho resiste a ir para a cama?"
  Exemplos: Nega irrevogavelmente, faz birra, traz desculpas constantes

APNEIA (Ronco/pausas respiratórias):
- "Seu filho ronca durante o sono?"
- "Seu filho faz pausas ao respirar durante o sono?" (preocupante)

SONOLÊNCIA (Cansaço excessivo):
- "Seu filho sente dificuldade em acordar pela manhã?"
- "Seu filho fica sonicioso durante o dia, dorme em aula?"

PARASONIAS (Comportamentos anormais durante sono):
- "Seu filho fala durante o sono?" (normal)
- "Seu filho anda durante o sono?" (preocupante)
- "Seu filho chora ou grita à noite?" (terror noturno)

PROBLEMAS COMPORTAMENTAIS ASSOCIADOS:
- "Seu filho tem dificuldade em separar-se dos pais?"
  Exemplo: Quer dormir com pais, não consegue dormir sozinho

INTERPRETAÇÃO:
- Escore baixo: Sono normal para idade
- Escore alto: Distúrbio de sono significativo
- Ronco frequente + sonolência = Possível apneia do sono → Referir pediatra/ORL

PADRÃO ESPERADO POR IDADE:
- 4-6 anos: Pode ter resistência, pesadelos ocasionais (normal)
- 6-10 anos: Dorme 9-10h, acordar raro (normal)
- Preocupante: Sonolência diurna, ronco frequente, apneia em qualquer idade
    `,
    respondentes: ["pais"],
    exemploContexto: "Criança dorme 9h, acorda raramente, sem ronco = normal. Ronca alto, cansada ao acordar, dorme na aula = possível apneia",
  },

  // ============ LINGUAGEM - CCC-2 ============
  "ccc-2": {
    titulo: "CCC-2 — Questionário de Comunicação Infantil",
    descricaoDetalhada: `
70 itens sobre comunicação pragmática e social. Respondente: Pais. Crianças 4-12 anos.
Objetivo: Identificar dificuldades de comunicação social (importante em TEA, dispraxia de fala).

ÁREAS DE COMUNICAÇÃO:

LINGUAGEM ESTRUTURAL (Gramática, vocabulário):
- "Seu filho usa frases com 4+ palavras?"
- "Seu filho usa verbos no passado (comeu, correu)?"
- Exemplo: Normal: "O menino comeu maçã"; Preocupante: Só palavras isoladas ou 2 palavras

LINGUAGEM PRAGMÁTICA (Uso social da linguagem):
- "Seu filho consegue manter conversa?"
  Exemplo: Você fala algo, ele responde, voltas alternadas (não monólogo)

- "Seu filho fala sobre interesses dos outros?"
  Exemplo: Pergunta sobre o dia de alguém, interessado no que disseram

- "Seu filho adapta seu discurso para diferentes pessoas?"
  Exemplo: Fala diferente com professora vs colegas, entende brincadeira/sarcasmo

LINGUAGEM NARRATIVA (Contar histórias):
- "Seu filho consegue contar o que fez no dia?"
  Exemplo: "Brinquei no parque, corri, comi lanche" (sequência lógica)

COMUNICAÇÃO NÃO-VERBAL:
- "Seu filho faz contato de olhos ao conversar?"
- "Seu filho usa gesto para comunicar?"
  Exemplo: Aponta quando quer algo, acena adeus, levanta mão na escola

- "Seu filho compreende expressões faciais?"
  Exemplo: Reconhece quando alguém está triste/feliz, ajusta comportamento

COMPORTAMENTO SOCIAL:
- "Seu filho brinca com outras crianças de forma recíproca?"
  Exemplo: Faz graça para amigo rir, aguarda resposta, compartilha interesse

- "Seu filho consegue esperar sua vez?"
  Exemplo: Aguarda em fila, não interrompe, espera resposta antes de falar

PADRÃO ESPERADO:
- 4-6 anos: Pragmática desenvolvendo, algumas dificuldades normais
- 8+ anos: Pragmática bem desenvolvida, piadas, troca de perspectiva

SINAIS DE ALERTA PARA REFERÊNCIA (Fono/TEA):
- Falta de contato ocular consistente
- Não adapta discurso (fala igual com todos)
- Monólogo sobre tópico (sem interesse do outro)
- Não entende intenção social (piada, sarcasmo)
- Dificuldade em esperar vez, interrompe frequentemente
    `,
    respondentes: ["pais"],
    exemploContexto: "Normal: Conversa alternada, contato ocular, adapta com professora vs amigos. Preocupante: Só fala de dinossauros (sem interesse do outro), sem contato ocular, não entende brincadeira",
  },

  // ============ ANSIEDADE GENERALIZADA - RCADS ============
  "rcads": {
    titulo: "RCADS — Escala de Ansiedade e Depressão de Crianças",
    descricaoDetalhada: `
47 itens sobre ansiedade (generalizada, separação, pânico, social, fobia) e depressão.
Respondentes: Criança (8+) e Pais (5+).
Escala: Nunca (0), Às vezes (1), Frequentemente (2), Sempre (3).

DOMÍNIOS DE ANSIEDADE:

ANSIEDADE GENERALIZADA:
- "Você se preocupa muito com coisas ruins que podem acontecer?"
- "Você se preocupa em não dormir o suficiente?"
- Exemplo: Medo de acidente, morte de pais, doença (sem motivo real)

TRANSTORNO DE PÂNICO/AGORAFOBIA:
- "Você sente desconforto no peito quando fica nervoso?"
- "Você tem medo de desmaiar quando se sente nervoso?"
- Exemplo: Tontura, tremores, falta de ar (sensações físicas)

FOBIA SOCIAL:
- "Você tem medo de falar em apresentação?"
- "Você fica nervoso conversando com pessoas desconhecidas?"
- Exemplo: Evita fazer apresentação, não participa em aula, não responde perguntas professor

TRANSTORNO DE SEPARAÇÃO:
- "Você sente medo quando se separa de seus pais?"
- "Você fica muito assustado se seus pais saem?"
- Exemplo: Choro ao ir escola, liga constantemente, sleep-over = impossível

FOBIA ESPECÍFICA:
- "Você tem muito medo de [animal/situação específica]?"
- Exemplo: Medo extremo de cão, tempestade, agulha

DEPRESSÃO:
- "Você se sente triste ou infeliz?"
- "Você perde o interesse em coisas que gostava?"
- Exemplo: Apatia, isolamento, anedonia

INTERPRETAÇÃO E REFERÊNCIA:
- Escore baixo (<20): Desenvolvimento típico
- Escore médio (20-40): Sintomas leves-moderados
- Escore alto (>40): Transtorno provável → Referir psiquiatra/psicólogo

PADRÃO POR IDADE:
- 5-7 anos: Alguns medos normais (escuro, animal)
- 8-12 anos: Ansiedade social emergente, fobias específicas
- 13+ anos: Preocupações abstratas, social/generalizada

DIFERENÇA PAIS vs CRIANÇA:
- Pais frequentemente subestimam ansiedade (criança mascara em casa)
- Autorrelato criança é mais confiável (especialmente adolescentes)
    `,
    respondentes: ["autoaplicavel", "pais"],
    exemploContexto: "Adolescente (12a): Autorrelato=40 (ansiedade significativa), Pais=15 (não percebem). Criança mascara em casa, mas recusa ir à escola por medo social",
  },

  // Continuação com mais exemplos...
};

// Template para estruturar outras escalas com exemplos similares
export const templateEscalaComExemplos = {
  id: "exemplo",
  titulo: "ESCALA — Título Completo",
  descricaoDetalhada: `
[Contexto: Número de itens, faixa etária, respondente, tempo]

ÁREAS PRINCIPAIS:
1. [Área 1]
   - Pergunta exemplo
   - Exemplo prático

2. [Área 2]
   - Pergunta exemplo
   - Exemplo prático

INTERPRETAÇÃO DO RESULTADO:
- Escore baixo: ...
- Escore alto: ...

PADRÃO ESPERADO:
- Por idade
- Variações culturais

SINAIS DE REFERÊNCIA:
- Quando encaminhar para especialista
  `,
  respondentes: ["pais", "professor", "autoaplicavel", "clinico"],
  exemploContexto: "Exemplo real de caso com score resultado",
};

// Esta estrutura será usada para aprimorar TODAS as escalas do app
// com descrições detalhadas, exemplos de perguntas reais, e
// interpretação que ajude pais e professores a entender e marcar corretamente
