/* NeuroPed Master — Área protegida (somente após PIN master).
   Conteúdo autoral do Dr. Jadson Fraga. Estrutura clínica de referência:
   sistema de pontuação das 100 escalas passivas, panorama de farmacoterapia
   por classe ("start low, go slow") e a Diretriz Dosimétrica para TEA (Volume II).
   Observação clínica: material educacional de apoio à organização do raciocínio.
   Doses, faixas e condutas individuais sempre conforme avaliação do médico
   assistente e bulas/diretrizes vigentes. */
window.NEUROPED_MASTER_PRO = {

  /* ---------- Sistema das 100 Escalas Passivas (0–4) ---------- */
  escalas: {
    principio: 'A avaliação passiva lê a criança em situação natural, sem desempenho sob comando. Nenhum item se conclui por um episódio isolado: o valor está na repetição entre contextos. Cada lente recebe uma nota de 0 a 4 segundo um de dois tipos de escala.',
    tipos: [
      ['Escala de competência', 'Mede o quanto uma habilidade está presente e generalizada.',
        [
          ['0','Ausente','A habilidade não aparece em nenhum contexto observado.'],
          ['1','Emergente sob forte mediação','Só surge com apoio intenso e direcionamento contínuo do adulto.'],
          ['2','Inconsistente','Aparece em alguns contextos, de forma instável, ainda dependente de pista.'],
          ['3','Consistente com apoio leve','Presente na maioria dos contextos, com mínima mediação.'],
          ['4','Espontâneo e generalizado','Ocorre de forma autônoma e transferida entre pessoas, locais e situações.']
        ]
      ],
      ['Escala de alerta', 'Mede o quanto um sinal de preocupação está presente e disseminado.',
        [
          ['0','Ausente','O sinal não é observado.'],
          ['1','Leve / situacional','Aparece raramente e em contexto muito específico.'],
          ['2','Moderado','Ocorre em mais de um contexto, com impacto perceptível.'],
          ['3','Importante','Frequente, com prejuízo funcional claro no dia a dia.'],
          ['4','Marcado / generalizado','Presente de forma intensa e transversal, com forte impacto funcional.']
        ]
      ]
    ],
    leitura: [
      ['Generalização espontânea ≠ desempenho treinado', 'Melhora que só aparece sob mediação intensa reduz o peso do item; o que vale como aquisição real é a transferência espontânea entre contextos.'],
      ['Preservação e armadilha de leitura', 'Cada lente tem um ponto de preservação (o que pode parecer "normal") e uma armadilha (o que costuma ser lido errado). Documentar as duas evita laudo apressado.'],
      ['Frase possível de laudo', 'Cada escala oferece uma redação-modelo que traduz a observação em linguagem clínica, sempre ancorada no nível 0–4 atribuído.']
    ],
    macrodominios: [
      ['01–20','Comunicação social e reciprocidade','Atenção compartilhada, imitação, jogo social e leitura relacional.'],
      ['21–40','Linguagem funcional e pragmática','Intenção comunicativa, gestos, compreensão, narrativa e reparo.'],
      ['41–60','Atenção, flexibilidade e função executiva','Sustentação, inibição, memória operacional, transições e tarefa escolar.'],
      ['61–80','Modulação sensorial, praxia e autonomia','Processamento sensorial, motricidade, oralidade, AVDs e sono.'],
      ['81–100','Regulação emocional, risco e ecologia','Humor, irritabilidade, crises, suporte, previsibilidade e prognóstico.']
    ]
  },

  /* ---------- Farmacoterapia — panorama por classe ---------- */
  farmaco: {
    lema: 'Start low, go slow — iniciar baixo, subir devagar, monitorar sempre.',
    nota: 'Panorama de classes para organização do raciocínio. Indicação, dose, faixa etária e duração são decisão individual do médico assistente, conforme bula, diretrizes e a criança à frente.',
    blocos: [
      { n:1, titulo:'Antiepilépticos', resumo:'Ampla classe para controle crisíaco; escolha guiada por tipo de crise/síndrome, perfil cognitivo e efeitos. Monitorar sonolência, humor, apetite, peso e função hepática/hematológica conforme o agente.',
        agentes:['Ácido valproico','Carbamazepina','Oxcarbazepina','Lamotrigina','Levetiracetam','Topiramato','Etossuximida','Clobazam','Vigabatrina','Fenobarbital'] },
      { n:2, titulo:'TDAH — psicoestimulantes e não-estimulantes', resumo:'Estimulantes (1ª linha) e não-estimulantes para perfil/comorbidade. Monitorar apetite, sono, humor, FC/PA, crescimento e tiques.',
        agentes:['Metilfenidato','Lisdexanfetamina','Dexmetilfenidato','Atomoxetina','Guanfacina','Clonidina'] },
      { n:3, titulo:'Antipsicóticos e estabilizadores', resumo:'Irritabilidade/agressividade no TEA, mania, psicose. Monitorização metabólica: peso, IMC, glicemia, lipídios, PA; prolactina e sintomas extrapiramidais.',
        agentes:['Risperidona','Aripiprazol','Olanzapina','Quetiapina','Lítio'] },
      { n:4, titulo:'ISRS — antidepressivos', resumo:'Ansiedade, TOC, depressão. Atenção a ativação comportamental e ideação no início/ajuste; reavaliar precocemente.',
        agentes:['Sertralina','Fluoxetina','Escitalopram','Fluvoxamina'] },
      { n:5, titulo:'Benzodiazepínicos e modulação motora', resumo:'Uso pontual/sintomático e modulação de tônus/movimento; cautela com sedação, tolerância e dependência.',
        agentes:['Clonazepam','Diazepam','Midazolam'] },
      { n:6, titulo:'Profilaxia de cefaleia / enxaqueca', resumo:'Profilaxia quando frequência/impacto justificam. Monitorar humor, peso, FC/PA e cognição conforme o agente.',
        agentes:['Propranolol','Flunarizina','Topiramato'] },
      { n:7, titulo:'Terapias gênicas (AME)', resumo:'Terapias modificadoras de doença na atrofia muscular espinhal; indicação e dispensação em centro especializado.',
        agentes:['Risdiplam','Onasemnogene abeparvovec'] }
    ],
    calendarios: [
      ['Antipsicóticos','Peso/IMC e PA em cada retorno; glicemia e lipídios na linha de base, ~12 semanas e depois periódico; prolactina e EPS se sintomas.'],
      ['Estabilizadores (lítio)','Nível sérico, função renal e tireoidiana periódicos; hidratação e sinais de toxicidade.'],
      ['Psicoestimulantes','Apetite, sono, humor, FC/PA e curva de crescimento em cada ajuste; reavaliar tiques.'],
      ['ISRS','Ativação/ideação nas primeiras semanas e a cada ajuste; resposta e tolerância no seguimento.']
    ]
  },

  /* ---------- Diretriz Dosimétrica para TEA (Volume II) ---------- */
  dosimetria: {
    intro: 'Matriz de referência de carga horária terapêutica semanal para TEA, por faixa etária e nível de suporte DSM-5-TR. Ponto de partida para o plano — calibrado pela resposta, metas (GAS) e contexto da rede.',
    matriz: {
      colunas:['Faixa etária','Nível 1','Nível 2','Nível 3'],
      linhas:[
        ['12–36 meses','20 h','25 h','30 h'],
        ['3–5 anos','20 h','35 h','40 h'],
        ['6–11 anos','12 h','25 h','35 h'],
        ['12–17 anos','6 h','15 h','25 h'],
        ['≥18 anos','4 h','10 h','15 h']
      ]
    },
    modelos: [
      ['Modelo intensivo precoce','Janela de plasticidade (12–60 meses): abordagens naturalistas do desenvolvimento (ESDM/NDBI), alta carga e mediação familiar.'],
      ['Modelo escolar funcional','Idade escolar: foco em funcionalidade, autonomia e inclusão, com carga ajustada à demanda e à fadiga.'],
      ['Modelo de manutenção e transição','Adolescência/adulto: metas de vida independente, trabalho e participação social, com carga seletiva por objetivo.']
    ],
    defesa: {
      titulo: 'Modelo de manifestação técnica contra negativa de operadora',
      texto: 'Quando a carga horária prescrita é negada, a defesa técnica articula a necessidade clínica individualizada (nível de suporte, metas funcionais, janela de plasticidade) com a base legal e normativa.',
      base: [
        'Lei 12.764/2012 — Política Nacional de Proteção dos Direitos da Pessoa com TEA.',
        'Lei 13.146/2015 — Lei Brasileira de Inclusão (Estatuto da Pessoa com Deficiência).',
        'Súmula 102 do TJSP — cobertura de tratamento conforme prescrição médica.',
        'RN 539/2022 da ANS — cobertura de sessões sem limite numérico para transtornos do espectro.'
      ]
    }
  }
};
