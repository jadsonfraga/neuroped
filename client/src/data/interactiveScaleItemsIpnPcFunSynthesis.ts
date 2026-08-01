import type { InteractiveDomainDef } from "./interactiveScaleItems";

export const ipnPcFunSynthesisDomains: InteractiveDomainDef[] = [
  {
    name: "Síntese funcional e metas",
    items: [
      { text: "Classificações funcionais registradas, com fonte e data.", emoji: "▤", example: "Documente sistemas reconhecidos quando aplicados por profissional treinado, sem inferir nível pelo questionário.", responseType: "text", placeholder: "GMFCS/MACS/CFCS/EDACS ou outros: nível, data, avaliador…", required: false },
      { text: "Fenótipo motor predominante e componentes mistos.", emoji: "〰", example: "Resuma espasticidade, distonia, discinesia, fraqueza, controle seletivo e contraturas.", responseType: "text", placeholder: "Síntese neuromotora e evidências observadas…", required: false },
      { text: "Funções preservadas e estratégias espontâneas eficazes.", emoji: "✓", example: "Valorize capacidades, compensações e condições em que o desempenho melhora.", responseType: "text", placeholder: "Forças funcionais e facilitadores…", required: false },
      { text: "Barreiras corporais com maior impacto atual.", emoji: "△", example: "Priorize dor, fadiga, tônus, amplitude, respiração, deglutição ou pele conforme o caso.", responseType: "text", placeholder: "Barreiras prioritárias e impacto…", required: false },
      { text: "Barreiras ambientais e de atitude.", emoji: "⌂", example: "Inclua acesso físico, tempo, comunicação, expectativas, transporte e preconceito.", responseType: "text", placeholder: "Barreiras externas e oportunidades de mudança…", required: false },
      { text: "Facilitadores ambientais disponíveis ou possíveis.", emoji: "⚙", example: "Mapeie tecnologia, apoio, mobiliário, parceiro de comunicação e ajustes de rotina.", responseType: "text", placeholder: "Recursos já eficazes e recursos a testar…", required: false },
      { text: "Meta 1 centrada na criança e na participação.", emoji: "1", example: "Defina atividade concreta, contexto e indicador observável.", responseType: "text", placeholder: "Meta, linha de base, critério e prazo…", required: false },
      { text: "Meta 2 centrada na criança e na participação.", emoji: "2", example: "Evite meta genérica de ‘normalizar tônus’ sem ganho de vida diária.", responseType: "text", placeholder: "Meta, linha de base, critério e prazo…", required: false },
      { text: "Meta 3 centrada na família e facilidade de cuidado.", emoji: "3", example: "Ex.: reduzir dor na troca, melhorar sono ou tornar transferência segura.", responseType: "text", placeholder: "Meta, linha de base, critério e prazo…", required: false },
      { text: "Plano de dor, conforto e sono.", emoji: "♥", example: "Defina como reconhecer, medir, prevenir, tratar e reavaliar.", responseType: "text", placeholder: "Sinais individuais, medidas e critérios de revisão…", required: false },
      { text: "Plano de alimentação, deglutição e respiração.", emoji: "♨", example: "Inclua posição, consistência, ritmo, sinais de parada e encaminhamentos.", responseType: "text", placeholder: "Plano compartilhado e critérios de urgência…", required: false },
      { text: "Plano de posicionamento, mobilidade e transferências.", emoji: "⇄", example: "Defina alternância postural, dispositivos, treinamento e segurança.", responseType: "text", placeholder: "Rotina postural, equipamentos e responsáveis…", required: false },
      { text: "Plano de comunicação e participação.", emoji: "▣", example: "Garantir CAA disponível, tempo de resposta e escolhas reais.", responseType: "text", placeholder: "Sistema, acesso, parceiros e contextos…", required: false },
      { text: "Adaptações escolares e responsabilidades.", emoji: "★", example: "Converta necessidades em ações observáveis no PEI.", responseType: "text", placeholder: "Adaptações, responsáveis, frequência e monitoramento…", required: false },
      { text: "Vigilância musculoesquelética e saúde óssea.", emoji: "△", example: "Registrar quadril, coluna, amplitude, fraturas, vitamina D e seguimento quando indicado.", responseType: "text", placeholder: "Exames, frequência e profissionais responsáveis…", required: false },
      { text: "Intervenções para tônus: objetivo, benefício esperado e risco.", emoji: "⚖", example: "Documente decisão compartilhada, medida de resultado e plano após procedimento.", responseType: "text", placeholder: "Intervenção, alvo, meta, acompanhamento e critérios de suspensão…", required: false },
      { text: "Encaminhamentos e contrarreferência.", emoji: "→", example: "Defina pergunta clínica para cada especialidade e retorno esperado.", responseType: "text", placeholder: "Especialidade, objetivo, urgência e informação de retorno…", required: false },
      { text: "Plano de segurança e urgência.", emoji: "⚑", example: "Inclua crises, aspiração, piora respiratória, status distônico, falha de bomba e contatos.", responseType: "text", placeholder: "Evento, primeira ação, serviço e contatos…", required: false },
      { text: "Devolutiva em linguagem acessível à família e à criança.", emoji: "☏", example: "Separe achados, incertezas, prioridades e próximos passos.", responseType: "text", placeholder: "Mensagem principal e decisões compartilhadas…", required: false },
      { text: "Data e critérios de reavaliação.", emoji: "⌚", example: "Revisar por prazo e por evento: crescimento, cirurgia, dor, perda funcional ou novo equipamento.", responseType: "text", placeholder: "Prazo, indicadores e gatilhos de retorno antecipado…", required: false }
    ],
  }
];
