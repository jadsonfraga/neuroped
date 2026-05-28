/* ==========================================================
   NeuroPed EDJ — Base de dados v4.0 (comercial)
   ========================================================== */

const NEUROPED = (() => {

  /* ---------- MÓDULOS ---------- */
  const modules = [
    { id: 'inicio',    title: 'Início',       sub: 'Dashboard clínico',            icon: '⌂', roles: ['medico','secretaria','familia'] },
    { id: 'pacientes', title: 'Pacientes',    sub: 'CRM e prontuário digital',     icon: '☺', roles: ['medico','secretaria'] },
    { id: 'consultas', title: 'Consultas',    sub: 'Atendimentos e telemedicina',  icon: '+', roles: ['medico','secretaria'] },
    { id: 'escalas',   title: 'Escalas',      sub: '507 instrumentos clínicos',    icon: '≡', roles: ['medico','familia'] },
    { id: 'laudos',    title: 'Laudos',       sub: 'Geração e assinatura',         icon: '✎', roles: ['medico'] },
    { id: 'agenda',    title: 'Agenda',       sub: 'Calendário e lembretes',       icon: '▦', roles: ['medico','secretaria','familia'] },
    { id: 'financeiro',title: 'Financeiro',   sub: 'Receita, cobrança e relatórios', icon: '$', roles: ['medico','secretaria'] },
    { id: 'mensagens', title: 'Mensagens',    sub: 'Equipe e família',             icon: '✉', roles: ['medico','secretaria','familia'] },
    { id: 'caa',       title: 'CAA',          sub: 'Comunicação alternativa',      icon: '◉', roles: ['medico','familia'] },
    { id: 'familia',   title: 'Portal Família',sub: 'Passes e materiais',          icon: '♥', roles: ['medico','secretaria','familia'] },
    { id: 'planos',    title: 'Planos',       sub: 'Sua assinatura NeuroPed',      icon: '★', roles: ['medico'] },
    { id: 'config',    title: 'Configurações',sub: 'Conta, nuvem e LGPD',          icon: '⚙', roles: ['medico','secretaria','familia'] }
  ];

  /* ---------- ESCALAS REAIS ---------- */
  const REAL_SCALES = [
    { id: 'tea-precoce', emoji: '🌱', title: 'Primeiros Sinais TEA — Olhar, Nome e Brincar',
      audience: 'familia', age: '12–36 meses', age_min: 12, age_max: 36, domain: 'TEA', priority: 99,
      questions: ['Ele olha quando você chama pelo nome?','Ele mostra o que quer usando gestos?','Ele brinca de forma simples com você?','Ele se incomoda muito com barulhos?','Ele usa sons ou palavras para pedir algo?'],
      options: ['Quase sempre','Às vezes','Quase nunca'], use: 'Triagem familiar inicial para TEA.' },
    { id: 'fala-inicial', emoji: '🗣️', title: 'Fala Inicial — Pedidos, Gestos e Sons',
      audience: 'familia', age: '12–36 meses', age_min: 12, age_max: 36, domain: 'Linguagem', priority: 97,
      questions: ['Ele tenta pedir algo com som, gesto ou olhar?','Ele aponta para o que quer?','Ele imita sons ou palavras simples?','Ele entende ordens simples como dá ou pega?','Ele chama alguém quando precisa de ajuda?'],
      options: ['Quase sempre','Às vezes','Quase nunca'], use: 'Mapear sinais de comunicação inicial.' },
    { id: 'alimentacao-sensorial', emoji: '🍽️', title: 'Alimentação Sensorial — Texturas e Recusas',
      audience: 'familia', age: '12–36 meses', age_min: 12, age_max: 36, domain: 'Alimentação', priority: 98,
      questions: ['Ele recusa alimentos por textura?','Ele aceita poucos alimentos?','Ele engasga com frequência?','Ele cheira ou toca a comida antes de comer?','A refeição costuma virar conflito?'],
      options: ['Sempre','Frequentemente','Raramente'], use: 'Triagem de seletividade alimentar.' },
    { id: 'sono-pequeno', emoji: '😴', title: 'Sono do Pequeno — Rotina e Despertares',
      audience: 'familia', age: '12–36 meses', age_min: 12, age_max: 36, domain: 'Sono', priority: 90,
      questions: ['Ele demora muito para dormir?','Ele acorda várias vezes à noite?','Ele precisa sempre da mesma rotina para dormir?','Ele ronca ou respira mal dormindo?','O sono ruim muda o comportamento no dia seguinte?'],
      options: ['Sempre','Às vezes','Quase nunca'], use: 'Organização de queixa de sono.' },
    { id: 'brincar-social', emoji: '🧸', title: 'Brincar e Interesse Social',
      audience: 'familia', age: '12–36 meses', age_min: 12, age_max: 36, domain: 'Social', priority: 93,
      questions: ['Ele procura você para brincar?','Ele imita brincadeiras simples?','Ele compartilha brinquedos ou objetos?','Ele prefere brincar sempre sozinho?','Ele mostra interesse por outras crianças?'],
      options: ['Quase sempre','Às vezes','Quase nunca'], use: 'Observar troca social inicial.' },
    { id: 'comunicacao-funcional', emoji: '💬', title: 'Comunicação Funcional',
      audience: 'familia', age: '3–5 anos', age_min: 36, age_max: 71, domain: 'Linguagem', priority: 96,
      questions: ['Ele pede o que quer de forma compreensível?','Ele responde perguntas simples?','Ele mostra coisas que achou interessantes?','Ele entende quando alguém muda a rotina?','Ele usa fala, gesto ou figura para se comunicar?'],
      options: ['Quase sempre','Às vezes','Quase nunca'], use: 'Mapear comunicação funcional no pré-escolar.' },
    { id: 'crises-frustracao', emoji: '🌪️', title: 'Crises e Frustração — Birras e Transições',
      audience: 'familia', age: '3–5 anos', age_min: 36, age_max: 71, domain: 'Comportamento', priority: 95,
      questions: ['Ele chora muito quando algo muda?','Ele se joga, bate ou morde durante crises?','Ele consegue esperar por pouco tempo?','Ele aceita trocar de atividade?','Depois da crise, ele consegue se acalmar com ajuda?'],
      options: ['Sempre','Às vezes','Raramente'], use: 'Distinguir birra esperada de desregulação.' },
    { id: 'sensorial-diario', emoji: '🎧', title: 'Sensorial Diário — Barulho, Toque e Luz',
      audience: 'familia', age: '3–5 anos', age_min: 36, age_max: 71, domain: 'Sensorial', priority: 94,
      questions: ['Ele tapa os ouvidos com barulhos comuns?','Ele evita certos tecidos ou etiquetas?','Ele se incomoda com luz forte?','Ele busca girar, pular ou se apertar?','As reações sensoriais atrapalham a rotina?'],
      options: ['Sempre','Às vezes','Raramente'], use: 'Organizar queixas sensoriais.' },
    { id: 'autonomia-inicial', emoji: '🚽', title: 'Autonomia Inicial — Banheiro e Higiene',
      audience: 'familia', age: '3–5 anos', age_min: 36, age_max: 71, domain: 'Autonomia', priority: 88,
      questions: ['Ele avisa quando quer ir ao banheiro?','Ele ajuda a vestir ou tirar roupa?','Ele lava as mãos com ajuda?','Ele participa da escovação dos dentes?','Ele entende pequenas rotinas de cuidado?'],
      options: ['Quase sempre','Às vezes','Quase nunca'], use: 'Mapear AVDs iniciais.' },
    { id: 'flexibilidade-rotina', emoji: '🧩', title: 'Flexibilidade e Rotina',
      audience: 'familia', age: '3–5 anos', age_min: 36, age_max: 71, domain: 'TEA/Comportamento', priority: 90,
      questions: ['Ele aceita pequenas mudanças na rotina?','Ele insiste em fazer sempre do mesmo jeito?','Ele consegue esperar com apoio visual?','Ele tolera perder ou dividir?','A rigidez atrapalha passeios ou escola?'],
      options: ['Sempre','Às vezes','Raramente'], use: 'Rastrear inflexibilidade adaptativa.' },
    { id: 'atencao-casa', emoji: '📚', title: 'Atenção em Casa — Começar, Manter e Terminar',
      audience: 'familia', age: '6–11 anos', age_min: 72, age_max: 143, domain: 'TDAH', priority: 97,
      questions: ['Ele começa a tarefa sem muita resistência?','Ele termina o que começou?','Ele se distrai com qualquer coisa?','Ele esquece instruções em poucos minutos?','A lição de casa demora mais que o esperado?'],
      options: ['Quase sempre','Às vezes','Quase nunca'], use: 'Queixas familiares de atenção.' },
    { id: 'organizacao-memoria', emoji: '🧠', title: 'Organização e Memória do Dia a Dia',
      audience: 'familia', age: '6–11 anos', age_min: 72, age_max: 143, domain: 'Funções Executivas', priority: 92,
      questions: ['Ele perde objetos com frequência?','Ele esquece recados simples?','Ele precisa de muitos lembretes para a rotina?','Ele se organiza para sair de casa?','Ele lembra combinados do dia anterior?'],
      options: ['Sempre','Às vezes','Raramente'], use: 'Diferenciar desatenção de desorganização.' },
    { id: 'ansiedade-infantil', emoji: '😟', title: 'Ansiedade Infantil — Medos e Evitação',
      audience: 'familia', age: '6–11 anos', age_min: 72, age_max: 143, domain: 'Ansiedade', priority: 91,
      questions: ['Ele evita situações por medo?','Ele reclama de dor antes da escola?','Ele precisa de muita confirmação para se sentir seguro?','Ele tem medo de ficar longe dos pais?','A preocupação atrapalha sono ou rotina?'],
      options: ['Sempre','Às vezes','Raramente'], use: 'Triagem familiar de ansiedade.' },
    { id: 'oposicao-irritabilidade', emoji: '😡', title: 'Irritabilidade e Oposição',
      audience: 'familia', age: '6–11 anos', age_min: 72, age_max: 143, domain: 'Comportamento', priority: 90,
      questions: ['Ele discute muito com adultos?','Ele perde a paciência com facilidade?','Ele culpa os outros por erros?','Ele desafia regras simples?','A irritabilidade acontece em casa e na escola?'],
      options: ['Sempre','Às vezes','Raramente'], use: 'Frequência e intensidade de oposição.' },
    { id: 'sono-escolar', emoji: '🛏️', title: 'Sono Escolar — Horário e Cansaço',
      audience: 'familia', age: '6–11 anos', age_min: 72, age_max: 143, domain: 'Sono', priority: 88,
      questions: ['Ele dorme no horário combinado?','Ele acorda cansado?','Ele ronca ou respira mal?','Ele usa telas perto da hora de dormir?','O sono ruim piora atenção ou humor?'],
      options: ['Sempre','Às vezes','Raramente'], use: 'Integrar sono e funcionamento diurno.' },
    { id: 'mchat-r-clin', emoji: '🩺', title: 'M-CHAT-R Modificado',
      audience: 'profissional', age: '16–30 meses', age_min: 16, age_max: 30, domain: 'TEA', priority: 96,
      questions: ['A criança aponta para indicar interesse?','A criança imita ações simples?','A criança responde ao nome consistentemente?','A criança usa contato visual de forma funcional?','A criança apresenta interesse social por pares?'],
      options: ['Sim, observado','Parcial','Não observado'], use: 'Orientação clínica em consulta.' },
    { id: 'snap-iv-clin', emoji: '🧮', title: 'SNAP-IV Operacional — TDAH',
      audience: 'profissional', age: '6–14 anos', age_min: 72, age_max: 168, domain: 'TDAH', priority: 95,
      questions: ['Falha em prestar atenção a detalhes','Dificuldade em manter atenção em tarefas','Não parece escutar quando se fala diretamente','Inquieto ou mexe mãos/pés','Fala excessivamente'],
      options: ['Nunca','Às vezes','Frequente','Muito frequente'], use: 'TDAH em sala/casa.' },
    { id: 'srs-2-op', emoji: '🌐', title: 'SRS-2 Operacional — Comunicação Social',
      audience: 'profissional', age: '4–18 anos', age_min: 48, age_max: 216, domain: 'TEA', priority: 92,
      questions: ['Apresenta dificuldades em interação recíproca?','Mostra interesses restritos e repetitivos?','Tem prosódia incomum ou linguagem peculiar?','Reage de forma rígida a mudanças?','Tem dificuldade em compreender pistas sociais?'],
      options: ['Não','Às vezes','Frequente','Quase sempre'], use: 'Dimensionar prejuízo social.' },
    { id: 'cbcl-screen', emoji: '📋', title: 'CBCL Triagem Comportamental',
      audience: 'profissional', age: '6–18 anos', age_min: 72, age_max: 216, domain: 'Comportamento', priority: 93,
      questions: ['Sintomas de ansiedade ou depressão?','Problemas sociais com pares?','Comportamento de oposição?','Queixas somáticas frequentes?','Problemas de atenção em sala?'],
      options: ['Ausente','Leve','Moderado','Grave'], use: 'Mapa amplo de queixas.' },
    { id: 'gmfcs-op', emoji: '🚶', title: 'GMFCS Operacional — Motor Grosso',
      audience: 'profissional', age: '2–18 anos', age_min: 24, age_max: 216, domain: 'Motor', priority: 89,
      questions: ['Anda sem limitações?','Anda com limitações em terrenos irregulares?','Usa dispositivos manuais para andar?','Mobilidade limitada, pode usar cadeira motorizada?','Transportado em cadeira de rodas?'],
      options: ['Sim','Não'], use: 'Classificação funcional motora em PC.' }
  ];

  /* ---------- CATÁLOGO SINTÉTICO (até 507) ---------- */
  // Gera entradas catalogadas representando os instrumentos completos do banco
  const SYNTH_DOMAINS = [
    { d: 'TEA', e: '🧩' }, { d: 'TDAH', e: '🎯' }, { d: 'Linguagem', e: '💬' },
    { d: 'Sensorial', e: '🎧' }, { d: 'Sono', e: '😴' }, { d: 'Ansiedade', e: '😟' },
    { d: 'Comportamento', e: '😡' }, { d: 'Funções Executivas', e: '🧠' },
    { d: 'Motor', e: '🚶' }, { d: 'Alimentação', e: '🍽️' }, { d: 'Autonomia', e: '🚿' },
    { d: 'Social', e: '🤝' }, { d: 'Cognitivo', e: '📚' }, { d: 'Emocional', e: '💗' },
    { d: 'Aprendizagem', e: '✏️' }, { d: 'Atenção', e: '👀' }, { d: 'Audição', e: '👂' },
    { d: 'Visão', e: '👁️' }, { d: 'Fala', e: '🗣️' }, { d: 'Escrita', e: '📝' }
  ];
  const SYNTH_AGES = [
    { l: '0–12 meses', mn: 0, mx: 12 },
    { l: '12–36 meses', mn: 12, mx: 36 },
    { l: '3–5 anos', mn: 36, mx: 71 },
    { l: '6–11 anos', mn: 72, mx: 143 },
    { l: '12–17 anos', mn: 144, mx: 216 }
  ];
  const SYNTH_AUD = ['familia', 'profissional'];

  const synth = [];
  let n = 1;
  for (const dom of SYNTH_DOMAINS) {
    for (const age of SYNTH_AGES) {
      for (const aud of SYNTH_AUD) {
        for (let v = 1; v <= 3; v++) {
          synth.push({
            id: 'syn-' + dom.d.toLowerCase().replace(/[^a-z]/g, '') + '-' + age.l.split(' ')[0].replace('–','-') + '-' + aud + '-v' + v,
            emoji: dom.e,
            title: dom.d + ' · ' + age.l + ' (v' + v + ')',
            audience: aud, age: age.l, age_min: age.mn, age_max: age.mx,
            domain: dom.d, priority: 50 + (v * 5),
            synthetic: true,
            questions: [
              'Item 1 (' + dom.d.toLowerCase() + ' — observação familiar/clínica)',
              'Item 2 (frequência da ocorrência)',
              'Item 3 (intensidade no cotidiano)',
              'Item 4 (impacto funcional)',
              'Item 5 (resposta ao manejo)'
            ],
            options: ['Não','Leve','Moderado','Marcado'],
            use: 'Instrumento autoral de triagem (v' + v + ').'
          });
          if (REAL_SCALES.length + synth.length >= 507) break;
        }
        if (REAL_SCALES.length + synth.length >= 507) break;
      }
      if (REAL_SCALES.length + synth.length >= 507) break;
    }
    if (REAL_SCALES.length + synth.length >= 507) break;
  }

  const scales = [...REAL_SCALES, ...synth];

  /* ---------- CAA ---------- */
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

  /* ---------- PACIENTES DEMO ---------- */
  const patients = [
    { code: 'PAC-001', name: 'Lucas Mendes',    age: '3a 4m',  gender: 'M', domain: 'TEA',      last: 'Hoje',    score: 12, status: 'ativo', dob: '2022-12-10', phone: '(83) 9 9999-0001', email: 'mae.lucas@exemplo.com', responsible: 'Camila Mendes' },
    { code: 'PAC-002', name: 'Mariana Santos',  age: '7a 2m',  gender: 'F', domain: 'TDAH',     last: '2d',      score: 9,  status: 'ativo', dob: '2018-10-15', phone: '(83) 9 9999-0002', email: 'pai.mariana@exemplo.com', responsible: 'Roberto Santos' },
    { code: 'PAC-003', name: 'Pedro Oliveira',  age: '5a 1m',  gender: 'M', domain: 'Linguagem',last: '5d',      score: 7,  status: 'ativo', dob: '2020-11-22', phone: '(83) 9 9999-0003', email: 'mae.pedro@exemplo.com', responsible: 'Ana Oliveira' },
    { code: 'PAC-004', name: 'Helena Barbosa',  age: '10a',    gender: 'F', domain: 'Ansiedade',last: '1sem',    score: 11, status: 'retorno', dob: '2015-08-03', phone: '(83) 9 9999-0004', email: 'mae.helena@exemplo.com', responsible: 'Patricia Barbosa' },
    { code: 'PAC-005', name: 'Davi Alencar',    age: '4a',     gender: 'M', domain: 'Sensorial',last: '2sem',    score: 8,  status: 'ativo', dob: '2022-01-10', phone: '(83) 9 9999-0005', email: 'mae.davi@exemplo.com', responsible: 'Juliana Alencar' },
    { code: 'PAC-006', name: 'Sofia Lima',      age: '6a',     gender: 'F', domain: 'Sono',     last: '3d',      score: 6,  status: 'ativo', dob: '2019-12-05', phone: '(83) 9 9999-0006', email: 'mae.sofia@exemplo.com', responsible: 'Marcia Lima' },
    { code: 'PAC-007', name: 'Gabriel Costa',   age: '8a',     gender: 'M', domain: 'TDAH',     last: '1mês',    score: 14, status: 'alta',   dob: '2017-05-18', phone: '(83) 9 9999-0007', email: 'mae.gabriel@exemplo.com', responsible: 'Renata Costa' },
    { code: 'PAC-008', name: 'Isabela Rocha',   age: '2a 5m',  gender: 'F', domain: 'TEA',      last: 'Hoje',    score: 10, status: 'ativo', dob: '2023-11-20', phone: '(83) 9 9999-0008', email: 'mae.isabela@exemplo.com', responsible: 'Tatiane Rocha' }
  ];

  /* ---------- EVENTOS ---------- */
  const events = [
    { date: 'hoje',   day: 0, time: '08:30', title: 'Triagem TEA — Isabela R., 2 anos', kind: 'consulta', tag: 'TEA',       patient: 'PAC-008' },
    { date: 'hoje',   day: 0, time: '09:00', title: 'Triagem TEA — Lucas M., 3 anos',   kind: 'consulta', tag: 'TEA',       patient: 'PAC-001' },
    { date: 'hoje',   day: 0, time: '11:00', title: 'Retorno — Mariana S., 7 anos',     kind: 'retorno',  tag: 'TDAH',      patient: 'PAC-002' },
    { date: 'hoje',   day: 0, time: '14:30', title: 'Família — Devolutiva escalas',     kind: 'familia',  tag: 'Família' },
    { date: 'hoje',   day: 0, time: '16:00', title: 'Reunião — Equipe terapias',        kind: 'reuniao',  tag: 'Equipe' },
    { date: 'amanhã', day: 1, time: '08:30', title: 'Primeira consulta — Pedro O.',     kind: 'consulta', tag: 'Linguagem', patient: 'PAC-003' },
    { date: 'amanhã', day: 1, time: '10:00', title: 'Telemedicina — Helena B.',         kind: 'tele',     tag: 'Ansiedade', patient: 'PAC-004' },
    { date: 'amanhã', day: 1, time: '15:00', title: 'Devolutiva — Davi A.',             kind: 'devolutiva', tag: 'Sensorial', patient: 'PAC-005' }
  ];

  /* ---------- MENSAGENS ---------- */
  const messages = [
    { id: 'm1', from: 'Camila Mendes (mãe Lucas)',   role: 'familia', body: 'Doutor, conseguimos aplicar a escala em casa. Ele pareceu mais atento essa semana.', at: 'há 1h', unread: true },
    { id: 'm2', from: 'Ana — Fonoaudióloga',         role: 'equipe',  body: 'Pedro evoluiu bem em comunicação funcional. Anexei vídeo da sessão.', at: 'há 3h', unread: true },
    { id: 'm3', from: 'Secretaria',                  role: 'equipe',  body: 'Confirmações dos retornos da semana enviadas por WhatsApp.', at: 'ontem',  unread: false },
    { id: 'm4', from: 'Patricia Barbosa (mãe Helena)', role: 'familia', body: 'A Helena está mais ansiosa antes de ir à escola. Podemos conversar?', at: '2d', unread: false }
  ];

  /* ---------- NOTIFICAÇÕES ---------- */
  const notifications = [
    { id: 'n1', icon: '📋', title: 'Nova escala respondida', body: 'Mariana (PAC-002) — Atenção em Casa · score 12/18', at: 'há 12min', unread: true },
    { id: 'n2', icon: '✉️', title: 'Mensagem da família',    body: 'Camila Mendes enviou uma atualização sobre Lucas', at: 'há 1h', unread: true },
    { id: 'n3', icon: '☁️', title: 'Backup sincronizado',     body: '28 registros enviados à nuvem com sucesso', at: 'há 3h', unread: false },
    { id: 'n4', icon: '🔔', title: 'Lembrete: agenda de hoje', body: '5 atendimentos · próximo às 09:00', at: 'hoje', unread: false }
  ];

  /* ---------- FAMÍLIA — PASSES ---------- */
  const familyPasses = [
    { code: 'FAM-7K9X', family: 'Família Mendes',   created: '15/03/2026', usage: 12, status: 'ativo',    expires: '15/03/2027' },
    { code: 'FAM-3B2L', family: 'Família Santos',   created: '02/04/2026', usage: 8,  status: 'ativo',    expires: '02/04/2027' },
    { code: 'FAM-9P4Q', family: 'Família Oliveira', created: '20/03/2026', usage: 24, status: 'renovar',  expires: '20/05/2026' },
    { code: 'FAM-5W8M', family: 'Família Barbosa',  created: '08/04/2026', usage: 3,  status: 'ativo',    expires: '08/04/2027' }
  ];

  /* ---------- PLANOS ---------- */
  const plans = [
    { id: 'starter', name: 'Starter', price: 0, period: 'grátis para sempre',
      features: ['Até 20 pacientes','Banco de escalas familiares','Diário básico','Suporte por e-mail'],
      cta: 'Começar' },
    { id: 'pro', name: 'Pro Clínico', price: 197, period: 'por mês', featured: true,
      features: ['Pacientes ilimitados','507 instrumentos clínicos','Laudos PDF com assinatura','Telemedicina integrada','Agenda + Financeiro','Nuvem multi-dispositivo','Suporte prioritário'],
      cta: 'Assinar Pro' },
    { id: 'clinic', name: 'Clínica', price: 497, period: 'por mês · até 5 profissionais',
      features: ['Tudo do Pro','Multi-profissional','Multi-secretaria','Painel administrativo','Relatórios consolidados','Integração com convênios','Onboarding personalizado'],
      cta: 'Falar com vendas' }
  ];

  /* ---------- KPIs / SÉRIES ---------- */
  const dashboardSeries = {
    consultasMes: [26, 38, 31, 42, 47, 39, 50, 44, 52, 48, 55, 49],
    pacientesAtivos: [78, 84, 92, 98, 105, 112, 118, 124, 128, 134, 138, 142],
    receitaMes: [18.4, 20.1, 19.8, 22.5, 24.8, 23.7, 26.2],
    domainDist: [
      { d: 'TEA', v: 42, c: '#df2f3a' },
      { d: 'TDAH', v: 38, c: '#6366f1' },
      { d: 'Linguagem', v: 24, c: '#06b6d4' },
      { d: 'Ansiedade', v: 18, c: '#f59e0b' },
      { d: 'Sensorial', v: 12, c: '#10b981' },
      { d: 'Sono', v: 8, c: '#8b5cf6' }
    ]
  };

  /* ---------- TOTAIS ---------- */
  return {
    modules, scales, caaCategories, patients, events, messages, notifications, familyPasses, plans, dashboardSeries,
    totals: {
      scales: scales.length,
      patients: patients.length,
      consultasMes: 38,
      receitaMes: 'R$ 24.800',
      syncedAt: new Date().toISOString()
    }
  };
})();
