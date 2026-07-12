import type { InteractiveScaleDef } from "./interactiveScaleItems";
import { AUTHORIAL_BANDS } from "./authorialScaleBuilder";

export function mariaClara(): InteractiveScaleDef {
  return {
    instruction: "Marque a frequência nas últimas duas semanas. Em caso de sofrimento intenso, risco ou queda funcional, priorize avaliação clínica.",
    infoBox: "Escala Maria Clara — versão operacional autoral, experimental e sem validação psicométrica própria. Não substitui SCARED, RCADS ou avaliação clínica.",
    labels: ["Nunca", "Alguns dias", "Muitos dias", "Quase todos os dias"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escala Maria Clara — ansiedade total (0–75)",
    bands: [...AUTHORIAL_BANDS],
    domains: [
      {
        name: "Ansiedade global e somática",
        items: [
          { text: "Sente-se tenso, nervoso ou incapaz de relaxar." },
          { text: "Tem dores de barriga, cabeça ou náusea quando está preocupado." },
          { text: "Sente coração acelerado, falta de ar ou tremor em situações de medo." },
          { text: "Evita ficar sozinho por medo de algo ruim acontecer." },
          { text: "Tem medo intenso de animais, escuro, lugares ou situações específicas." },
          { text: "Precisa de confirmação frequente de que está tudo bem." },
          { text: "Tem crises de choro ou pânico diante de situações comuns." },
          { text: "Os sintomas físicos de ansiedade atrapalham a rotina." },
        ],
      },
      {
        name: "Preocupação e ansiedade generalizada",
        items: [
          { text: "Preocupa-se excessivamente com várias coisas ao mesmo tempo." },
          { text: "Tem dificuldade para interromper pensamentos de preocupação." },
          { text: "Imagina repetidamente que algo ruim acontecerá." },
          { text: "Preocupa-se muito com saúde, família, escola ou futuro." },
          { text: "Precisa planejar tudo para sentir-se seguro." },
          { text: "Fica irritado ou cansado por causa das preocupações." },
          { text: "Tem dificuldade para dormir porque continua pensando nos problemas." },
          { text: "Busca garantias dos adultos repetidas vezes." },
        ],
      },
      {
        name: "Desempenho, avaliação e impacto funcional",
        items: [
          { text: "Tem medo de errar ou ser julgado por outras pessoas." },
          { text: "Evita apresentar trabalhos, responder perguntas ou participar em grupo." },
          { text: "Estuda ou revisa de forma excessiva por medo de falhar." },
          { text: "Fica muito ansioso antes de provas, consultas ou eventos sociais." },
          { text: "Desiste de atividades quando acredita que não será perfeito." },
          { text: "A ansiedade reduz seu rendimento escolar." },
          { text: "A ansiedade interfere em amizades ou convivência familiar." },
          { text: "Deixa de ir à escola ou a atividades por causa do medo." },
          { text: "Sente vergonha intensa após situações sociais." },
        ],
      },
    ],
  };
}
