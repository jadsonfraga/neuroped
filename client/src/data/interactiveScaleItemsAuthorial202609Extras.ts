import type { InteractiveScaleDef } from "./interactiveScaleItems";
import type { ScaleConfig } from "@/components/GenericScale";

const LONGITUDINAL_BAND = [
  {
    minPct: 0,
    classification: "Monitorização longitudinal — sem ponto de corte",
    color: "teal",
    description:
      "Interprete a aplicação em relação ao próprio basal, ao contexto e aos itens individuais. Não há classificação diagnóstica, normativa ou ponto de corte validado.",
  },
];

const ritmoDomainNames = [
  "Energia e arranque do dia",
  "Esforço cognitivo e sustentação",
  "Participação e autorregulação",
  "Recuperação e variabilidade",
];
const ritmoDomainSizes = [4, 5, 5, 4];

const ritmoCalculate: ScaleConfig["onCalculate"] = (answers) => {
  let globalSum = 0;
  let globalValid = 0;
  const domainResults = ritmoDomainNames.map((domain, domainIndex) => {
    let sum = 0;
    let valid = 0;
    for (let itemIndex = 0; itemIndex < ritmoDomainSizes[domainIndex]; itemIndex += 1) {      const answer = answers[`${domainIndex}-${itemIndex}`];
      if (answer === undefined || answer === 4) continue;
      sum += answer;
      valid += 1;
    }
    globalSum += sum;
    globalValid += valid;
    const mean = valid ? sum / valid : 0;
    return {
      domain,
      score: Number(mean.toFixed(2)),
      classification: valid
        ? `Média descritiva ${mean.toFixed(2)}/3 · ${valid}/${ritmoDomainSizes[domainIndex]} itens`
        : "Sem itens pontuáveis neste domínio",
      color: valid === ritmoDomainSizes[domainIndex] ? "teal" : "slate",
    };
  });
  const mean = globalValid ? globalSum / globalValid : 0;
  return {
    total: globalValid ? Number(mean.toFixed(2)) : undefined,
    totalLabel: globalValid
      ? `Média global ${mean.toFixed(2)}/3 em ${globalValid}/18 itens válidos`
      : "Média global não calculada — sem itens pontuáveis",
    classification: "Monitorização longitudinal — sem ponto de corte",
    description:
      "N/O não entra no denominador. Quanto maior a média, maior a carga observada de fadiga e impacto funcional. Compare a mesma pessoa ao próprio basal e revise sono, saúde clínica, demandas, humor e medicamentos quando pertinente.",
    color: "teal",
    domainResults,
  };
};
const trilhaDomainNames = [
  "Compreensão do próprio cuidado",
  "Participação em consultas e decisões",
  "Organização da rotina de saúde",
  "Segurança e transição de responsabilidade",
];

const trilhaCalculate: ScaleConfig["onCalculate"] = (answers) => {
  let globalSum = 0;
  let globalValid = 0;
  const domainResults = trilhaDomainNames.map((domain, domainIndex) => {
    let sum = 0;
    let valid = 0;
    for (let itemIndex = 0; itemIndex < 5; itemIndex += 1) {
      const answer = answers[`${domainIndex}-${itemIndex}`];
      if (answer === undefined || answer === 4 || answer === 5) continue;
      sum += answer;
      valid += 1;
    }
    globalSum += sum;
    globalValid += valid;
    const mean = valid ? sum / valid : 0;
    return {
      domain,
      score: Number(mean.toFixed(2)),
      classification: valid >= 3
        ? `Média descritiva ${mean.toFixed(2)}/3 · ${valid}/5 itens válidos`
        : `Domínio não interpretável — ${valid}/5 itens válidos`,
      color: valid >= 3 ? "teal" : "slate",
    };
  });  const mean = globalValid ? globalSum / globalValid : 0;
  return {
    total: globalValid >= 14 ? Number(mean.toFixed(2)) : undefined,
    totalLabel: globalValid >= 14
      ? `Média global ${mean.toFixed(2)}/3 em ${globalValid}/20 itens válidos`
      : `Global não interpretado — ${globalValid}/20 itens válidos (preferir pelo menos 14)`,
    classification: "Monitorização longitudinal — sem ponto de corte",
    description:
      "N/O e N/A são respostas válidas, mas não recebem zero nem entram no denominador. Maior média indica maior autonomia observada. A transferência de responsabilidades deve ser gradual e nunca definida pelo escore isolado.",
    color: "teal",
    domainResults,
  };
};

