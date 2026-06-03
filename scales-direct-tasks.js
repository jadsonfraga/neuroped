/* NeuroPed EDJ — Testes diretos com a criança (tarefas aplicadas)
 * ---------------------------------------------------------------
 * Biblioteca estruturada de TAREFAS DIRETAS (aplicadas ativamente na
 * criança), complementando as escalas de heterorrelato. Cada tarefa traz:
 *   emoji · título · instrução LÚDICA (o que dizer/fazer) · o que observar
 *   · faixa etária opcional (em meses).
 *
 * Roteia pelo domínio da escala (reaproveita NeuroPedCoach.themeOf quando
 * presente) para sugerir as tarefas mais pertinentes ao caso — assim o
 * sistema "também sugere testes diretos", não só questionários.
 *
 * Apoio à observação clínica; NÃO é teste normatizado nem ponto de corte.
 *
 * API:
 *   window.NeuroPedDirectTasks.forDomain(domain, ageMonths) -> [tarefa, ...]
 */
(function () {
  'use strict';
  if (window.NeuroPedDirectTasks) return;

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Tarefas por "balde" funcional. faixa:[minMeses,maxMeses] é opcional.
  var TASKS = {
    linguagem: [
      { emoji: '🐶', titulo: 'Nomeação por figuras', instrucao: 'Mostre objetos ou figuras: "O que é isso?" (copo, bola, cachorro, mão, sapato).', observar: 'Quantos nomeia, trocas de som, se usa gesto no lugar da palavra.' },
      { emoji: '💬', titulo: 'Compreensão de ordem', instrucao: 'Sem apontar, peça: "Pegue o lápis e coloque em cima da mesa."', observar: 'Se cumpre as duas etapas sem pista visual.' },
      { emoji: '🗣️', titulo: 'Repetição de frase', instrucao: '"O menino pegou a bola azul." Peça para repetir igualzinho.', observar: 'Se omite ou troca palavras (memória + fala).' },
      { emoji: '⚡', titulo: 'Nomeação rápida', instrucao: 'Aponte 5 figuras conhecidas em sequência: "Diga o nome o mais rápido que conseguir."', observar: 'Velocidade, pausas e travas de evocação.', faixa: [48, 215] }
    ],
    social: [
      { emoji: '🙋', titulo: 'Resposta ao nome', instrucao: 'Chame o nome 2–3 vezes, fora do campo de visão da criança.', observar: 'Se vira e busca o olhar de quem chamou.', faixa: [12, 72] },
      { emoji: '👉', titulo: 'Atenção compartilhada', instrucao: 'Aponte algo interessante e diga "Olha!".', observar: 'Se segue o apontar e alterna o olhar entre você e o objeto.', faixa: [12, 72] },
      { emoji: '🧸', titulo: 'Brincar simbólico', instrucao: 'Ofereça boneco, copo e colher: "Vamos dar comidinha?"', observar: 'Se faz de conta, imita e cria pequenas cenas.', faixa: [18, 84] },
      { emoji: '🔁', titulo: 'Troca de turno', instrucao: 'Brinque de "minha vez, sua vez" com uma bola ou torre de blocos.', observar: 'Se espera a vez e mantém a reciprocidade.' }
    ],
    atencao: [
      { emoji: '🎯', titulo: 'Atenção auditiva (alvo)', instrucao: 'Leia: sol, bola, peixe, bola, casa, bola. Combine: "Bata na mesa quando ouvir BOLA."', observar: 'Acertos, omissões e impulsos (bate na palavra errada).' },
      { emoji: '🔢', titulo: 'Span de dígitos (memória operacional)', instrucao: 'Peça para repetir: 4-8-2; depois 7-1-9-3; depois de trás pra frente: 5-2-9.', observar: 'Maior sequência correta, na ordem direta e inversa.', faixa: [60, 215] },
      { emoji: '🚦', titulo: 'Inibição (dia/noite)', instrucao: 'Combine: quando eu disser "dia", você diz "noite"; e o contrário.', observar: 'Se segura a resposta automática (controle inibitório).', faixa: [60, 215] },
      { emoji: '🧭', titulo: 'Sequência de 3 passos', instrucao: '"Desenhe um círculo, escreva seu nome e faça um risco embaixo."', observar: 'Se mantém a ordem e conclui (planejamento).' }
    ],
    escola: [
      { emoji: '🔤', titulo: 'Reconhecimento de letras', instrucao: 'Mostre letras fora de ordem (A, M, S, O, P, E): "Vamos descobrir as letras? 🎈"', observar: 'Quantas nomeia e confusões (b/d, p/q).', faixa: [48, 144] },
      { emoji: '🧩', titulo: 'Consciência fonológica', instrucao: '"Com que som começa BOLA?" · "Bata palma em cada pedaço: ca-sa, bo-ne-ca" · "O que rima com PÃO?"', observar: 'Sílabas, som inicial e rima.', faixa: [48, 120] },
      { emoji: '📖', titulo: 'Leitura curta', instrucao: '"Lia viu um sapo no jardim. O sapo pulou perto da flor." Pergunte: quem viu o sapo? onde estava?', observar: 'Fluência, trocas e compreensão.', faixa: [72, 215] },
      { emoji: '✏️', titulo: 'Ditado', instrucao: 'Dite: casa, bola, janela, prato. Depois a frase: "A menina gosta de ler."', observar: 'Trocas, omissões e organização na linha.', faixa: [72, 215] },
      { emoji: '🔢', titulo: 'Matemática rápida', instrucao: 'Resolva junto: 8+5, 14−6, 3 grupos de 4, metade de 10.', observar: 'Estratégia (conta nos dedos?) e acertos.', faixa: [72, 215] }
    ],
    sensorial: [
      { emoji: '✨', titulo: 'Termômetro sensorial', instrucao: '"De 0 a 5, quanto incomoda: barulho de liquidificador? etiqueta na roupa? luz forte?"', observar: 'Reações e quais estímulos pesam mais.' },
      { emoji: '🖐️', titulo: 'Tolerância gradual', instrucao: 'Ofereça olhar → tocar → cheirar um item novo, sem forçar.', observar: 'Até onde aceita e o que ajuda a regular.' }
    ],
    emocional: [
      { emoji: '😊', titulo: 'Nomear emoções', instrucao: 'Peça para escolher/apontar: feliz, triste, bravo, com medo, cansado.', observar: 'Vocabulário emocional e reconhecimento.' },
      { emoji: '🌡️', titulo: 'Termômetro emocional', instrucao: '"De 0 a 10, quanto está a preocupação/tristeza hoje?"', observar: 'Intensidade percebida e gatilhos.', faixa: [72, 215] },
      { emoji: '💬', titulo: 'Situação social', instrucao: '"Um colega não respondeu sua mensagem. O que pode ter acontecido?"', observar: 'Flexibilidade de interpretação (viés negativo?).', faixa: [96, 215] },
      { emoji: '🛟', titulo: 'Checagem de segurança', instrucao: 'Com acolhimento e linguagem apropriada, pergunte se já pensou em se machucar ou sumir. Liste 3 adultos de confiança.', observar: 'Se positivo/hesitante: acionar protocolo — CVV 188 · SAMU 192.', risk: true, faixa: [96, 215] }
    ],
    motor: [
      { emoji: '🤸', titulo: 'Coordenação grossa', instrucao: 'Peça: pular num pé só, andar sobre uma linha, chutar e pegar uma bola.', observar: 'Equilíbrio, quedas e diferença em relação à idade.' },
      { emoji: '✍️', titulo: 'Motricidade fina', instrucao: 'Peça para recortar, abotoar e desenhar uma pessoa.', observar: 'Preensão do lápis, esforço e legibilidade.' }
    ],
    registro: [
      { emoji: '📝', titulo: 'Linha do tempo do evento', instrucao: 'Registre hora, duração, gatilho, sinais associados e como foi a recuperação.', observar: 'Padrão, consciência durante o evento e impacto na rotina.' },
      { emoji: '🎥', titulo: 'Registro em vídeo', instrucao: 'Quando possível e seguro, grave um vídeo curto do evento para mostrar ao médico.', observar: 'Nunca atrase o socorro para filmar.' }
    ],
    geral: [
      { emoji: '🎲', titulo: 'Observação funcional', instrucao: 'Proponha uma tarefa simples (montar, guardar, vestir) como brincadeira.', observar: 'Independência, ajuda necessária e tolerância à frustração.' },
      { emoji: '🗣️', titulo: 'Linguagem espontânea', instrucao: 'Converse sobre algo que a criança gosta e deixe contar.', observar: 'Palavras/frases usadas sem modelo, clareza e iniciativa.' },
      { emoji: '🤝', titulo: 'Interação', instrucao: 'Brinquem juntos por alguns minutos.', observar: 'Se compartilha, espera a vez e responde ao adulto.' }
    ]
  };

  // domínio/tema clínico → baldes de tarefas pertinentes
  var MAP = {
    linguagem: ['linguagem'],
    social: ['social'], rigidez: ['social'],
    atencao: ['atencao'], hiperatividade: ['atencao'], executiva: ['atencao'],
    escola: ['escola'],
    sensorial: ['sensorial'], alimentacao: ['sensorial'],
    humor: ['emocional'], ansiedade: ['emocional'], regulacao: ['emocional'], risco: ['emocional'], substancias: ['emocional'],
    motor: ['motor'], motorfino: ['motor'],
    epilepsia: ['registro'], dor: ['registro'], fadiga: ['registro'],
    autonomia: ['geral'], bullying: ['social', 'emocional'], estigma: ['emocional'], familia: ['geral'], qualidade: ['geral']
  };

  function themeOf(domain, keywords) {
    if (window.NeuroPedCoach && window.NeuroPedCoach.themeOf) {
      var t = window.NeuroPedCoach.themeOf(domain || '', domain || '', keywords || []);
      if (t) return t;
    }
    var d = norm([domain || '', (keywords || []).join(' ')].join(' '));
    var keys = Object.keys(MAP);
    for (var i = 0; i < keys.length; i++) { if (d.indexOf(keys[i]) >= 0) return keys[i]; }
    return '';
  }

  function forDomain(domain, ageMonths, keywords) {
    var theme = themeOf(domain, keywords);
    var buckets = MAP[theme] || ['geral'];
    var out = [], seen = {};
    buckets.forEach(function (b) {
      (TASKS[b] || []).forEach(function (t) { if (!seen[t.titulo]) { seen[t.titulo] = 1; out.push(t); } });
    });
    var age = Number(ageMonths);
    if (Number.isFinite(age) && age > 0) {
      out = out.filter(function (t) { return !t.faixa || (age >= t.faixa[0] && age <= t.faixa[1]); });
    }
    if (!out.length) out = TASKS.geral.slice();
    return out.slice(0, 6);
  }

  window.NeuroPedDirectTasks = { version: '1.1.0', forDomain: forDomain, themeOf: themeOf, TASKS: TASKS };
})();
