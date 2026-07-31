import type { InteractiveScaleDef } from "./interactiveScaleItems";
import { IPN_BANDS } from "./interactiveScaleItemsIpnTeaCommon";

const AGE_LABELS = [
  "Adequado / sem preocupação relevante",
  "Parcial, inconsistente ou com dúvida",
  "Dificuldade ou achado clinicamente relevante",
  "N/O · Sem oportunidade / não aplicável",
];

export const ipnTeaAgeItemsPart1: Record<string, InteractiveScaleDef> = {
  "ipn-tea-18-30m": {
    instruction: "Use como guia de investigação para a faixa etária. Em cada eixo, marque se o funcionamento está adequado, parcial/inconsistente ou se há dificuldade clinicamente relevante. Registre exemplo, contexto, frequência, impacto, trajetória e suporte que melhora o desempenho.",
    infoBox: "Módulo breve de 18–30 meses. Priorize história do desenvolvimento, audição, comunicação funcional e atenção compartilhada natural. Ausência de fala isolada não define TEA. Instrumento autoral, não padronizado e sem ponto de corte diagnóstico.",
    labels: AGE_LABELS,
    optionPoints: [0, 1, 2, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Síntese qualitativa — ipn-tea-18-30m",
    bands: [...IPN_BANDS],
    domains: [
      { name: "Eixos da faixa etária", items: [
        {"text": "Orientação social — Olha, sorri, vocaliza ou se aproxima para manter troca com cuidador?"},
        {"text": "Atenção compartilhada — Alterna olhar entre pessoa e objeto; aponta para mostrar, não apenas pedir?"},
        {"text": "Gestos — Usa dar, mostrar, acenar, negar, chamar e imitar espontaneamente?"},
        {"text": "Resposta ao nome — Responde em ambiente calmo e sem estar totalmente absorvido?"},
        {"text": "Imitação — Imita ações simples com objetos, gestos e expressões?"},
        {"text": "Brincadeira — Explora função e inicia faz-de-conta simples?"},
        {"text": "Linguagem — Usa sons, palavras ou CAA para várias funções comunicativas?"},
        {"text": "Repetição — Há movimentos, uso repetitivo de objetos ou fascínio sensorial?"},
        {"text": "Flexibilidade — Como reage a pequenas mudanças de rotina e interrupções?"},
        {"text": "Regressão — ⚠️ ALERTA SENTINELA — Houve perda de palavras, gestos ou engajamento?"},
      ] },
    ],
  },
  "ipn-tea-31-47m": {
    instruction: "Use como guia de investigação para a faixa etária. Em cada eixo, marque se o funcionamento está adequado, parcial/inconsistente ou se há dificuldade clinicamente relevante. Registre exemplo, contexto, frequência, impacto, trajetória e suporte que melhora o desempenho.",
    infoBox: "Módulo breve de 31–47 meses. Compare brincar sozinho com brincar cocriado, pragmática e generalização entre casa, escola e terapia. Instrumento autoral, não padronizado e sem ponto de corte diagnóstico.",
    labels: AGE_LABELS,
    optionPoints: [0, 1, 2, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Síntese qualitativa — ipn-tea-31-47m",
    bands: [...IPN_BANDS],
    domains: [
      { name: "Eixos da faixa etária", items: [
        {"text": "Iniciativa social — Convida adulto ou criança para compartilhar brincadeira?"},
        {"text": "Brincadeira simbólica — Representa papéis e aceita mudança no enredo?"},
        {"text": "Conversação inicial — Responde e acrescenta algo, ou apenas repete/pergunta?"},
        {"text": "Pares — Observa, aproxima-se e consegue entrar em brincadeira?"},
        {"text": "Emoções — Reconhece e responde a emoções básicas no contexto?"},
        {"text": "Rigidez — Exige rotinas, frases, objetos ou sequências específicas?"},
        {"text": "Interesses — Há temas ou objetos de intensidade incomum?"},
        {"text": "Sensorial — Reações ou buscas interferem em banho, roupa, alimentação ou saída?"},
        {"text": "Autonomia — Comunica banheiro, dor, fome e necessidade de ajuda?"},
        {"text": "Regulação — Como se recupera de frustração, espera e transição?"},
      ] },
    ],
  },
  "ipn-tea-4-5a": {
    instruction: "Use como guia de investigação para a faixa etária. Em cada eixo, marque se o funcionamento está adequado, parcial/inconsistente ou se há dificuldade clinicamente relevante. Registre exemplo, contexto, frequência, impacto, trajetória e suporte que melhora o desempenho.",
    infoBox: "Módulo breve de 4–5 anos e 11 meses. A demanda de grupo e alfabetização pode tornar sinais mais visíveis; diferencie linguagem, TDAH, ansiedade e imaturidade. Instrumento autoral, não padronizado e sem ponto de corte diagnóstico.",
    labels: AGE_LABELS,
    optionPoints: [0, 1, 2, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Síntese qualitativa — ipn-tea-4-5a",
    bands: [...IPN_BANDS],
    domains: [
      { name: "Eixos da faixa etária", items: [
        {"text": "Conversa — Mantém tema compartilhado e faz perguntas sobre o outro?"},
        {"text": "Narrativa — Conta acontecimentos com sequência e contexto?"},
        {"text": "Faz-de-conta — Negocia papéis e tolera ideias do parceiro?"},
        {"text": "Grupo — Segue regras explícitas e percebe regras implícitas?"},
        {"text": "Amizade — Diferencia colega, amigo e adulto de referência?"},
        {"text": "Literalidade — Compreende brincadeiras simples e linguagem indireta?"},
        {"text": "Flexibilidade — Tolera erro, perda e mudança de plano?"},
        {"text": "Perfil sensorial — Como lida com sala, recreio, festas, roupa e alimentação?"},
        {"text": "Aprendizagem — Há ilhas de habilidade e dificuldade de generalização?"},
        {"text": "Segurança — Pede ajuda e reconhece riscos básicos?"},
      ] },
    ],
  },
};
