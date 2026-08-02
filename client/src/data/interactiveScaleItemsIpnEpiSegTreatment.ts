import type { InteractiveDomainDef } from "./interactiveScaleItems";

export const ipnEpiSegTreatmentDomains: InteractiveDomainDef[] = [
  {
    name: "Estratégia terapêutica e adesão",
    items: [
      { text: "A indicação de tratamento foi discutida considerando tipo de crise, síndrome, idade e risco.", example: "Ex.: decisão compartilhada após avaliação clínica e exames pertinentes. Não usar o instrumento para prescrever." },
      { text: "O esquema atual está registrado com dose por tomada, dose diária e horários.", example: "Ex.: evitar apenas nome comercial sem concentração. Conferir peso e formulação quando relevante." },
      { text: "A adesão foi avaliada sem julgamento, incluindo barreiras reais.", example: "Ex.: custo, sabor, rotina escolar, dificuldade de deglutição ou esquecimento. Planejar soluções concretas." },
      { text: "A resposta é avaliada por frequência, duração, gravidade e impacto funcional.", example: "Ex.: menos quedas e recuperação mais rápida, mesmo sem zerar eventos. Definir linha de base comparável." },
      { text: "Mudanças de dose ou medicamento têm data e motivo documentados.", example: "Ex.: ineficácia, efeito adverso, interação ou nova classificação. Evitar múltiplas mudanças sem rastreabilidade." },
    ],
  },
  {
    name: "Efeitos adversos e monitoramento",
    items: [
      { text: "Sonolência, tontura e alterações cognitivas são monitoradas.", example: "Ex.: queda no rendimento após titulação. Comparar com sono e carga de crises." },
      { text: "Humor, irritabilidade e comportamento são monitorados.", example: "Ex.: mudança temporal após início ou aumento de dose. Avaliar também comorbidades." },
      { text: "Rash, sintomas sistêmicos ou sinais de hipersensibilidade são tratados como red flags.", example: "Ex.: febre, lesão de mucosa ou edema. Orientar avaliação urgente conforme quadro." },
      { text: "Peso, apetite e parâmetros laboratoriais são acompanhados quando indicados.", example: "Ex.: alteração ponderal ou risco metabólico/hepático. Seguir perfil da medicação e do paciente." },
      { text: "Riscos reprodutivos e aconselhamento apropriado são considerados na adolescência.", example: "Ex.: valproato/topiramato e potenciais riscos conforme regulamentação aplicável. Decisão individualizada e documentada." },
    ],
  },
  {
    name: "Plano de resgate e clusters",
    items: [
      { text: "Existe definição clara de evento prolongado para aquela criança.", example: "Ex.: limiar temporal individual no plano escrito. Alinhar com orientação médica e serviço de emergência." },
      { text: "O plano diferencia crise prolongada de crises repetidas em cluster.", example: "Ex.: múltiplos eventos sem recuperação completa. Definir quando usar resgate e quando chamar SAMU 192." },
      { text: "A medicação de resgate tem dose, via e responsáveis documentados.", example: "Ex.: midazolam ou diazepam conforme prescrição individual. Não improvisar dose ou via." },
      { text: "A resposta ao resgate é registrada.", example: "Ex.: tempo até cessar, efeitos respiratórios e necessidade de segunda medida. Levar registro ao retorno." },
      { text: "O plano contempla falha do resgate e recorrência.", example: "Ex.: acionar emergência se não houver resposta no tempo definido. Treinar cuidadores e escola." },
    ],
  },
  {
    name: "Redução de risco e seguimento",
    items: [
      { text: "O risco de lesões, afogamento, queimaduras e quedas foi discutido individualmente.", example: "Ex.: plano para banho, piscina, cozinha e alturas. Evitar proibições genéricas." },
      { text: "Sono, adesão e uso de álcool/substâncias são abordados conforme idade.", example: "Ex.: adolescente compreende fatores de risco e escolhas seguras. Abordagem confidencial e apropriada." },
      { text: "Risco de morte relacionada à epilepsia, incluindo SUDEP, é discutido de modo proporcional.", example: "Ex.: adesão, controle de crises tônico-clônicas e segurança noturna. Comunicação deve ser clara, não alarmista e individualizada." },
      { text: "Comorbidades neurodesenvolvimentais, cognitivas e de saúde mental são rastreadas.", example: "Ex.: TDAH, TEA, ansiedade, depressão e dificuldades de aprendizagem. Integrar cuidado multiprofissional." },
      { text: "Há plano de transição, seguimento e reavaliação por mudanças clínicas.", example: "Ex.: crescimento, puberdade, nova escola, gravidez potencial ou perda de controle. Definir data e gatilhos de retorno antecipado." },
    ],
  },
];
