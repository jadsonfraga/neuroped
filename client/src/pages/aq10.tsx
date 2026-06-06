import { Puzzle } from "lucide-react";
import { GenericScale } from "@/components/GenericScale";

// Items 0-indexed: reverse scored = 0, 2, 8 (items 1, 3, 9)
// Direct scored = 1, 3, 4, 5, 6, 7, 9 (items 2, 4, 5, 6, 7, 8, 10)
const REVERSE_ITEMS = new Set([0, 2, 8]);

const config = {
  title: "AQ-10",
  subtitle: "Autism Quotient — Triagem de TEA — ≥16 anos, autorrelato, ~2 min",
  icon: Puzzle,
  gradient: "from-teal-500 to-cyan-600",
  instruction:
    "Leia cada afirmação cuidadosamente e selecione a opção que melhor descreve você. Não há respostas certas ou erradas. Responda todos os 10 itens com sinceridade.",
  labels: [
    "Concordo totalmente",
    "Concordo",
    "Discordo",
    "Discordo totalmente",
  ],
  infoBox:
    "Pontuação máxima: 10 pontos. Ponto de corte: ≥6 = indicado encaminhamento para avaliação diagnóstica completa de TEA. Itens 1, 3, 9 têm pontuação inversa (Discordo/Discordo totalmente = 1 ponto). Escala de domínio público (Baron-Cohen et al.).",
  domains: [
    {
      name: "Triagem de TEA",
      color: "text-teal-600 dark:text-teal-400",
      items: [
        "Prefiro fazer as coisas com outras pessoas do que sozinho(a)",
        "Prefiro fazer as coisas sempre da mesma forma",
        "Quando tento imaginar algo, acho muito fácil criar uma imagem na mente",
        "Frequentemente fico tão absorvido(a) em algo que perco de vista outras coisas",
        "Frequentemente percebo pequenos sons que os outros não notam",
        "Costumo prestar atenção em placas de carro, datas ou sequências numéricas",
        "Quando leio uma história, acho difícil entender as intenções dos personagens",
        "Gosto de colecionar informações sobre categorias de coisas",
        "Acho fácil perceber o que alguém está pensando ou sentindo apenas olhando o rosto",
        "Acho difícil entender as regras implícitas de uma conversa",
      ],
    },
  ],
  onCalculate: (answers: Record<string, number>) => {
    // For each item (0-indexed), compute AQ point:
    // Reverse items (0, 2, 8): score 1 if answer >= 2 (Discordo ou Discordo totalmente)
    // Direct items: score 1 if answer <= 1 (Concordo totalmente ou Concordo)
    let total = 0;
    for (let i = 0; i < 10; i++) {
      const ans = answers[`0-${i}`] ?? -1;
      if (ans === -1) continue;
      if (REVERSE_ITEMS.has(i)) {
        if (ans >= 2) total += 1;
      } else {
        if (ans <= 1) total += 1;
      }
    }

    const classification =
      total >= 6
        ? "Acima do ponto de corte — encaminhar para avaliação diagnóstica"
        : "Abaixo do ponto de corte";

    const color = total >= 6 ? "red" : "emerald";

    const description =
      total >= 6
        ? `Pontuação ${total}/10, acima do ponto de corte (≥6). Este resultado sugere características compatíveis com TEA. Recomenda-se encaminhamento para avaliação diagnóstica completa por profissional especializado (psicólogo/neuropsicólogo, neuropediatra ou psiquiatra). O AQ-10 é uma ferramenta de triagem — não constitui diagnóstico.`
        : `Pontuação ${total}/10, abaixo do ponto de corte (<6). Resultado não sugestivo de TEA pela triagem AQ-10. Se houver preocupação clínica significativa, considerar avaliação complementar individualizada.`;

    return {
      total,
      totalLabel: "Pontuação AQ-10 (máx. 10)",
      classification,
      color,
      description,
      domainResults: [
        {
          domain: "Triagem de TEA",
          score: total,
          classification,
          color,
        },
      ],
    };
  },
};

export default function Aq10Page() {
  return <GenericScale config={config} />;
}
