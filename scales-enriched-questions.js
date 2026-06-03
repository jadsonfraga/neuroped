/* ============================================================
   NeuroPed EDJ — scales-enriched-questions.js
   ============================================================
   Transforma `plain_questions` (string) em pergunta humanizada:

     {
       emoji:   "🎯",
       text:    "Seu filho consegue manter a atenção por alguns minutos?",
       examples: ["escutar historinhas","terminar uma brincadeira","fazer dever"],
       micro:   "Observe se muda rápido de atividade ou parece desligar."
     }

   Estratégia:
     1) OVERRIDE_QUESTIONS — tabela curada por scale.id (Fase 2 humanizada).
        Tem prioridade absoluta. Hoje cobre as escalas-alvo do brief.
     2) Heurística por domínio (TEA, TDAH, fala, sono, etc) que infere
        emoji + exemplos + micro a partir do texto bruto da pergunta.
     3) Fallback — só põe um emoji genérico e devolve.

   Não modifica `scales-bundle.js`. É camada de display.
   ============================================================ */
(function(){
  'use strict';
  if (window.NPEnrichedQuestion) return;

  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }

  /* ---------- Domain heuristics ---------- */
  /* Cada domínio define: emoji, bank de exemplos cotidianos, micro genérico */
  var DOMAIN_PROFILES = {
    tea: {
      emoji: '🧩',
      examples: ['olha quando chama o nome','divide brinquedo','aponta para mostrar','imita gestos','responde sorriso'],
      micro: 'Observe reciprocidade, contato ocular e brincar funcional.'
    },
    fala: {
      emoji: '🗣️',
      examples: ['pede com palavra','aponta para o que quer','imita som','responde "sim/não"','chama por ajuda'],
      micro: 'Veja se há intenção comunicativa, mesmo sem fala formada.'
    },
    linguagem: {
      emoji: '💬',
      examples: ['compreende ordem simples','conta o que aconteceu','faz pergunta','segue história','usa frase com 2-3 palavras'],
      micro: 'Compare expressão (fala) com compreensão (entender).'
    },
    tdah: {
      emoji: '🎯',
      examples: ['escutar historinhas','terminar tarefa escolar','assistir desenho até o fim','jogar a vez','aguardar a hora'],
      micro: 'Observe se muda rápido de atividade ou parece desligar no meio.'
    },
    atencao: {
      emoji: '🎯',
      examples: ['manter foco em jogo','escutar instrução','terminar atividade','permanecer sentado','aguardar a vez'],
      micro: 'Diferenciar desinteresse momentâneo de padrão persistente.'
    },
    executiva: {
      emoji: '🧠',
      examples: ['organiza material','lembra recado','planeja sair de casa','começa lição sozinho','segue rotina'],
      micro: 'Funções executivas envolvem iniciar, organizar e finalizar.'
    },
    escola: {
      emoji: '📚',
      examples: ['copiar do quadro','terminar atividade','seguir instrução da professora','prestar atenção na aula','realizar tema de casa'],
      micro: 'Pergunte à professora se o impacto é em sala E em casa.'
    },
    aprendizagem: {
      emoji: '✏️',
      examples: ['ler frase simples','escrever próprio nome','contar até 10','reconhecer letras','associar som-letra'],
      micro: 'Compare com pares da mesma faixa etária e mesma exposição.'
    },
    comportamento: {
      emoji: '💢',
      examples: ['esperar a vez','aceitar "não"','dividir brinquedo','obedecer pequeno pedido','parar quando chamado'],
      micro: 'Intensidade, frequência e contexto são chave.'
    },
    agressividade: {
      emoji: '🌋',
      examples: ['bate em irmãos','grita por muito tempo','quebra objetos','machuca-se na crise','agride para se defender'],
      micro: 'Veja se há gatilho previsível ou explosão sem aviso.'
    },
    ansiedade: {
      emoji: '😰',
      examples: ['evita ir à escola','reclama de dor antes de sair','precisa de muita confirmação','medo de dormir sozinho','pergunta repetidamente'],
      micro: 'Ansiedade infantil costuma virar queixa somática (barriga, cabeça).'
    },
    humor: {
      emoji: '💧',
      examples: ['perdeu interesse no que gostava','chora sem motivo claro','dorme demais ou de menos','fica isolado','reclama de cansaço'],
      micro: 'Em crianças, irritabilidade pode dominar mais que tristeza.'
    },
    sono: {
      emoji: '🌙',
      examples: ['demora a pegar no sono','acorda várias vezes','dorme tarde por tela','ronca','acorda cansado'],
      micro: 'Sono ruim amplifica déficit de atenção e regulação emocional.'
    },
    alimentacao: {
      emoji: '🍽️',
      examples: ['recusa por textura','aceita 5 alimentos só','engasga','vira conflito na mesa','demora 1h+ pra comer'],
      micro: 'Seletividade rígida + sensorial = sinal forte de avaliar TEA/sensorial.'
    },
    sensorial: {
      emoji: '✨',
      examples: ['tapa ouvido com liquidificador','não tolera etiqueta','evita luz forte','busca girar/pular','cheira tudo'],
      micro: 'Hiperresponsivo (foge) ou hiporresponsivo (busca) — registre os dois.'
    },
    motor: {
      emoji: '🤸',
      examples: ['cai com frequência','demora a abotoar roupa','escreve com letra muito ruim','não pula em um pé','demora a aprender bicicleta'],
      micro: 'Diferencie motricidade grossa (correr) de fina (pinça, traço).'
    },
    autonomia: {
      emoji: '🧷',
      examples: ['avisa para ir ao banheiro','tira/coloca roupa','escova dente sozinho','come sozinho','organiza mochila'],
      micro: 'Compare com expectativa pra idade — não com irmão.'
    },
    social: {
      emoji: '👫',
      examples: ['chama colega pra brincar','divide brinquedo','responde ao ser chamado','prefere brincar sozinho','imita brincadeira'],
      micro: 'Interesse social ESPONTÂNEO é mais informativo que resposta a estímulo.'
    },
    epilepsia: {
      emoji: '⚡',
      examples: ['olhar parado por segundos','tremor súbito','perde fio do que dizia','urina sem perceber','fica confuso depois'],
      micro: 'Episódios curtos repetitivos pedem investigação imediata.'
    },
    risco: {
      emoji: '🛟',
      examples: ['fala em se machucar','disse que não quer mais viver','marca de auto-lesão','fica em ambiente perigoso','expressa desejo de sumir'],
      micro: 'Risco é emergência. Não esperar a próxima consulta.'
    },
    medicacao: {
      emoji: '💊',
      examples: ['atenção melhorou na escola','apetite caiu','dorme menos','irritabilidade aumentou','rotina ficou mais organizada'],
      micro: 'Compare ANTES x DEPOIS em domínios separados (atenção, sono, humor, apetite).'
    }
  };

  /* Mapeamento de termos no texto da pergunta → domain key */
  var KEYWORD_TO_DOMAIN = [
    [/atenç|foco|concentra|distrai|termin[ao]/, 'atencao'],
    [/hiperativ|agitad|para quiet/, 'tdah'],
    [/organiz|memoria|esquece|perde|recad/, 'executiva'],
    [/olha|nome|aponta|recipro|imit|brincar|interesse social|gesto/, 'tea'],
    [/fala|som|palavra|comunica|gesto|aponta/, 'fala'],
    [/compreend|entend|ordem|frase|conta o que/, 'linguagem'],
    [/escola|professora|sala|tarefa|aula|dever/, 'escola'],
    [/le[ir]|escrev|copiar|alfabet|matemat|contar/, 'aprendizagem'],
    [/birra|opos|teimo|discute|desafi|limite/, 'comportamento'],
    [/bate|morde|agress|crise|explos|machuc/, 'agressividade'],
    [/medo|preocupa|evita|ansios|separa|pavor/, 'ansiedade'],
    [/triste|chora|desanim|isolad|humor|interesse perdid/, 'humor'],
    [/dorm|sono|ronca|despert|cansad|insônia/, 'sono'],
    [/comid|aliment|seletiv|textur|recus|mast|engasg/, 'alimentacao'],
    [/barulh|toque|textur|luz|cheir|sensori/, 'sensorial'],
    [/marc[ah]|equilibri|coorden|cai|qued|escreve mal|grafo/, 'motor'],
    [/banheir|desfrald|veste|higi|sozinho|escov|autonomia|avd/, 'autonomia'],
    [/brincar com|colega|amig|outros|recipro|interesse social|companheiro/, 'social'],
    [/convuls|crise epil|olhar parado|ausenc|epilep/, 'epilepsia'],
    [/risco|autolesão|autolesao|machuc[ao]r-se|suicid|nao quer viver/, 'risco'],
    [/medica|remédi|remedio|metilfenidato|ritalin|venvanse|risperidona/, 'medicacao']
  ];

  function pickDomain(question, scale){
    var t = norm(question);
    for (var i = 0; i < KEYWORD_TO_DOMAIN.length; i++) {
      if (KEYWORD_TO_DOMAIN[i][0].test(t)) return KEYWORD_TO_DOMAIN[i][1];
    }
    // Fallback no domínio da escala
    var sd = norm(scale && scale.domain);
    if (sd.indexOf('tea') >= 0) return 'tea';
    if (sd.indexOf('tdah') >= 0) return 'tdah';
    if (sd.indexOf('fala') >= 0 || sd.indexOf('linguagem') >= 0) return 'fala';
    if (sd.indexOf('escol') >= 0) return 'escola';
    if (sd.indexOf('aprendi') >= 0) return 'aprendizagem';
    if (sd.indexOf('comport') >= 0) return 'comportamento';
    if (sd.indexOf('ansied') >= 0) return 'ansiedade';
    if (sd.indexOf('humor') >= 0) return 'humor';
    if (sd.indexOf('sono') >= 0) return 'sono';
    if (sd.indexOf('aliment') >= 0) return 'alimentacao';
    if (sd.indexOf('sensori') >= 0) return 'sensorial';
    if (sd.indexOf('motor') >= 0) return 'motor';
    if (sd.indexOf('autonomi') >= 0) return 'autonomia';
    if (sd.indexOf('social') >= 0) return 'social';
    return null;
  }

  /* ============================================================
     OVERRIDE_QUESTIONS — tabela curada (Fase 2)
     ============================================================
     Cobre as escalas-piloto com perguntas totalmente humanizadas:
     emoji + frase + exemplos cotidianos + micro nota clínica.
     Cada entry é um array — mesma posição que `plain_questions`. */
  var OVERRIDE_QUESTIONS = {

    /* ---- Primeiros sinais TEA 12-36m (escala piloto Fase 1) ---- */
    'fam-12-36-tea-primeiros-sinais': [
      { emoji: '👀', text: 'Ele olha pra você quando você chama pelo nome?',
        examples: ['na hora do banho','quando entra no quarto','quando chama de longe','no parquinho'],
        micro: 'Resposta consistente ao nome é marco social inicial.' },
      { emoji: '👉', text: 'Ele mostra o que quer com gestos ou apontando?',
        examples: ['aponta pro doce','puxa sua mão pra pegar algo','levanta o braço pra pegar colo','aponta pra bicho na rua'],
        micro: 'Apontar protodeclarativo (mostrar pra dividir) é o de maior peso clínico.' },
      { emoji: '🧸', text: 'Ele brinca de forma simples com você (não só sozinho)?',
        examples: ['esconde-esconde','dar e receber bola','empilhar e derrubar','imitar barulho de bichinho'],
        micro: 'Brincar funcional compartilhado é mais informativo do que repertório isolado.' },
      { emoji: '🔊', text: 'Ele se incomoda muito com barulhos comuns do dia a dia?',
        examples: ['liquidificador','aspirador','secador','sirene de longe','aplausos'],
        micro: 'Hipersensibilidade auditiva persistente é sinal de perfil sensorial alterado.' },
      { emoji: '💬', text: 'Ele usa sons, balbucio ou palavras pra pedir algo?',
        examples: ['fala "água" quando quer beber','imita som de animal','vocaliza pra chamar atenção','tenta repetir palavra'],
        micro: 'Intenção comunicativa importa mais que clareza da fala nesta faixa.' }
    ],

    /* ---- Fala inicial 12-36m ---- */
    'fam-12-36-fala-inicial': [
      { emoji: '🙋', text: 'Ele tenta pedir o que quer (com som, gesto ou olhar)?',
        examples: ['levanta o braço pra colo','puxa pra mostrar a geladeira','aponta o lanche','olha fixo pro objeto'],
        micro: 'Toda intenção comunicativa conta — não só palavra.' },
      { emoji: '👆', text: 'Ele aponta para o que quer?',
        examples: ['aponta pra bicho na rua','aponta livro pra você ler','aponta brinquedo na estante','aponta TV pra ligar'],
        micro: 'Apontamento é divisor de águas no rastreio de TEA.' },
      { emoji: '🦜', text: 'Ele imita sons ou palavras simples?',
        examples: ['imita "au au"','repete "mamãe"','imita barulho de carro','tenta repetir tchau'],
        micro: 'Imitação verbal mostra prontidão pra fala expressiva.' },
      { emoji: '🎯', text: 'Ele entende ordens simples como "dá", "pega", "vem"?',
        examples: ['pega o sapato e traz','dá a chupeta','vem pro banho','tira da boca'],
        micro: 'Compreensão preservada com expressão atrasada = padrão receptivo > expressivo (mais favorável).' },
      { emoji: '🙏', text: 'Ele chama alguém quando precisa de ajuda?',
        examples: ['vai até você se machucar','puxa pra abrir potinho','chama com mão','vocaliza pra você ir até ele'],
        micro: 'Busca social funcional é proteção comunicativa importante.' }
    ],

    /* ---- TDAH atenção em casa 6-11 ---- */
    'fam-6-11-atencao-casa': [
      { emoji: '🚀', text: 'Ele começa a tarefa sem muita resistência?',
        examples: ['abre o caderno quando você pede','começa a lição sem brigar','senta na mesa pra estudar','desliga a TV quando avisa'],
        micro: 'Resistência ao iniciar pode ser ansiedade, não só desatenção.' },
      { emoji: '🎯', text: 'Ele termina o que começou?',
        examples: ['acaba a lição que abriu','termina o jogo','finaliza desenho','conclui a história'],
        micro: 'Abandono persistente em tarefa que GOSTA é mais sugestivo.' },
      { emoji: '🦋', text: 'Ele se distrai com qualquer coisa?',
        examples: ['olha pela janela','puxa assunto fora do tema','mexe em outro material','escuta barulho do quarto vizinho'],
        micro: 'Distratibilidade externa + interna (pensamentos) é mais informativa.' },
      { emoji: '🧠', text: 'Ele esquece instruções em poucos minutos?',
        examples: ['esquece o que você pediu pra buscar','não lembra de 3 itens da lista','esquece recado da escola','esquece tarefa enquanto faz'],
        micro: 'Memória de trabalho fraca aparece em rotinas multietapa.' },
      { emoji: '⏰', text: 'A lição de casa demora bem mais que o esperado?',
        examples: ['leva 2h pra fazer 30 min de exercício','faz uma página e levanta','sempre acaba depois do horário','vira drama todo dia'],
        micro: 'Tempo gasto + frustração + nota são tripé do impacto funcional.' }
    ],

    /* ---- Crises e frustração 3-5 ---- */
    'fam-3-5-crises-transicoes': [
      { emoji: '😢', text: 'Ele chora muito quando algo muda de planos?',
        examples: ['quando troca de brinquedo','quando acaba o desenho','quando muda o caminho','quando precisa sair do parquinho'],
        micro: 'Rigidez à mudança pode ser TEA, ansiedade ou perfil de regulação.' },
      { emoji: '🌋', text: 'Durante as crises, ele se joga no chão, bate ou morde?',
        examples: ['joga no chão e bate cabeça','morde a mão','bate no irmão','quebra objetos','grita por 20+ minutos'],
        micro: 'Intensidade + duração definem se é birra esperada ou desregulação.' },
      { emoji: '⏳', text: 'Ele consegue esperar por pouco tempo?',
        examples: ['aguarda 2-3 min na fila','espera você terminar de falar','aguarda a vez no jogo','espera o lanche ficar pronto'],
        micro: 'Tolerância à espera amadurece dos 3 aos 5 anos — comparar com pares.' },
      { emoji: '🔄', text: 'Ele aceita trocar de atividade quando você pede?',
        examples: ['sair do desenho pra comer','trocar brinquedo','sair do parquinho','passar do tablet pro banho'],
        micro: 'Transições difíceis sinalizam dificuldade de flexibilidade cognitiva.' },
      { emoji: '🤗', text: 'Depois da crise, ele consegue se acalmar com seu apoio?',
        examples: ['aceita abraço pra se acalmar','escuta voz baixa','aceita técnica de respiração','volta ao normal em 10 min'],
        micro: 'Co-regulação (você acalma ele) precede autorregulação.' }
    ],

    /* ---- Sensorial 3-5 ---- */
    'fam-3-5-sensorial-diario': [
      { emoji: '🙉', text: 'Ele tapa os ouvidos com barulhos comuns?',
        examples: ['liquidificador','aspirador','secador','sirene','aplausos'],
        micro: 'Hipersensibilidade auditiva persistente é sinal-bandeira sensorial.' },
      { emoji: '👕', text: 'Ele evita certos tecidos, etiquetas ou costuras?',
        examples: ['arranca etiqueta','não veste meia com costura','recusa jeans','só veste roupa larga'],
        micro: 'Defensividade tátil tem alto impacto em rotina (vestir/banho).' },
      { emoji: '☀️', text: 'Ele se incomoda com luz forte?',
        examples: ['fecha olho em sala','não tolera sol','prefere luz baixa','reclama do lustre'],
        micro: 'Fotofobia + barulho juntos sugerem perfil hiperresponsivo.' },
      { emoji: '🌀', text: 'Ele busca girar, pular ou se apertar?',
        examples: ['pula no sofá horas','adora balanço','se enrola apertado em cobertor','gira sem tontear'],
        micro: 'Padrão de busca vestibular/proprioceptiva pode coexistir com hipersens auditiva.' },
      { emoji: '🚪', text: 'As reações sensoriais atrapalham a rotina (passeio, escola, banho)?',
        examples: ['não consegue ir ao mercado','evita festa','banho vira luta','escola fica difícil pelo ruído'],
        micro: 'Impacto funcional é o que define necessidade de intervenção.' }
    ],

    /* ---- Comunicação funcional 3-5 ---- */
    'fam-3-5-comunicacao-funcional': [
      { emoji: '🍪', text: 'Ele pede o que quer de forma compreensível?',
        examples: ['fala o nome do que quer','aponta + nomeia','usa frase simples','traz a coisa pra mostrar'],
        micro: 'Mesmo com fala atípica, a função comunicativa pode estar preservada.' },
      { emoji: '❓', text: 'Ele responde perguntas simples?',
        examples: ['"que cor é isso?"','"cadê o sapato?"','"o que você quer?"','"quem é esse?"'],
        micro: 'Compreensão funcional é mais robusta que fala expressiva nesta faixa.' },
      { emoji: '✨', text: 'Ele mostra coisas que achou interessantes?',
        examples: ['"olha mamãe"','vai te buscar pra ver','aponta o avião','traz brinquedo pra mostrar'],
        micro: 'Atenção compartilhada espontânea é eixo do desenvolvimento social.' },
      { emoji: '🔄', text: 'Ele entende quando alguém muda a rotina?',
        examples: ['aceita rota nova','aceita brinquedo diferente','aceita troca de cuidador','tolera atraso do horário'],
        micro: 'Compreensão de mudança + tolerância separa rigidez TEA de personalidade tímida.' },
      { emoji: '🗣️', text: 'Ele usa fala, gesto ou figura pra se comunicar?',
        examples: ['fala palavra','aponta','usa figura PECS','imita som','olha + sorri'],
        micro: 'Qualquer modalidade funcional vale — multimodal é positivo.' }
    ],

    /* ---- Ansiedade 6-11 ---- */
    'fam-6-11-ansiedade-infantil': [
      { emoji: '🚫', text: 'Ele evita situações por medo?',
        examples: ['recusa dormir fora','foge de festa','evita parque com muita gente','recusa apresentar trabalho'],
        micro: 'Evitação consolida a ansiedade — distingue de timidez.' },
      { emoji: '🤕', text: 'Ele reclama de dor antes da escola?',
        examples: ['dor de barriga','dor de cabeça','vontade de vomitar','tontura'],
        micro: 'Sintomas somáticos vespertinos/matinais sem causa orgânica são clássicos.' },
      { emoji: '🛟', text: 'Ele precisa de muita confirmação pra se sentir seguro?',
        examples: ['pergunta a mesma coisa 10x','pede você prometer','quer voltar a checar','quer abraço repetido'],
        micro: 'Reasseguramento excessivo retroalimenta o ciclo ansioso.' },
      { emoji: '👨‍👩‍👧', text: 'Ele tem medo intenso de ficar longe dos pais?',
        examples: ['não dorme em casa de avó','chora ao ficar na escola','não quer ir ao banheiro sozinho','liga muitas vezes do colégio'],
        micro: 'Ansiedade de separação esperada até 7-8 anos; persistente vira clínica.' },
      { emoji: '😴', text: 'A preocupação atrapalha sono ou rotina?',
        examples: ['demora a dormir pensando','acorda preocupado','perde apetite','não consegue brincar pensando'],
        micro: 'Impacto em sono/rotina é o limite que diferencia traço de transtorno.' }
    ],

    /* ---- Sono 12-36m (pequeno) ---- */
    'fam-12-36-sono-pequeno': [
      { emoji: '⏳', text: 'Ele demora muito pra dormir?',
        examples: ['leva 45+ min pra pegar no sono','precisa de muito embalo','rola na cama','chora antes de dormir'],
        micro: 'Latência > 30 min consistente é sinal de higiene/regulação.' },
      { emoji: '🌃', text: 'Ele acorda várias vezes à noite?',
        examples: ['acorda 3+ vezes','chama no meio da noite','vem pra cama dos pais','não volta a dormir sozinho'],
        micro: 'Despertares recorrentes pós-12m sugerem associação inadequada de sono.' },
      { emoji: '📿', text: 'Ele precisa sempre da mesma rotina pra dormir?',
        examples: ['só com o mesmo objeto','só com luz x','só com música y','só com a mesma pessoa'],
        micro: 'Rituais rígidos podem ser parte sensorial/TEA.' },
      { emoji: '🐽', text: 'Ele ronca ou respira mal dormindo?',
        examples: ['ronco alto','pausa respiratória','boca aberta','sudorese intensa','agitação'],
        micro: 'Ronco persistente + apneia exige avaliação ORL/respiratória.' },
      { emoji: '☀️', text: 'O sono ruim muda o comportamento no dia seguinte?',
        examples: ['mais irritado','menos atento','mais agitado','perde apetite','chora mais'],
        micro: 'Cascata sono → atenção → humor é frequente e reversível.' }
    ],

    /* ---- Alimentação sensorial 12-36m ---- */
    'fam-12-36-alimentacao-sensorial': [
      { emoji: '🥄', text: 'Ele recusa alimentos por causa da textura?',
        examples: ['rejeita iogurte','não come arroz molhado','recusa frutas com casca','não tolera carne fibrosa'],
        micro: 'Recusa baseada em textura é marca sensorial — diferencia de seletividade comum por sabor.' },
      { emoji: '🍽️', text: 'Ele aceita só poucos alimentos (cardápio curto)?',
        examples: ['só come 5-7 itens','recusa ver comida nova','prefere sempre o mesmo prato','rejeita misturas'],
        micro: 'Cardápio < 10 alimentos com rigidez por anos é sinal de avaliação fono/sensorial.' },
      { emoji: '😨', text: 'Ele engasga com frequência?',
        examples: ['engasga com bebida','tosse durante refeição','engasga com pão','engasga com fruta picada'],
        micro: 'Engasgo recorrente exige avaliação de deglutição/respiratória.' },
      { emoji: '👃', text: 'Ele cheira ou toca a comida antes de comer?',
        examples: ['esfrega comida no dedo','aproxima do nariz','recusa antes de provar','separa por cor/forma'],
        micro: 'Inspeção sensorial elaborada antes de comer indica perfil hiper-vigilante.' },
      { emoji: '⚔️', text: 'A refeição costuma virar conflito?',
        examples: ['demora 1h+','choro recorrente','negociação cansativa','clima de tensão à mesa'],
        micro: 'Refeição como evento estressante diário gera ciclo de aversão — interromper cedo.' }
    ],

    /* ---- Brincar e interesse social 12-36m ---- */
    'fam-12-36-brincar-social': [
      { emoji: '🤲', text: 'Ele procura você pra brincar?',
        examples: ['traz brinquedo pra você','puxa pra brincar','sobe no colo pra interagir','chama com som'],
        micro: 'Iniciativa social espontânea, mesmo sem fala, é eixo do desenvolvimento.' },
      { emoji: '👯', text: 'Ele imita brincadeiras simples?',
        examples: ['imita "atchim"','copia bater palma','imita esconde-esconde','imita bater na panela'],
        micro: 'Imitação social é precursor da reciprocidade pragmática.' },
      { emoji: '🎁', text: 'Ele compartilha brinquedos ou objetos com você?',
        examples: ['oferece comida','dá brinquedo','passa o livro','divide o lanche'],
        micro: 'Compartilhar espontâneo (sem pedido) reflete teoria da mente inicial.' },
      { emoji: '🧍', text: 'Ele prefere brincar sempre sozinho?',
        examples: ['ignora outras crianças','não responde a tentativa de brincar','vira de costas','foge para canto'],
        micro: 'Preferência rígida pelo solo isolamento é sinal de avaliar TEA.' },
      { emoji: '👀', text: 'Ele mostra interesse por outras crianças?',
        examples: ['olha pra quem chega','observa criança brincando','aproxima de outras crianças','sorri pra criança'],
        micro: 'Interesse social mesmo passivo (olhar) é preservador — registrar.' }
    ],

    /* ---- Autonomia inicial 3-5 ---- */
    'fam-3-5-autonomia-inicial': [
      { emoji: '🚽', text: 'Ele avisa quando quer ir ao banheiro?',
        examples: ['pede para ir antes','fica seco em rotinas longas','reconhece urgência','não molha mais no sono diurno'],
        micro: 'Desfralde diurno por volta dos 3 anos; noturno até 5 — atrasos pedem investigação.' },
      { emoji: '👕', text: 'Ele ajuda a vestir ou tirar roupa?',
        examples: ['tira meia','desabotoa botão grande','calça shorts elástico','tira camiseta'],
        micro: 'Marcador motor fino + planejamento — comparar com pares.' },
      { emoji: '🫧', text: 'Ele lava as mãos com ajuda?',
        examples: ['abre torneira','molha as mãos','passa sabonete','enxuga'],
        micro: 'Sequência multi-etapas curta — falhas podem indicar dispraxia/atenção.' },
      { emoji: '🪥', text: 'Ele participa da escovação dos dentes?',
        examples: ['segura escova','passa creme','escova a frente','aceita sua ajuda nos fundos'],
        micro: 'Participação ativa, não execução perfeita, é o esperado nesta faixa.' },
      { emoji: '📖', text: 'Ele entende pequenas rotinas de cuidado?',
        examples: ['sabe ordem da rotina banho-jantar-pijama','entende "depois do almoço escova"','aceita sequência diária','prevê o próximo passo'],
        micro: 'Internalizar rotina é base para autorregulação futura.' }
    ],

    /* ---- Flexibilidade e rotina 3-5 ---- */
    'fam-3-5-flexibilidade-rotina': [
      { emoji: '🔄', text: 'Ele aceita pequenas mudanças na rotina?',
        examples: ['rota diferente até a escola','outro horário do banho','outro restaurante','outro brinquedo no banho'],
        micro: 'Tolerância à mudança amadurece dos 3 aos 5 — rigidez extrema sugere TEA/ansiedade.' },
      { emoji: '📌', text: 'Ele insiste em fazer sempre do mesmo jeito?',
        examples: ['mesmo prato','mesmo trajeto','mesma roupa','mesmo brinquedo'],
        micro: 'Rituais inflexíveis com sofrimento se mudados ≠ preferência. Avaliar quando atrapalha.' },
      { emoji: '🧭', text: 'Ele consegue esperar com apoio visual (timer, figura)?',
        examples: ['aceita timer de cozinha','olha pra figura "depois disso, vem isso"','aceita marca no relógio','espera ouvindo música'],
        micro: 'Apoio visual concretiza o abstrato "esperar" — diferenciador clínico.' },
      { emoji: '⚖️', text: 'Ele tolera perder ou dividir?',
        examples: ['aceita perder no jogo','divide doce','aceita "agora é a vez do irmão"','espera a vez no balanço'],
        micro: 'Tolerância à frustração + reciprocidade — base do convívio social.' },
      { emoji: '🚧', text: 'A rigidez atrapalha passeios, escola ou socialização?',
        examples: ['não consegue ir a festa','recusa parquinho diferente','não vai pra casa de outro adulto','vira drama na escola'],
        micro: 'Impacto funcional é o limiar entre traço esperado e necessidade de intervenção.' }
    ],

    /* ---- Organização e memória 6-11 ---- */
    'fam-6-11-organizacao-memoria': [
      { emoji: '🔍', text: 'Ele perde objetos com frequência?',
        examples: ['esquece lápis','perde caderno','não acha mochila','some com a chave da casa'],
        micro: 'Perdas seriadas + sem aprendizagem sugere déficit de memória prospectiva.' },
      { emoji: '📢', text: 'Ele esquece recados simples?',
        examples: ['"avisa a vovó que…"','recado da escola','pedido do irmão','combinado de fim de semana'],
        micro: 'Recados de 1-2 frases esquecidos em minutos = memória de trabalho fraca.' },
      { emoji: '⏰', text: 'Ele precisa de muitos lembretes pra rotina?',
        examples: ['"escove o dente" 5 vezes','"pega a mochila" repetido','"toma água" toda hora','"levanta da cama" várias vezes'],
        micro: 'Rotina sem internalização aos 8+ anos indica disfunção executiva.' },
      { emoji: '🎒', text: 'Ele se organiza pra sair de casa?',
        examples: ['separa material da escola','lembra do lanche','pega tênis certo','não esquece chave/passe'],
        micro: 'Planejamento prospectivo é executivo nuclear — bom marcador funcional.' },
      { emoji: '📅', text: 'Ele lembra combinados do dia anterior?',
        examples: ['"ontem você prometeu o sorvete"','data do passeio','tarefa marcada','horário do dentista'],
        micro: 'Memória episódica preservada com executivo fraco aponta padrão TDAH.' }
    ],

    /* ---- Oposição e irritabilidade 6-11 ---- */
    'fam-6-11-oposicao-irritabilidade': [
      { emoji: '💢', text: 'Ele discute muito com adultos?',
        examples: ['debate por tudo','argumenta sem fim','responde mal','contesta cada pedido'],
        micro: 'Diferenciar oposição esperada de desafio sistemático (TOD).' },
      { emoji: '⚡', text: 'Ele perde a paciência com facilidade?',
        examples: ['explode em 30s','grita por pouco','fica vermelho rápido','larga atividade frustrado'],
        micro: 'Baixa tolerância à frustração + irritabilidade = possível TDAH/regulação.' },
      { emoji: '🫥', text: 'Ele culpa os outros pelos próprios erros?',
        examples: ['"foi o irmão"','"a professora implica"','"o jogo é injusto"','nunca assume erro'],
        micro: 'Externalização persistente pode ser autoestima frágil ou padrão TOD.' },
      { emoji: '🚫', text: 'Ele desafia regras simples?',
        examples: ['ignora "não pode"','faz mesmo proibido','testa limite na frente','responde "e daí?"'],
        micro: 'Desafio em casa E na escola é mais informativo que só num ambiente.' },
      { emoji: '🏠🏫', text: 'A irritabilidade acontece em casa E na escola?',
        examples: ['professor reclama','colegas evitam','irmão tem medo','vizinhança comenta'],
        micro: 'Pervasividade entre contextos é critério-chave para TOD/TDE.' }
    ],

    /* ---- Sono escolar 6-11 ---- */
    'fam-6-11-sono-escolar': [
      { emoji: '⏰', text: 'Ele dorme no horário combinado?',
        examples: ['cama às 21h e dorme em 30 min','dorme até 23h','prolonga rotina','resiste a apagar a luz'],
        micro: 'Latência > 1h consistente em escolar = avaliar higiene + ansiedade.' },
      { emoji: '😴', text: 'Ele acorda cansado?',
        examples: ['custa levantar','reclama de cansaço','queda de rendimento na 1ª aula','dorme no carro'],
        micro: 'Cansaço matinal pós-noite suficiente sugere má qualidade do sono.' },
      { emoji: '🐽', text: 'Ele ronca ou respira mal dormindo?',
        examples: ['ronco audível do corredor','boca aberta na noite','pausa respiratória','sudorese intensa'],
        micro: 'Ronco + cansaço + atenção ruim = avaliar SAOS (apneia infantil).' },
      { emoji: '📱', text: 'Ele usa telas perto da hora de dormir?',
        examples: ['tablet na cama','TV até as 22h','celular pré-sono','vídeo enquanto cochila'],
        micro: 'Luz azul + estimulação cognitiva atrasam fase do sono — primeira intervenção.' },
      { emoji: '🧠', text: 'O sono ruim piora atenção ou humor no dia seguinte?',
        examples: ['mais irritado','desconcentrado na escola','briga mais com irmão','sem disposição'],
        micro: 'Sono → atenção → humor é cascata. Tratar o sono trata os 3.' }
    ]
  };

  function enrich(rawQuestion, scale, index){
    var idx = index == null ? 0 : index;
    var sid = scale && scale.id;

    // 1) Override curado (Fase 2)
    if (sid && OVERRIDE_QUESTIONS[sid] && OVERRIDE_QUESTIONS[sid][idx]) {
      return Object.assign({ raw: rawQuestion, source: 'curated' }, OVERRIDE_QUESTIONS[sid][idx]);
    }

    // 2) Heurística por domínio
    var dom = pickDomain(rawQuestion, scale);
    var profile = dom && DOMAIN_PROFILES[dom];
    if (profile) {
      return {
        emoji: profile.emoji,
        text: String(rawQuestion || ''),
        examples: profile.examples.slice(0, 4),
        micro: profile.micro,
        raw: rawQuestion,
        source: 'heuristic',
        domain: dom
      };
    }

    // 3) Fallback
    return {
      emoji: (scale && scale.emoji) || '📋',
      text: String(rawQuestion || ''),
      examples: [],
      micro: '',
      raw: rawQuestion,
      source: 'fallback'
    };
  }

  function enrichAll(scale){
    var qs = (scale && scale.plain_questions) || [];
    return qs.map(function(q, i){ return enrich(q, scale, i); });
  }

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }

  function renderCard(q, opts){
    opts = opts || {};
    var examples = (q.examples || []).map(function(e){
      return '<li style="margin:2px 0;color:#cdc8ee;font-size:12.5px">' + esc(e) + '</li>';
    }).join('');
    var micro = q.micro ? '<details style="margin-top:8px;border-top:1px dashed rgba(124,118,210,.22);padding-top:6px"><summary style="cursor:pointer;font-size:11px;letter-spacing:.04em;color:#a9a4d8;font-weight:700">💡 Nota clínica</summary><p style="margin:6px 0 0;color:#cdc8ee;font-size:12px;line-height:1.5">' + esc(q.micro) + '</p></details>' : '';
    var exBlock = examples ? '<div style="margin-top:8px"><strong style="display:block;font-size:10.5px;letter-spacing:.06em;color:#8b86b8;text-transform:uppercase;margin-bottom:4px">📌 Exemplos do dia a dia</strong><ul style="list-style:none;margin:0;padding:0">' + examples + '</ul></div>' : '';
    return '<article class="np-q-card" style="background:linear-gradient(180deg,rgba(124,118,210,.10),rgba(124,118,210,.04));border:1px solid rgba(124,118,210,.22);border-radius:16px;padding:14px;margin:10px 0">' +
      '<header style="display:flex;align-items:flex-start;gap:10px">' +
        '<span aria-hidden="true" style="font-size:22px;line-height:1;flex:0 0 auto">' + esc(q.emoji) + '</span>' +
        '<p style="margin:0;font:600 15px/1.45 system-ui;color:#F2F0FF;flex:1">' + esc(q.text) + '</p>' +
      '</header>' +
      exBlock + micro +
      '</article>';
  }

  window.NPEnrichedQuestion = {
    version: '1.0.0',
    DOMAIN_PROFILES: DOMAIN_PROFILES,
    OVERRIDE_QUESTIONS: OVERRIDE_QUESTIONS,
    enrich: enrich,
    enrichAll: enrichAll,
    renderCard: renderCard,
    pickDomain: pickDomain
  };
})();
