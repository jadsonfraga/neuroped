/* ============================================================
   NeuroPed SDG — scales-questions.js
   Camada de DADOS: perguntas-guia ENRIQUECIDAS por queixa, em linguagem de
   pais, com emoji + exemplos funcionais + microexplicação + adaptação por idade.
   ------------------------------------------------------------
   IMPORTANTE (conformidade): NÃO são itens de instrumentos proprietários
   (SNAP-IV, M-CHAT, SRS-2, CBCL, BRIEF… não podem ser reproduzidos). São
   prompts GENÉRICOS de observação do desenvolvimento — conhecimento comum —
   no mesmo espírito das "perguntas-guia" que o app já usa. Apoio à observação,
   não diagnóstico.
   ------------------------------------------------------------
   API: NeuroPedQuestions.guide(tag, ageMonths) -> [{emoji, pergunta,
        explicacao, exemplos:[], contexto:[casa|escola|social], faixa}]
   Puro, sem dependências. Browser (window.NeuroPedQuestions) + Node (exports).
   ============================================================ */
(function (root) {
  'use strict';

  function norm(s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  // q(emoji, pergunta, explicacao, exemplos, contexto, minM, maxM)
  function q(emoji, pergunta, explicacao, exemplos, contexto, minM, maxM) {
    return { emoji: emoji, pergunta: pergunta, explicacao: explicacao,
      exemplos: exemplos || [], contexto: contexto || ['casa'], faixa: [minM || 0, maxM || 240] };
  }

  // Guias enriquecidos por queixa (genéricos, observacionais). Cada item tem faixa
  // etária para adaptação. Mantidos concisos e factuais.
  var GUIDE = {
    tdah: [
      q('🎯', 'Ele consegue manter a atenção numa atividade por alguns minutos?',
        'Observe se sustenta o foco ou troca de tarefa o tempo todo.',
        ['escutar uma história até o fim', 'terminar uma brincadeira', 'fazer a tarefa da escola'], ['casa', 'escola'], 36),
      q('🏃', 'Fica muito agitado, como se "tivesse um motorzinho"?',
        'Hiperatividade vai além de ser ativo: é não conseguir desacelerar.',
        ['não para sentado nas refeições', 'sobe nos móveis', 'mexe nas mãos/pés sem parar'], ['casa', 'escola', 'social'], 36),
      q('⏳', 'Tem dificuldade de esperar a vez ou age sem pensar?',
        'Impulsividade: responde/age antes de o adulto terminar.',
        ['interrompe conversas', 'não espera na fila do jogo', 'se arrisca sem medir'], ['social', 'escola'], 48)
    ],
    tea: [
      q('👀', 'Ele responde quando você chama o nome dele?',
        'Resposta ao nome é um marcador social precoce importante.',
        ['vira ao ser chamado de longe', 'busca seu olhar ao brincar'], ['casa', 'social'], 12),
      q('🤝', 'Demonstra interesse espontâneo por outras crianças?',
        'Interesse social espontâneo (não só quando provocado).',
        ['chama para brincar', 'compartilha o que achou interessante', 'responde quando chamam'], ['social', 'escola'], 24),
      q('🔁', 'Tem rotinas, movimentos ou interesses muito repetitivos?',
        'Padrões repetitivos e resistência a mudança de rotina.',
        ['enfileira objetos', 'repete falas/movimentos', 'incomoda-se com mudanças'], ['casa', 'escola'], 18),
      q('🗣️', 'Aponta para mostrar algo que achou interessante (não só para pedir)?',
        'Atenção compartilhada: dividir interesse, não só obter um objeto.',
        ['aponta a lua e olha pra você', 'mostra um brinquedo só para compartilhar'], ['casa', 'social'], 12, 48)
    ],
    fala: [
      q('🗣️', 'Como ele comunica o que quer hoje?',
        'Veja o meio principal: gesto, palavra solta, frase.',
        ['aponta', 'fala palavras soltas', 'monta frases curtas', 'puxa pela mão'], ['casa'], 12),
      q('👂', 'Ele entende ordens simples sem você apontar?',
        'Linguagem receptiva: compreender separa atraso de fala de outros quadros.',
        ['"pega o sapato"', '"vem comer"', '"cadê a bola?"'], ['casa'], 18),
      q('🔤', 'Troca, omite ou distorce muitos sons ao falar?',
        'Aspecto fonológico/articulatório da fala.',
        ['"tato" por "gato"', 'fala difícil de entender para estranhos'], ['casa', 'escola'], 36)
    ],
    ansiedade: [
      q('😟', 'Ele se preocupa demais ou pede garantias o tempo todo?',
        'Preocupação desproporcional para a idade.',
        ['pergunta "e se…" repetidamente', 'precisa de reasseguramento constante'], ['casa', 'escola'], 48),
      q('🚪', 'Evita lugares, pessoas ou situações por medo?',
        'Evitação é o sinal funcional central da ansiedade.',
        ['recusa ir à escola', 'evita festas', 'não dorme fora'], ['social', 'escola'], 36),
      q('🤕', 'Tem queixas físicas (barriga/cabeça) sem causa médica, em momentos de tensão?',
        'Somatização ligada a contextos de estresse.',
        ['dor de barriga antes da escola', 'cabeça doendo em provas'], ['escola', 'casa'], 60)
    ],
    comportamento: [
      q('💢', 'Quando ouve "não", como ele costuma reagir?',
        'Tolerância à frustração e aceitação de limites.',
        ['aceita com ajuda', 'discute muito', 'tem explosão'], ['casa', 'escola'], 24),
      q('🧩', 'Cumpre combinados e rotinas simples?',
        'Seguir regras previsíveis do dia a dia.',
        ['guarda os brinquedos quando combinado', 'segue a rotina da noite'], ['casa'], 36)
    ],
    escola: [
      q('📚', 'Acompanha a turma nas atividades da idade dele?',
        'Rendimento funcional comparado aos pares.',
        ['reconhece letras/números', 'copia do quadro', 'termina no tempo da turma'], ['escola'], 60),
      q('✍️', 'Evita ou cansa muito rápido em ler/escrever?',
        'Esquiva e fadiga podem indicar dificuldade específica.',
        ['some na hora da lição', 'reclama que "não consegue"'], ['escola', 'casa'], 60)
    ],
    sono: [
      q('🌙', 'Tem dificuldade para pegar no sono ou acorda muito à noite?',
        'Início e manutenção do sono nas últimas semanas.',
        ['demora mais de 30min para dormir', 'acorda várias vezes', 'só dorme acompanhado'], ['casa'], 12),
      q('😴', 'Durante o dia parece sonolento, irritado ou "desligado" por falta de sono?',
        'Repercussão diurna costuma indicar sono insuficiente ou fragmentado.',
        ['cochila fora de hora', 'muito irritado de manhã', 'chora fácil'], ['casa', 'escola'], 24),
      q('🛏️', 'A rotina antes de dormir é agitada (telas, sem horário fixo)?',
        'Higiene do sono: ambiente e rotina influenciam diretamente.',
        ['usa tela até deitar', 'sem horário de dormir', 'quarto claro/barulhento'], ['casa'], 12)
    ],
    sensorial: [
      q('🔊', 'Reage de forma intensa a sons, luzes, texturas ou toques?',
        'Hiper-reatividade sensorial: incômodo desproporcional a estímulos comuns.',
        ['tapa os ouvidos com barulho', 'recusa certas roupas/etiquetas', 'enjoa com texturas'], ['casa', 'escola'], 12),
      q('🤸', 'Procura muito movimento, apertos ou estímulos fortes?',
        'Busca sensorial: parece precisar de estímulo intenso para se regular.',
        ['gira/pula sem parar', 'gosta de apertos fortes', 'esbarra de propósito'], ['casa', 'social'], 18),
      q('🍽️', 'A seletividade alimentar parece ligada a textura/cheiro (não só birra)?',
        'Aspecto sensorial da alimentação, distinto de manha.',
        ['só come uma textura', 'enjoa com cheiro forte'], ['casa'], 18)
    ],
    motor: [
      q('🤹', 'Parece desajeitado, tropeça ou esbarra mais que os colegas?',
        'Coordenação motora ampla comparada aos pares.',
        ['cai com frequência', 'dificuldade para pular/correr', 'evita o parquinho'], ['casa', 'escola'], 36),
      q('✏️', 'Tem dificuldade com tarefas de mão fina (lápis, botão, tesoura)?',
        'Coordenação motora fina e preensão.',
        ['letra muito difícil', 'cansa ao escrever', 'não abotoa/amarra'], ['escola', 'casa'], 48),
      q('⏱️', 'Demorou para alcançar marcos motores (sentar, andar)?',
        'Histórico de marcos motores — comparar com o esperado.',
        ['andou após 18 meses', 'ainda instável para a idade'], ['casa'], 6, 60)
    ],
    aprendizagem: [
      q('🔤', 'Tem dificuldade para reconhecer letras/sons ou juntar sílabas na idade esperada?',
        'Base da leitura (consciência fonológica / decodificação).',
        ['troca/inverte letras (b/d, p/q)', 'lê muito devagar', 'não junta sílabas'], ['escola'], 60),
      q('🔢', 'Erra muito em contas simples ou confunde quantidades?',
        'Habilidades numéricas básicas.',
        ['conta sempre nos dedos', 'confunde maior/menor', 'erra somas simples'], ['escola'], 72),
      q('🧠', 'O esforço é grande, mas o rendimento fica abaixo do esperado para ele?',
        'Discrepância esforço×resultado sugere dificuldade específica.',
        ['estuda e vai mal', 'cansa rápido na lição', 'evita ler'], ['escola', 'casa'], 72)
    ],
    humor: [
      q('😔', 'Anda muito triste, desanimado ou perdeu o interesse pelo que gostava?',
        'Humor deprimido / anedonia mantidos por semanas.',
        ['não quer brincar', 'chora fácil', 'fica isolado'], ['casa', 'escola'], 60),
      q('🌋', 'Tem explosões de raiva desproporcionais e frequentes?',
        'Irritabilidade / desregulação — intensidade e frequência importam.',
        ['crises por pouco', 'demora a se acalmar', 'agride no auge'], ['casa', 'escola'], 48)
    ],
    alimentacao: [
      q('🍽️', 'Aceita variedade de alimentos ou come sempre os mesmos poucos itens?',
        'Seletividade alimentar: leque restrito mantido ao longo do tempo.',
        ['recusa texturas/cores novas', 'come só 4–5 itens', 'rejeita o que a família come'], ['casa'], 12),
      q('😬', 'A recusa parece ligada a textura, cheiro ou cor — e não só a "manha"?',
        'O componente sensorial distingue seletividade de birra pontual.',
        ['enjoa com cheiro forte', 'não mistura alimentos', 'incomoda-se com certas texturas'], ['casa'], 18),
      q('🥄', 'Mastiga e engole bem, sem engasgos frequentes?',
        'Segurança da deglutição — engasgos repetidos merecem atenção.',
        ['engasga com sólidos', 'guarda comida na boca', 'demora muito para engolir'], ['casa'], 6)
    ],
    adaptativo: [
      q('🧦', 'Faz sozinho as tarefas de autocuidado esperadas para a idade?',
        'Independência nas atividades de vida diária comparada ao esperado.',
        ['vestir-se e calçar', 'escovar os dentes', 'tomar banho com pouca ajuda'], ['casa'], 24),
      q('🚽', 'Já tem controle de xixi/cocô compatível com a idade?',
        'Desfralde e aviso de necessidades — comparar com o esperado.',
        ['avisa para ir ao banheiro', 'fica seco à noite', 'escapes frequentes para a idade'], ['casa'], 24, 84),
      q('🧹', 'Ajuda na rotina e guarda os próprios materiais quando combinado?',
        'Autonomia de organização no dia a dia.',
        ['guarda os brinquedos', 'organiza a mochila', 'segue os passos de uma rotina'], ['casa', 'escola'], 36)
    ],
    agressividade: [
      q('🌋', 'Tem explosões de raiva intensas e desproporcionais ao que as causou?',
        'Intensidade e desproporção importam mais que a birra comum.',
        ['crise por um "não"', 'grita / joga objetos', 'demora muito a se acalmar'], ['casa', 'escola'], 24),
      q('✋', 'Machuca a si, outras pessoas ou quebra coisas quando perde o controle?',
        'Hetero/autoagressão sinaliza necessidade de apoio e segurança.',
        ['bate / morde / empurra', 'se machuca quando frustrado', 'quebra objetos no auge'], ['casa', 'escola', 'social'], 24),
      q('🧯', 'Depois da crise, consegue se acalmar — sozinho ou com ajuda?',
        'Capacidade de recuperação e o que ajuda a regular.',
        ['acalma com colo / pausa', 'melhora ao tirar o gatilho', 'precisa de muito tempo'], ['casa'], 24)
    ],
    epilepsia: [
      q('⚡', 'Tem episódios de "desligar", olhar parado ou ausências por instantes?',
        'Eventos paroxísticos breves podem passar despercebidos.',
        ['para no meio de uma fala', 'olhar fixo por segundos', 'não responde por instantes'], ['casa', 'escola'], 12),
      q('🎥', 'Já teve abalos, quedas ou perda de consciência sem explicação?',
        'Eventos motores ou perda de consciência merecem avaliação.',
        ['abalos de braços/pernas', 'queda súbita', 'confusão logo depois'], ['casa'], 0),
      q('📝', 'Você consegue descrever horário, duração e como foi a recuperação?',
        'Detalhes do evento orientam a investigação; um vídeo ajuda muito.',
        ['quanto durou', 'o que fazia antes', 'como ficou depois'], ['casa'], 0)
    ],
    desenvolvimento: [
      q('📈', 'Ele alcançou os marcos esperados para a idade (sentar, andar, falar)?',
        'Comparar a trajetória com o esperado ajuda a identificar atraso global.',
        ['sentou/andou no tempo', 'primeiras palavras na idade', 'brinca como os colegas'], ['casa'], 0, 72),
      q('↩️', 'Ele já chegou a perder habilidades que tinha (regressão)?',
        'Perda de habilidades adquiridas é sinal de alerta e pede avaliação.',
        ['parou de falar palavras que dizia', 'deixou de brincar como antes'], ['casa'], 0, 72),
      q('🧭', 'Em quais áreas você percebe mais o atraso (fala, motor, social)?',
        'Mapear as áreas afetadas orienta os encaminhamentos.',
        ['mais na fala', 'mais no motor', 'mais no social/brincar'], ['casa', 'escola'], 0)
    ],
    dor: [
      q('🤕', 'Com que frequência a dor aparece e quanto ela atrapalha?',
        'Frequência e impacto funcional importam mais que a intensidade isolada.',
        ['faz parar de brincar/estudar', 'falta à escola', 'acorda à noite com dor'], ['casa', 'escola'], 36),
      q('🔎', 'A dor vem junto de outros sinais (náusea, luz/barulho, vômito)?',
        'Sinais associados ajudam a caracterizar o tipo de dor (ex.: enxaqueca).',
        ['enjoa junto', 'incomoda com luz/som', 'fica pálido'], ['casa'], 36),
      q('📝', 'Você percebe gatilhos ou mudança recente no padrão da dor?',
        'Anotar gatilhos e mudanças recentes orienta a investigação.',
        ['piora com jejum/sono ruim', 'mais em dias de prova', 'mudou nas últimas semanas'], ['casa', 'escola'], 48)
    ],
    toc: [
      q('🔁', 'Ele tem pensamentos que voltam e incomodam, mesmo sem querer?',
        'Obsessões: ideias/imagens intrusivas que geram aflição.',
        ['medo de germe/sujeira', 'medo de que algo ruim aconteça', 'precisa que fique "certo"'], ['casa'], 60),
      q('🧼', 'Repete ações ou rituais para aliviar o desconforto (lavar, conferir, ordenar)?',
        'Compulsões: comportamentos repetidos para reduzir a aflição.',
        ['lava as mãos demais', 'confere várias vezes', 'precisa de simetria/ordem'], ['casa', 'escola'], 60),
      q('⏱️', 'Isso toma muito tempo ou atrapalha a rotina dele?',
        'O tempo gasto e o prejuízo funcional definem a relevância.',
        ['atrasa para sair', 'fica aflito se impedido', 'evita lugares por causa disso'], ['casa', 'escola'], 60)
    ],
    tiques: [
      q('😬', 'Ele faz movimentos ou sons repetidos, rápidos, que parecem involuntários?',
        'Tiques motores (piscar, caretas) ou vocais (pigarro, estalos).',
        ['pisca/franze muito', 'balança a cabeça', 'pigarro ou estalos repetidos'], ['casa', 'escola'], 36),
      q('🔀', 'Os tiques mudam de forma, aumentam com estresse ou somem ao se distrair?',
        'Variar com o tempo e com o estado emocional é característico.',
        ['piora cansado/ansioso', 'troca o tipo de tique', 'some quando concentrado'], ['casa'], 36),
      q('📚', 'Os tiques atrapalham a escola, o sono ou a convivência?',
        'O impacto funcional orienta a necessidade de conduta.',
        ['atrapalha escrever', 'colegas comentam', 'incomoda para dormir'], ['escola', 'social'], 36)
    ],
    regulacao: [
      q('🎭', 'Quando fica bravo ou frustrado, qual a intensidade da reação?',
        'Desregulação: a resposta emocional é maior do que a situação pede.',
        ['explode por pouco', 'passa de 0 a 100 rápido', 'não consegue "baixar a guarda"'], ['casa', 'escola'], 24),
      q('🧯', 'Quanto tempo leva — e o que ajuda — para ele se acalmar?',
        'A recuperação e os apoios que funcionam orientam o manejo.',
        ['acalma com colo/pausa', 'precisa de muito tempo', 'melhora ao tirar o gatilho'], ['casa'], 24),
      q('🔋', 'Existe um horário ou contexto que piora (fome, sono, transições)?',
        'Padrões de contexto ajudam a antecipar e prevenir as crises.',
        ['pior no fim do dia', 'nas transições', 'com fome/sono'], ['casa', 'escola'], 24)
    ],
    mutismo: [
      q('🤐', 'Ele fala normalmente em casa, mas trava em alguns lugares (escola)?',
        'Mutismo seletivo: fala num ambiente e silencia em outro, de forma consistente.',
        ['conversa solto em casa', 'não fala na escola', 'não responde a estranhos'], ['casa', 'escola', 'social'], 36),
      q('⏳', 'Isso já dura mais de um mês e não é só timidez do início?',
        'Persistência ajuda a separar de uma adaptação inicial esperada.',
        ['começou há meses', 'não melhorou com o tempo', 'mesmo já conhecendo o local'], ['escola', 'social'], 36),
      q('🚪', 'O silêncio atrapalha o aprendizado ou a convivência dele?',
        'O prejuízo funcional orienta a necessidade de apoio.',
        ['não tira dúvidas', 'não faz amigos', 'evita atividades que exigem falar'], ['escola', 'social'], 36)
    ]
  };

  // Resolve a taxonomia no browser (window) ou em Node (require) — fallback DRY.
  function getTax() {
    if (root && root.NeuroPedTaxonomy) return root.NeuroPedTaxonomy;
    try { if (typeof require !== 'undefined') return require('./scales-taxonomy.js'); } catch (e) {}
    return null;
  }
  // Pergunta-guia genérica derivada de uma queixa sem guia curado (fallback honesto).
  function genericFor(tag) {
    var tax = getTax();
    var fe = (tax && tax.functionalExamples) ? tax.functionalExamples(tag) : null;
    var ex = (fe && (fe.observe || fe.examples)) || [];
    var emoji = (fe && fe.emoji) || '🔎';
    // Fallback honesto, porém COMPLETO: frequência+contexto e impacto funcional
    // (em vez de uma única pergunta vaga). Genérico — apoio à observação.
    return [
      q(emoji, 'Com que frequência isso aparece, e em quais situações do dia a dia?',
        'Frequência e contexto ajudam a separar variação normal de algo a investigar.',
        ex.slice(0, 4), ['casa', 'escola'], 0),
      q('📈', 'Isso atrapalha a rotina dele — em casa, na escola ou com os amigos?',
        'O impacto funcional orienta a conduta mais do que o sintoma isolado.',
        ['na escola', 'em casa', 'com os amigos'], ['casa', 'escola', 'social'], 0)
    ];
  }

  function guide(tag, ageMonths) {
    var t = norm(tag);
    var base = GUIDE[t] || genericFor(t);
    if (ageMonths == null || isNaN(ageMonths)) return base.slice();
    var a = Number(ageMonths);
    // adapta por idade: prioriza perguntas cuja faixa inclui a idade; nunca esvazia.
    var inRange = base.filter(function (x) { return a >= x.faixa[0] && a <= x.faixa[1]; });
    return (inRange.length ? inRange : base).slice();
  }

  var api = { guide: guide, GUIDE: GUIDE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NeuroPedQuestions = api;
})(typeof window !== 'undefined' ? window : null);
