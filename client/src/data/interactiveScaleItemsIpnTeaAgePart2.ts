import type { InteractiveScaleDef } from "./interactiveScaleItems";
import { IPN_BANDS } from "./interactiveScaleItemsIpnTeaCommon";

const AGE_LABELS = [
  "Adequado / sem preocupação relevante",
  "Parcial, inconsistente ou com dúvida",
  "Dificuldade ou achado clinicamente relevante",
  "N/O · Sem oportunidade / não aplicável",
];

export const ipnTeaAgeItemsPart2: Record<string, InteractiveScaleDef> = {
  "ipn-tea-6-8a": {
    instruction: "Use como guia de investigação para a faixa etária. Em cada eixo, marque se o funcionamento está adequado, parcial/inconsistente ou se há dificuldade clinicamente relevante. Registre exemplo, contexto, frequência, impacto, trajetória e suporte que melhora o desempenho.",
    infoBox: "Módulo breve de 6–8 anos. Mapeie discrepância acadêmica-adaptativa, bullying e se oposição aparente reflete rigidez, linguagem, sobrecarga ou ansiedade. Instrumento autoral, não padronizado e sem ponto de corte diagnóstico.",
    labels: AGE_LABELS,
    optionPoints: [0, 1, 2, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Síntese qualitativa — ipn-tea-6-8a",
    bands: [...IPN_BANDS],
    domains: [
      { name: "Eixos da faixa etária", items: [
        {"text": "Reciprocidade — Conversa para trocar ideias, não só transmitir fatos?"},
        {"text": "Inferência — Compreende intenção, causa social e ideia principal?"},
        {"text": "Amizade — Mantém vínculo recíproco e repara conflitos?"},
        {"text": "Recreio — Participa ou apenas fica ao lado, repete atividade ou busca adulto?"},
        {"text": "Regras — Aplica regra com contexto e tolera exceção?"},
        {"text": "Interesses — O tema preferido facilita ou restringe participação?"},
        {"text": "Função executiva — Inicia, organiza e conclui tarefas sem suporte desproporcional?"},
        {"text": "Sensorial — Ambiente coletivo provoca sobrecarga ou evasão?"},
        {"text": "Autonomia — Higiene, materiais, banheiro e segurança são compatíveis com capacidade?"},
        {"text": "Bem-estar — Há ansiedade, bullying, somatização ou exaustão pós-escola?"},
      ] },
    ],
  },
  "ipn-tea-9-12a": {
    instruction: "Use como guia de investigação para a faixa etária. Em cada eixo, marque se o funcionamento está adequado, parcial/inconsistente ou se há dificuldade clinicamente relevante. Registre exemplo, contexto, frequência, impacto, trajetória e suporte que melhora o desempenho.",
    infoBox: "Módulo breve de 9–12 anos. Inclua custo subjetivo e camuflagem; contato ocular, notas altas ou uma amizade não excluem TEA. Instrumento autoral, não padronizado e sem ponto de corte diagnóstico.",
    labels: AGE_LABELS,
    optionPoints: [0, 1, 2, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Síntese qualitativa — ipn-tea-9-12a",
    bands: [...IPN_BANDS],
    domains: [
      { name: "Eixos da faixa etária", items: [
        {"text": "Camuflagem — Observa e copia pares, ensaia falas ou esconde necessidades?"},
        {"text": "Pertencimento — Tem amizades recíprocas ou acompanha grupos sem intimidade?"},
        {"text": "Pragmática — Percebe ironia, reputação, segredo e intenção ambígua?"},
        {"text": "Identidade — Sente-se diferente, confuso ou exausto ao tentar se encaixar?"},
        {"text": "Interesses — Existe profundidade incomum e dificuldade de ampliar repertório?"},
        {"text": "Rigidez cognitiva — Tolera múltiplas respostas, feedback e mudança de estratégia?"},
        {"text": "Executivo — Gerencia prazos, materiais e várias demandas simultâneas?"},
        {"text": "Sensorial/interocepção — Reconhece limite, dor, fome, banheiro e necessidade de pausa?"},
        {"text": "Saúde mental — Ansiedade, humor, recusa escolar ou autocrítica aumentaram?"},
        {"text": "Segurança digital — Compreende privacidade, manipulação e consentimento on-line?"},
      ] },
    ],
  },
  "ipn-tea-13-17a": {
    instruction: "Use como guia de investigação para a faixa etária. Em cada eixo, marque se o funcionamento está adequado, parcial/inconsistente ou se há dificuldade clinicamente relevante. Registre exemplo, contexto, frequência, impacto, trajetória e suporte que melhora o desempenho.",
    infoBox: "Módulo breve de 13–17 anos. Respeite privacidade e autonomia. Itens de risco exigem avaliação imediata, independentemente da hipótese de TEA. Instrumento autoral, não padronizado e sem ponto de corte diagnóstico.",
    labels: AGE_LABELS,
    optionPoints: [0, 1, 2, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Síntese qualitativa — ipn-tea-13-17a",
    bands: [...IPN_BANDS],
    domains: [
      { name: "Eixos da faixa etária", items: [
        {"text": "Esforço social — Quanto planejamento e recuperação são necessários para interagir?"},
        {"text": "Camuflagem — Há persona social, scripts, imitação ou supressão de autorregulação?"},
        {"text": "Relações — Compreende limites, consentimento, flerte, manipulação e ruptura?"},
        {"text": "Autonomia — Organiza estudo, autocuidado, transporte, dinheiro e compromissos?"},
        {"text": "Flexibilidade — Lida com ambiguidade, futuro incerto e mudanças de identidade?"},
        {"text": "Interesses — Apoiam projeto de vida ou limitam repertório e rotina?"},
        {"text": "Sensorial — Consegue prever e comunicar necessidade de ajuste?"},
        {"text": "Burnout — Há perda de função após esforço prolongado, com exaustão e retraimento?"},
        {"text": "Saúde mental — ⚠️ ALERTA SENTINELA — Avaliar ansiedade, depressão, autolesão e ideação suicida diretamente."},
        {"text": "Transição — Quais suportes serão necessários em ensino médio, faculdade ou trabalho?"},
      ] },
    ],
  },
};
