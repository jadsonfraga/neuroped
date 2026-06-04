/* NeuroPed EDJ — Perguntas-guia AUTORAIS para instrumentos de referência
 * ----------------------------------------------------------------------
 * Os instrumentos oficiais de terceiros (M-CHAT, SDQ, Vanderbilt, ASQ,
 * C-SSRS…) são catalogados como REFERÊNCIA (applicable:false) e NÃO podem
 * reproduzir seus itens protegidos por direito autoral. Antes, ao abrir,
 * caíam num fallback genérico de 5 perguntas — abriam "incompletos".
 *
 * Este módulo injeta, para cada instrumento sem perguntas, um conjunto
 * AUTORAL de perguntas-guia em linguagem simples sobre o MESMO construto —
 * redigidas do zero, NÃO são os itens do instrumento original. Assim a tela
 * abre completa e lógica, mantendo conformidade. A fonte oficial continua
 * linkada e o disclaimer deixa a natureza autoral explícita.
 *
 * Roda por último no bundle (após todos os instrumentos carregarem).
 */
(function () {
  'use strict';
  if (window.NEUROPED_OFFICIAL_QUESTIONS_LOADED) return;
  window.NEUROPED_OFFICIAL_QUESTIONS_LOADED = true;

  function norm(s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  // Banco autoral por construto (perguntas-guia próprias, não itens originais).
  var BANK = {
    tea: [
      'A criança responde quando você chama o nome dela, mesmo de longe?',
      'Ela olha nos seus olhos durante a interação do dia a dia?',
      'Aponta ou mostra coisas para compartilhar interesse com você?',
      'Brinca de faz-de-conta (dar comida ao boneco, fingir cozinhar)?',
      'Repete falas, sons ou movimentos de forma marcante?',
      'Incomoda-se muito com mudanças de rotina ou imprevistos?',
      'Prefere brincar sozinha a interagir com outras crianças?'
    ],
    tdah: [
      'Tem dificuldade de manter a atenção até terminar uma tarefa?',
      'Parece "no mundo da lua" ou não escuta quando falam com ela?',
      'Agita-se, levanta ou não para quieta em momentos que pedem calma?',
      'Age por impulso, sem esperar ou pensar nas consequências?',
      'Esquece recados, perde materiais ou se desorganiza com frequência?',
      'Tem dificuldade de esperar a vez em jogos e conversas?',
      'O comportamento melhora bastante quando há rotina e apoio próximo?'
    ],
    aprendizagem: [
      'Tem dificuldade para reconhecer ou nomear letras e números?',
      'Confunde letras parecidas (b/d, p/q) ao ler ou escrever?',
      'Lê mais devagar ou com mais erros que os colegas da mesma série?',
      'Troca, omite ou junta letras ao escrever ou no ditado?',
      'Tem dificuldade com contas simples ou noção de quantidade?',
      'Evita atividades de leitura, escrita ou lição de casa?',
      'A dificuldade escolar afeta a autoestima ou o ânimo dela?'
    ],
    linguagem: [
      'Demorou para começar a falar palavras ou frases?',
      'Usa menos palavras do que o esperado para a idade?',
      'Troca ou omite sons, tornando a fala difícil de entender?',
      'Tem dificuldade de entender ordens com duas etapas?',
      'Usa mais gestos do que palavras para se comunicar?',
      'Tem dificuldade de contar o que aconteceu no dia?',
      'A dificuldade de fala atrapalha a interação com outras pessoas?'
    ],
    ansiedade: [
      'Preocupa-se demais com coisas do dia a dia, mais que outras crianças?',
      'Evita situações, lugares ou pessoas por medo ou insegurança?',
      'Tem dificuldade de se separar dos pais sem grande sofrimento?',
      'Apresenta queixas físicas (dor de barriga, cabeça) sem causa clara?',
      'Fica muito tensa, agitada ou irritada quando ansiosa?',
      'O medo ou a preocupação atrapalham a rotina, a escola ou o sono?',
      'Tem dificuldade de relaxar mesmo em momentos tranquilos?'
    ],
    humor: [
      'Tem estado triste, para baixo ou irritada na maior parte dos dias?',
      'Perdeu o interesse por brincadeiras ou coisas de que gostava?',
      'Mudou o apetite ou o sono de forma marcante?',
      'Queixa-se de cansaço, falta de energia ou desânimo?',
      'Fala de si mesma de forma muito negativa ("não sirvo", "sou ruim")?',
      'A tristeza ou irritação atrapalha a escola e a convivência?',
      'Tem se isolado de amigos e da família?'
    ],
    risco: [
      'A criança/adolescente já falou em se machucar, sumir ou não querer viver?',
      'Houve algum gesto ou tentativa de se machucar?',
      'Esses pensamentos têm aparecido com mais frequência ou intensidade?',
      'Existe acesso fácil a meios perigosos (remédios, objetos cortantes) em casa?',
      'Ela consegue procurar um adulto de confiança quando está muito mal?',
      'Há adultos protetores disponíveis e atentos no dia a dia?',
      'O plano de segurança (quem chamar, o que fazer) está combinado?'
    ],
    substancias: [
      'Houve uso de álcool, cigarro/vape ou outras substâncias?',
      'O uso aconteceu para relaxar, se encaixar ou lidar com problemas?',
      'Já usou sozinho(a) ou começou mais cedo no dia?',
      'Amigos próximos ou familiares fazem uso frequente?',
      'O uso já causou problema na escola, em casa ou com a lei?',
      'Já tentou reduzir ou parar e teve dificuldade?',
      'Percebe esquecimentos ou situações de risco ligados ao uso?'
    ],
    motor: [
      'Atingiu os marcos motores (sentar, andar) no tempo esperado?',
      'Cai muito, tropeça ou parece desajeitada para a idade?',
      'Tem dificuldade para segurar o lápis, usar tesoura ou se vestir?',
      'Usa mais um lado do corpo que o outro de forma marcante?',
      'Apresenta rigidez, moleza ou movimentos involuntários?',
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
      'Há preocupação dos pais ou da escola sobre o desenvolvimento?'
    ],
    comportamento: [
      'Desafia regras ou discute com adultos com frequência?',
      'Tem explosões de raiva intensas ou desproporcionais?',
      'Machuca pessoas, a si mesma ou quebra objetos quando frustrada?',
      'Tem dificuldade de aceitar limites e combinados simples?',
      'Irrita-se com facilidade ou guarda rancor?',
      'O comportamento gera problemas em casa, na escola ou com amigos?',
      'Melhora com rotina previsível, reforço positivo e clareza de regras?'
    ],
    sono: [
      'Demora muito para adormecer na maioria das noites?',
      'Acorda várias vezes durante a noite?',
      'Ronca, faz pausas ou respira pela boca ao dormir?',
      'Tem pesadelos, terror noturno ou anda dormindo?',
      'Acorda cansada ou fica sonolenta durante o dia?',
      'A rotina de sono é irregular (horários muito variáveis)?',
      'O sono ruim afeta o humor, a atenção ou a escola?'
    ],
    saude_mental_global: [
      'Há sinais de ansiedade, tristeza ou irritabilidade marcantes?',
      'Há dificuldades de atenção, agitação ou impulsividade?',
      'Há problemas de comportamento ou de aceitar limites?',
      'Há dificuldade de relacionamento com colegas ou família?',
      'Há queixas físicas frequentes sem causa clara?',
      'Esses sinais atrapalham a rotina, a escola ou a convivência?',
      'Houve mudança recente importante no jeito de ser da criança?'
    ],
    seguimento: [
      'Desde a última avaliação, os sintomas melhoraram, pioraram ou seguem iguais?',
      'A criança está conseguindo realizar a rotina (escola, sono, convívio)?',
      'O tratamento/estratégias combinados estão sendo seguidos?',
      'Surgiram efeitos novos, colaterais ou dificuldades?',
      'A família percebe ganhos funcionais no dia a dia?',
      'As metas combinadas foram alcançadas, total ou parcialmente?',
      'É preciso ajustar o plano ou encaminhar para avaliação?'
    ]
  };

  // Classifica o domínio do instrumento → construto do banco.
  function bucketOf(s) {
    var d = norm([s.domain || '', s.cat || '', s.finalidade || '', s.title || ''].join(' '));
    if (/risco|suicid|seguranca|autoagress/.test(d)) return 'risco';
    if (/substanc|alcool|drog|cigarro|crafft/.test(d)) return 'substancias';
    if (/tea|autis|espectro/.test(d)) return 'tea';
    if (/tdah|atenc|hiperativ|vanderbilt|executiv/.test(d)) return 'tdah';
    if (/parali|gmfcs|macs|motor|manual|cerebral/.test(d)) return 'motor';
    if (/aprendiz|leitura|escrita|dislex|discalc|escolar/.test(d)) return 'aprendizagem';
    if (/linguagem|fala|comunica/.test(d)) return 'linguagem';
    if (/ansiedad|medo|preocup|pswq|gad|scared/.test(d)) return 'ansiedade';
    if (/depress|humor|tristeza|phq/.test(d)) return 'humor';
    if (/sono|insonia|cshq/.test(d)) return 'sono';
    if (/comportament|oposic|tod|conduta/.test(d)) return 'comportamento';
    if (/desenvolv|marcos|swyc|asq|denver|milestone|vigil/.test(d)) return 'desenvolvimento';
    if (/seguiment|terapeut|monitor|mtt/.test(d)) return 'seguimento';
    if (/saude mental|global|psc|sdq|bem-estar|forcas/.test(d)) return 'saude_mental_global';
    return 'saude_mental_global';
  }

  var cat = window.NEUROPED_EDITORIAL_SCALES;
  if (!Array.isArray(cat)) return;
  var n = 0;
  cat.forEach(function (s) {
    if (!s || (s.plain_questions && s.plain_questions.filter(Boolean).length) || (s.questions && s.questions.length)) return;
    if (Array.isArray(s.domains) && s.domains[0] && Array.isArray(s.domains[0].items) && s.domains[0].items.length) return;
    var bucket = bucketOf(s);
    var qs = BANK[bucket] || BANK.saude_mental_global;
    s.plain_questions = qs.slice();
    s._authorial_proxy = true;
    s._proxy_bucket = bucket;
    var ref = s.official_url ? (' Fonte oficial: ' + s.official_url) : '';
    s.not_normative_disclaimer = 'Perguntas-guia AUTORAIS NeuroPed sobre o mesmo construto — redigidas pela equipe, NÃO são os itens do instrumento original (protegidos por direito autoral). Use o instrumento oficial para pontuação formal.' + ref;
    n++;
  });
  window.NEUROPED_OFFICIAL_QUESTIONS_FILLED = n;
})();
