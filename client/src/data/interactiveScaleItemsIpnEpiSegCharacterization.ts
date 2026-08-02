import type { InteractiveDomainDef } from "./interactiveScaleItems";

export const ipnEpiSegCharacterizationDomains: InteractiveDomainDef[] = [
  {
    name: "Cronologia do evento",
    items: [
      { text: "Existe linha do tempo com estado pré-evento, início, evolução, término e recuperação.", example: "Ex.: sono normal, despertar, olhar fixo, rigidez, abalos, sono pós-evento. Usar marcos temporais objetivos." },
      { text: "A duração de cada fase foi estimada separadamente.", example: "Ex.: aura 10 s, fase motora 60 s, confusão 15 min. Não somar recuperação à duração ictal." },
      { text: "O evento típico foi comparado com eventos atípicos.", example: "Ex.: padrão habitual sem queda versus novo evento com queda. Documentar se pode haver mais de um tipo." },
      { text: "O contexto foi descrito sem assumir causalidade.", example: "Ex.: ocorreu após privação de sono, mas também em dias habituais. Usar linguagem de associação." },
      { text: "A fonte de cada informação está identificada.", example: "Ex.: mãe observou início; escola observou recuperação; vídeo mostra fase motora. Triangular fontes e discrepâncias." },
    ],
  },
  {
    name: "Descritores focais",
    items: [
      { text: "Há evidência de início focal motor.", example: "Ex.: clonia unilateral, postura distônica ou versão cefálica. Registrar lado e sequência." },
      { text: "Há evidência de início focal sensorial ou experiencial.", example: "Ex.: parestesia, fenômeno visual, déjà vu ou medo súbito. Usar relato espontâneo." },
      { text: "Há alteração focal de linguagem ou cognição.", example: "Ex.: bloqueio de fala, afasia ou comportamento automático. Avaliar consciência de forma independente." },
      { text: "Há progressão de sinais focais para envolvimento bilateral tônico-clônico.", example: "Ex.: mão direita, face, perda de consciência e convulsão bilateral. Não omitir o início focal." },
      { text: "O início focal permanece possível, mas não demonstrado.", example: "Ex.: convulsão noturna sem observação dos primeiros segundos. Manter incerteza explícita." },
    ],
  },
  {
    name: "Descritores generalizados ou de início desconhecido",
    items: [
      { text: "Há características de ausência com início e fim abruptos.", example: "Ex.: pausa breve, olhar fixo e retomada imediata. Distinguir desatenção por duração e contexto." },
      { text: "Há mioclonias breves, isoladas ou em séries.", example: "Ex.: solta objetos ao despertar por abalos rápidos. Registrar horário e consciência." },
      { text: "Há crise tônico-clônica bilateral sem início focal observado.", example: "Ex.: rigidez bilateral seguida de abalos, início não visto. Classificar início como desconhecido se necessário." },
      { text: "Há eventos atônicos ou com mioclonia negativa.", example: "Ex.: queda súbita de cabeça ou interrupção breve do tônus. Relacionar lesões e frequência." },
      { text: "Há combinação de tipos de crise sugerindo síndrome específica, sem conclusão automática.", example: "Ex.: ausências, mioclonias e convulsões. Encaminhar para classificação sindrômica clínica." },
    ],
  },
  {
    name: "Contexto e mimetizadores",
    items: [
      { text: "O evento ocorreu em posição, atividade ou estímulo que favoreça síncope.", example: "Ex.: ortostatismo prolongado, dor, calor ou coleta de sangue. Registrar pródromo e recuperação." },
      { text: "O evento ocorre predominantemente no sono e possui características de parassonia.", example: "Ex.: despertar parcial, comportamento complexo e amnésia. Relacionar horário e repetição estereotipada." },
      { text: "Há fenômenos motores habituais que podem imitar crise.", example: "Ex.: tique, estereotipia, tremor, distonia ou shuddering. Avaliar suprimibilidade e contexto." },
      { text: "Há possibilidade de evento psicogênico não epiléptico ou dissociativo.", example: "Ex.: variabilidade, contexto emocional e sinais incongruentes. Abordagem deve ser respeitosa e baseada em avaliação especializada." },
      { text: "Há condição sistêmica que exige investigação paralela.", example: "Ex.: hipoglicemia, distúrbio cardíaco, intoxicação ou infecção. Red flags clínicas têm prioridade sobre classificação." },
    ],
  },
];
