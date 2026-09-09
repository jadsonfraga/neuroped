import { Pill, Users } from "lucide-react";
import type { InteractiveScaleDef } from "./interactiveScaleItems";

const LONGITUDINAL_BAND = [
  {
    minPct: 0,
    classification: "Monitorização longitudinal — sem ponto de corte",
    color: "teal",
    description:
      "Interprete a aplicação em relação ao próprio basal, ao contexto e aos itens individuais. O percentual do escore máximo não constitui categoria diagnóstica ou normativa.",
  },
];

const vigiaCalculate: NonNullable<InteractiveScaleDef["calculate"]> = (answers) => {
  const domainResults = Array.from({ length: 6 }, (_, domainIndex) => {
    let sum = 0;
    let valid = 0;
    for (let itemIndex = 0; itemIndex < 4; itemIndex += 1) {
      const answer = answers[`${domainIndex}-${itemIndex}`];
      if (answer === undefined || answer === 4) continue;
      sum += answer;
      valid += 1;
    }
    return {
      domain: [
        "Sono, vigília e energia",
        "Apetite, digestivo e hidratação",
        "Humor, ativação e cognição",
        "Neurológico e motor",
        "Cardiovascular, autonômico e cefaleia",
        "Corpo, metabolismo, pele e impacto funcional",
      ][domainIndex],
      score: sum,
      classification:
        valid === 4
          ? `Escore descritivo ${sum}/12`
          : `Domínio não calculado — ${valid}/4 itens pontuáveis`,
      color: valid === 4 ? "teal" : "slate",
    };
  });
  const valid = Object.values(answers).filter((value) => value !== 4).length;
  const total = Object.values(answers).reduce(
    (sum, value) => sum + (value === 4 ? 0 : value),
    0,
  );
  return {
    total: valid === 24 ? total : undefined,
    totalLabel:
      valid === 24
        ? `Total descritivo ${total}/72`
        : `Total não calculado — ${valid}/24 itens pontuáveis`,
    classification: "Monitorização longitudinal — sem ponto de corte",
    description:
      "N/O é resposta válida, mas não recebe zero e impede o cálculo do total bruto. Compare basal e seguimentos; red flags e relação temporal percebida com o medicamento são analisadas separadamente do escore.",
    color: "teal",
    domainResults,
  };
};

const nexoFamCalculate: NonNullable<InteractiveScaleDef["calculate"]> = (answers) => {
  let globalSum = 0;
  let globalValid = 0;
  const domainNames = [
    "Rotina e organização da casa",
    "Energia e recuperação do cuidador",
    "Relações e clima familiar",
    "Trabalho, estudo, deslocamento e custos",
    "Rede de apoio e continuidade",
    "Sustentabilidade e bem-estar familiar",
  ];
  const domainResults = domainNames.map((domain, domainIndex) => {
    let sum = 0;
    let valid = 0;
    for (let itemIndex = 0; itemIndex < 4; itemIndex += 1) {
      const answer = answers[`${domainIndex}-${itemIndex}`];
      if (answer === undefined || answer === 5) continue;
      sum += answer;
      valid += 1;
    }
    globalSum += sum;
    globalValid += valid;
    const mean = valid > 0 ? sum / valid : 0;
    return {
      domain,
      score: Number(mean.toFixed(2)),
      classification:
        valid > 0
          ? `Média descritiva ${mean.toFixed(2)}/4 · ${valid}/4 itens`
          : "Sem itens pontuáveis neste domínio",
      color: valid === 4 ? "teal" : "slate",
    };
  });
  const mean = globalValid > 0 ? globalSum / globalValid : 0;
  return {
    total: globalValid === 24 ? globalSum : undefined,
    totalLabel:
      globalValid === 24
        ? `Total bruto ${globalSum}/96 · média geral ${mean.toFixed(2)}/4`
        : `Total bruto não calculado · média geral ${mean.toFixed(2)}/4 em ${globalValid}/24 itens`,
    classification: "Monitorização longitudinal — sem ponto de corte",
    description:
      "N/O não entra na soma nem na média. Compare preferencialmente o mesmo cuidador em contexto semelhante. A pontuação não mede competência parental, qualidade do vínculo ou elegibilidade e não possui delta mínimo validado.",
    color: "teal",
    domainResults,
  };
};

