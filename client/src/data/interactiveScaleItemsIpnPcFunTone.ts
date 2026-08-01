import type { InteractiveDomainDef } from "./interactiveScaleItems";

export const ipnPcFunToneDomains: InteractiveDomainDef[] = [
  {
    name: "Fenótipo motor",
    items: [
      { text: "A resistência ao movimento aumenta claramente com maior velocidade de estiramento.", emoji: "↯", example: "Ex.: comparar movimento lento e rápido em mais de uma articulação." },
      { text: "A hipertonia está presente mesmo em movimento lento e flutua com repetição ou estímulo.", emoji: "〰", example: "Ex.: postura rígida variável, acionada por toque ou tarefa distante." },
      { text: "Movimentos ou posturas involuntárias são iniciados ou agravados pela ação voluntária.", emoji: "↗", example: "Ex.: alcançar com a mão desencadeia extensão ou rotação em outro segmento." },
      { text: "Há movimentos rápidos, imprevisíveis ou serpenteantes além da distonia sustentada.", emoji: "≈", example: "Ex.: observar coreia, atetose ou combinação de padrões." },
      { text: "O quadro apresenta mistura de espasticidade, distonia, fraqueza e controle seletivo reduzido.", emoji: "◫", example: "Ex.: registrar a contribuição de cada componente para a tarefa." }
    ],
  },
  {
    name: "Distribuição e gatilhos",
    items: [
      { text: "A alteração de tônus é focal, segmentar, hemicorporal ou generalizada.", emoji: "⌖", example: "Ex.: mapear segmentos e lados, não usar apenas rótulo global." },
      { text: "Dor, emoção, fadiga, ruído, toque ou esforço pioram o padrão motor.", emoji: "⚡", example: "Ex.: identificar gatilhos modificáveis e contexto de maior interferência." },
      { text: "O sono ou relaxamento reduzem significativamente as posturas involuntárias.", emoji: "☾", example: "Ex.: comparar vigília, distração, tarefa e repouso." },
      { text: "A postura de um segmento desencadeia overflow em outro.", emoji: "↔", example: "Ex.: abrir a mão aumenta extensão do pescoço ou membros inferiores." },
      { text: "Episódios de aumento do tônus não estão adequadamente caracterizados ou monitorados.", emoji: "⚠", example: "Ex.: faltam registro de duração, gatilhos, dor, recuperação e resposta às medidas." }
    ],
  },
  {
    name: "Amplitude e componentes fixos",
    items: [
      { text: "A amplitude passiva difere de forma relevante entre movimento lento e rápido.", emoji: "↔", example: "Ex.: sugere componente dinâmico além de encurtamento fixo." },
      { text: "Há contratura fixa que limita posição mesmo com relaxamento adequado.", emoji: "□", example: "Ex.: não atinge amplitude funcional em movimento lento e sustentado." },
      { text: "Dor ou reação defensiva limita a avaliação de amplitude.", emoji: "♥", example: "Ex.: não atribuir automaticamente a tônus; investigar quadril, fratura ou pele." },
      { text: "O alinhamento ósseo ou deformidade modifica o movimento disponível.", emoji: "△", example: "Ex.: torsão, subluxação, escoliose, pé deformado ou rotação pélvica." },
      { text: "A órtese mantém posição proposta sem pressão, dor ou perda funcional relevante.", emoji: "□", example: "Ex.: revisar objetivo, tempo de uso, ajuste e tolerância." }
    ],
  },
  {
    name: "Interferência funcional",
    items: [
      { text: "A alteração de tônus impede uma meta específica de mobilidade ou autocuidado.", emoji: "→", example: "Ex.: definir a tarefa concreta, não apenas ‘reduzir tônus’." },
      { text: "A alteração de tônus piora dor, sono ou tolerância ao posicionamento.", emoji: "☾", example: "Ex.: registrar frequência, intensidade e horários." },
      { text: "A alteração de tônus dificulta higiene, vestir, transferir ou alimentar.", emoji: "◎", example: "Ex.: mensurar tempo, número de pessoas e esforço do cuidado." },
      { text: "O tônus contribui positivamente para alguma função que pode ser perdida ao tratar.", emoji: "⚖", example: "Ex.: usa extensão para ficar em pé ou rigidez para estabilizar transferência." },
      { text: "Há meta compartilhada e medida de resultado antes de intervenção focal ou sistêmica.", emoji: "★", example: "Ex.: conforto, sono, posição, função manual, marcha ou facilidade de cuidado." }
    ],
  }
];
