/* ==========================================================
   NeuroPed EDJ v5.1 — Base de dados HONESTA
   Truth-pass: zero placeholders, registry estruturado,
   status por instrumento, dados explicitamente demo.
   ========================================================== */

const NEUROPED = (() => {

  /* ---------- AMBIENTE ---------- */
  // Esta build é DEMONSTRATIVA. Nenhum dado real de paciente deve ser inserido.
  const ENV = {
    mode: 'demo',
    label: 'AMBIENTE DEMONSTRATIVO',
    warning: 'Não utilizar com dados reais de pacientes. Banco local não criptografado, sem autenticação real.',
    version: '5.1-truth-pass'
  };

  /* ---------- MÓDULOS (status real) ----------
     status:
       'live'       — funciona com persistência local válida
       'preview'    — UI pronta, integração real pendente
       'gated'      — bloqueado por compliance/credenciais
       'planned'    — ainda não construído
  */
  const modules = [
    // PÚBLICO
    { id: 'inicio',       title: 'Início',                sub: 'Boas-vindas',                    icon: '⌂', locked: false, status: 'live' },
    { id: 'sobre',        title: 'Sobre o Dr. Jadson',    sub: 'Formação e atuação',             icon: '★', locked: false, status: 'live' },
    { id: 'escalas',      title: 'Instrumentos abertos',  sub: 'Triagem livre para famílias',    icon: '≡', locked: false, status: 'live' },
    { id: 'caa',          title: 'CAA',                   sub: 'Comunicação alternativa',        icon: '◉', locked: false, status: 'live' },
    { id: 'materiais',    title: 'Materiais educativos',  sub: 'Para famílias e escolas',        icon: '📘', locked: false, status: 'live' },
    { id: 'marcos',       title: 'Marcos do desenvolvimento', sub: 'Por faixa etária',            icon: '🌱', locked: false, status: 'live' },
    { id: 'calculadoras', title: 'Calculadoras',          sub: 'IMC e doses · referenciais',     icon: '🧮', locked: false, status: 'live' },
    { id: 'contato',      title: 'Agendar consulta',      sub: 'WhatsApp e Instagram',           icon: '📞', locked: false, status: 'live' },
    // PROFISSIONAL — todos em demo até gates de segurança/compliance serem cumpridos
    { id: 'pacientes',    title: 'Pacientes',             sub: 'CRM · demo isolada',             icon: '☺', locked: true,  status: 'preview' },
    { id: 'consultas',    title: 'Consultas',             sub: 'Registro · demo isolada',        icon: '+', locked: true,  status: 'preview' },
    { id: 'laudos',       title: 'Laudos',                sub: 'PDF · sem assinatura digital',   icon: '✎', locked: true,  status: 'preview' },
    { id: 'agenda',       title: 'Agenda clínica',        sub: 'Calendário · demo',              icon: '▦', locked: true,  status: 'preview' },
    { id: 'escalas-pro',  title: 'Instrumentos clínicos', sub: 'Em revisão clínica',             icon: '🩺', locked: true, status: 'preview' },
    { id: 'config',       title: 'Configurações',         sub: 'Conta, nuvem, LGPD',             icon: '⚙', locked: true,  status: 'live' }
    // Módulos REMOVIDOS desta build (gates não cumpridos):
    //   financeiro/cobrança — sem provedor real autorizado
    //   mensagens — sem persistência segura, sem RLS, risco LGPD
    //   telemedicina — fora do escopo até validação regulatória
  ];

  /* ---------- INSTRUMENT REGISTRY ----------
     Esquema obrigatório (CLINICAL_CONTENT_GOVERNANCE.md):
       id, name, sigla, domain, age_band, age_min, age_max,
       respondent, purpose, n_items, response_type, scoring,
       interpretation, validation_status, license_status,
       source, language, app_status, last_reviewed, notes
  */

  // INSTRUMENTOS AUTORAIS ABERTOS — para uso livre/educacional (família)
  // Conteúdo descritivo desenvolvido pelo Dr. Jadson Fraga, não normatizado.
  // Não substitui escala validada quando formalmente indicada.
  const familyScales = [
    { id: 'tea-precoce', sigla: 'NP-TEA-PREC', emoji: '🌱',
      title: 'Primeiros Sinais TEA — Olhar, Nome e Brincar',
      audience: 'familia', age: '12–36 meses', age_min: 12, age_max: 36,
      domain: 'TEA', respondent: 'pais/cuidador', priority: 99,
      purpose: 'Triagem familiar de sinais precoces de TEA — comunicação social e brincar.',
      questions: ['Ele olha quando você chama pelo nome?','Ele mostra o que quer usando gestos?','Ele brinca de forma simples com você?','Ele se incomoda muito com barulhos?','Ele usa sons ou palavras para pedir algo?'],
      options: ['Quase sempre','Às vezes','Quase nunca'],
      scoring: 'Soma simples (0–2 por item). Score ÷ máximo → %.',
      interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%. Sinalização operacional, não diagnóstica.',
      validation_status: 'autoral · não normatizado',
      license_status: 'aberto · CC-BY-NC',
      source: 'Dr. Jadson Fraga (autoral)',
      language: 'pt-BR',
      app_status: 'live',
      last_reviewed: '2026-05-28',
      notes: 'Instrumento operacional de triagem. Encaminhar a avaliação especializada quando sinalização Moderada ou Alta.',
      use: 'Triagem familiar inicial.' },
    { id: 'fala-inicial', sigla: 'NP-FALA-INI', emoji: '🗣️',
      title: 'Fala Inicial — Pedidos, Gestos e Sons',
      audience: 'familia', age: '12–36 meses', age_min: 12, age_max: 36, domain: 'Linguagem', respondent: 'pais/cuidador', priority: 97,
      purpose: 'Mapear comunicação funcional inicial.',
      questions: ['Ele tenta pedir algo com som, gesto ou olhar?','Ele aponta para o que quer?','Ele imita sons ou palavras simples?','Ele entende ordens simples como dá ou pega?','Ele chama alguém quando precisa de ajuda?'],
      options: ['Quase sempre','Às vezes','Quase nunca'],
      scoring: 'Soma simples (0–2 por item).', interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%.',
      validation_status: 'autoral · não normatizado', license_status: 'aberto · CC-BY-NC', source: 'Dr. Jadson Fraga (autoral)', language: 'pt-BR', app_status: 'live', last_reviewed: '2026-05-28',
      notes: 'Foco em função comunicativa do dia a dia.', use: 'Mapeamento de comunicação inicial.' },
    { id: 'alimentacao-sensorial', sigla: 'NP-ALIM-SENS', emoji: '🍽️',
      title: 'Alimentação Sensorial — Texturas e Recusas',
      audience: 'familia', age: '12–36 meses', age_min: 12, age_max: 36, domain: 'Alimentação', respondent: 'pais/cuidador', priority: 98,
      purpose: 'Triagem de seletividade alimentar com componente sensorial.',
      questions: ['Ele recusa alimentos por textura?','Ele aceita poucos alimentos?','Ele engasga com frequência?','Ele cheira ou toca a comida antes de comer?','A refeição costuma virar conflito?'],
      options: ['Sempre','Frequentemente','Raramente'], scoring: 'Soma simples (0–2 por item).', interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%.',
      validation_status: 'autoral · não normatizado', license_status: 'aberto · CC-BY-NC', source: 'Dr. Jadson Fraga (autoral)', language: 'pt-BR', app_status: 'live', last_reviewed: '2026-05-28',
      notes: 'Encaminhar fono/TO em sinalização alta.', use: 'Triagem de seletividade alimentar.' },
    { id: 'sono-pequeno', sigla: 'NP-SONO-12M', emoji: '😴',
      title: 'Sono do Pequeno — Rotina e Despertares',
      audience: 'familia', age: '12–36 meses', age_min: 12, age_max: 36, domain: 'Sono', respondent: 'pais/cuidador', priority: 90,
      purpose: 'Organizar queixa de sono na primeira infância.',
      questions: ['Ele demora muito para dormir?','Ele acorda várias vezes à noite?','Ele precisa sempre da mesma rotina para dormir?','Ele ronca ou respira mal dormindo?','O sono ruim muda o comportamento no dia seguinte?'],
      options: ['Sempre','Às vezes','Quase nunca'], scoring: 'Soma simples (0–2 por item).', interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%.',
      validation_status: 'autoral · não normatizado', license_status: 'aberto · CC-BY-NC', source: 'Dr. Jadson Fraga (autoral)', language: 'pt-BR', app_status: 'live', last_reviewed: '2026-05-28',
      notes: 'Investigar ronco/apneia separadamente.', use: 'Organização de queixa de sono.' },
    { id: 'brincar-social', sigla: 'NP-SOC-12M', emoji: '🧸',
      title: 'Brincar e Interesse Social',
      audience: 'familia', age: '12–36 meses', age_min: 12, age_max: 36, domain: 'Social', respondent: 'pais/cuidador', priority: 93,
      purpose: 'Observar troca social inicial e brincar funcional.',
      questions: ['Ele procura você para brincar?','Ele imita brincadeiras simples?','Ele compartilha brinquedos ou objetos?','Ele prefere brincar sempre sozinho?','Ele mostra interesse por outras crianças?'],
      options: ['Quase sempre','Às vezes','Quase nunca'], scoring: 'Soma simples (0–2 por item).', interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%.',
      validation_status: 'autoral · não normatizado', license_status: 'aberto · CC-BY-NC', source: 'Dr. Jadson Fraga (autoral)', language: 'pt-BR', app_status: 'live', last_reviewed: '2026-05-28',
      notes: 'Foco em iniciativa social.', use: 'Observação de brincar funcional.' },
    { id: 'comunicacao-funcional', sigla: 'NP-COMF-35', emoji: '💬',
      title: 'Comunicação Funcional', audience: 'familia', age: '3–5 anos', age_min: 36, age_max: 71, domain: 'Linguagem', respondent: 'pais/cuidador', priority: 96,
      purpose: 'Mapear comunicação funcional no pré-escolar.',
      questions: ['Ele pede o que quer de forma compreensível?','Ele responde perguntas simples?','Ele mostra coisas que achou interessantes?','Ele entende quando alguém muda a rotina?','Ele usa fala, gesto ou figura para se comunicar?'],
      options: ['Quase sempre','Às vezes','Quase nunca'], scoring: 'Soma simples (0–2 por item).', interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%.',
      validation_status: 'autoral · não normatizado', license_status: 'aberto · CC-BY-NC', source: 'Dr. Jadson Fraga (autoral)', language: 'pt-BR', app_status: 'live', last_reviewed: '2026-05-28',
      notes: 'Considera fala+gesto+figura.', use: 'Comunicação funcional pré-escolar.' },
    { id: 'crises-frustracao', sigla: 'NP-CRIS-35', emoji: '🌪️',
      title: 'Crises e Frustração — Birras e Transições', audience: 'familia', age: '3–5 anos', age_min: 36, age_max: 71, domain: 'Comportamento', respondent: 'pais/cuidador', priority: 95,
      purpose: 'Distinguir birra esperada de desregulação persistente.',
      questions: ['Ele chora muito quando algo muda?','Ele se joga, bate ou morde durante crises?','Ele consegue esperar por pouco tempo?','Ele aceita trocar de atividade?','Depois da crise, ele consegue se acalmar com ajuda?'],
      options: ['Sempre','Às vezes','Raramente'], scoring: 'Soma simples (0–2 por item).', interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%.',
      validation_status: 'autoral · não normatizado', license_status: 'aberto · CC-BY-NC', source: 'Dr. Jadson Fraga (autoral)', language: 'pt-BR', app_status: 'live', last_reviewed: '2026-05-28',
      notes: 'Investigar gatilhos sensoriais associados.', use: 'Crises de regulação.' },
    { id: 'sensorial-diario', sigla: 'NP-SENS-35', emoji: '🎧',
      title: 'Sensorial Diário — Barulho, Toque e Luz', audience: 'familia', age: '3–5 anos', age_min: 36, age_max: 71, domain: 'Sensorial', respondent: 'pais/cuidador', priority: 94,
      purpose: 'Organizar queixas sensoriais em linguagem familiar.',
      questions: ['Ele tapa os ouvidos com barulhos comuns?','Ele evita certos tecidos ou etiquetas?','Ele se incomoda com luz forte?','Ele busca girar, pular ou se apertar?','As reações sensoriais atrapalham a rotina?'],
      options: ['Sempre','Às vezes','Raramente'], scoring: 'Soma simples (0–2 por item).', interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%.',
      validation_status: 'autoral · não normatizado', license_status: 'aberto · CC-BY-NC', source: 'Dr. Jadson Fraga (autoral)', language: 'pt-BR', app_status: 'live', last_reviewed: '2026-05-28',
      notes: 'TO especializada quando alto.', use: 'Queixas sensoriais.' },
    { id: 'autonomia-inicial', sigla: 'NP-AVD-35', emoji: '🚽',
      title: 'Autonomia Inicial — Banheiro e Higiene', audience: 'familia', age: '3–5 anos', age_min: 36, age_max: 71, domain: 'Autonomia', respondent: 'pais/cuidador', priority: 88,
      purpose: 'Mapear AVDs iniciais.',
      questions: ['Ele avisa quando quer ir ao banheiro?','Ele ajuda a vestir ou tirar roupa?','Ele lava as mãos com ajuda?','Ele participa da escovação dos dentes?','Ele entende pequenas rotinas de cuidado?'],
      options: ['Quase sempre','Às vezes','Quase nunca'], scoring: 'Soma simples (0–2 por item).', interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%.',
      validation_status: 'autoral · não normatizado', license_status: 'aberto · CC-BY-NC', source: 'Dr. Jadson Fraga (autoral)', language: 'pt-BR', app_status: 'live', last_reviewed: '2026-05-28',
      notes: 'Sem cobrança quando atraso isolado.', use: 'AVDs iniciais.' },
    { id: 'flexibilidade-rotina', sigla: 'NP-FLEX-35', emoji: '🧩',
      title: 'Flexibilidade e Rotina', audience: 'familia', age: '3–5 anos', age_min: 36, age_max: 71, domain: 'TEA', respondent: 'pais/cuidador', priority: 90,
      purpose: 'Rastrear inflexibilidade adaptativa.',
      questions: ['Ele aceita pequenas mudanças na rotina?','Ele insiste em fazer sempre do mesmo jeito?','Ele consegue esperar com apoio visual?','Ele tolera perder ou dividir?','A rigidez atrapalha passeios ou escola?'],
      options: ['Sempre','Às vezes','Raramente'], scoring: 'Soma simples (0–2 por item).', interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%.',
      validation_status: 'autoral · não normatizado', license_status: 'aberto · CC-BY-NC', source: 'Dr. Jadson Fraga (autoral)', language: 'pt-BR', app_status: 'live', last_reviewed: '2026-05-28',
      notes: 'Item descritivo, não rotulador.', use: 'Inflexibilidade adaptativa.' },
    { id: 'atencao-casa', sigla: 'NP-ATEN-611', emoji: '📚',
      title: 'Atenção em Casa — Começar, Manter e Terminar', audience: 'familia', age: '6–11 anos', age_min: 72, age_max: 143, domain: 'TDAH', respondent: 'pais/cuidador', priority: 97,
      purpose: 'Organizar queixas familiares de atenção.',
      questions: ['Ele começa a tarefa sem muita resistência?','Ele termina o que começou?','Ele se distrai com qualquer coisa?','Ele esquece instruções em poucos minutos?','A lição de casa demora mais que o esperado?'],
      options: ['Quase sempre','Às vezes','Quase nunca'], scoring: 'Soma simples (0–2 por item).', interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%.',
      validation_status: 'autoral · não normatizado', license_status: 'aberto · CC-BY-NC', source: 'Dr. Jadson Fraga (autoral)', language: 'pt-BR', app_status: 'live', last_reviewed: '2026-05-28',
      notes: 'Não diagnóstico de TDAH.', use: 'Atenção e execução em casa.' },
    { id: 'organizacao-memoria', sigla: 'NP-ORG-611', emoji: '🧠',
      title: 'Organização e Memória do Dia a Dia', audience: 'familia', age: '6–11 anos', age_min: 72, age_max: 143, domain: 'Funções Executivas', respondent: 'pais/cuidador', priority: 92,
      purpose: 'Diferenciar desatenção de desorganização.',
      questions: ['Ele perde objetos com frequência?','Ele esquece recados simples?','Ele precisa de muitos lembretes para a rotina?','Ele se organiza para sair de casa?','Ele lembra combinados do dia anterior?'],
      options: ['Sempre','Às vezes','Raramente'], scoring: 'Soma simples (0–2 por item).', interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%.',
      validation_status: 'autoral · não normatizado', license_status: 'aberto · CC-BY-NC', source: 'Dr. Jadson Fraga (autoral)', language: 'pt-BR', app_status: 'live', last_reviewed: '2026-05-28',
      notes: '—', use: 'Funções executivas.' },
    { id: 'ansiedade-infantil', sigla: 'NP-ANS-611', emoji: '😟',
      title: 'Ansiedade Infantil — Medos e Evitação', audience: 'familia', age: '6–11 anos', age_min: 72, age_max: 143, domain: 'Ansiedade', respondent: 'pais/cuidador', priority: 91,
      purpose: 'Triagem familiar de ansiedade com impacto funcional.',
      questions: ['Ele evita situações por medo?','Ele reclama de dor antes da escola?','Ele precisa de muita confirmação para se sentir seguro?','Ele tem medo de ficar longe dos pais?','A preocupação atrapalha sono ou rotina?'],
      options: ['Sempre','Às vezes','Raramente'], scoring: 'Soma simples (0–2 por item).', interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%.',
      validation_status: 'autoral · não normatizado', license_status: 'aberto · CC-BY-NC', source: 'Dr. Jadson Fraga (autoral)', language: 'pt-BR', app_status: 'live', last_reviewed: '2026-05-28',
      notes: 'Encaminhar avaliação especializada quando alto.', use: 'Triagem de ansiedade.' },
    { id: 'oposicao-irritabilidade', sigla: 'NP-OPO-611', emoji: '😡',
      title: 'Irritabilidade e Oposição', audience: 'familia', age: '6–11 anos', age_min: 72, age_max: 143, domain: 'Comportamento', respondent: 'pais/cuidador', priority: 90,
      purpose: 'Organizar frequência e intensidade de oposição.',
      questions: ['Ele discute muito com adultos?','Ele perde a paciência com facilidade?','Ele culpa os outros por erros?','Ele desafia regras simples?','A irritabilidade acontece em casa e na escola?'],
      options: ['Sempre','Às vezes','Raramente'], scoring: 'Soma simples (0–2 por item).', interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%.',
      validation_status: 'autoral · não normatizado', license_status: 'aberto · CC-BY-NC', source: 'Dr. Jadson Fraga (autoral)', language: 'pt-BR', app_status: 'live', last_reviewed: '2026-05-28',
      notes: '—', use: 'Oposição e limites.' },
    { id: 'sono-escolar', sigla: 'NP-SONO-611', emoji: '🛏️',
      title: 'Sono Escolar — Horário e Cansaço', audience: 'familia', age: '6–11 anos', age_min: 72, age_max: 143, domain: 'Sono', respondent: 'pais/cuidador', priority: 88,
      purpose: 'Integrar sono e funcionamento diurno.',
      questions: ['Ele dorme no horário combinado?','Ele acorda cansado?','Ele ronca ou respira mal?','Ele usa telas perto da hora de dormir?','O sono ruim piora atenção ou humor?'],
      options: ['Sempre','Às vezes','Raramente'], scoring: 'Soma simples (0–2 por item).', interpretation: 'Baixo <33% · Moderado 33–66% · Alto >66%.',
      validation_status: 'autoral · não normatizado', license_status: 'aberto · CC-BY-NC', source: 'Dr. Jadson Fraga (autoral)', language: 'pt-BR', app_status: 'live', last_reviewed: '2026-05-28',
      notes: '—', use: 'Sono em escolares.' }
  ];

  // INSTRUMENTOS PROFISSIONAIS — REGISTRO CATALOGADO COM STATUS REAL
  // Nomes clássicos (M-CHAT-R, SNAP-IV, SRS-2, CBCL, GMFCS) NÃO estão implementados
  // nesta build por exigirem licença formal e validação cultural pt-BR.
  // Listamos apenas como REFERÊNCIA, sem botão aplicar.
  const proScalesCatalog = [
    { id: 'cat-mchat-r',  sigla: 'M-CHAT-R/F',  title: 'Modified Checklist for Autism in Toddlers, Revised with Follow-up', domain: 'TEA',      age: '16–30 meses', respondent: 'pais',          n_items: 20, language: 'pt-BR (oficial)',  validation_status: 'normatizado',     license_status: 'requer autorização dos autores', app_status: 'catalogado · não aplicável',     source: 'Robins, Fein, Barton (2009)' },
    { id: 'cat-snap-iv',  sigla: 'SNAP-IV',     title: 'Swanson, Nolan, Pelham IV Rating Scale',                                domain: 'TDAH',     age: '6–18 anos',   respondent: 'pais/professor', n_items: 26, language: 'pt-BR (versão pesquisa)', validation_status: 'amplamente utilizado', license_status: 'uso clínico requer cautela',  app_status: 'catalogado · não aplicável',     source: 'Swanson et al. (1983)' },
    { id: 'cat-srs-2',    sigla: 'SRS-2',       title: 'Social Responsiveness Scale, Second Edition',                            domain: 'TEA',      age: '4–18 anos',   respondent: 'pais/professor', n_items: 65, language: 'pt-BR (oficial WPS)',  validation_status: 'normatizado',     license_status: 'licença comercial obrigatória (WPS)', app_status: 'catalogado · bloqueado por licença', source: 'Constantino (2012)' },
    { id: 'cat-cbcl',     sigla: 'CBCL',        title: 'Child Behavior Checklist',                                              domain: 'Comportamento amplo', age: '6–18 anos', respondent: 'pais', n_items: 113, language: 'pt-BR (oficial)', validation_status: 'normatizado',     license_status: 'licença comercial obrigatória (ASEBA)', app_status: 'catalogado · bloqueado por licença', source: 'Achenbach (2001)' },
    { id: 'cat-gmfcs',    sigla: 'GMFCS',       title: 'Gross Motor Function Classification System',                              domain: 'Motor',    age: '2–18 anos',   respondent: 'profissional', n_items: 5, language: 'pt-BR (oficial)', validation_status: 'normatizado',     license_status: 'uso livre acadêmico', app_status: 'catalogado · classificação requer treinamento', source: 'Palisano et al. (2007)' },
    { id: 'cat-asq3',     sigla: 'ASQ-3',       title: 'Ages and Stages Questionnaires, Third Edition',                          domain: 'Desenvolvimento global', age: '1–66 meses', respondent: 'pais', n_items: 30, language: 'pt-BR (oficial Brookes)', validation_status: 'normatizado', license_status: 'licença comercial obrigatória', app_status: 'catalogado · bloqueado por licença', source: 'Squires & Bricker (2009)' },
    { id: 'cat-vineland', sigla: 'Vineland-3',  title: 'Vineland Adaptive Behavior Scales, Third Edition',                       domain: 'Comportamento adaptativo', age: '0–90 anos', respondent: 'pais/profissional', n_items: 502, language: 'pt-BR (oficial Pearson)', validation_status: 'normatizado', license_status: 'licença comercial obrigatória (Pearson)', app_status: 'catalogado · bloqueado por licença', source: 'Sparrow et al. (2016)' },
    { id: 'cat-conners3', sigla: 'Conners-3',   title: 'Conners 3rd Edition',                                                   domain: 'TDAH/Comportamento', age: '6–18 anos', respondent: 'pais/professor', n_items: 110, language: 'pt-BR (oficial)', validation_status: 'normatizado',     license_status: 'licença comercial obrigatória (MHS)', app_status: 'catalogado · bloqueado por licença', source: 'Conners (2008)' }
  ];

  // Para o runner, expomos somente os autorais abertos.
  // O catálogo profissional aparece como referência, sem botão "Aplicar".
  const scales = [...familyScales];

  /* ---------- CAA (PÚBLICO · live) ---------- */
  const caaCategories = [
    { id: 'basico', label: 'Sentimentos', items: [
      { e: '😊', l: 'Feliz' }, { e: '😢', l: 'Triste' }, { e: '😡', l: 'Bravo' },
      { e: '😴', l: 'Cansado' }, { e: '🤒', l: 'Doente' }, { e: '😨', l: 'Medo' },
      { e: '🥰', l: 'Amor' }, { e: '🤔', l: 'Pensando' }, { e: '😮', l: 'Surpreso' },
      { e: '😎', l: 'Legal' }, { e: '🤗', l: 'Abraço' }, { e: '😅', l: 'Aliviado' }
    ]},
    { id: 'social', label: 'Social', items: [
      { e: '👋', l: 'Oi' }, { e: '👋', l: 'Tchau' }, { e: '🙏', l: 'Por favor' },
      { e: '🙌', l: 'Obrigado' }, { e: '✅', l: 'Sim' }, { e: '❌', l: 'Não' },
      { e: '🤲', l: 'Quero' }, { e: '🙅', l: 'Não quero' }, { e: '✋', l: 'Espera' },
      { e: '👍', l: 'Combinado' }, { e: '🆘', l: 'Ajuda' }, { e: '⏰', l: 'Agora' }
    ]},
    { id: 'comida', label: 'Comida', items: [
      { e: '🍎', l: 'Maçã' }, { e: '🍌', l: 'Banana' }, { e: '🍞', l: 'Pão' },
      { e: '🥛', l: 'Leite' }, { e: '🍪', l: 'Biscoito' }, { e: '🍝', l: 'Macarrão' },
      { e: '🍗', l: 'Frango' }, { e: '🍚', l: 'Arroz' }, { e: '🥣', l: 'Sopa' },
      { e: '💧', l: 'Água' }, { e: '🍦', l: 'Sorvete' }, { e: '🍫', l: 'Chocolate' }
    ]},
    { id: 'lugares', label: 'Lugares', items: [
      { e: '🏠', l: 'Casa' }, { e: '🏫', l: 'Escola' }, { e: '🏥', l: 'Médico' },
      { e: '🏞️', l: 'Parque' }, { e: '🚗', l: 'Carro' }, { e: '🛏️', l: 'Quarto' },
      { e: '🚿', l: 'Banho' }, { e: '🍽️', l: 'Mesa' }, { e: '🏃', l: 'Correr' },
      { e: '🛒', l: 'Mercado' }, { e: '⛪', l: 'Igreja' }, { e: '🎉', l: 'Festa' }
    ]},
    { id: 'acoes', label: 'Ações', items: [
      { e: '🍴', l: 'Comer' }, { e: '🥤', l: 'Beber' }, { e: '😴', l: 'Dormir' },
      { e: '🎮', l: 'Brincar' }, { e: '📺', l: 'TV' }, { e: '📖', l: 'Ler' },
      { e: '🎵', l: 'Música' }, { e: '🚶', l: 'Andar' }, { e: '🛁', l: 'Banho' },
      { e: '✋', l: 'Parar' }, { e: '➡️', l: 'Ir' }, { e: '🪥', l: 'Escovar dentes' }
    ]},
    { id: 'corpo', label: 'Corpo', items: [
      { e: '🤕', l: 'Dor cabeça' }, { e: '🤢', l: 'Enjoo' }, { e: '🫀', l: 'Coração' },
      { e: '🦷', l: 'Dente' }, { e: '👂', l: 'Ouvido' }, { e: '👁️', l: 'Olho' },
      { e: '🫁', l: 'Respiração' }, { e: '🦵', l: 'Perna' }, { e: '🖐️', l: 'Mão' },
      { e: '🤧', l: 'Espirro' }, { e: '🤒', l: 'Febre' }, { e: '💊', l: 'Remédio' }
    ]}
  ];

  /* ---------- MATERIAIS EDUCATIVOS (live) ---------- */
  const materiais = [
    { e: '📘', t: 'Manual do desfralde', sub: 'Guia em 8 passos para famílias', tag: 'Autonomia',
      body: 'O desfralde é uma das transições mais importantes na primeira infância. Ele exige paciência, observação dos sinais de prontidão (avisar antes, segurar a fralda seca por mais tempo, interesse pelo banheiro) e consistência. Recomenda-se iniciar geralmente entre 24 e 30 meses, em períodos de menor stress familiar. Evite cobrança e privilegie elogio.' },
    { e: '🎧', t: 'Sensorial em casa', sub: 'Dicas práticas por ambiente', tag: 'Sensorial',
      body: 'Crianças com perfil sensorial atípico se beneficiam de adaptações simples: redução de ruído na sala (tapetes, almofadas), iluminação suave, etiquetas removidas das roupas, opções de texturas alimentares variadas. Cantos de calma, com almofadas e luz baixa, ajudam na auto-regulação.' },
    { e: '😴', t: 'Higiene do sono', sub: 'Rotina visual para crianças', tag: 'Sono',
      body: 'Sono de qualidade depende de rotina previsível: banho morno, leitura, luz baixa 1h antes, telas desligadas, horário consistente. O ambiente deve ser fresco, escuro e silencioso. Em crianças neurodivergentes, considere objetos de transição e quadro de rotina visual.' },
    { e: '🍽️', t: 'Seletividade alimentar', sub: 'Estratégias gentis', tag: 'Alimentação',
      body: 'Seletividade pode ser sensorial, comportamental ou mista. Estratégias úteis: oferecer sem pressionar, exposição repetida (15-20 vezes), envolver a criança no preparo, evitar barganhas e gratificações condicionadas. Encaminhar fonoaudiologia/terapia ocupacional quando persistente.' },
    { e: '🧠', t: 'TDAH em casa', sub: 'Organização e foco', tag: 'TDAH',
      body: 'Estrutura visual (quadro de rotina), tarefas curtas, pausas frequentes, instruções diretas em uma etapa. Reduzir distratores no momento da tarefa (TV, brinquedos). Reforço positivo imediato funciona melhor que punição. Movimento autorizado entre tarefas ajuda a sustentar atenção.' },
    { e: '💬', t: 'CAA — quando começar', sub: 'Comunicação alternativa', tag: 'Linguagem',
      body: 'CAA (Comunicação Aumentativa e Alternativa) não atrasa a fala — ao contrário, é cientificamente comprovada como facilitadora. Indique CAA quando a criança apresenta dificuldade persistente em comunicar necessidades por fala, mesmo em terapia. Pictogramas, apps e gestos personalizados funcionam.' },
    { e: '🎓', t: 'Adaptações escolares', sub: 'Para professores e famílias', tag: 'Escola',
      body: 'Adaptações simples: posicionamento na frente da sala, instruções escritas além das verbais, tempo estendido em avaliações, intervalo extra para auto-regulação, plano educacional individualizado (PEI) quando indicado. A comunicação família-escola-clínica é essencial.' },
    { e: '🌱', t: 'Marcos do desenvolvimento', sub: 'Sinais de alerta', tag: 'Desenvolvimento',
      body: 'Sinais que merecem avaliação especializada: não sorri socialmente aos 4 meses, não responde ao nome aos 12 meses, não fala palavras aos 16 meses, não combina palavras aos 24 meses, perda de habilidades adquiridas em qualquer idade. Detecção precoce muda o prognóstico.' }
  ];

  /* ---------- MARCOS (live) ---------- */
  const marcos = [
    { age: '3 meses',  emoji: '👶', items: ['Sorri socialmente', 'Segue objetos com olhar', 'Sustenta a cabeça brevemente', 'Reage a sons'] },
    { age: '6 meses',  emoji: '🍼', items: ['Senta com apoio', 'Pega objetos com as duas mãos', 'Vira para sons', 'Balbucia (ba-ba, da-da)'] },
    { age: '9 meses',  emoji: '🪑', items: ['Senta sem apoio', 'Engatinha', 'Responde ao nome', 'Estranha pessoas desconhecidas'] },
    { age: '12 meses', emoji: '🚶', items: ['Anda com apoio', 'Diz primeiras palavras', 'Aponta para o que quer', 'Imita gestos simples'] },
    { age: '18 meses', emoji: '🏃', items: ['Anda sem apoio', '10-20 palavras', 'Brinca de faz-de-conta simples', 'Sobe escada com apoio'] },
    { age: '24 meses', emoji: '🗣️', items: ['Frases de 2 palavras', 'Corre', 'Aponta para partes do corpo', 'Empilha 4-6 cubos'] },
    { age: '3 anos',   emoji: '🎨', items: ['Fala em frases completas', 'Conta até 3', 'Desenha círculo', 'Brinca em paralelo'] },
    { age: '4 anos',   emoji: '🎮', items: ['Conta histórias', 'Pula em um pé', 'Reconhece cores', 'Brinca cooperativamente'] },
    { age: '5 anos',   emoji: '✏️', items: ['Escreve o próprio nome', 'Conta até 10', 'Anda de bicicleta', 'Compreende regras de jogo'] }
  ];

  /* ---------- DADOS DEMO (claramente identificados) ---------- */
  // ATENÇÃO: todos os "pacientes" abaixo são FICTÍCIOS, usados apenas para
  // demonstração do CRM. Nenhum dado real de paciente deve ser inserido nesta build.
  const demoPatients = [
    { code: 'DEMO-001', name: '[DEMO] Paciente 1', age: '3a 4m', gender: 'M', domain: 'TEA',      last: 'Hoje', score: 12, status: 'ativo', dob: '2022-12-10', phone: '—', email: '', responsible: '[DEMO]' },
    { code: 'DEMO-002', name: '[DEMO] Paciente 2', age: '7a 2m', gender: 'F', domain: 'TDAH',     last: '2d',   score: 9,  status: 'ativo', dob: '2018-10-15', phone: '—', email: '', responsible: '[DEMO]' },
    { code: 'DEMO-003', name: '[DEMO] Paciente 3', age: '5a 1m', gender: 'M', domain: 'Linguagem', last: '5d',  score: 7,  status: 'ativo', dob: '2020-11-22', phone: '—', email: '', responsible: '[DEMO]' }
  ];

  const demoEvents = [
    { date: 'hoje',   day: 0, time: '09:00', title: '[DEMO] Triagem TEA',     kind: 'consulta', tag: 'TEA',  patient: 'DEMO-001' },
    { date: 'hoje',   day: 0, time: '11:00', title: '[DEMO] Retorno TDAH',    kind: 'retorno',  tag: 'TDAH', patient: 'DEMO-002' },
    { date: 'amanhã', day: 1, time: '08:30', title: '[DEMO] Primeira consulta', kind: 'consulta', tag: 'Linguagem', patient: 'DEMO-003' }
  ];

  /* ---------- DR. JADSON ---------- */
  const doutor = {
    nome: 'Dr. Jadson Fraga Araújo Júnior',
    titulo: 'Neuropediatra',
    crm: 'CRM-PE 25227',
    rqe: 'RQE 17756',
    cidades: ['Petrolina-PE', 'Juazeiro-BA'],
    whatsapp: '5587960970280',
    instagram: 'drjadsonfraga',
    areas: [
      { e: '🧩', t: 'Transtorno do Espectro Autista (TEA)', sub: 'Diagnóstico, acompanhamento e devolutiva' },
      { e: '🎯', t: 'TDAH e Funções Executivas',           sub: 'Avaliação multidimensional' },
      { e: '💬', t: 'Atrasos de Linguagem',                sub: 'Desde primeiros sinais' },
      { e: '😟', t: 'Ansiedade Infantil',                  sub: 'Triagem e orientação' },
      { e: '😴', t: 'Distúrbios do Sono',                  sub: 'Higiene e investigação' },
      { e: '🎧', t: 'Perfil Sensorial',                    sub: 'Adaptação domiciliar e escolar' },
      { e: '🚶', t: 'Atrasos motores',                     sub: 'Coordenação e marcos' },
      { e: '🌱', t: 'Marcos do desenvolvimento',           sub: 'Acompanhamento longitudinal' }
    ]
  };

  return {
    ENV, modules,
    scales, familyScales, proScalesCatalog,
    caaCategories, materiais, marcos,
    patients: demoPatients, events: demoEvents, doutor,
    totals: {
      // CONTAGENS HONESTAS — sem inflar
      instrumentosAplicaveis: familyScales.length,         // 15
      instrumentosCatalogados: proScalesCatalog.length,    // 8
      instrumentosBloqueadosPorLicenca: proScalesCatalog.filter(c => /licença comercial/i.test(c.license_status)).length,
      modulosLive: modules.filter(m => m.status === 'live').length,
      modulosPreview: modules.filter(m => m.status === 'preview').length
    }
  };
})();
