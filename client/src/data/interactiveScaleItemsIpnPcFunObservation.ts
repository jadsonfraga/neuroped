import type { InteractiveDomainDef } from "./interactiveScaleItems";

export const ipnPcFunObservationDomains: InteractiveDomainDef[] = [
  {
    name: "Postura e alinhamento",
    items: [
      { text: "Tem dificuldade para manter alinhamento de cabeça em relação ao tronco durante atividade funcional.", emoji: "◉", example: "Ex.: observar sentado, em pé e durante alcance, sem corrigir continuamente." },
      { text: "Tem dificuldade para manter o tronco estável o suficiente para liberar membros superiores.", emoji: "▰", example: "Ex.: consegue alcançar sem colapsar ou depender de apoio total." },
      { text: "Apresenta assimetria persistente de pelve, tronco ou descarga de peso.", emoji: "◐", example: "Ex.: obliquidade pélvica, rotação ou apoio predominante em um lado." },
      { text: "O sistema de assento não oferece suporte, distribuição de pressão ou alcance funcional adequados.", emoji: "♿", example: "Ex.: pés apoiados, pelve estável, mesa acessível e sem pontos de pressão." }
    ],
  },
  {
    name: "Mobilidade e transferências",
    items: [
      { text: "Tem dificuldade para realizar transição postural com estratégia eficiente para seu nível funcional.", emoji: "⇄", example: "Ex.: rolar, sentar, ajoelhar, levantar ou transferir com apoio adequado." },
      { text: "A marcha ou mobilidade assistida apresenta risco, gasto excessivo de energia ou baixa utilidade funcional.", emoji: "⇢", example: "Ex.: avaliar velocidade útil, quedas, energia e acesso ao ambiente." },
      { text: "Demonstra perda recente de habilidade, resistência ou tolerância ao esforço.", emoji: "↓", example: "Ex.: comparar com registros anteriores e relato familiar." },
      { text: "O cuidador não dispõe de técnica segura e sustentável nas transferências.", emoji: "⚙", example: "Ex.: número de pessoas, uso de guincho, postura e comunicação prévia." }
    ],
  },
  {
    name: "Membros superiores e função manual",
    items: [
      { text: "Tem dificuldade para usar as duas mãos de modo complementar quando a tarefa permite.", emoji: "✋", example: "Ex.: uma estabiliza e a outra manipula, com adaptações se necessário." },
      { text: "O alcance voluntário é limitado por fraqueza, controle seletivo, tônus ou dor.", emoji: "↗", example: "Ex.: diferenciar incapacidade de falta de oportunidade." },
      { text: "A órtese ou adaptação não melhora a tarefa ou produz dano, desconforto ou dependência desnecessária.", emoji: "□", example: "Ex.: comparar com e sem dispositivo em atividade real." }
    ],
  },
  {
    name: "Comunicação e cognição funcional",
    items: [
      { text: "Não existe resposta consistente para sim, não, escolha e interrupção.", emoji: "●", example: "Ex.: testar com perguntas conhecidas e parceiros diferentes." },
      { text: "O acesso ao recurso de comunicação não é motoramente viável em todos os contextos necessários.", emoji: "▣", example: "Ex.: toque, varredura, olhar, switch ou parceiro assistido." },
      { text: "A demanda motora ou de fala mascara habilidades cognitivas preservadas.", emoji: "△", example: "Ex.: oferecer resposta por seleção, tempo ampliado ou demonstração não verbal." }
    ],
  },
  {
    name: "Alimentação e respiração",
    items: [
      { text: "A posição não oferece estabilidade suficiente de pelve, tronco, cabeça e pés para alimentação.", emoji: "♨", example: "Ex.: observar antes de concluir que a dificuldade é oral." },
      { text: "Há sinais clínicos de comprometimento da segurança da deglutição.", emoji: "♒", example: "Ex.: tosse, alteração vocal, dessaturação, aumento de esforço ou infecções." },
      { text: "A respiração ou o manejo de secreções não permanecem estáveis durante atividade e repouso.", emoji: "≈", example: "Ex.: frequência, esforço, ruídos, tosse efetiva e necessidade de aspiração." }
    ],
  },
  {
    name: "Dor, pele e segurança",
    items: [
      { text: "Há sinais comportamentais ou fisiológicos de dor durante exame e manuseio.", emoji: "♥", example: "Ex.: expressão, tônus, frequência cardíaca, retirada ou vocalização." },
      { text: "Há alteração de pele nas áreas de apoio ou contato com equipamentos.", emoji: "□", example: "Ex.: sacro, ísquios, pés, tornozelos, cotovelos e pontos de órtese." },
      { text: "O plano de monitoramento e encaminhamento diante de piora clínica não está claramente definido.", emoji: "⚠", example: "Ex.: equipe e família não compartilham sinais de parada, urgência, contato e primeira ação." }
    ],
  }
];