export const authorial202609OperationalItems: Record<string, InteractiveScaleDef> = {
  "vigia-med-24": {
    icon: Pill,
    gradient: "from-teal-600 to-cyan-700",
    instruction:
      "Considere somente os últimos 7 dias e o padrão habitual da própria criança/adolescente. Marque 0, 1, 2 ou 3; use N/O quando o item não pôde ser observado ou não se aplica. N/O não vale zero. Se perceber relação temporal com início, ajuste ou horário do medicamento, registre esse marcador no formulário impresso ou na nota clínica; relação temporal não prova causalidade.",
    infoBox:
      "VIGIA-MED 24 é instrumento clínico autoral de monitorização, não teste diagnóstico validado. Red flags independem do escore: ideação suicida/autoagressão, sedação intensa com dificuldade de despertar ou alteração respiratória, síncope/dor torácica/palpitações com mal-estar importante, reação cutânea extensa ou com mucosas/inchaço/dificuldade respiratória, febre com rigidez/confusão/instabilidade autonômica, distonia ou piora motora abrupta, primeira crise/crise prolongada/aumento relevante de crises, ou ativação extrema com redução marcante do sono/psicose/desinibição perigosa. Diante de risco imediato, priorizar urgência/emergência; SAMU 192 quando indicado.",
    labels: [
      "0 — Não ocorreu",
      "1 — Ocorreu, sem atrapalhar",
      "2 — Atrapalhou ou exigiu ajuste",
      "3 — Impacto forte ou necessidade de avaliação",
      "N/O — Não observado / não aplicável",
    ],
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "VIGIA-MED 24 — carga observada",
    calculate: vigiaCalculate,
    bands: LONGITUDINAL_BAND,
    domains: [
      {
        name: "A. Sono, vigília e energia",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Ficou sonolento durante o dia ou mais difícil de acordar do que o habitual.",
          "Teve dificuldade nova ou claramente maior para iniciar ou manter o sono.",
          "Ficou mais lento, cansado ou sem disposição para atividades que costumava realizar.",
          "Ficou excessivamente desperto, inquieto ou acelerado em horários em que costumava estar tranquilo.",
        ],
      },
      {
        name: "B. Apetite, digestivo e hidratação",
        color: "text-emerald-600 dark:text-emerald-400",
        items: [
          "Reduziu de forma perceptível o apetite ou passou a deixar refeições que costumava fazer.",
          "Aumentou muito a fome, a procura por comida ou a quantidade ingerida.",
          "Teve náusea, vômitos ou dor/desconforto abdominal que interferiu na rotina.",
          "Teve mudança intestinal ou de hidratação (prisão de ventre, diarreia, boca muito seca ou sede incomum) com incômodo relevante.",
        ],
      },
      {
        name: "C. Humor, ativação e cognição",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Ficou mais irritado, explosivo ou emocionalmente instável do que o padrão habitual.",
          "Apresentou ansiedade nova/maior, inquietação interna ou dificuldade incomum de permanecer parado.",
          "Ficou desinibido, eufórico, muito acelerado ou com necessidade de sono claramente menor que o habitual.",
          "Apresentou lentificação mental, confusão, piora de atenção ou queda de participação escolar/terapêutica após mudança medicamentosa.",
        ],
      },
      {
        name: "D. Neurológico e motor",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Surgiram ou pioraram tremor, rigidez, lentidão de movimentos ou perda de destreza.",
          "Surgiram movimentos involuntários repetidos da face, boca, língua, tronco ou membros.",
          "Surgiram tiques ou houve piora clara de tiques já existentes.",
          "Houve desequilíbrio, marcha mais instável, quedas ou coordenação pior que o habitual.",
        ],
      },
      {
        name: "E. Cardiovascular, autonômico e cefaleia",
        color: "text-rose-600 dark:text-rose-400",
        items: [
          "Relatou palpitações ou foi percebida aceleração/desaceleração incomum do pulso associada a mal-estar.",
          "Teve tontura ao levantar, sensação de desmaio ou episódio de desmaio.",
          "Teve dor de cabeça nova/mais frequente ou queixa visual nova após início ou ajuste medicamentoso.",
          "Apresentou sudorese excessiva, intolerância incomum ao calor/frio ou outro desconforto autonômico persistente.",
        ],
      },
      {
        name: "F. Corpo, metabolismo, pele e impacto funcional",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Houve aumento ou redução de peso claramente acima do esperado entre acompanhamentos, sem outra explicação evidente.",
          "Surgiram alterações corporais/endócrinas percebidas, como aumento mamário, saída de leite, mudança menstrual ou outro sinal novo.",
          "Surgiu erupção, mancha, coceira ou outra alteração de pele após início ou ajuste de medicação.",
          "O conjunto de efeitos físicos ou comportamentais reduziu autonomia, escola/terapia, lazer ou rotina familiar.",
        ],
      },
    ],
  },
  "nexo-fam-24": {
    icon: Users,
    gradient: "from-cyan-600 to-teal-700",
    instruction:
      "Considere somente os últimos 14 dias. Marque o quanto cada situação afetou a vida da família, e não o quanto você acha que deveria afetar. Use N/O quando a situação não aconteceu, não pôde ser observada ou não se aplica. N/O não entra na soma nem na média. Em reaplicações, prefira o mesmo cuidador e contexto comparável.",
    infoBox:
      "NEXO-FAM 24 é instrumento clínico autoral de monitorização, não teste diagnóstico validado. Red flags independem da pontuação: impossibilidade de manter supervisão/cuidados básicos com segurança por exaustão, doença ou falta de apoio; risco atual de lesão, violência ou abandono involuntário de cuidado essencial; crise emocional aguda do cuidador com preocupação de risco; ou falta de acesso imediato a necessidade essencial já definida no plano. Diante de risco imediato, priorizar proteção e urgência/emergência; SAMU 192 quando houver ameaça à vida ou instabilidade clínica.",
    labels: [
      "0 — Sem impacto",
      "1 — Pequeno",
      "2 — Moderado",
      "3 — Alto",
      "4 — Muito alto",
      "N/O — Não observado",
    ],
    optionPoints: [0, 1, 2, 3, 4, 0],
    scoreDirection: "higher_worse",
    totalLabel: "NEXO-FAM 24 — impacto familiar",
    calculate: nexoFamCalculate,
    bands: LONGITUDINAL_BAND,
    domains: [
      {
        name: "A. Rotina e organização da casa",
        color: "text-cyan-600 dark:text-cyan-400",
        items: [
          "As necessidades de cuidado mudaram de forma importante os horários básicos da casa.",
          "A família precisou cancelar ou remarcar compromissos por causa de demandas de cuidado.",
          "Foi difícil manter uma rotina previsível para sono, refeições, escola, terapias ou tarefas domésticas.",
          "A organização do cuidado ficou concentrada em uma única pessoa na maior parte do tempo.",
        ],
      },
      {
        name: "B. Energia e recuperação do cuidador",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "O cuidador principal terminou o dia sem energia suficiente para necessidades pessoais básicas.",
          "O descanso do cuidador foi interrompido por necessidades de cuidado da criança ou do adolescente.",
          "Houve pouco tempo disponível para recuperação física ou mental entre uma demanda e outra.",
          "O cansaço reduziu a paciência, a atenção ou a capacidade de organizar o cuidado.",
        ],
      },
      {
        name: "C. Relações e clima familiar",
        color: "text-rose-600 dark:text-rose-400",
        items: [
          "As demandas de cuidado aumentaram a tensão ou os desentendimentos entre adultos da casa.",
          "Irmãos ou outros familiares receberam menos tempo ou atenção do que a família considerava adequado.",
          "A família evitou passeios, encontros ou visitas por receio de dificuldades durante a atividade.",
          "Foi difícil conversar sobre as necessidades da criança sem surgirem culpa, cobrança ou conflito.",
        ],
      },
      {
        name: "D. Trabalho, estudo, deslocamento e custos",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "O cuidado interferiu no trabalho, estudo ou compromissos profissionais de algum responsável.",
          "Deslocamentos para escola, terapias, exames ou consultas consumiram parte relevante da semana.",
          "Os gastos ligados ao cuidado limitaram outras necessidades importantes da família.",
          "Foi difícil conciliar os horários dos serviços com a rotina real da família.",
        ],
      },
      {
        name: "E. Rede de apoio e continuidade",
        color: "text-emerald-600 dark:text-emerald-400",
        items: [
          "Houve poucas pessoas disponíveis e preparadas para assumir o cuidado com segurança por algumas horas.",
          "Quando o cuidador principal precisou se ausentar, faltou um plano alternativo de cuidado bem definido.",
          "Orientações de profissionais ou da escola foram difíceis de reunir em um plano único e praticável.",
          "Mudanças de profissional, serviço ou rotina interromperam estratégias que estavam ajudando.",
        ],
      },
      {
        name: "F. Sustentabilidade e bem-estar familiar",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Foi difícil reservar algum momento agradável em família que não girasse em torno de problemas, consultas ou terapias.",
          "A semana foi vivida mais no modo de reagir a crises e imprevistos do que de conseguir planejar.",
          "As metas de cuidado pareceram maiores do que o tempo, a energia ou os recursos disponíveis.",
          "Foi difícil perceber progressos recentes ou manter objetivos de curto prazo que parecessem alcançáveis.",
        ],
      },
    ],
  },
};
