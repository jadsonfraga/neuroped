import { ShieldAlert } from "lucide-react";
import type { InteractiveScaleDef } from "./interactiveScaleItems";

const PRIORITY_NOTE =
  "Se a resposta for 3, este item exige revisão clínica prioritária independentemente do escore total.";

/**
 * EJIA-15 — versão operacional fiel ao instrumento autoral de 05/09/2026.
 *
 * A EJIA-15 é longitudinal: NÃO há banda transversal validada de gravidade.
 * Por isso, a única banda abaixo orienta comparar a mesma criança com o próprio
 * basal. Os percentuais de resposta pertencem à mudança basal→seguimento, não
 * ao percentual do escore máximo numa aplicação isolada.
 */
export const ejia15OperationalItems: Record<string, InteractiveScaleDef> = {
  "ejia-15": {
    icon: ShieldAlert,
    gradient: "from-amber-600 to-red-700",
    instruction:
      "Responda pensando somente nos últimos 7 dias. Marque 0, 1, 2 ou 3 conforme frequência, intensidade, dificuldade de manejo e prejuízo. Nas reaplicações, prefira o mesmo responsável para reduzir variação entre informantes.",
    infoBox:
      "Instrumento clínico autoral para acompanhamento longitudinal. Não validado para diagnóstico ou comparação normativa populacional. O total varia de 0 a 45, mas deve ser interpretado em relação ao basal e aos itens de segurança.",
    labels: [
      "0 — Não aconteceu",
      "1 — Pouco / fácil de contornar",
      "2 — Várias vezes / atrapalhou a rotina",
      "3 — Frequente ou intenso / difícil de controlar / risco importante",
    ],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "EJIA-15 — escore total de 0 a 45",
    domains: [
      {
        name: "Irritabilidade / frustração · 0–18",
        color: "text-amber-700 dark:text-amber-300",
        items: [
          "Ficou irritada ou ‘aperreada’ por coisas pequenas, mais do que seria esperado para a situação?",
          "Passou rapidamente de calma para muito irritada, como se ‘virasse uma chave’?",
          "Teve crises de birra, raiva ou descontrole quando ouviu ‘não’, foi contrariada ou não conseguiu o que queria?",
          "Chorou ou gritou de forma intensa e teve dificuldade para parar, mesmo depois de receber ajuda?",
          "Teve dificuldade para esperar, dividir, perder ou aceitar frustração?",
          "Ficou irritada quando houve mudança de rotina, plano, horário, caminho ou combinado?",
        ],
      },
      {
        name: "Agressividade / segurança · 0–12",
        color: "text-red-700 dark:text-red-300",
        items: [
          {
            text: "Bateu, chutou, empurrou, mordeu, beliscou ou tentou machucar outra pessoa?",
            example: PRIORITY_NOTE,
          },
          {
            text: "Jogou objetos, bateu portas, quebrou coisas ou tentou destruir algo durante uma crise?",
            example: PRIORITY_NOTE,
          },
          "Xingou, ameaçou, falou de forma agressiva ou tentou intimidar alguém durante a irritação?",
          {
            text: "Tentou se machucar, bater a cabeça, se morder, se arranhar ou apresentou outro comportamento de autoagressão?",
            example:
              "A autoagressão deve ser analisada separadamente: melhora dos demais itens não compensa este risco. Resposta 3 exige revisão clínica prioritária.",
          },
        ],
      },
      {
        name: "Desregulação / recuperação · 0–6",
        color: "text-orange-700 dark:text-orange-300",
        items: [
          "Depois que se irritou, demorou muito para voltar ao normal, mesmo com ajuda do adulto?",
          "Durante as crises ficou tão agitada que foi difícil conversar, orientar, redirecionar ou conduzir?",
        ],
      },
      {
        name: "Repetitividade associada à desregulação · 0–6",
        color: "text-purple-700 dark:text-purple-300",
        items: [
          "Apresentou mais movimentos repetitivos ou estereotipias quando estava irritada, ansiosa ou contrariada?",
          "Ficou presa em repetições, perguntas, assuntos, rituais ou comportamentos e se irritou quando alguém tentou interromper?",
        ],
      },
      {
        name: "Impacto funcional · 0–3",
        color: "text-blue-700 dark:text-blue-300",
        items: [
          "A irritabilidade/agitação atrapalhou atividades importantes, como escola, terapia, passeio, alimentação, sono ou convivência familiar?",
        ],
      },
    ],
    bands: [
      {
        minPct: 0,
        classification: "Monitorização longitudinal — comparar com o basal",
        color: "amber",
        description:
          "Não há cutoff transversal validado de gravidade. Compare o total e cada domínio com a própria linha de base, preservando a leitura independente dos itens 7, 8 e 10. Para seguimento operacional: % de melhora = (basal − atual) ÷ basal × 100; <10% sem mudança convincente, 10–24% mudança pequena/possível sinal, 25–49% resposta clinicamente relevante, ≥50% resposta importante e ≥75% resposta muito expressiva. Essas faixas não são critérios psicométricos validados.",
      },
    ],
  },
};