export const authorial202609ExtraOperationalItems: Record<string, InteractiveScaleDef> = {
  "ritmo-18-sdg": {
    gradient: "from-indigo-600 to-cyan-700",
    instruction:
      "Considere somente os últimos 14 dias e compare com o funcionamento habitual da própria criança/adolescente. Marque 0, 1, 2 ou 3; use N/O quando não houver observação suficiente. Em seguimentos, procure manter respondente, contexto e período comparáveis.",
    infoBox:
      "RITMO-18 SDG é instrumento clínico autoral de monitorização, não teste diagnóstico validado. O objetivo é localizar cansaço, queda de rendimento, necessidade de pausas e recuperação. Red flags como rebaixamento de consciência, síncope, dispneia/cianose, fraqueza progressiva, crise epiléptica nova/piora relevante, desidratação, sonolência medicamentosa intensa, apneias no sono, sintomas sistêmicos ou ideação de morte exigem avaliação independente do escore.",
    labels: [
      "0 — Ausente / dentro do esperado; sem impacto perceptível",
      "1 — Leve; exige pequeno ajuste",
      "2 — Moderado; frequente ou exige pausas/ajuda; reduz participação",
      "3 — Intenso; interrompe atividades ou exige recuperação prolongada",
      "N/O — Não observado / informação insuficiente",
    ],
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",    totalLabel: "RITMO-18 SDG — carga observada de fadiga/impacto",
    bands: LONGITUDINAL_BAND,
    domains: [
      {
        name: "A. Energia e arranque do dia",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Precisa de esforço incomum para levantar e começar as atividades do dia, mesmo quando teve oportunidade adequada de dormir.",
          "Fica sonolento(a) ou muito lento(a) pela manhã a ponto de atrasar higiene, alimentação, saída de casa ou início das tarefas.",
          "Refere ou demonstra ‘corpo pesado’, cabeça cansada ou falta de energia antes de demandas que costumava tolerar melhor.",
          "Já começa escola, terapia ou atividade programada com pouca reserva de energia e precisa reduzir o ritmo logo no início.",
        ],
      },
      {
        name: "B. Esforço cognitivo e sustentação",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "O desempenho cai conforme a tarefa avança: fica mais lento(a), comete mais erros ou precisa de mais pistas, mesmo entendendo o que deve fazer.",
          "Precisa de pausas mais frequentes do que o habitual para terminar deveres, leituras, jogos estruturados ou atividades de terapia.",
          "Depois de um período de atenção ou raciocínio, demora para responder, perde o fio da conversa ou parece ‘travado(a)’ mentalmente.",
          "Quando está cansado(a), instruções simples precisam ser repetidas mais vezes para serem compreendidas ou executadas.",
          "Após uma pausa, ainda encontra dificuldade para retomar uma tarefa porque não recuperou energia ou clareza suficientes.",
        ],
      },      {
        name: "C. Participação e autorregulação",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Encurta, abandona ou recusa atividades que normalmente aceita quando o cansaço já se acumulou ao longo do dia.",
          "Irritabilidade, choro, impulsividade ou sensibilidade a barulho/toque aumentam claramente quando está cansado(a).",
          "Após escola, terapia ou passeio, precisa ficar deitado(a), em silêncio ou isolado(a) antes de conseguir participar de rotinas de casa.",
          "No fim do dia, reduz conversa, brincadeira, contato social ou interesse por atividades que em outros horários costuma aproveitar.",
          "Perde autonomia em autocuidado, organização ou tarefas simples quando cansado(a), necessitando mais lembretes ou ajuda física.",
        ],
      },
      {
        name: "D. Recuperação e variabilidade",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Mesmo após uma pausa curta, demora a recuperar disponibilidade para aprender, conversar, brincar ou colaborar.",
          "Precisa de uma hora ou mais para voltar ao funcionamento habitual depois de um período exigente de escola, terapia, esporte ou passeio.",
          "Depois de um dia mais cheio, apresenta no dia seguinte queda de energia ou participação maior do que seria esperado pela rotina habitual.",
          "A resistência para atividades físicas, escolares ou sociais está pior do que o padrão habitual da própria criança/adolescente.",
        ],
      },
    ],
  },
  "trilha-20-sdg": {
    gradient: "from-emerald-600 to-teal-700",
    instruction:
      "Considere o que o adolescente de fato consegue fazer no cotidiano nos últimos 30 dias. Sempre que possível, peça primeiro a resposta do adolescente e complemente com o cuidador. Marque 0, 1, 2 ou 3; use N/O se não foi observado e N/A se não se aplica. N/O e N/A não valem zero.",    infoBox:
      "TRILHA-20 SDG é instrumento clínico autoral de monitorização, não teste diagnóstico validado e não determina capacidade jurídica. O foco é participação real no próprio cuidado. Transferência de responsabilidades deve ser gradual e compatível com idade, cognição, comunicação, condição clínica e supervisão necessária.",
    labels: [
      "0 — Ainda não realiza",
      "1 — Realiza com ajuda direta",
      "2 — Realiza com apoio leve",
      "3 — Realiza de forma independente e consistente",
      "N/O — Não observado",
      "N/A — Não aplicável",
    ],
    optionPoints: [0, 1, 2, 3, 0, 0],
    scoreDirection: "higher_better",
    totalLabel: "TRILHA-20 SDG — autonomia observada",
    bands: LONGITUDINAL_BAND,
    domains: [
      {
        name: "A. Compreensão do próprio cuidado",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Consegue explicar, com as próprias palavras, o principal motivo do acompanhamento de saúde ou a condição que exige cuidado.",
          "Reconhece o nome, a apresentação ou outra forma segura de identificar os medicamentos de uso regular, quando houver.",
          "Sabe para que serve cada medicamento, terapia ou cuidado principal que faz parte da rotina.",
          "Consegue informar alergias, reações importantes ou efeitos adversos já conhecidos, quando existentes.",
          "Sabe quem procurar na família ou na equipe de saúde quando surge uma dúvida relacionada ao tratamento.",
        ],
      },      {
        name: "B. Participação em consultas e decisões",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Durante a consulta, responde diretamente às perguntas que estão ao seu alcance antes de depender totalmente do acompanhante.",
          "Consegue relatar mudanças em sintomas, sono, comportamento, crises, dor ou efeitos de medicamento percebidos no período.",
          "Pede explicação ou faz perguntas quando não entende uma orientação de saúde.",
          "Consegue dizer o que mais atrapalha sua rotina e qual aspecto do cuidado gostaria de melhorar.",
          "Informa quando esqueceu, atrasou ou realizou de forma diferente algum cuidado combinado, sem depender apenas do relato do adulto.",
        ],
      },
      {
        name: "C. Organização da rotina de saúde",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Sabe os principais horários de medicamentos, terapias ou outros cuidados regulares que fazem parte da sua rotina.",
          "Usa agenda, alarme, checklist, quadro de rotina ou outro apoio quando precisa lembrar tarefas relacionadas à saúde.",
          "Participa da conferência de medicamentos, materiais ou documentos necessários antes de sair de casa, viajar ou passar o dia fora.",
          "Lembra ou participa ativamente do acompanhamento de consultas, exames ou retornos já marcados.",
          "Sabe onde ficam, ou como localizar com ajuda mínima, receitas, relatórios, cartão do SUS/convênio ou outros documentos relevantes.",
        ],
      },      {
        name: "D. Segurança e transição de responsabilidade",
        color: "text-emerald-600 dark:text-emerald-400",
        items: [
          "Sabe que não deve aumentar, reduzir, iniciar ou suspender medicamento por conta própria.",
          "Reconhece situações do seu próprio caso em que precisa chamar um adulto ou procurar atendimento de saúde com rapidez.",
          "Sabe informar pelo menos um contato de emergência ou sabe onde encontrá-lo rapidamente.",
          "Consegue explicar uma necessidade de saúde a professor, cuidador, familiar ou outro adulto de confiança quando necessário.",
          "Assume uma parte do próprio cuidado compatível com sua capacidade, mantendo a supervisão adulta necessária para segurança.",
        ],
      },
    ],
  },
};

export const authorial202609ExtraCalculators: Record<string, ScaleConfig["onCalculate"]> = {
  "ritmo-18-sdg": ritmoCalculate,
  "trilha-20-sdg": trilhaCalculate,
};
