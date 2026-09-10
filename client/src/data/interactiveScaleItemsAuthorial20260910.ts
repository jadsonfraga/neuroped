import type { ScaleConfig } from "@/components/GenericScale";
import type { InteractiveScaleDef } from "./interactiveScaleItems";

const LONGITUDINAL_BAND = [
  {
    minPct: 0,
    classification: "Monitorização longitudinal — sem ponto de corte",
    color: "teal",
    description:
      "Interprete em relação ao próprio basal, ao contexto e aos itens individuais. Não há classificação diagnóstica, normativa ou ponto de corte validado.",
  },
];

function meanCalculator(
  domainNames: string[],
  domainSizes: number[],
  minimumDomainItems: number,
  minimumGlobalItems: number,
  direction: "higher_worse" | "higher_better",
): ScaleConfig["onCalculate"] {
  const totalItems = domainSizes.reduce((sum, size) => sum + size, 0);
  return (answers) => {
    let globalSum = 0;
    let globalValid = 0;

    const domainResults = domainNames.map((domain, domainIndex) => {
      let sum = 0;
      let valid = 0;
      for (let itemIndex = 0; itemIndex < domainSizes[domainIndex]; itemIndex += 1) {
        const answer = answers[`${domainIndex}-${itemIndex}`];
        if (answer === undefined || answer === 4) continue;
        sum += answer;
        valid += 1;
      }
      globalSum += sum;
      globalValid += valid;
      const mean = valid ? sum / valid : 0;
      return {
        domain,
        score: valid >= minimumDomainItems ? Number(mean.toFixed(2)) : undefined,
        classification:
          valid >= minimumDomainItems
            ? `Média descritiva ${mean.toFixed(2)}/3 · ${valid}/${domainSizes[domainIndex]} itens válidos`
            : `Dados insuficientes — ${valid}/${domainSizes[domainIndex]} itens válidos`,
        color: valid >= minimumDomainItems ? "teal" : "slate",
      };
    });

    const mean = globalValid ? globalSum / globalValid : 0;
    const interpretable = globalValid >= minimumGlobalItems;
    const directionText =
      direction === "higher_worse"
        ? "Quanto maior a média, maior a carga/repercussão observada."
        : "Quanto maior a média, maior a habilidade/generalização observada.";

    return {
      total: interpretable ? Number(mean.toFixed(2)) : undefined,
      totalLabel: interpretable
        ? `Média global ${mean.toFixed(2)}/3 · ${globalValid}/${totalItems} itens válidos`
        : `Global não interpretado — ${globalValid}/${totalItems} itens válidos`,
      classification: "Monitorização longitudinal — sem ponto de corte",
      description: `N/O não entra no denominador. ${directionText} Compare aplicações da mesma pessoa com respondentes, oportunidades e contextos semelhantes; não use a média isoladamente para diagnóstico, prognóstico ou elegibilidade.`,
      color: "teal",
      domainResults,
    };
  };
}

const ADAPTA_LABELS = [
  "0 — Não ocorreu / sem dificuldade relevante",
  "1 — Ocasional ou leve; apoio breve costuma bastar",
  "2 — Frequente ou moderado; exige apoio estruturado",
  "3 — Intenso; interrompe participação ou exige apoio prolongado",
  "N/O — Não observado / não aplicável",
];

const SUPPORT_LABELS = [
  "0 — Sem demanda adicional relevante",
  "1 — Apoio breve",
  "2 — Apoio estruturado",
  "3 — Apoio intensivo / participação muito reduzida",
  "N/O — Não observado / não aplicável",
];

const TICAR_LABELS = [
  "0 — Sem repercussão relevante",
  "1 — Repercussão pequena",
  "2 — Repercussão moderada",
  "3 — Repercussão importante",
  "N/O — Não observado / informação insuficiente",
];

