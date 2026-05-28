/* ==========================================================
   NeuroPed EDJ v5.0 — Base de dados (modo único + PIN gate)
   ========================================================== */

const NEUROPED = (() => {

  /* ---------- MÓDULOS (público vs profissional) ---------- */
  const modules = [
    // PÚBLICO — educacional e marketing
    { id: 'inicio',       title: 'Início',                sub: 'Boas-vindas',                    icon: '⌂', locked: false },
    { id: 'sobre',        title: 'Sobre o Dr. Jadson',    sub: 'Formação e atuação',             icon: '★', locked: false },
    { id: 'escalas',      title: 'Escalas familiares',    sub: 'Triagem para famílias · livre',  icon: '≡', locked: false },
    { id: 'caa',          title: 'CAA',                   sub: 'Comunicação alternativa',        icon: '◉', locked: false },
    { id: 'materiais',    title: 'Materiais educativos',  sub: 'Para famílias e escolas',        icon: '📘', locked: false },
    { id: 'marcos',       title: 'Marcos do desenvolvimento', sub: 'Por faixa etária',            icon: '🌱', locked: false },
    { id: 'calculadoras', title: 'Calculadoras',          sub: 'Doses, IMC, percentis',          icon: '🧮', locked: false },
    { id: 'contato',      title: 'Agendar consulta',      sub: 'WhatsApp e contato',             icon: '📞', locked: false },
    // PROFISSIONAL — bloqueado por PIN MASTER
    { id: 'pacientes',    title: 'Pacientes',             sub: 'CRM e prontuário',               icon: '☺', locked: true },
    { id: 'consultas',    title: 'Consultas',             sub: 'Atendimentos',                   icon: '+', locked: true },
    { id: 'laudos',       title: 'Laudos',                sub: 'Geração PDF',                    icon: '✎', locked: true },
    { id: 'agenda',       title: 'Agenda clínica',        sub: 'Calendário e lembretes',         icon: '▦', locked: true },
    { id: 'financeiro',   title: 'Financeiro',            sub: 'Receita e cobrança',             icon: '$', locked: true },
    { id: 'mensagens',    title: 'Mensagens',             sub: 'Equipe e família',               icon: '✉', locked: true },
    { id: 'escalas-pro',  title: 'Escalas clínicas',      sub: 'Instrumentos profissionais',     icon: '🩺', locked: true },
    { id: 'config',       title: 'Configurações',         sub: 'Conta, nuvem, LGPD',             icon: '⚙', locked: true }
  ];

  /* ---------- ESCALAS FAMILIARES (PÚBLICAS — educacionais) ---------- */
  const familyScales = [
    { id: 'tea-precoce', emoji: '🌱', title: 'Primeiros Sinais TEA — Olhar, Nome e Brincar',
      audience: 'familia', age: '12–36 meses', age_min: 12, age_max: 36, domain: 'TEA', priority: 99,
      questions: ['Ele olha quando você chama pelo nome?','Ele mostra o que quer usando gestos?','Ele brinca de forma simples com você?','Ele se incomoda muito com barulhos?','Ele usa sons ou palavras para pedir algo?'],
      options: ['Quase sempre','Às vezes','Quase nunca'], use: 'Triagem familiar inicial.' },
    { id: 'fala-inicial', emoji: '🗣️', title: 'Fala Inicial — Pedidos, Gestos e Sons',
      audience: 'familia', age: '12–36 meses', age_min: 12, age_max: 36, domain: 'Linguagem', priority: 97,
      questions: ['Ele tenta pedir algo com som, gesto ou olhar?','Ele aponta para o que quer?','Ele imita sons ou palavras simples?','Ele entende ordens simples como dá ou pega?','Ele chama alguém quando precisa de ajuda?'],
      options: ['Quase sempre','Às vezes','Quase nunca'], use: 'Mapear comunicação inicial.' },
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
      options: ['Quase sempre','Às vezes','Quase nunca'], use: 'Comunicação funcional no pré-escolar.' },
    { id: 'crises-frustracao', emoji: '🌪️', title: 'Crises e Frustração — Birras e Transições',
      audience: 'familia', age: '3–5 anos', age_min: 36, age_max: 71, domain: 'Comportamento', priority: 95,
      questions: ['Ele chora muito quando algo muda?','Ele se joga, bate ou morde durante crises?','Ele consegue esperar por pouco tempo?','Ele aceita trocar de atividade?','Depois da crise, ele consegue se acalmar com ajuda?'],
      options: ['Sempre','Às vezes','Raramente'], use: 'Distinguir birra de desregulação.' },
    { id: 'sensorial-diario', emoji: '🎧', title: 'Sensorial Diário — Barulho, Toque e Luz',
      audience: 'familia', age: '3–5 anos', age_min: 36, age_max: 71, domain: 'Sensorial', priority: 94,
      questions: ['Ele tapa os ouvidos com barulhos comuns?','Ele evita certos tecidos ou etiquetas?','Ele se incomoda com luz forte?','Ele busca girar, pular ou se apertar?','As reações sensoriais atrapalham a rotina?'],
      options: ['Sempre','Às vezes','Raramente'], use: 'Queixas sensoriais.' },
    { id: 'autonomia-inicial', emoji: '🚽', title: 'Autonomia Inicial — Banheiro e Higiene',
      audience: 'familia', age: '3–5 anos', age_min: 36, age_max: 71, domain: 'Autonomia', priority: 88,
      questions: ['Ele avisa quando quer ir ao banheiro?','Ele ajuda a vestir ou tirar roupa?','Ele lava as mãos com ajuda?','Ele participa da escovação dos dentes?','Ele entende pequenas rotinas de cuidado?'],
      options: ['Quase sempre','Às vezes','Quase nunca'], use: 'AVDs iniciais.' },
    { id: 'flexibilidade-rotina', emoji: '🧩', title: 'Flexibilidade e Rotina',
      audience: 'familia', age: '3–5 anos', age_min: 36, age_max: 71, domain: 'TEA', priority: 90,
      questions: ['Ele aceita pequenas mudanças na rotina?','Ele insiste em fazer sempre do mesmo jeito?','Ele consegue esperar com apoio visual?','Ele tolera perder ou dividir?','A rigidez atrapalha passeios ou escola?'],
      options: ['Sempre','Às vezes','Raramente'], use: 'Inflexibilidade adaptativa.' },
    { id: 'atencao-casa', emoji: '📚', title: 'Atenção em Casa — Começar, Manter e Terminar',
      audience: 'familia', age: '6–11 anos', age_min: 72, age_max: 143, domain: 'TDAH', priority: 97,
      questions: ['Ele começa a tarefa sem muita resistência?','Ele termina o que começou?','Ele se distrai com qualquer coisa?','Ele esquece instruções em poucos minutos?','A lição de casa demora mais que o esperado?'],
      options: ['Quase sempre','Às vezes','Quase nunca'], use: 'Atenção e execução.' },
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
      options: ['Sempre','Às vezes','Raramente'], use: 'Oposição e limites.' },
    { id: 'sono-escolar', emoji: '🛏️', title: 'Sono Escolar — Horário e Cansaço',
      audience: 'familia', age: '6–11 anos', age_min: 72, age_max: 143, domain: 'Sono', priority: 88,
      questions: ['Ele dorme no horário combinado?','Ele acorda cansado?','Ele ronca ou respira mal?','Ele usa telas perto da hora de dormir?','O sono ruim piora atenção ou humor?'],
      options: ['Sempre','Às vezes','Raramente'], use: 'Sono e funcionamento diurno.' }
  ];

  /* ---------- ESCALAS PROFISSIONAIS (LOCKED) ---------- */
  const proScales = [
    { id: 'mchat-r-clin', emoji: '🩺', title: 'M-CHAT-R Modificado — Operacional',
      audience: 'profissional', age: '16–30 meses', age_min: 16, age_max: 30, domain: 'TEA', priority: 96,
      questions: ['A criança aponta para indicar interesse?','A criança imita ações simples?','A criança responde ao nome consistentemente?','A criança usa contato visual de forma funcional?','A criança apresenta interesse social por pares?','Há regressão de habilidades adquiridas?','Há estereotipias motoras?'],
      options: ['Sim observado','Parcial','Não observado'], use: 'Triagem clínica TEA.' },
    { id: 'snap-iv-clin', emoji: '🧮', title: 'SNAP-IV Operacional — TDAH',
      audience: 'profissional', age: '6–14 anos', age_min: 72, age_max: 168, domain: 'TDAH', priority: 95,
      questions: ['Falha em prestar atenção a detalhes','Dificuldade em manter atenção em tarefas','Não parece escutar quando se fala diretamente','Inquieto ou mexe mãos/pés','Fala excessivamente','Interrompe ou se intromete','Tem dificuldade em esperar a vez'],
      options: ['Nunca','Às vezes','Frequente','Muito frequente'], use: 'TDAH em sala/casa.' },
    { id: 'srs-2-op', emoji: '🌐', title: 'SRS-2 Operacional — Comunicação Social',
      audience: 'profissional', age: '4–18 anos', age_min: 48, age_max: 216, domain: 'TEA', priority: 92,
      questions: ['Apresenta dificuldades em interação recíproca?','Mostra interesses restritos e repetitivos?','Tem prosódia incomum ou linguagem peculiar?','Reage de forma rígida a mudanças?','Tem dificuldade em compreender pistas sociais?'],
      options: ['Não','Às vezes','Frequente','Quase sempre'], use: 'Dimensionar prejuízo social.' },
    { id: 'cbcl-screen', emoji: '📋', title: 'CBCL — Triagem Comportamental',
      audience: 'profissional', age: '6–18 anos', age_min: 72, age_max: 216, domain: 'Comportamento', priority: 93,
      questions: ['Sintomas de ansiedade ou depressão?','Problemas sociais com pares?','Comportamento de oposição?','Queixas somáticas frequentes?','Problemas de atenção em sala?'],
      options: ['Ausente','Leve','Moderado','Grave'], use: 'Mapa amplo de queixas.' },
    { id: 'gmfcs-op', emoji: '🚶', title: 'GMFCS Operacional — Motor Grosso',
      audience: 'profissional', age: '2–18 anos', age_min: 24, age_max: 216, domain: 'Motor', priority: 89,
      questions: ['Anda sem limitações?','Anda com limitações em terrenos irregulares?','Usa dispositivos manuais para andar?','Mobilidade limitada, pode usar cadeira motorizada?','Transportado em cadeira de rodas?'],
      options: ['Sim','Não'], use: 'Classificação funcional motora em PC.' }
  ];

  // Combina e exporta — público + locked
  const scales = [...familyScales, ...proScales];

  /* ---------- CAA (PÚBLICO) ---------- */
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

  /* ---------- MATERIAIS EDUCATIVOS (PÚBLICO) ---------- */
  const materiais = [
    { e: '📘', t: 'Manual do desfralde', sub: 'Guia em 8 passos para famílias', tag: 'Autonomia', body: 'O desfralde é uma das transições mais importantes na primeira infância. Ele exige paciência, observação dos sinais de prontidão (avisar antes, segurar a fralda seca por mais tempo, interesse pelo banheiro) e consistência. Recomenda-se iniciar geralmente entre 24 e 30 meses, em períodos de menor stress familiar. Evite cobrança e privilegie elogio.' },
    { e: '🎧', t: 'Sensorial em casa', sub: 'Dicas práticas por ambiente', tag: 'Sensorial', body: 'Crianças com perfil sensorial atípico se beneficiam de adaptações simples: redução de ruído na sala (tapetes, almofadas), iluminação suave, etiquetas removidas das roupas, opções de texturas alimentares variadas. Cantos de calma, com almofadas e luz baixa, ajudam na auto-regulação.' },
    { e: '😴', t: 'Higiene do sono', sub: 'Rotina visual para crianças', tag: 'Sono', body: 'Sono de qualidade depende de rotina previsível: banho morno, leitura, luz baixa 1h antes, telas desligadas, horário consistente. O ambiente deve ser fresco, escuro e silencioso. Em crianças neurodivergentes, considere objetos de transição e quadro de rotina visual.' },
    { e: '🍽️', t: 'Seletividade alimentar', sub: 'Estratégias gentis', tag: 'Alimentação', body: 'Seletividade pode ser sensorial, comportamental ou mista. Estratégias úteis: oferecer sem pressionar, exposição repetida (15-20 vezes), envolver a criança no preparo, evitar barganhas e gratificações condicionadas. Encaminhar fonoaudiologia/terapia ocupacional quando persistente.' },
    { e: '🧠', t: 'TDAH em casa', sub: 'Organização e foco', tag: 'TDAH', body: 'Estrutura visual (quadro de rotina), tarefas curtas, pausas frequentes, instruções diretas em uma etapa. Reduzir distratores no momento da tarefa (TV, brinquedos). Reforço positivo imediato funciona melhor que punição. Movimento autorizado entre tarefas ajuda a sustentar atenção.' },
    { e: '💬', t: 'CAA — quando começar', sub: 'Comunicação alternativa', tag: 'Linguagem', body: 'CAA (Comunicação Aumentativa e Alternativa) não atrasa a fala — ao contrário, é cientificamente comprovada como facilitadora. Indique CAA quando a criança apresenta dificuldade persistente em comunicar necessidades por fala, mesmo em terapia. Pictogramas, apps e gestos personalizados funcionam.' },
    { e: '🎓', t: 'Adaptações escolares', sub: 'Para professores e famílias', tag: 'Escola', body: 'Adaptações simples: posicionamento na frente da sala, instruções escritas além das verbais, tempo estendido em avaliações, intervalo extra para auto-regulação, plano educacional individualizado (PEI) quando indicado. A comunicação família-escola-clínica é essencial.' },
    { e: '🌱', t: 'Marcos do desenvolvimento', sub: 'Sinais de alerta', tag: 'Desenvolvimento', body: 'Sinais que merecem avaliação especializada: não sorri socialmente aos 4 meses, não responde ao nome aos 12 meses, não fala palavras aos 16 meses, não combina palavras aos 24 meses, perda de habilidades adquiridas em qualquer idade. Detecção precoce muda o prognóstico.' }
  ];

  /* ---------- MARCOS DO DESENVOLVIMENTO (PÚBLICO) ---------- */
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

  /* ---------- DADOS PROFISSIONAIS (LOCKED) ---------- */
  const patients = [
    { code: 'PAC-001', name: 'Paciente Demo 1', age: '3a 4m', gender: 'M', domain: 'TEA',      last: 'Hoje', score: 12, status: 'ativo', dob: '2022-12-10', phone: '(83) 9 9999-0001', email: '', responsible: 'Responsável Demo' },
    { code: 'PAC-002', name: 'Paciente Demo 2', age: '7a 2m', gender: 'F', domain: 'TDAH',     last: '2d',   score: 9,  status: 'ativo', dob: '2018-10-15', phone: '(83) 9 9999-0002', email: '', responsible: 'Responsável Demo' },
    { code: 'PAC-003', name: 'Paciente Demo 3', age: '5a 1m', gender: 'M', domain: 'Linguagem', last: '5d',  score: 7,  status: 'ativo', dob: '2020-11-22', phone: '(83) 9 9999-0003', email: '', responsible: 'Responsável Demo' }
  ];

  const events = [
    { date: 'hoje',   day: 0, time: '09:00', title: 'Demo — Triagem TEA',     kind: 'consulta', tag: 'TEA',  patient: 'PAC-001' },
    { date: 'hoje',   day: 0, time: '11:00', title: 'Demo — Retorno TDAH',    kind: 'retorno',  tag: 'TDAH', patient: 'PAC-002' },
    { date: 'amanhã', day: 1, time: '08:30', title: 'Demo — Primeira consulta', kind: 'consulta', tag: 'Linguagem', patient: 'PAC-003' }
  ];

  const messages = [
    { id: 'm1', from: 'Demo Família',  role: 'familia', body: 'Doutor, conseguimos aplicar a escala em casa essa semana.', at: 'há 1h', unread: true },
    { id: 'm2', from: 'Demo Terapeuta', role: 'equipe', body: 'Sessão de hoje correu bem, paciente colaborativo.', at: 'há 3h', unread: false }
  ];

  const dashboardSeries = {
    consultasMes: [26, 38, 31, 42, 47, 39, 50, 44, 52, 48, 55, 49],
    pacientesAtivos: [78, 84, 92, 98, 105, 112, 118, 124, 128, 134, 138, 142],
    receitaMes: [18.4, 20.1, 19.8, 22.5, 24.8, 23.7, 26.2],
    domainDist: [
      { d: 'TEA', v: 42, c: '#df2f3a' }, { d: 'TDAH', v: 38, c: '#6366f1' },
      { d: 'Linguagem', v: 24, c: '#06b6d4' }, { d: 'Ansiedade', v: 18, c: '#f59e0b' },
      { d: 'Sensorial', v: 12, c: '#10b981' }, { d: 'Sono', v: 8, c: '#8b5cf6' }
    ]
  };

  /* ---------- DR. JADSON — perfil profissional ---------- */
  const doutor = {
    nome: 'Dr. Jadson Fraga Araújo Júnior',
    titulo: 'Neuropediatra',
    crm: 'CRM-PE 25227',
    rqe: 'RQE 17756',
    cidades: ['Petrolina-PE', 'Juazeiro-BA'],
    whatsapp: '5587960970280',
    instagram: 'drjadsonfraga',
    areas: [
      { e: '🧩', t: 'Transtorno do Espectro Autista (TEA)', sub: 'Diagnóstico, acompanhamento e devolutiva orientadora' },
      { e: '🎯', t: 'TDAH e Funções Executivas',           sub: 'Avaliação multidimensional e plano terapêutico' },
      { e: '💬', t: 'Atrasos de Linguagem',                sub: 'Desde primeiros sinais até CAA' },
      { e: '😟', t: 'Ansiedade Infantil',                  sub: 'Triagem, manejo e orientação familiar' },
      { e: '😴', t: 'Distúrbios do Sono',                  sub: 'Higiene do sono, ronco, despertares' },
      { e: '🎧', t: 'Perfil Sensorial',                    sub: 'Adaptação domiciliar e escolar' },
      { e: '🚶', t: 'Atrasos motores',                     sub: 'Coordenação e marcos motores' },
      { e: '🌱', t: 'Marcos do desenvolvimento',           sub: 'Acompanhamento longitudinal' }
    ]
  };

  return {
    modules, scales, familyScales, proScales, caaCategories, materiais, marcos,
    patients, events, messages, dashboardSeries, doutor,
    totals: {
      scalesPublicas: familyScales.length,
      scalesPro: proScales.length,
      modulosPublicos: modules.filter(m => !m.locked).length,
      modulosPro: modules.filter(m => m.locked).length
    }
  };
})();
