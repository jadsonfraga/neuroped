// Descrições Detalhadas com Exemplos de Perguntas para Pais e Professores
// Objetivo: Pais/professores conseguem marcar corretamente baseado em exemplos reais
// Estrutura: Cada descrição inclui "Exemplo: ..." com pergunta específica
// Só instrumentos de uso livre: exemplos de ECBI, Bayley-III e CCC-2 (licenciados) saíram em 17/10/2026.

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
