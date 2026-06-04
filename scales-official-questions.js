/* NeuroPed EDJ — Camada autoral + proveniência para instrumentos de referência
 * ---------------------------------------------------------------------------
 * Os instrumentos oficiais de terceiros (M-CHAT, SDQ, Vanderbilt, ASQ, C-SSRS,
 * PROMIS, NeuroQoL…) são catalogados como REFERÊNCIA e NÃO reproduzem seus itens
 * protegidos por direito autoral. Para que (a) ABRAM completos e lógicos e (b)
 * APAREÇAM no filtro por queixa, este módulo injeta, para cada um que esteja sem
 * conteúdo próprio:
 *   1) perguntas-guia AUTORAIS NeuroPed sobre o MESMO construto — redigidas do
 *      zero, NÃO são os itens do instrumento original;
 *   2) metadados de filtragem (complaints/keywords/symptoms) por construto;
 *   3) proveniência honesta: classificação de licença + link da fonte oficial.
 *
 * Roda por ÚLTIMO no bundle (após todo o catálogo carregar).
 */
(function () {
  'use strict';
  if (window.NEUROPED_OFFICIAL_QUESTIONS_LOADED) return;
  window.NEUROPED_OFFICIAL_QUESTIONS_LOADED = true;

  function norm(s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function uniq(a) { var s = {}, o = []; a.forEach(function (x) { if (x && !s[x]) { s[x] = 1; o.push(x); } }); return o; }

  // Perguntas-guia AUTORAIS por construto (conteúdo próprio, não itens originais).
  var BANK = {
    tea: [
      'A criança responde quando você chama o nome dela, mesmo de longe?',
      'Olha nos seus olhos durante a interação do dia a dia?',
      'Aponta ou mostra coisas para compartilhar interesse com você?',
      'Segue o seu apontar quando você mostra algo ("olha lá!")?',
      'Brinca de faz-de-conta (dar comida ao boneco, fingir cozinhar)?',
      'Imita gestos, caretas ou ações simples?',
      'Repete falas, sons ou movimentos de forma marcante?',
      'Alinha, gira ou usa objetos sempre da mesma maneira?',
      'Incomoda-se muito com mudanças de rotina ou imprevistos?',
      'Prefere brincar sozinha a interagir com outras crianças?'
    ],
    tdah: [
      'Tem dificuldade de manter a atenção até terminar uma tarefa?',
      'Parece "no mundo da lua" ou não escuta quando falam com ela?',
      'Distrai-se com facilidade com qualquer estímulo ao redor?',
      'Agita-se, levanta ou não para quieta em momentos que pedem calma?',
      'Mexe-se sem parar (mãos, pés, na cadeira) com frequência?',
      'Age por impulso, sem esperar ou pensar nas consequências?',
      'Interrompe, responde antes da hora ou tem dificuldade de esperar a vez?',
      'Esquece recados, perde materiais ou se desorganiza com frequência?',
      'Evita ou adia tarefas que exigem esforço mental continuado?',
      'O comportamento melhora bastante quando há rotina e apoio próximo?'
    ],
    aprendizagem: [
      'Tem dificuldade para reconhecer ou nomear letras e números?',
      'Confunde letras parecidas (b/d, p/q) ao ler ou escrever?',
      'Lê mais devagar, soletrando ou com mais erros que os colegas?',
      'Tem dificuldade de entender o que acabou de ler?',
      'Troca, omite ou junta letras ao escrever ou no ditado?',
      'Tem dificuldade com contas simples ou noção de quantidade?',
      'Demora muito para copiar do quadro ou organizar o caderno?',
      'Evita atividades de leitura, escrita ou lição de casa?',
      'O desempenho está abaixo do esperado para a série?',
      'A dificuldade escolar afeta a autoestima ou o ânimo dela?'
    ],
    linguagem: [
      'Demorou para começar a falar palavras ou frases?',
      'Usa menos palavras do que o esperado para a idade?',
      'Troca ou omite sons, tornando a fala difícil de entender?',
      'Pessoas de fora da família entendem o que ela fala?',
      'Tem dificuldade de entender ordens com duas etapas?',
      'Usa mais gestos do que palavras para se comunicar?',
      'Junta palavras em frases compatíveis com a idade?',
      'Tem dificuldade de contar o que aconteceu no dia?',
      'Mantém uma conversa simples, esperando a vez de falar?',
      'A dificuldade de fala atrapalha a interação com outras pessoas?'
    ],
    ansiedade: [
      'Preocupa-se demais com coisas do dia a dia, mais que outras crianças?',
      'Evita situações, lugares ou pessoas por medo ou insegurança?',
      'Tem dificuldade de se separar dos pais sem grande sofrimento?',
      'Fica muito tímida ou paralisada em situações sociais ou de avaliação?',
      'Apresenta queixas físicas (dor de barriga, cabeça) sem causa clara?',
      'Tem medos específicos intensos (escuro, animais, médico)?',
      'Fica muito tensa, agitada ou irritada quando ansiosa?',
      'Busca reasseguramento repetidas vezes ("vai dar tudo certo?")?',
      'O medo ou a preocupação atrapalham a rotina, a escola ou o sono?',
      'Tem dificuldade de relaxar mesmo em momentos tranquilos?'
    ],
    humor: [
      'Tem estado triste, para baixo ou irritada na maior parte dos dias?',
      'Perdeu o interesse por brincadeiras ou coisas de que gostava?',
      'Mudou o apetite ou o sono de forma marcante?',
      'Queixa-se de cansaço, falta de energia ou desânimo?',
      'Tem dificuldade de se concentrar ou tomar decisões simples?',
      'Fala de si mesma de forma muito negativa ("não sirvo", "sou ruim")?',
      'Chora com facilidade ou parece sem esperança?',
      'A tristeza ou irritação atrapalha a escola e a convivência?',
      'Tem se isolado de amigos e da família?',
      'Houve alguma perda, mudança ou estresse recente importante?'
    ],
    risco: [
      'A criança/adolescente já falou em se machucar, sumir ou não querer viver?',
      'Houve algum gesto, plano ou tentativa de se machucar?',
      'Esses pensamentos têm aparecido com mais frequência ou intensidade?',
      'Ela consegue contar a alguém quando esses pensamentos aparecem?',
      'Existe acesso fácil a meios perigosos (remédios, objetos cortantes, armas) em casa?',
      'Houve uso de álcool ou outras substâncias associado a esses momentos?',
      'Ela consegue procurar um adulto de confiança quando está muito mal?',
      'Há adultos protetores disponíveis e atentos no dia a dia?',
      'Existem motivos de proteção que a ajudam (família, amigos, projetos)?',
      'O plano de segurança (quem chamar, o que fazer — CVV 188, SAMU 192) está combinado?'
    ],
    substancias: [
      'Houve uso de álcool, cigarro/vape ou outras substâncias?',
      'Com que frequência e desde quando isso acontece?',
      'O uso aconteceu para relaxar, se encaixar ou lidar com problemas?',
      'Já usou sozinho(a) ou logo cedo no dia?',
      'Amigos próximos ou familiares fazem uso frequente?',
      'O uso já causou problema na escola, em casa ou com a lei?',
      'Já esqueceu coisas ou se arriscou (dirigir, brigas) por causa do uso?',
      'Já tentou reduzir ou parar e teve dificuldade?',
      'Sente que precisa de quantidades maiores para o mesmo efeito?',
      'Há disposição para conversar sobre reduzir ou pedir ajuda?'
    ],
    motor: [
      'Atingiu os marcos motores (sentar, andar) no tempo esperado?',
      'Cai muito, tropeça ou parece desajeitada para a idade?',
      'Tem dificuldade para segurar o lápis, usar tesoura ou se vestir?',
      'A escrita é difícil, lenta ou pouco legível pelo esforço motor?',
      'Usa muito mais um lado do corpo que o outro?',
      'Apresenta rigidez, moleza ou movimentos involuntários?',
      'Tem dificuldade para pular, correr, chutar ou subir escadas?',
      'Cansa-se rápido em esforço físico comparada aos colegas?',
      'Precisa de apoio, órtese ou dispositivo para se locomover?',
      'A dificuldade motora limita brincar, escola ou autocuidado?'
    ],
    desenvolvimento: [
      'A criança está atingindo os marcos esperados para a idade?',
      'Já perdeu alguma habilidade que tinha (fala, gestos, contato)?',
      'Há diferença marcante entre o que faz e o esperado para a idade?',
      'Interage, sorri e responde socialmente como esperado?',
      'Compreende e usa a comunicação de forma compatível com a idade?',
      'Brinca e explora os objetos de maneira variada?',
      'Move-se e manipula objetos como esperado para a idade?',
      'Demonstra autonomia compatível (comer, vestir, avisar necessidades)?',
      'Os pais ou a escola têm preocupação sobre o desenvolvimento?',
      'Houve fatores de risco (prematuridade, intercorrências) na história?'
    ],
    comportamento: [
      'Desafia regras ou discute com adultos com frequência?',
      'Tem explosões de raiva intensas ou desproporcionais?',
      'Machuca pessoas, a si mesma ou quebra objetos quando frustrada?',
      'Tem dificuldade de aceitar limites e combinados simples?',
      'Irrita-se com facilidade, implica ou provoca os outros?',
      'Culpa os outros pelos próprios erros com frequência?',
      'Guarda rancor ou age para "se vingar"?',
      'O comportamento gera problemas em casa, na escola ou com amigos?',
      'Os episódios são mais intensos do que o esperado para a idade?',
      'Melhora com rotina previsível, reforço positivo e clareza de regras?'
    ],
    sono: [
      'Demora muito para adormecer na maioria das noites?',
      'Resiste ou faz birra na hora de dormir?',
      'Acorda várias vezes durante a noite?',
      'Ronca, faz pausas ou respira pela boca ao dormir?',
      'Tem pesadelos, terror noturno ou anda dormindo?',
      'Precisa de presença ou colo para voltar a dormir?',
      'Acorda cansada ou fica sonolenta durante o dia?',
      'A rotina e os horários de sono são muito irregulares?',
      'Usa telas até pouco antes de dormir?',
      'O sono ruim afeta o humor, a atenção ou a escola?'
    ],
    saude_mental_global: [
      'Há sinais de ansiedade, tristeza ou irritabilidade marcantes?',
      'Há dificuldades de atenção, agitação ou impulsividade?',
      'Há problemas de comportamento ou de aceitar limites?',
      'Há dificuldade de relacionamento com colegas ou família?',
      'Há queixas físicas frequentes sem causa clara?',
      'Há dificuldades de sono, apetite ou energia?',
      'O desempenho ou a participação na escola foram afetados?',
      'A criança consegue se divertir e se acalmar como antes?',
      'Esses sinais atrapalham a rotina, a escola ou a convivência?',
      'Houve mudança recente importante no jeito de ser da criança?'
    ],
    seguimento: [
      'Desde a última avaliação, os sintomas melhoraram, pioraram ou seguem iguais?',
      'A criança está conseguindo realizar a rotina (escola, sono, convívio)?',
      'O tratamento e as estratégias combinados estão sendo seguidos?',
      'Surgiram efeitos novos, colaterais ou dificuldades?',
      'A família percebe ganhos funcionais no dia a dia?',
      'A escola percebeu mudanças no período?',
      'As metas combinadas foram alcançadas, total ou parcialmente?',
      'Houve algum evento ou estresse novo desde o último contato?',
      'A adesão (consultas, terapias, medicação) está adequada?',
      'É preciso ajustar o plano ou encaminhar para avaliação?'
    ],
    trauma: [
      'Houve algum evento assustador, perda, acidente ou situação muito difícil?',
      'A criança revive a situação sem querer (pensamentos, imagens, pesadelos)?',
      'Evita lugares, pessoas ou assuntos que lembram o que aconteceu?',
      'Ficou mais assustada, alerta ou se sobressalta com facilidade?',
      'Tem dificuldade para dormir ou se concentrar desde o evento?',
      'O humor mudou (mais irritada, triste ou "desligada") após o ocorrido?',
      'Voltou a comportamentos de quando era menor (xixi na cama, muito apego)?',
      'Brinca repetidamente cenas ligadas ao que aconteceu?',
      'Esses sinais já duram mais de um mês?',
      'Isso atrapalha a escola, o sono ou a convivência?'
    ],
    dor: [
      'A criança sente dor com frequência? Onde costuma doer?',
      'De 0 a 10, qual costuma ser a intensidade da dor?',
      'A dor faz parar de brincar, estudar ou dormir?',
      'Com que frequência a dor aparece (diária, semanal, esporádica)?',
      'Há algo que parece desencadear (esforço, telas, jejum, estresse)?',
      'A dor vem com náusea, tontura ou incômodo com luz/barulho?',
      'A criança falta à escola por causa da dor?',
      'Algo costuma melhorar (repouso, remédio, ambiente escuro)?',
      'A dor mudou de padrão ou piorou recentemente?',
      'A dor atrapalha o humor e as atividades do dia a dia?'
    ],
    toc: [
      'Tem pensamentos repetitivos que incomodam e não saem da cabeça?',
      'Sente necessidade de repetir ações (lavar as mãos, conferir, arrumar) muitas vezes?',
      'Fica muito aflita se for impedida de fazer esses rituais?',
      'Precisa que as coisas estejam "do jeito certo", em ordem ou simétricas?',
      'Evita tocar em certas coisas por medo de germes ou sujeira?',
      'Repete perguntas ou pede a mesma garantia várias vezes?',
      'Os rituais tomam tempo (mais de 1h/dia) ou atrasam a rotina?',
      'Tenta esconder esses comportamentos dos outros?',
      'Reconhece que é exagerado, mas não consegue parar?',
      'Isso atrapalha a escola, o sono ou a convivência?'
    ],
    tiques: [
      'Faz movimentos repetidos e involuntários (piscar, franzir, balançar cabeça/ombros)?',
      'Emite sons repetidos sem querer (pigarro, fungar, estalos, palavras)?',
      'Os tiques aumentam quando está ansiosa, cansada ou empolgada?',
      'Consegue segurar o tique por um tempo, mas depois "precisa" fazer?',
      'Sente uma urgência ou sensação antes do movimento/som?',
      'Os tiques mudam de tipo ou de lugar ao longo do tempo?',
      'Há quanto tempo aparecem (mais de um ano)?',
      'Causam constrangimento, dor ou atrapalham tarefas?',
      'Há histórico de tiques ou TOC na família?',
      'A criança é alvo de comentários ou brincadeiras por causa disso?'
    ],
    regulacao: [
      'Consegue se acalmar sozinha depois de irritar ou frustrar?',
      'As reações emocionais são proporcionais ao que aconteceu?',
      'Tolera um "não", a espera ou uma mudança de planos?',
      'Recompõe-se com facilidade (chora e logo se acalma)?',
      'Tem explosões emocionais frequentes e difíceis de conter?',
      'Consegue nomear o que está sentindo?',
      'Demonstra carinho e empatia de forma adequada?',
      'Precisa muito do adulto para conseguir se regular?',
      'A desregulação atrapalha amizades, escola ou a rotina de casa?',
      'Melhora com antecipação, rotina e estratégias de calma?'
    ],
    mutismo: [
      'Fala normalmente em casa, mas fica em silêncio em certos lugares (escola)?',
      'Deixa de falar com pessoas específicas (professores, desconhecidos)?',
      'Isso já dura mais de um mês, fora o período de adaptação?',
      'Comunica-se por gestos, acenos ou sussurros nesses lugares?',
      'Parece travar ou ficar muito tensa quando esperam que fale?',
      'Evita situações em que precise falar em público?',
      'Fala bem quando está confortável e segura?',
      'O silêncio atrapalha o aprendizado ou a socialização?',
      'Há também timidez intensa ou ansiedade em outras situações?',
      'Melhora quando a pressão para falar diminui?'
    ]
  };

  // Metadados de filtragem por construto (para o instrumento APARECER na queixa).
  var META = {
    tea: { complaints: ['tea', 'autismo', 'espectro', 'nao aponta', 'nao olha', 'brinca sozinho', 'ecolalia', 'rigidez', 'social'], symptoms: ['não responde ao nome', 'não aponta', 'brinca sozinho', 'pouco contato visual'] },
    tdah: { complaints: ['tdah', 'atencao', 'desatento', 'agitado', 'hiperatividade', 'impulsividade', 'desorganizado'], symptoms: ['desatento', 'agitado', 'impulsivo', 'não termina tarefas'] },
    aprendizagem: { complaints: ['aprendizagem', 'escola', 'leitura', 'escrita', 'dislexia', 'discalculia', 'matematica', 'letras'], symptoms: ['confunde letras', 'não lê para a série', 'dificuldade em matemática'] },
    linguagem: { complaints: ['linguagem', 'fala', 'nao fala', 'atraso de fala', 'troca sons', 'vocabulario'], symptoms: ['não fala para a idade', 'troca sons', 'fala pouco'] },
    ansiedade: { complaints: ['ansiedade', 'medo', 'preocupa', 'fobia', 'separacao', 'timido', 'panico'], symptoms: ['preocupa-se demais', 'evita situações', 'queixas físicas'] },
    humor: { complaints: ['humor', 'triste', 'tristeza', 'depressao', 'irritabilidade', 'desanimo'], symptoms: ['triste/irritado', 'perda de interesse', 'isolamento'] },
    risco: { complaints: ['risco', 'suicidio', 'autoagressao', 'se machucar', 'seguranca'], symptoms: ['fala em se machucar', 'desesperança', 'autolesão'] },
    substancias: { complaints: ['substancias', 'alcool', 'drogas', 'cigarro', 'vape', 'adolescente'], symptoms: ['uso de substâncias', 'mudança de comportamento', 'risco'] },
    motor: { complaints: ['motor', 'coordenacao', 'equilibrio', 'motricidade', 'paralisia', 'tdc', 'desajeitado'], symptoms: ['cai muito', 'desajeitado', 'dificuldade motora fina'] },
    desenvolvimento: { complaints: ['desenvolvimento', 'marcos', 'atraso global', 'regressao', 'vigilancia', 'primeira infancia'], symptoms: ['atraso de marcos', 'regressão', 'preocupação dos pais'] },
    comportamento: { complaints: ['comportamento', 'oposicao', 'desafia', 'birra', 'agressividade', 'tod'], symptoms: ['desafia regras', 'explosões de raiva', 'agressividade'] },
    sono: { complaints: ['sono', 'insonia', 'pesadelo', 'ronca', 'acorda', 'dormir'], symptoms: ['dificuldade para dormir', 'desperta à noite', 'sonolência diurna'] },
    saude_mental_global: { complaints: ['saude mental', 'rastreio', 'bem-estar', 'forças e dificuldades', 'triagem'], symptoms: ['sinais emocionais', 'sinais comportamentais', 'impacto funcional'] },
    seguimento: { complaints: ['seguimento', 'monitoramento', 'evolucao', 'tratamento', 'resposta'], symptoms: ['mudança no período', 'adesão', 'metas'] },
    trauma: { complaints: ['trauma', 'tept', 'estresse pos-traumatico', 'evento', 'susto', 'abuso', 'perda', 'luto', 'pesadelo', 'acidente'], symptoms: ['revive o evento', 'evita lembranças', 'hipervigilância', 'sobressalto'] },
    dor: { complaints: ['dor', 'cefaleia', 'dor de cabeca', 'enxaqueca', 'dor abdominal', 'dor cronica', 'doi'], symptoms: ['dor recorrente', 'falta escolar por dor', 'dor com náusea'] },
    toc: { complaints: ['toc', 'obsessao', 'compulsao', 'ritual', 'mania de repetir', 'lavar as maos', 'conferir', 'simetria', 'contaminacao'], symptoms: ['rituais repetitivos', 'pensamentos intrusivos', 'aflição se impedido'] },
    tiques: { complaints: ['tique', 'tiques', 'tic', 'tourette', 'pisca', 'pigarro', 'movimento involuntario', 'som repetido'], symptoms: ['tiques motores', 'tiques vocais', 'urgência premonitória'] },
    regulacao: { complaints: ['regulacao', 'desregulacao', 'explosao', 'descontrole emocional', 'frustracao', 'autocontrole', 'birra intensa', 'raiva'], symptoms: ['explosões emocionais', 'dificuldade de se acalmar', 'baixa tolerância à frustração'] },
    mutismo: { complaints: ['mutismo', 'mutismo seletivo', 'nao fala na escola', 'silencio', 'timidez extrema', 'trava ao falar'], symptoms: ['fala em casa e cala fora', 'trava ao falar', 'comunica por gestos'] }
  };

  // Classificação de licença (alto grau de confiança; demais → verificar na fonte).
  // 'livre' = uso clínico gratuito; 'livre-nc' = gratuito p/ uso não comercial;
  // 'livre-reg' = gratuito mediante registro/conta; 'verificar' = checar na fonte.
  var LICENSE = {
    'ofc-phq-gad': 'livre', 'ofc-asq': 'livre', 'ofc-cssrs': 'livre', 'ofc-crafft': 'livre',
    'ofc-psc': 'livre', 'ofc-swyc': 'livre', 'ofc-vanderbilt': 'livre', 'ofc-cdc-milestones': 'livre',
    'ofc-sdq': 'livre-nc', 'ofc-rcads': 'livre-nc', 'ofc-mchat': 'livre',
    'ofc-gmfcs': 'livre', 'ofc-macs': 'livre', 'ofc-minimacs': 'livre'
  };
  function licenseOf(id) {
    if (LICENSE[id]) return LICENSE[id];
    if (/^ofc2-(promis|neuroqol)/.test(id)) return 'livre-reg'; // HealthMeasures
    if (/^ofc2-scas/.test(id)) return 'livre-nc';
    return 'verificar';
  }
  var LIC_TXT = {
    'livre': 'Uso clínico gratuito (atribuição à fonte oficial).',
    'livre-nc': 'Gratuito para uso não comercial (atribuição à fonte oficial).',
    'livre-reg': 'Gratuito mediante registro na plataforma oficial (HealthMeasures).',
    'verificar': 'Verifique a licença na fonte oficial antes do uso formal.'
  };

  // Override explícito para instrumentos amplos/multidomínio cuja descrição cita
  // subescalas (ex.: SDQ cita hiperatividade) e confundiria a heurística textual.
  var ID_BUCKET = {
    'ofc-sdq': 'saude_mental_global', 'ofc-psc': 'saude_mental_global',
    'ofc-swyc': 'desenvolvimento', 'ofc-cdc-milestones': 'desenvolvimento',
    'ofc2-promis-global': 'saude_mental_global', 'ofc2-promis-profile25': 'saude_mental_global',
    'ofc2-promis-profile36': 'saude_mental_global', 'ofc2-promis-profile48': 'saude_mental_global',
    'ofc2-casafs': 'saude_mental_global', 'ofc2-bedsy': 'saude_mental_global',
    'ofc3-irdi': 'desenvolvimento', 'ofc3-kidscreen10': 'saude_mental_global',
    'ofc3-cries8': 'trauma', 'ofc3-fpsr': 'dor',
    'ofc3-ocicv': 'toc', 'ofc3-moves': 'tiques', 'ofc3-erc': 'regulacao', 'ofc3-smq': 'mutismo'
  };

  // Classifica o domínio do instrumento → construto do banco (corrigido).
  function bucketOf(s) {
    if (ID_BUCKET[s.id]) return ID_BUCKET[s.id];
    var d = norm([s.domain || '', s.cat || '', s.finalidade || '', s.title || '', s.id || ''].join(' '));
    if (/risco|suicid|seguranca|autoagress|cssrs|\basq\b/.test(d)) return 'risco';
    if (/trauma|tept|ptsd|pos-?traumat|abuso|\bluto\b|evento traumat|cries/.test(d)) return 'trauma';
    if (/\bdor\b|cefaleia|enxaqueca|\bpain\b|fps-r|faces de dor/.test(d)) return 'dor';
    if (/\btoc\b|obsess|compuls|oci-cv|ritual/.test(d)) return 'toc';
    if (/tique|tiques|tourette|\bmoves\b/.test(d)) return 'tiques';
    if (/regulac|desregulac|autocontrole|emotion regulation|\berc\b/.test(d)) return 'regulacao';
    if (/mutismo|mutism|\bsmq\b|seletiv/.test(d)) return 'mutismo';
    if (/desenvolv|marcos|swyc|denver|milestone|vigil|primeira infancia|nipissing|looksee/.test(d)) return 'desenvolvimento';
    if (/substanc|alcool|drog|cigarro|crafft|vape/.test(d)) return 'substancias';
    if (/tea|autis|espectro|mchat/.test(d)) return 'tea';
    if (/sono|insonia|cshq|sleep/.test(d)) return 'sono';
    if (/parali|gmfcs|macs|cerebral|mobilidade|motora|motor|coordena|dcdq|tdc|upper-extremity|upper-adl/.test(d)) return 'motor';
    if (/tdah|hiperativ|vanderbilt|desatenc|\batenc/.test(d)) return 'tdah';
    if (/aprendiz|leitura|escrita|dislex|discalc|escolar/.test(d)) return 'aprendizagem';
    if (/linguagem|\bfala\b|comunica/.test(d)) return 'linguagem';
    if (/ansiedad|medo|preocup|pswq|gad|scared|scas|\bpas\b|fobia|inibicao|biq/.test(d)) return 'ansiedade';
    if (/depress|humor|tristeza|\bphq\b|anger|irritab/.test(d)) return 'humor';
    if (/comportament|oposic|\btod\b|conduta/.test(d)) return 'comportamento';
    if (/desenvolv|marcos|swyc|denver|milestone|vigil|primeira infancia/.test(d)) return 'desenvolvimento';
    if (/seguiment|terapeut|monitor|\bmtt\b|evolucao/.test(d)) return 'seguimento';
    return 'saude_mental_global';
  }

  var cat = window.NEUROPED_EDITORIAL_SCALES;
  if (!Array.isArray(cat)) return;
  var n = 0;
  cat.forEach(function (s) {
    if (!s) return;
    var hasQ = (s.plain_questions && s.plain_questions.filter(Boolean).length) || (s.questions && s.questions.length) ||
      (Array.isArray(s.domains) && s.domains[0] && Array.isArray(s.domains[0].items) && s.domains[0].items.length);
    var isRef = s._authorial_proxy || s.applicable === false || (!hasQ && (s.official_catalog || s.official_url || /^ofc/.test(s.id || '')));
    if (!isRef && hasQ) return; // instrumentos autorais respondíveis: não mexe

    var bucket = bucketOf(s);
    var qs = BANK[bucket] || BANK.saude_mental_global;
    var m = META[bucket] || META.saude_mental_global;
    if (!hasQ) s.plain_questions = qs.slice();
    // metadados de filtragem (só completa o que falta — não sobrescreve curadoria)
    s.complaints = uniq([].concat(s.complaints || [], m.complaints));
    s.symptoms = uniq([].concat(s.symptoms || [], m.symptoms));
    s.keywords = uniq([].concat(s.keywords || [], m.complaints, m.symptoms, [norm(s.domain || ''), bucket]));
    s._authorial_proxy = true;
    s._proxy_bucket = bucket;
    // proveniência honesta (respeita licença já declarada no instrumento)
    var lic = s.license_status || licenseOf(s.id || '');
    s.license_status = lic;
    s.license_note = LIC_TXT[lic] || LIC_TXT.verificar;
    var ref = s.official_url ? (' Fonte oficial: ' + s.official_url) : '';
    var cite = s._citation ? (' Referência: ' + s._citation + (s._pmid ? ' (PMID ' + s._pmid + ')' : '')) : '';
    s.not_normative_disclaimer = 'Perguntas-guia AUTORAIS NeuroPed sobre o mesmo construto — redigidas pela equipe, NÃO são os itens do instrumento original (protegidos por direito autoral). ' + (LIC_TXT[lic] || LIC_TXT.verificar) + ' Use o instrumento oficial para pontuação formal.' + ref + cite;
    n++;
  });
  window.NEUROPED_OFFICIAL_QUESTIONS_FILLED = n;
})();
