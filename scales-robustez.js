/* NeuroPed EDJ — Robustez: aprofundamento AUTORAL + interpretação
 * --------------------------------------------------------------------------
 * Torna os instrumentos de REFERÊNCIA mais completos e robustos SEM violar
 * limites: acrescenta perguntas-guia AUTORAIS extras (facetas adicionais do
 * mesmo construto, redigidas do zero — NÃO são itens de instrumentos
 * proprietários) e uma ORIENTAÇÃO DE INTERPRETAÇÃO padronizada.
 * Roda por ÚLTIMO no bundle (depois de scales-official-questions.js).
 */
(function () {
  'use strict';
  if (window.NEUROPED_ROBUSTEZ_LOADED) return;
  window.NEUROPED_ROBUSTEZ_LOADED = true;

  function uniq(a) { var s = {}, o = []; a.forEach(function (x) { if (x && !s[x]) { s[x] = 1; o.push(x); } }); return o; }

  // Facetas AUTORAIS extras por construto (somam-se às já existentes).
  var EXTRA = {
    tea: [
      'Reage de forma incomum a sons, texturas, luzes ou cheiros?',
      'Perdeu palavras, gestos ou contato que já tinha (regressão)?',
      'Tem interesses muito intensos ou restritos a poucos temas/objetos?',
      'Compartilha alegria ou conquistas olhando espontaneamente para você?',
      'Usa gestos sociais (acenar "tchau", balançar a cabeça) como esperado?'
    ],
    tdah: [
      'A dificuldade aparece em mais de um ambiente (casa E escola)?',
      'Tem dificuldade de organizar tarefas e administrar o tempo?',
      'Perde o fio do que estava fazendo no meio da tarefa?',
      'Comete erros por desatenção em coisas que sabe fazer?',
      'A dificuldade já aparecia antes dos 12 anos?'
    ],
    linguagem: [
      'Aponta/usa gestos para compensar quando falta a palavra?',
      'Conta uma história simples com começo, meio e fim?',
      'Entende perguntas do tipo "por quê" e "como"?',
      'Houve infecções de ouvido de repetição ou suspeita de audição?',
      'A compreensão é melhor que a fala, ou as duas estão atrasadas?'
    ],
    aprendizagem: [
      'Tem dificuldade específica de leitura, de escrita ou de matemática?',
      'Apesar de esforço e ensino adequado, a dificuldade persiste?',
      'O desempenho oral é melhor que o escrito?',
      'Há histórico de dificuldade escolar na família?',
      'Já recebe apoio/reforço, e mesmo assim mantém a dificuldade?'
    ],
    ansiedade: [
      'A preocupação é difícil de controlar uma vez que começa?',
      'Tem sintomas físicos quando ansiosa (coração acelerado, falta de ar, suor)?',
      'Pede para faltar à escola ou a eventos por ansiedade?',
      'A ansiedade atrapalha dormir ou comer?',
      'Os medos são desproporcionais ao risco real da situação?'
    ],
    humor: [
      'A irritabilidade ou tristeza dura a maior parte do dia, quase todos os dias?',
      'Houve mudança no rendimento escolar junto com o humor?',
      'Tem pensamentos de que "nada vale a pena" ou de desistir?',
      'Os sintomas duram mais de duas semanas?',
      'Há períodos de agitação/euforia alternando com a tristeza?'
    ],
    comportamento: [
      'Os episódios são mais intensos ou frequentes que o esperado para a idade?',
      'O comportamento traz consequências (suspensões, perda de amizades)?',
      'Há agressão a pessoas, animais ou destruição de objetos?',
      'A criança demonstra remorso depois, ou parece indiferente?',
      'O padrão dura seis meses ou mais?'
    ],
    sono: [
      'A dificuldade de sono acontece na maioria das noites da semana?',
      'A criança dorme em horários muito diferentes a cada dia?',
      'Range os dentes, mexe muito as pernas ou sua muito ao dormir?',
      'O ronco vem com pausas na respiração ou engasgos?',
      'O sono ruim afeta o humor e o desempenho no dia seguinte?'
    ],
    motor: [
      'Tem dificuldade que afeta atividades do dia a dia (vestir, comer, escrever)?',
      'A dificuldade motora aparece desde cedo e se mantém?',
      'Evita esportes, parquinho ou brincadeiras que exigem coordenação?',
      'Há diferença clara entre o que consegue e o esperado para a idade?',
      'Houve perda de habilidade motora que já tinha?'
    ],
    desenvolvimento: [
      'Houve prematuridade, baixo peso ou intercorrência no parto?',
      'A diferença em relação ao esperado vem aumentando com o tempo?',
      'Atrasos aparecem em mais de uma área (motor, fala, social) ao mesmo tempo?',
      'A criança usa o olhar e o sorriso social como esperado?',
      'Há preocupação tanto da família quanto da escola/creche?'
    ],
    adaptativo: [
      'A autonomia é parecida em casa, na escola e na casa de outros?',
      'Precisa de lembretes constantes para tarefas simples da idade?',
      'Tem noção de perigo e pede ajuda quando precisa?',
      'Participa de tarefas em grupo conforme a idade?',
      'A dependência limita a participação social ou escolar?'
    ],
    cognicao: [
      'Generaliza o que aprende para situações novas?',
      'Segue instruções de vários passos compatíveis com a idade?',
      'Tem dificuldade de noção de tempo, dinheiro ou quantidade?',
      'O raciocínio é concreto demais para a idade?',
      'A dificuldade aparece em quase todas as áreas, não só uma?'
    ],
    risco: [
      'Houve mudança brusca de comportamento, despedidas ou doar pertences?',
      'A criança/adolescente tem um plano ou acesso a um meio?',
      'Já houve episódio anterior de autoagressão ou tentativa?',
      'Sente-se um peso para os outros ou sem saída?',
      'Há sofrimento intenso que ela não consegue aliviar sozinha?'
    ]
  };

  // Orientação de interpretação padronizada (robustez de uso, sem corte diagnóstico).
  var SCORING = ' · Como interpretar: marque a frequência de cada sinal; NÃO há ponto de corte diagnóstico — quanto mais sinais frequentes e maior o impacto na rotina (casa/escola), mais forte a indicação de avaliação especializada. Triangule família + escola + observação direta. Sinais de alarme isolados já justificam atenção.';

  var cat = window.NEUROPED_EDITORIAL_SCALES;
  if (!Array.isArray(cat)) return;
  var n = 0;
  cat.forEach(function (s) {
    if (!s || s._robustez) return;
    if (!s._authorial_proxy) return;          // só os de referência (não toca autorais respondíveis)
    var b = s._proxy_bucket, ex = EXTRA[b];
    if (ex && Array.isArray(s.plain_questions)) {
      s.plain_questions = uniq(s.plain_questions.concat(ex));
    }
    s.scoring_note = SCORING.trim();
    if (typeof s.not_normative_disclaimer === 'string' && s.not_normative_disclaimer.indexOf('Como interpretar') < 0) {
      s.not_normative_disclaimer += SCORING;
    }
    s._robustez = true; n++;
  });
  window.NEUROPED_ROBUSTEZ_FILLED = n;
})();
