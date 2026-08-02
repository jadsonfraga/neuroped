import type { InteractiveDomainDef } from "./interactiveScaleItems";

export const ipnEpiSegObservationDomains: InteractiveDomainDef[] = [
  {
    name: "Sequência semiológica",
    items: [
      { text: "O primeiro sinal observável foi identificado com precisão temporal.", example: "Ex.: alteração ocular precede postura tônica em segundos. Construir linha do tempo segundo a segundo." },
      { text: "A evolução dos sinais motores foi descrita por segmento e lado.", example: "Ex.: mão direita, face direita, depois generalização bilateral. Evitar rótulo único para sequência complexa." },
      { text: "Foram registrados automatismos e comportamentos motores não direcionados.", example: "Ex.: mastigação, manipulação de roupa, marcha automática. Distinguir de ação voluntária contextual." },
      { text: "Foram descritos fenômenos negativos, como perda de força ou interrupção motora.", example: "Ex.: queda de cabeça, perda de tônus ou parada súbita do movimento. Registrar duração e recuperação." },
      { text: "Foram observadas manifestações vocais ou de linguagem.", example: "Ex.: grito inicial, vocalização, fala preservada ou afasia ictal. Separar produção de compreensão." },
      { text: "A cronologia incluiu fase pós-evento, e não apenas manifestações ictais.", example: "Ex.: confusão, sonolência, déficit focal ou cefaleia. Definir retorno ao basal." },
      { text: "A descrição permite reconhecer se houve manifestações observáveis ou não observáveis.", example: "Ex.: sensação subjetiva relatada sem sinal externo evidente. Incorporar relato do paciente e observador." },
      { text: "A classificação permaneceu provisória quando o início não foi observado.", example: "Ex.: encontrada já em crise generalizada sem informação do começo. Usar categoria de início desconhecido quando apropriado." },
    ],
  },
  {
    name: "Consciência e responsividade",
    items: [
      { text: "A responsividade foi testada de forma padronizada e segura.", example: "Ex.: comando simples e pergunta de orientação. Registrar estímulo e resposta exata." },
      { text: "A recordação do período foi avaliada após recuperação.", example: "Ex.: lembra palavra ou comando apresentado durante o evento. Evitar concluir apenas pela aparência." },
      { text: "A consciência foi classificada como preservada, prejudicada ou indeterminada quando aplicável.", example: "Ex.: comportamento automático não basta para inferir consciência. Documentar limites da observação." },
      { text: "Alterações de linguagem não foram confundidas automaticamente com perda de consciência.", example: "Ex.: afasia com atenção preservada. Usar tarefas não verbais quando necessário." },
    ],
  },
  {
    name: "Sinais motores e autonômicos",
    items: [
      { text: "Foram descritas características tônicas, clônicas, mioclônicas ou distônicas.", example: "Ex.: postura sustentada versus abalos rítmicos ou breves. Registrar ritmo, simetria e progressão." },
      { text: "Foram observados desvio ocular e cefálico com direção e duração.", example: "Ex.: olhos e cabeça para a esquerda por 20 segundos. Distinguir versão sustentada de olhar casual." },
      { text: "Foram registrados sinais autonômicos relevantes.", example: "Ex.: alteração respiratória, salivação, vômito, palidez ou rubor. Relacionar à sequência ictal." },
      { text: "Foram avaliados cianose, trauma e comprometimento respiratório.", example: "Ex.: saturação quando disponível e contexto de obstrução. Red flag independente de qualquer escore." },
    ],
  },
  {
    name: "Recuperação e diferenciais",
    items: [
      { text: "O retorno ao basal foi observado em cognição, fala, marcha e comportamento.", example: "Ex.: orientação retorna antes do equilíbrio. Registrar cada dimensão separadamente." },
      { text: "Foram considerados sinais que favorecem síncope.", example: "Ex.: pródromo vegetativo, contexto ortostático e recuperação rápida. Não excluir epilepsia sem avaliação completa." },
      { text: "Foram considerados eventos não epilépticos funcionais ou comportamentais sem julgamento pejorativo.", example: "Ex.: duração variável, contexto e responsividade complexa. Diagnóstico exige avaliação clínica adequada." },
      { text: "Foram considerados distúrbios do sono, refluxo, movimentos estereotipados e outros mimetizadores.", example: "Ex.: parassonia, shuddering, tique ou distonia. Correlacionar vídeo, história e EEG quando indicado." },
    ],
  },
];
