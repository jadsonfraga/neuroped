// ============================================================
// PODJ-TEA PRIME — Inventário observacional por faixa etária
//
// Conteúdo AUTORAL (Dr. Jadson Fraga), transcrito literalmente das
// Fichas de Aplicação do "Kit Fichas por Paciente" (PODJ-TEA PRIME):
//   • 1–6A   → 12 meses a 5 anos e 11 meses (80 itens observáveis)
//   • 6–12A  → 6 anos a 12 anos e 11 meses  (80 itens observáveis)
//   • 12–19A → 12 a 19 anos                 (80 itens observáveis)
//
// Cada item é observado pelo profissional e pontuado na MESMA legenda
// qualitativa da ficha original:
//   0 adequado · 1 discreto · 2 claro/moderado · 3 intenso/importante
//   NO não observado · NA não aplicável
//
// As "estações" (materiais/domínios de aplicação da folha de pontuação)
// foram REMOVIDAS a pedido do autor — mantém-se apenas o inventário de
// itens por faixa etária, agrupado por eixo clínico.
//
// Por decisão do autor (2026), o RESULTADO no app exibe apenas as
// perguntas e as respostas selecionadas por extenso — sem escore, ponto
// de corte, percentual ou classificação automática (o GenericScale já
// respeita isso). As faixas abaixo existem só para satisfazer o tipo e
// não são exibidas. Método observacional complementar — não é teste
// diagnóstico isolado; usar dentro do escopo profissional.
// ============================================================
import { ClipboardList, type LucideIcon } from "lucide-react";
import type { InteractiveScaleDef, InteractiveBand } from "./interactiveScaleItems";

// Legenda de pontuação idêntica à das fichas originais.
const PODJ_LABELS = [
  "0 · Adequado",
  "1 · Discreto",
  "2 · Claro / moderado",
  "3 · Intenso / importante",
  "NO · Não observado",
  "NA · Não aplicável",
];
// 0–3 refletem intensidade; NO/NA não somam. O escore não é exibido
// (resultado por extenso), então serve apenas para persistência interna.
const PODJ_POINTS = [0, 1, 2, 3, 0, 0];

const PODJ_INSTRUCTION =
  "Observe ou colha exemplos concretos e marque apenas uma pontuação por item, conforme a legenda (0 adequado · 1 discreto · 2 claro/moderado · 3 intenso/importante · NO não observado · NA não aplicável). Ao marcar 2 ou 3, descreva a evidência objetiva. No fechamento, resuma o impacto funcional e os diferenciais.";

// Faixa mínima obrigatória pelo tipo — NÃO é exibida (resultado por extenso).
const PODJ_BANDS: InteractiveBand[] = [
  {
    minPct: 0,
    classification: "Registro de respostas — análise clínica pelo profissional",
    color: "emerald",
    description:
      "Método observacional complementar (autoral). O resultado apresenta apenas as perguntas e as respostas selecionadas por extenso. A leitura clínica — pervasividade, impacto funcional e diferenciais — é do profissional.",
  },
];

const ICON: LucideIcon = ClipboardList;

