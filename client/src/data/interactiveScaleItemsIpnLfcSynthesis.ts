import type { InteractiveDomainDef } from "./interactiveScaleItems";

export const ipnLfcSynthesisDomains: InteractiveDomainDef[] = [
  {
    name: "Resumo funcional",
    items: [
      { text: "Síntese do que a criança compreende, expressa e consegue fazer em contextos reais.", emoji: "◇", example: "Começar por forças e condições de melhor desempenho. Aprofundar: Evitar lista desconectada de escores.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Domínios prioritários",
    items: [
      { text: "Dois ou três domínios com maior impacto atual.", emoji: "◇", example: "Ex.: compreensão de instruções, inteligibilidade e narrativa. Aprofundar: Justificar pela participação e segurança.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Hipóteses a favor",
    items: [
      { text: "Achados que sustentam cada hipótese clínica considerada.", emoji: "◇", example: "Usar fontes convergentes: família, escola, criança e observação. Aprofundar: Separar fato de inferência.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Achados contra ou incertezas",
    items: [
      { text: "Dados que enfraquecem a hipótese ou ainda não foram obtidos.", emoji: "◇", example: "Registrar inconsistências e necessidade de avaliação formal. Aprofundar: Não fechar diagnóstico por ausência de informação.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Red flags e urgência",
    items: [
      { text: "Sinais independentes do escore e ação indicada.", emoji: "⚠", example: "Definir prazo, serviço e orientação à família. Aprofundar: Não diluir urgência em pontuação total.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Meta 1 de comunicação",
    items: [
      { text: "Meta funcional, mensurável, centrada na criança.", emoji: "💬", example: "Definir linha de base, contexto, apoio e prazo. Aprofundar: Ex.: comunicar dor a três parceiros.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Meta 2 de linguagem/aprendizagem",
    items: [
      { text: "Meta relacionada à compreensão, vocabulário, narrativa ou letramento.", emoji: "🗣", example: "Usar indicador observável. Aprofundar: Ex.: seguir instrução de duas etapas com apoio visual reduzido.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Meta 3 de fala/voz/fluência",
    items: [
      { text: "Meta motora, fonológica, vocal ou de fluência quando pertinente.", emoji: "🔊", example: "Relacionar a inteligibilidade e participação. Aprofundar: Não escolher som isolado sem relevância funcional.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Plano de acessibilidade e CAA",
    items: [
      { text: "Modalidades, recursos, acesso motor e parceiros necessários.", emoji: "◇", example: "Garantir disponibilidade em casa, escola e comunidade. Aprofundar: CAA não impede desenvolvimento da fala.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Adaptações escolares",
    items: [
      { text: "Ações objetivas para instrução, avaliação e participação.", emoji: "🏫", example: "Tempo de resposta, apoio visual, formato alternativo e prevenção de bullying. Aprofundar: Articular com PEI e LBI.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Encaminhamentos",
    items: [
      { text: "Pergunta clínica, prioridade e contrarreferência para cada profissional.", emoji: "◇", example: "Fonoaudiologia, audiologia, otorrino, psicologia, pedagogia, genética ou neurologia. Aprofundar: Evitar encaminhamento genérico sem objetivo.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Plano familiar",
    items: [
      { text: "Estratégias de comunicação responsiva sem culpabilização.", emoji: "◇", example: "Esperar, expandir, modelar, ler e criar oportunidades reais. Aprofundar: Definir poucas ações sustentáveis.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Medida de evolução",
    items: [
      { text: "Indicadores funcionais além de acurácia de teste.", emoji: "◇", example: "Inteligibilidade, participação, reparo, compreensão, qualidade de vida e generalização. Aprofundar: Registrar mesma medida na reavaliação.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Devolutiva acessível",
    items: [
      { text: "Mensagem principal para família, criança e escola.", emoji: "◇", example: "Diferenciar achados, hipóteses, incertezas e próximos passos. Aprofundar: Evitar jargão e promessa de cura.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Data e gatilhos de reavaliação",
    items: [
      { text: "Prazo e eventos que exigem retorno antecipado.", emoji: "◇", example: "Regressão, perda auditiva, engasgos, piora escolar ou falha de recurso. Aprofundar: Definir responsável por acompanhar.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
];