const PONTE_LABELS = [
  "0 — Não demonstrou / aparece apenas em treino muito dirigido",
  "1 — Demonstra com ajuda direta ou em contexto muito específico",
  "2 — Demonstra com pista leve ou em mais de um contexto",
  "3 — Demonstra espontaneamente e de modo consistente quando há oportunidade",
  "N/O — Não observado / oportunidade insuficiente",
];

export const authorial20260910Items: Record<string, InteractiveScaleDef> = {
  "adapta-18-sdg": {
    gradient: "from-amber-600 to-rose-700",
    instruction:
      "Considere os últimos 14 dias. Marque quanto cada situação interferiu na participação habitual da criança/adolescente. Use N/O quando não houve oportunidade suficiente. Esta versão é uma revisão operacional autoral para o app, e não uma reconstrução textual do PDF anterior.",
    infoBox:
      "ADAPTA-18 SDG v2.0-app é instrumento clínico autoral de monitorização, não teste diagnóstico validado. Não possui ponto de corte. Perda de habilidades, mudança abrupta de comportamento, autoagressão/fala de morte, agressão com risco, fuga perigosa, alteração de consciência, quedas inexplicadas, eventos paroxísticos, dor/febre/intoxicação/efeito adverso importante ou recusa de líquidos/alimentos com risco exigem avaliação independente do escore.",
    labels: ADAPTA_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "ADAPTA-18 SDG — carga funcional observada",
    bands: LONGITUDINAL_BAND,
    domains: [
      {
        name: "A. Transições e passagem entre atividades",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Mesmo com aviso prévio, interromper uma atividade muito desejada exige vários lembretes ou intervenção direta do adulto.",
          "Depois que uma atividade termina, demora para iniciar a próxima porque permanece preso(a) ao que estava fazendo.",
          "Trocas de ambiente, como sair de casa, mudar de sala ou ir para outra etapa da rotina, provocam resistência ou perda de organização.",
          "Quando o percurso, a sequência ou o horário habitual muda, precisa de apoio adicional para seguir a rotina.",
          "Passar de tela, brincadeira ou interesse preferido para uma obrigação cotidiana costuma gerar conflito ou atraso prolongado.",
          "Encerrar visita, aula, passeio ou outra situação e efetivamente ir embora costuma exigir negociação repetida ou ajuda intensa.",
        ],
      },
      {
        name: "B. Flexibilidade diante de imprevistos e alternativas",
        color: "text-rose-600 dark:text-rose-400",
        items: [
          "Uma mudança inesperada de plano provoca reação emocional maior do que a situação costuma exigir.",
          "Tem dificuldade para aceitar pessoa, material, lugar ou forma de fazer diferente daquela esperada.",
          "Quando a primeira estratégia não funciona, continua insistindo nela mesmo após receber orientação para tentar outra.",
          "Pequenas mudanças na ordem ou no horário das atividades geram preocupação, oposição ou necessidade de confirmação repetida.",
          "Quando uma opção desejada fica indisponível, permanece fixado(a) nela por tempo que atrapalha escolher outra possibilidade.",
          "Aceitar uma alternativa razoável costuma depender de mediação repetida do adulto, mesmo quando a alternativa já é conhecida.",
        ],
      },
      {
        name: "C. Recuperação e retorno à participação",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Depois de ouvir um limite, errar ou perder algo desejado, demora para voltar ao estado habitual.",
          "Após conflito ou frustração, continua retomando o acontecimento de modo que atrapalha a atividade seguinte.",
          "Precisa de ajuda intensa do adulto para reorganizar-se depois de um contratempo cotidiano.",
          "Mesmo após se acalmar visivelmente, permanece com participação reduzida ou evita retomar o que estava previsto.",
          "Uma frustração em um momento do dia interfere de forma perceptível em atividades posteriores ou em outro ambiente.",
          "Quando está muito frustrado(a), tem dificuldade para usar uma estratégia de recuperação já conhecida, como pedir ajuda, fazer pausa ou combinar uma alternativa.",
        ],
      },
    ],
  },

  "porta-20-sdg": {
    gradient: "from-teal-600 to-cyan-700",
    instruction:
      "Considere os últimos 14 dias de frequência escolar. O respondente deve observar diretamente a rotina na escola. Marque a necessidade de apoio adicional além dos apoios habituais já previstos. Use N/O quando não houve oportunidade suficiente.",
    infoBox:
      "PORTA-20 SDG v2.1 é instrumento clínico autoral de monitorização funcional escolar, não teste diagnóstico validado. Pontuação alta indica maior demanda de apoio no contexto observado, não 'comportamento pior'. Barreiras ambientais, comunicação, dor, sono, sobrecarga sensorial e demandas acadêmicas devem ser consideradas. Red flags prevalecem sobre qualquer escore.",
    labels: SUPPORT_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "PORTA-20 SDG — demanda de apoio escolar observada",
    bands: LONGITUDINAL_BAND,
    domains: [
      {
        name: "A. Chegada e transições",
        color: "text-cyan-600 dark:text-cyan-400",
        items: [
          "Na chegada, precisa de intervenção repetida do adulto para separar-se do acompanhante e iniciar a rotina.",
          "Depois de entrar na escola, demora para se organizar e participar da primeira atividade do período.",
          "Trocas entre sala, recreio, banheiro, refeitório ou outro espaço provocam resistência, atraso ou perda de organização.",
          "Mudanças avisadas de horário, professor, atividade ou sequência do dia exigem apoio maior do que o habitual.",
          "Na saída ou em outra transição de encerramento, apresenta dificuldade que interfere na organização ou segurança.",
        ],
      },
      {
        name: "B. Início, sustentação e conclusão de atividades",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Mesmo entendendo a proposta, precisa de vários lembretes para iniciar uma atividade compatível com sua rotina escolar.",
          "Perde o objetivo da tarefa durante a execução e necessita de redirecionamentos frequentes para continuar.",
          "Precisa que instruções sejam repetidas, reduzidas ou apresentadas passo a passo para conseguir acompanhar.",
          "Necessita de presença muito próxima do adulto para concluir atividades que, em outros momentos, já consegue realizar com menos ajuda.",
          "Ao longo do turno, a participação cai de forma perceptível e exige aumento de pausas, pistas ou redução de demanda.",
        ],
      },
      {
        name: "C. Autonomia prática e comunicação de necessidades",
        color: "text-emerald-600 dark:text-emerald-400",
        items: [
          "Precisa de ajuda adicional para localizar, guardar ou organizar materiais pessoais e escolares.",
          "Precisa de apoio adicional para higiene, banheiro, alimentação ou hidratação durante a rotina escolar.",
          "Tem dificuldade para comunicar que precisa de ajuda, pausa, água, banheiro, mudança de posição ou outro suporte.",
          "Quando sente dor, mal-estar ou desconforto, tem dificuldade para sinalizar o problema de forma compreensível antes de se desorganizar.",
          "Precisa de supervisão adicional para deslocar-se e permanecer em ambientes da escola com segurança.",
        ],
      },
      {
        name: "D. Participação social, autorregulação e recuperação",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Tem dificuldade para entrar em atividade de grupo mesmo quando recebe convite, modelo ou apoio inicial.",
          "Esperar a vez, dividir materiais ou lidar com limites gera conflitos que interrompem a participação.",
          "Após frustração, correção ou erro, demora para se reorganizar e voltar à atividade proposta.",
          "Barulho, aglomeração, toque, iluminação ou movimento do ambiente reduzem claramente sua participação.",
          "Tem dificuldade para pedir ajuda ou uma pausa antes que a sobrecarga evolua para choro, fuga, agressividade, paralisação ou abandono da atividade.",
        ],
      },
    ],
  },

  "ticar-18-sdg": {
    gradient: "from-violet-600 to-indigo-800",
    instruction:
      "Considere os últimos 7 dias e a repercussão dos tiques, não apenas quantas vezes apareceram. Não peça à criança que contenha o tique para pontuar melhor. Use N/O quando o item não pôde ser observado ou não se aplica.",
    infoBox:
      "TICAR-18 SDG v1.1 é instrumento clínico autoral de monitorização, não teste diagnóstico validado. Não diferencia tiques de estereotipias, compulsões, crises epilépticas, distonia, coreia, mioclonias ou fenômenos funcionais. Perda/alteração de consciência, crise prolongada/repetida, cianose, novo déficit neurológico, lesão relevante, reação medicamentosa aguda, autoagressão/fala de morte ou febre com alteração neurológica exigem avaliação separada do escore.",
    labels: TICAR_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "TICAR-18 SDG — repercussão funcional observada",
    bands: LONGITUDINAL_BAND,
    domains: [
      {
        name: "A. Conforto corporal e esforço de contenção",
        color: "text-rose-600 dark:text-rose-400",
        items: [
          "Os movimentos ou sons causaram dor, ardor, irritação, fadiga muscular ou outro desconforto físico perceptível.",
          "A criança interrompeu uma atividade desejada para se recompor fisicamente depois de uma sequência de tiques.",
          "Houve machucado, vermelhidão, dor de cabeça, rouquidão ou outro efeito corporal associado ao padrão de tiques.",
          "A criança relatou incômodo interno, sensação de pressão ou necessidade difícil de adiar antes de alguns movimentos ou sons.",
          "Depois de tentar conter ou disfarçar os tiques por algum tempo, ficou mais cansada, irritada ou precisou de pausa para se reorganizar.",
          "Na rotina de dormir, preocupação ou desconforto relacionado aos tiques dificultou relaxar e iniciar o sono.",
        ],
      },
      {
        name: "B. Participação e desempenho nas atividades",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Os tiques atrapalharam leitura, escrita, desenho, uso de teclado, recorte ou outra atividade que exige coordenação fina.",
          "Os tiques interromperam fala, leitura em voz alta, resposta oral ou outra situação de comunicação.",
          "Durante tarefa escolar ou atividade dirigida, a criança perdeu o ritmo ou precisou de tempo extra por causa dos tiques.",
          "Os tiques atrapalharam alimentação, higiene, vestir-se ou outra rotina prática do dia.",
          "Os tiques reduziram participação em brincadeira, esporte, passeio ou atividade física que a criança queria realizar.",
          "A criança evitou ou abandonou uma situação social, escolar ou pública porque os tiques estavam difíceis de manejar naquele momento.",
        ],
      },
      {
        name: "C. Contexto, autorregulação e repercussão social",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Comentários, olhares, brincadeiras ou perguntas de outras pessoas sobre os tiques causaram desconforto ou mudaram a participação da criança.",
          "Pedidos para \"parar\", \"se controlar\" ou esconder os tiques aumentaram tensão, vergonha, irritação ou dificuldade de continuar a atividade.",
          "A criança gastou esforço perceptível tentando esconder os tiques em sala, consulta, transporte, visita ou outro ambiente social.",
          "Foi necessário sair brevemente do ambiente, fazer uma pausa ou ir a um local mais reservado por causa da carga de tiques ou do desconforto associado.",
          "A família ou a escola precisou explicar, mediar ou proteger a criança diante de reação inadequada de outras pessoas aos tiques.",
          "Os tiques, ou a preocupação com eles, geraram sofrimento suficiente para a criança pedir ajuda, reclamar repetidamente ou evitar uma situação.",
        ],
      },
    ],
  },

  "ponte-16-sdg": {
    gradient: "from-cyan-600 to-indigo-700",
    instruction:
      "Considere os últimos 14 dias. Responda sobre o que a criança/adolescente fez de verdade quando teve oportunidade, comparando situações de casa, escola, terapia e comunidade. Use N/O quando não houve oportunidade suficiente. Em seguimentos, procure manter respondentes e contextos comparáveis.",
    infoBox:
      "PONTE-16 SDG é instrumento clínico autoral de monitorização da generalização funcional, não teste diagnóstico validado. Não possui ponto de corte. Perda clara de habilidade previamente adquirida, piora neurológica abrupta, alteração de consciência, nova dificuldade de marcha/deglutição, crise epiléptica nova ou aumento relevante de crises, autoagressão ou situação de risco exigem avaliação clínica independente do escore.",
    labels: PONTE_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_better",
    totalLabel: "PONTE-16 SDG — generalização funcional observada",
    bands: LONGITUDINAL_BAND,
    domains: [
      {
        name: "A. Transferência entre ambientes",
        color: "text-cyan-600 dark:text-cyan-400",
        items: [
          "Usa fora do local de treino uma habilidade que já aprendeu ou praticou em terapia, escola, consulta ou em casa.",
          "Usa formas de comunicação já conhecidas para pedir, responder ou compartilhar necessidades em mais de um ambiente.",
          "Executa uma rotina familiar, como guardar material, higiene ou organização, mesmo quando ela acontece em outro lugar.",
          "Aplica uma habilidade de autonomia em uma situação real do cotidiano, e não somente quando alguém transforma a situação em treino.",
        ],
      },
      {
        name: "B. Transferência entre pessoas e materiais",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Responde a uma instrução ou combinado já conhecido quando ele é apresentado por mais de uma pessoa familiar.",
          "Consegue usar a mesma habilidade com materiais, exemplos ou objetos diferentes daqueles usados durante o ensino inicial.",
          "Usa uma habilidade social ou comunicativa aprendida com pessoas diferentes, quando a situação pede essa habilidade.",
          "Mantém o desempenho quando muda quem oferece o apoio, sem precisar reaprender toda a tarefa com cada adulto.",
        ],
      },
      {
        name: "C. Espontaneidade e dependência de pistas",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Inicia uma habilidade já aprendida quando a situação pede, sem esperar uma ordem direta para começar.",
          "Pede ajuda, esclarecimento, pausa ou recurso necessário antes que o adulto precise adivinhar ou antecipar tudo.",
          "Depois de um erro ou dificuldade, tenta uma estratégia já ensinada sem depender de condução passo a passo.",
          "Conclui ações familiares com pouca ou nenhuma repetição de comandos, gestos-modelo ou ajuda física.",
        ],
      },
      {
        name: "D. Estabilidade e utilidade funcional",
        color: "text-emerald-600 dark:text-emerald-400",
        items: [
          "Mantém uma habilidade já adquirida mesmo quando há pequenas variações naturais de horário, sequência ou ambiente.",
          "Continua demonstrando uma habilidade após alguns dias sem treino direto daquela tarefa.",
          "Usa uma habilidade aprendida para resolver uma necessidade real, como terminar uma tarefa, participar, comunicar-se ou cuidar de si.",
          "O uso das habilidades aprendidas reduz ajuda adulta ou melhora de forma perceptível a participação em atividades do cotidiano.",
        ],
      },
    ],
  },
};

export const authorial20260910Calculators: Readonly<
  Record<string, ScaleConfig["onCalculate"]>
> = {
  "adapta-18-sdg": meanCalculator(
    ["Transições", "Flexibilidade", "Recuperação"],
    [6, 6, 6],
    4,
    14,
    "higher_worse",
  ),
  "porta-20-sdg": meanCalculator(
    ["Chegada/transições", "Atividades", "Autonomia/comunicação", "Social/regulação"],
    [5, 5, 5, 5],
    4,
    16,
    "higher_worse",
  ),
  "ticar-18-sdg": meanCalculator(
    ["Conforto/esforço", "Participação/desempenho", "Contexto/repercussão social"],
    [6, 6, 6],
    4,
    14,
    "higher_worse",
  ),
  "ponte-16-sdg": meanCalculator(
    [
      "Transferência entre ambientes",
      "Transferência entre pessoas e materiais",
      "Espontaneidade e dependência de pistas",
      "Estabilidade e utilidade funcional",
    ],
    [4, 4, 4, 4],
    2,
    12,
    "higher_better",
  ),
};
