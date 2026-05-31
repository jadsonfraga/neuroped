/* NeuroPed — Sinais de alerta (red flags) por queixa.
 *
 * Apoio à DECISÃO, não diagnóstico: quando o filtro detecta uma queixa, este
 * módulo destaca os sinais que sugerem PRIORIDADE/URGÊNCIA de avaliação.
 * Conteúdo educativo, conservador, alinhado à conduta de não substituir o exame.
 *
 * Estrutura: NEUROPED_RED_FLAGS[tag] = { urgente:[...], prioritario:[...] }
 *  - urgente     → encaminhamento/avaliação imediata
 *  - prioritario → avaliação em curto prazo, não postergar
 *
 * Fontes de referência (marcos e sinais amplamente consolidados): CDC Developmental
 * Milestones, M-CHAT-R/F (uso), diretrizes gerais de neuropediatria/pediatria.
 */
(function () {
  'use strict';
  window.NEUROPED_RED_FLAGS = {
    fala: {
      prioritario: [
        'Sem balbucio até 12 meses; sem palavras até 16 meses',
        'Sem frases de 2 palavras (espontâneas, não ecolálicas) até 24 meses',
        'Não atende pelo nome / pouco contato visual associado',
      ],
      urgente: [
        'Perda/regressão de linguagem ou de habilidades sociais em qualquer idade',
      ],
    },
    tea: {
      prioritario: [
        'Pouco contato visual, ausência de apontar protodeclarativo até 18 meses',
        'Ausência de atenção compartilhada / brincar de faz de conta até 24 meses',
        'Padrões restritos/repetitivos com prejuízo funcional',
      ],
      urgente: [
        'Regressão de linguagem ou social (perda de marcos já adquiridos)',
      ],
    },
    tdah: {
      prioritario: [
        'Prejuízo em ≥2 contextos (casa e escola) com impacto acadêmico/social',
        'Sintomas presentes antes dos 12 anos e persistentes (≥6 meses)',
      ],
      urgente: [
        'Impulsividade com risco real (correr para rua, acidentes de repetição)',
      ],
    },
    escola: {
      prioritario: [
        'Dificuldade de leitura/escrita desproporcional à idade/escolaridade',
        'Queda abrupta de rendimento ou recusa escolar persistente',
      ],
    },
    comportamento: {
      prioritario: [
        'Oposição/agressão com prejuízo funcional e sofrimento familiar',
        'Padrão persistente (>6 meses) e desproporcional à idade',
      ],
      urgente: [
        'Agressão com risco a si ou a terceiros',
      ],
    },
    agressividade: {
      urgente: [
        'Auto ou heteroagressão com risco de lesão',
        'Crises de descontrole com perda de contato/segurança',
      ],
    },
    sono: {
      prioritario: [
        'Ronco alto habitual com pausas respiratórias (suspeita de apneia)',
        'Sonolência diurna excessiva afetando aprendizagem',
      ],
    },
    alimentacao: {
      urgente: [
        'Engasgos de repetição / sinais de aspiração',
        'Recusa alimentar com perda de peso ou desidratação',
      ],
      prioritario: [
        'Seletividade extrema com restrição nutricional',
      ],
    },
    ansiedade: {
      prioritario: [
        'Evitação que impede escola/rotina/sono',
        'Sintomas físicos recorrentes (dor abdominal, cefaleia) sem causa orgânica',
      ],
    },
    humor: {
      urgente: [
        'Ideação de morte, desesperança ou menção a não querer viver',
      ],
      prioritario: [
        'Tristeza/irritabilidade persistente (≥2 semanas) com perda de interesse',
      ],
    },
    motor: {
      prioritario: [
        'Não senta sem apoio aos 9 meses; não anda aos 18 meses',
        'Assimetria de movimento / preferência de mão antes de 12–18 meses',
      ],
      urgente: [
        'Perda de marcos motores já adquiridos (regressão)',
        'Hipotonia importante ou fraqueza progressiva',
      ],
    },
    sensorial: {
      prioritario: [
        'Reações sensoriais que impedem alimentação, higiene ou convívio',
      ],
    },
    epilepsia: {
      urgente: [
        'Crise > 5 minutos ou crises subentrantes (emergência)',
        'Primeira crise, crise com febre atípica, ou alteração de consciência prolongada',
        'Olhar parado com perda de contato e quedas inexplicadas recorrentes',
      ],
    },
    cefaleia: {
      urgente: [
        'Cefaleia que acorda à noite ou piora pela manhã com vômitos',
        'Piora progressiva, sinais neurológicos focais ou alteração de comportamento',
        'Pior cefaleia da vida / início súbito e intenso',
      ],
    },
    autonomia: {
      prioritario: [
        'Perda de autonomia já adquirida (regressão de AVDs)',
      ],
    },
    risco: {
      urgente: [
        'Ideação ou comportamento de autolesão/suicídio — acionar fluxo de segurança',
        'Plano, acesso a meios ou tentativa prévia',
      ],
    },
    medicacao: {
      prioritario: [
        'Efeito colateral relevante (apetite, sono, humor, cardiovascular)',
        'Ausência de resposta após titulação adequada — reavaliar diagnóstico/dose',
      ],
    },
  };
})();