export const podjTeaPrimeItems: Record<string, InteractiveScaleDef> = {
  // ----------------------------------------------------------
  // 1–6A · 12 meses a 5 anos e 11 meses (80 itens)
  // ----------------------------------------------------------
  "podj-tea-prime-1-6a": {
    icon: ICON,
    gradient: "from-violet-500 to-purple-600",
    instruction: PODJ_INSTRUCTION,
    infoBox:
      "PODJ-TEA PRIME — Inventário observacional 12 meses a 5 anos e 11 meses. Método clínico-observacional autoral, complementar e ainda sem validação psicométrica própria. Não usar como teste diagnóstico isolado nem como substituto de avaliação médica, psicológica, neuropsicológica, fonoaudiológica, terapêutica ocupacional ou multiprofissional.",
    labels: PODJ_LABELS,
    optionPoints: PODJ_POINTS,
    scoreDirection: "higher_worse",
    totalLabel: "Inventário PODJ-TEA PRIME 1–6A",
    bands: PODJ_BANDS,
    domains: [
      {
        name: "Comunicação social e reciprocidade",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Responde ao nome de forma consistente e socialmente dirigida",
          "Busca o rosto do adulto durante interação prazerosa",
          "Sorri socialmente em resposta ao outro",
          "Alterna olhar entre pessoa e objeto",
          "Procura o adulto para compartilhar, não apenas para pedir",
          "Demonstra prazer em jogos sociais simples",
          "Reconhece mudanças emocionais no adulto",
          "Aproxima-se de pessoas familiares espontaneamente",
          "Diferencia presença humana de objetos de interesse",
          "Mantém engajamento social por tempo compatível com a idade",
        ],
      },
      {
        name: "Atenção compartilhada e gestos",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Aponta para pedir objetos ou ajuda",
          "Aponta para mostrar algo interessante",
          "Segue o apontar do adulto",
          "Mostra objetos espontaneamente",
          "Leva objetos para compartilhar, não apenas entregar",
          "Busca aprovação social após conquista",
          "Compartilha surpresa, alegria ou medo",
          "Alterna olhar entre objeto desejado e adulto",
          "Usa gestos para chamar atenção",
          "Sustenta atenção conjunta por alguns segundos",
        ],
      },
      {
        name: "Linguagem e comunicação verbal",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Usa sons, gestos ou palavras para pedir",
          "Usa comunicação para compartilhar interesses",
          "Compreende comandos simples com contexto",
          "Compreende comandos simples sem pistas visuais",
          "Usa palavras funcionais",
          "Combina palavras de modo comunicativo",
          "Usa fala para interação, não apenas repetição",
          "Apresenta ecolalia imediata clinicamente relevante",
          "Apresenta ecolalia tardia ou fala roteirizada",
          "Ajusta entonação e volume ao contexto",
        ],
      },
      {
        name: "Comunicação não verbal",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Usa gestos convencionais, como tchau ou beijo",
          "Balança a cabeça para sim ou não",
          "Usa expressão facial variada",
          "Coordena olhar, gesto e vocalização",
          "Demonstra emoção de forma compartilhada",
          "Entende expressão facial do adulto",
          "Usa o corpo para comunicação social",
          "Evita contato visual social de modo persistente",
          "Usa a mão do adulto como ferramenta",
          "Apresenta comunicação pouco integrada",
        ],
      },
      {
        name: "Imitação e aprendizagem social",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Imita gestos simples, como bater palmas",
          "Imita movimentos corporais amplos",
          "Imita ações com objetos",
          "Imita sons ou vocalizações",
          "Imita palavras",
          "Imita expressões faciais",
          "Aprende observando outra criança ou adulto",
          "Copia brincadeiras sociais",
          "Participa de jogos imitativos",
          "Usa imitação de forma espontânea e social",
        ],
      },
      {
        name: "Brincadeira e criatividade lúdica",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Usa brinquedos de modo funcional",
          "Faz brincadeira simples de causa e efeito",
          "Evita uso exclusivamente repetitivo dos objetos",
          "Realiza faz de conta simples",
          "Simula rotina com boneco ou miniaturas",
          "Aceita variações na brincadeira",
          "Compartilha brincadeira com adulto",
          "Compartilha brincadeira com criança",
          "Tolera interrupção da brincadeira",
          "Demonstra criatividade lúdica compatível com a idade",
        ],
      },
      {
        name: "Interesses restritos, rigidez e comportamentos repetitivos",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Alinha objetos repetidamente",
          "Gira rodas, tampas ou objetos",
          "Observa objetos por ângulos incomuns",
          "Apresenta movimentos repetitivos de mãos ou corpo",
          "Demonstra apego excessivo a objetos específicos",
          "Resiste a mudanças simples de rotina",
          "Apresenta interesses incomuns para a idade",
          "Repete sequências de forma rígida",
          "Insiste em fazer tudo do mesmo jeito",
          "Apresenta crises por quebra de padrão esperado",
        ],
      },
      {
        name: "Sensorialidade e funcionalidade",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Hipersensibilidade a sons comuns",
          "Hipersensibilidade a texturas",
          "Cheira, lambe ou toca objetos de forma incomum",
          "Busca movimento de forma excessiva",
          "Apresenta seletividade alimentar importante",
          "Tem dificuldade intensa em transições",
          "Apresenta crises desproporcionais à frustração",
          "Tem dificuldade de se acalmar com ajuda do adulto",
          "Demonstra baixa percepção de perigo",
          "Apresenta prejuízo funcional em casa, escola ou terapias",
        ],
      },
    ],
  },

  // ----------------------------------------------------------
  // 6–12A · 6 anos a 12 anos e 11 meses (80 itens)
  // ----------------------------------------------------------
  "podj-tea-prime-6-12a": {
    icon: ICON,
    gradient: "from-indigo-500 to-violet-600",
    instruction: PODJ_INSTRUCTION,
    infoBox:
      "PODJ-TEA PRIME — Inventário observacional 6 anos a 12 anos e 11 meses. Método clínico-observacional autoral, complementar e ainda sem validação psicométrica própria. Não usar como teste diagnóstico isolado nem como substituto de avaliação médica, psicológica, neuropsicológica, fonoaudiológica, terapêutica ocupacional ou multiprofissional.",
    labels: PODJ_LABELS,
    optionPoints: PODJ_POINTS,
    scoreDirection: "higher_worse",
    totalLabel: "Inventário PODJ-TEA PRIME 6–12A",
    bands: PODJ_BANDS,
    domains: [
      {
        name: "Comunicação social e reciprocidade",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Inicia interação social espontânea",
          "Responde de forma adequada à aproximação social",
          "Mantém troca de ida e volta na conversa",
          "Demonstra interesse pelo outro",
          "Faz perguntas sobre sentimentos ou experiências alheias",
          "Compartilha experiências pessoais com adequação",
          "Percebe quando o outro perdeu interesse",
          "Modula comportamento conforme o ambiente",
          "Demonstra prazer social genuíno",
          "Evita isolamento persistente",
        ],
      },
      {
        name: "Pragmática e linguagem",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Mantém assunto de forma recíproca",
          "Evita monólogos sobre tema favorito",
          "Entende ironias simples",
          "Entende piadas e duplo sentido conforme a idade",
          "Usa entonação natural",
          "Ajusta volume da voz ao contexto",
          "Respeita turnos de fala",
          "Evita interpretação excessivamente literal",
          "Usa gestos e expressão facial junto com a fala",
          "Relata fatos com organização narrativa",
        ],
      },
      {
        name: "Cognição social e teoria da mente",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Reconhece emoções em si mesmo",
          "Reconhece emoções nos outros",
          "Percebe desconforto alheio",
          "Entende que outra pessoa pode pensar diferente",
          "Compreende regras sociais implícitas",
          "Pede desculpas com compreensão real",
          "Demonstra empatia prática",
          "Interpreta expressões faciais adequadamente",
          "Compreende consequências sociais do que fala",
          "Diferencia brincadeira, provocação e agressão",
        ],
      },
      {
        name: "Amizades e pares",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Tem amigos compatíveis com a idade",
          "Mantém amizades ao longo do tempo",
          "Participa de grupos sem exclusão frequente",
          "Entende regras de jogos coletivos",
          "Aceita perder em jogos",
          "Negocia conflitos simples",
          "Evita isolamento persistente",
          "Não depende apenas de adultos para socializar",
          "Compreende limites físicos e sociais",
          "Adapta comportamento conforme o grupo",
        ],
      },
      {
        name: "Flexibilidade e rotina",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Tolera mudanças de rotina",
          "Aceita alteração de planos sem crise intensa",
          "Consegue mudar de assunto",
          "Aceita correções",
          "Tolera frustrações compatíveis com a idade",
          "Consegue esperar sua vez",
          "Aceita regras diferentes em ambientes diferentes",
          "Abandona atividade preferida quando necessário",
          "Lida com imprevistos escolares",
          "Não se prende rigidamente a detalhes",
        ],
      },
      {
        name: "Hiperfoco e interesses restritos",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Apresenta interesse muito intenso por tema específico",
          "Fala repetidamente sobre o mesmo tema",
          "Tem dificuldade de variar assuntos",
          "Demonstra conhecimento incomum e rígido sobre tema restrito",
          "Irrita-se quando interrompido no hiperfoco",
          "Prefere atividades solitárias ligadas ao interesse",
          "Organiza objetos ou informações de forma rígida",
          "Repete rotinas mentais ou sequências",
          "Apresenta apego excessivo a coleções, objetos ou padrões",
          "O hiperfoco prejudica socialização ou escola",
        ],
      },
      {
        name: "Comportamentos repetitivos e sensorialidade",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Apresenta movimentos repetitivos de mãos, dedos ou corpo",
          "Faz sons repetitivos ou vocalizações incomuns",
          "Repete frases, cenas ou diálogos",
          "Demonstra incômodo intenso com sons",
          "Demonstra incômodo com cheiros, texturas ou etiquetas",
          "Apresenta seletividade alimentar persistente",
          "Busca estímulos sensoriais excessivamente",
          "Evita ambientes cheios, barulhentos ou imprevisíveis",
          "Apresenta baixa tolerância a contato físico inesperado",
          "Tem crises associadas à sobrecarga sensorial",
        ],
      },
      {
        name: "Autonomia, funcionalidade e sofrimento",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Apresenta prejuízo de autonomia para a idade",
          "Tem dificuldade significativa em autocuidado",
          "Necessita mediação excessiva de adultos",
          "Apresenta sofrimento social relevante",
          "Tem prejuízo acadêmico por rigidez, atenção ou socialização",
          "Apresenta crises em casa por frustração ou mudança",
          "Sofre bullying, isolamento ou rejeição frequente",
          "Tem baixa percepção das próprias dificuldades",
          "Apresenta ansiedade associada à interação social ou rotina",
          "Há prejuízo funcional em dois ou mais contextos",
        ],
      },
    ],
  },

  // ----------------------------------------------------------
  // 12–19A · 12 a 19 anos (80 itens)
  // Itens de saúde mental (74–77) NÃO pontuam TEA e disparam
  // protocolo de segurança — ver infoBox.
  // ----------------------------------------------------------
  "podj-tea-prime-12-19a": {
    icon: ICON,
    gradient: "from-blue-500 to-indigo-600",
    instruction: PODJ_INSTRUCTION,
    infoBox:
      "PODJ-TEA PRIME — Inventário observacional 12 a 19 anos. ⚠️ Alerta clínico importante: os itens de SAÚDE MENTAL E SEGURANÇA (ansiedade, humor deprimido, autolesão, ideação suicida) NÃO pontuam TEA. Se houver autolesão, ideação suicida, plano, intenção ou acesso a meios, suspender o foco classificatório e acionar imediatamente o responsável, a rede de proteção ou a emergência conforme a gravidade — CVV 188 (24h) e SAMU 192. Método clínico-observacional autoral, complementar e ainda sem validação psicométrica própria; não usar como teste diagnóstico isolado.",
    labels: PODJ_LABELS,
    optionPoints: PODJ_POINTS,
    scoreDirection: "higher_worse",
    totalLabel: "Inventário PODJ-TEA PRIME 12–19A",
    bands: PODJ_BANDS,
    domains: [
      {
        name: "Comunicação social e reciprocidade",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Inicia interação social espontânea com pares ou adultos",
          "Sustenta conversa com troca de ida e volta",
          "Demonstra interesse genuíno pela experiência do outro",
          "Faz perguntas socialmente pertinentes ao interlocutor",
          "Percebe quando o outro perdeu interesse",
          "Ajusta comportamento social ao contexto",
          "Compartilha experiências pessoais de modo recíproco",
          "Demonstra prazer social espontâneo",
          "Evita isolamento social persistente",
          "Não depende exclusivamente de adultos para interação social",
        ],
      },
      {
        name: "Pragmática avançada e linguagem",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Usa linguagem de forma socialmente ajustada",
          "Evita monólogos prolongados sobre tema preferido",
          "Reconhece ironia, indiretas e duplo sentido",
          "Interpreta intenção comunicativa além do literal",
          "Ajusta volume, ritmo e entonação ao contexto",
          "Usa expressão facial e gestos integrados à fala",
          "Respeita turnos conversacionais em grupo",
          "Percebe desconforto ou tédio do interlocutor",
          "Consegue mudar de assunto sem sofrimento excessivo",
          "Evita fala excessivamente formal, pedante ou deslocada",
        ],
      },
      {
        name: "Cognição social e julgamento",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Compreende regras sociais implícitas",
          "Reconhece emoções complexas em si mesmo",
          "Reconhece emoções complexas nos outros",
          "Entende que outra pessoa pode ter perspectiva diferente",
          "Diferencia brincadeira, provocação, ironia e agressão",
          "Mantém amizades compatíveis com a idade",
          "Participa de grupos sem exclusão recorrente",
          "Negocia conflitos simples sem ruptura desproporcional",
          "Compreende limites físicos, sociais e digitais",
          "Percebe consequências sociais do que fala ou posta",
          "Apresenta julgamento social compatível com a idade",
          "Evita ingenuidade social com vulnerabilidade importante",
          "Demonstra empatia prática em situações cotidianas",
          "Consegue ajustar identidade social sem sofrimento extremo",
        ],
      },
      {
        name: "Flexibilidade e rotina",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Tolera mudanças de rotina sem crise intensa",
          "Aceita alteração de planos com adaptação gradual",
          "Lida com imprevistos escolares ou familiares",
          "Aceita correções sem reação desproporcional",
          "Não se prende rigidamente a regras ou detalhes",
          "Tolera frustrações compatíveis com a idade",
          "Consegue abandonar atividade preferida quando necessário",
          "Tolera incerteza e ambiguidade razoavelmente",
          "Apresenta flexibilidade para mudar de opinião",
        ],
      },
      {
        name: "Hiperfoco e comportamentos repetitivos",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Apresenta interesse muito intenso por tema específico",
          "Fala repetidamente sobre o mesmo tema",
          "Tem dificuldade de variar assuntos",
          "Irrita-se quando interrompido no hiperfoco",
          "O hiperfoco prejudica socialização, escola ou rotina",
          "Organiza informações, objetos ou rotinas de forma rígida",
          "Repete frases, cenas, músicas, trechos ou diálogos",
          "Apresenta movimentos repetitivos de mãos, dedos ou corpo",
          "Apresenta vocalizações ou sons repetitivos",
          "Demonstra apego excessivo a objetos, coleções ou padrões",
        ],
      },
      {
        name: "Sensorialidade",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Demonstra incômodo intenso com sons",
          "Demonstra incômodo com texturas, roupas ou etiquetas",
          "Apresenta seletividade alimentar com impacto funcional",
          "Evita ambientes cheios, barulhentos ou imprevisíveis",
          "Tem crises por sobrecarga sensorial",
        ],
      },
      {
        name: "Autonomia e funcionalidade",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Apresenta prejuízo de autonomia para a idade",
          "Tem dificuldade significativa em autocuidado",
          "Necessita mediação excessiva de adultos",
          "Tem dificuldade de organizar rotina, agenda ou materiais",
          "Apresenta prejuízo escolar por rigidez, ansiedade ou socialização",
          "Apresenta prejuízo em trabalhos em grupo ou apresentações",
          "Sofre bullying, exclusão ou rejeição frequente",
          "Apresenta sofrimento social relevante",
          "Tem baixa percepção das próprias dificuldades",
          "Apresenta crises em casa após demanda social",
          "Precisa de recuperação prolongada após eventos sociais",
          "Tem dificuldade em lidar com transição para vida adulta",
          "Apresenta dependência familiar desproporcional à idade",
          "Apresenta prejuízo funcional em dois ou mais contextos",
          "Há impacto relevante na participação social, escolar ou familiar",
        ],
      },
      {
        name: "⚠️ Saúde mental e segurança (não pontua TEA)",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Apresenta ansiedade clinicamente relevante",
          "Apresenta humor deprimido, desesperança ou isolamento intenso",
          "Apresenta autolesão não suicida ou comportamento de risco",
          "Apresenta ideação suicida, plano, intenção ou risco atual",
        ],
      },
      {
        name: "Camuflagem e exaustão social",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Apresenta discrepância entre bom desempenho externo e colapso em casa",
          "Usa scripts, imitação social ou controle consciente para parecer adequado",
          "Relata exaustão, perda de identidade ou sofrimento por tentar se encaixar",
        ],
      },
    ],
  },
};
