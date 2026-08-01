import type { InteractiveDomainDef } from "./interactiveScaleItems";

export const ipnPcFunFeedingDomains: InteractiveDomainDef[] = [
  {
    name: "Fase oral e eficiência",
    items: [
      { text: "Mantém vedamento labial suficiente para conter alimento e saliva.", emoji: "◒", example: "Ex.: observar escape anterior e necessidade de múltiplas deglutições." },
      { text: "Controla o bolo sem acúmulo importante em sulcos ou bochechas.", emoji: "◇", example: "Ex.: resíduos persistem após a deglutição ou exigem limpeza manual." },
      { text: "Mastiga de modo eficiente para a textura oferecida.", emoji: "♢", example: "Ex.: tritura, lateraliza e organiza sem fadiga excessiva." },
      { text: "Coordena colher, copo ou canudo com abertura e fechamento adequados.", emoji: "◎", example: "Ex.: derrame, mordida no utensílio ou sucção ineficiente." },
      { text: "Conclui volume suficiente em tempo e esforço aceitáveis.", emoji: "⌚", example: "Ex.: refeição prolongada, queda de alerta ou interrupções frequentes." }
    ],
  },
  {
    name: "Sinais faríngeos e segurança",
    items: [
      { text: "Tosse ou engasgo aparecem com consistência, volume ou velocidade específicos.", emoji: "♨", example: "Ex.: diferenciar líquidos finos, pastosos, sólidos e secreção." },
      { text: "A voz ou respiração muda após a deglutição.", emoji: "♒", example: "Ex.: voz molhada, pigarro, ruído respiratório ou queda de saturação." },
      { text: "Há múltiplas deglutições, esforço ou atraso perceptível para iniciar.", emoji: "…", example: "Ex.: alimento permanece na boca ou há pausa longa antes de engolir." },
      { text: "Apresenta episódios silenciosos suspeitos apesar de pouca tosse.", emoji: "⚠", example: "Ex.: infecções, dessaturação, olhos lacrimejantes ou perda de peso sem tosse clara." },
      { text: "O plano de consistência e ritmo está documentado e é seguido por todos.", emoji: "▤", example: "Ex.: mesma orientação em casa, escola e terapia." }
    ],
  },
  {
    name: "Respiração e secreções",
    items: [
      { text: "Apresenta aumento de esforço respiratório durante ou após alimentação.", emoji: "≈", example: "Ex.: tiragem, taquipneia, pausa excessiva ou cansaço." },
      { text: "A tosse é suficiente para limpar secreções quando necessário.", emoji: "♒", example: "Ex.: tosse fraca, congestão persistente ou necessidade frequente de aspiração." },
      { text: "O sono apresenta ronco, pausas, dessaturação ou dificuldade de manejo de secreções.", emoji: "☾", example: "Ex.: despertares, posição obrigatória ou uso de suporte respiratório." },
      { text: "Há histórico de pneumonia, internação ou antibiótico por infecção respiratória recorrente.", emoji: "✚", example: "Ex.: relacionar temporalmente com alimentação e refluxo." }
    ],
  },
  {
    name: "Nutrição, hidratação e trato gastrointestinal",
    items: [
      { text: "O crescimento e a composição corporal são acompanhados com método adequado à condição motora.", emoji: "▱", example: "Ex.: não depender apenas de uma medida isolada de peso." },
      { text: "A ingestão de líquidos parece suficiente para urina, secreções e evacuação adequadas.", emoji: "◒", example: "Ex.: urina concentrada, boca seca ou constipação sugerem baixa hidratação." },
      { text: "Constipação, refluxo, vômitos ou dor abdominal interferem no conforto e alimentação.", emoji: "●", example: "Ex.: piora de tônus, recusa ou irritabilidade em torno das refeições." },
      { text: "A via enteral, quando presente, atende metas sem complicações relevantes.", emoji: "○", example: "Ex.: vazamento, granuloma, obstrução, dor, intolerância ou falha do plano." },
      { text: "Saúde oral e dentária permite mastigação, higiene e conforto.", emoji: "◇", example: "Ex.: cárie, gengivite, dor, bruxismo ou dificuldade de escovação." },
      { text: "A família compreende sinais que exigem avaliação instrumental ou médica prioritária.", emoji: "⚑", example: "Ex.: perda ponderal, pneumonias, engasgos frequentes, desidratação ou dor." }
    ],
  }
];
