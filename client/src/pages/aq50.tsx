import { Puzzle } from "lucide-react";
import { GenericScale } from "@/components/GenericScale";

// AQ-50 (Baron-Cohen et al., 2001) — autorrelato de traços do espectro em
// adultos com QI normal. Chave de pontuação oficial (apêndice do artigo):
//   • Itens "concordo-pontua": 1 ponto quando a resposta é "Concordo
//     totalmente" ou "Concordo parcialmente" (índices 0 ou 1).
//   • Itens "discordo-pontua": 1 ponto quando a resposta é "Discordo
//     totalmente" ou "Discordo parcialmente" (índices 2 ou 3).
// Conjuntos abaixo em numeração 1..50 (convertidos p/ 0-index no cálculo).
const AGREE_SCORED = new Set([
  1, 2, 4, 5, 6, 7, 9, 12, 13, 16, 18, 19, 20, 21, 22, 23, 26, 33, 35, 39, 41,
  42, 43, 45, 46,
]);
// Todos os demais itens pontuam quando a resposta é de discordância.

// Cinco subdomínios (10 itens cada), numeração 1..50.
const SUBDOMAINS: { name: string; items: number[] }[] = [
  { name: "Habilidade social", items: [1, 11, 13, 15, 22, 36, 44, 45, 47, 48] },
  { name: "Alternância de atenção", items: [2, 4, 10, 16, 25, 32, 34, 37, 43, 46] },
  { name: "Atenção a detalhes", items: [5, 6, 9, 12, 19, 23, 28, 29, 30, 49] },
  { name: "Comunicação", items: [7, 17, 18, 26, 27, 31, 33, 35, 38, 39] },
  { name: "Imaginação", items: [3, 8, 14, 20, 21, 24, 40, 41, 42, 50] },
];

const ITEMS = [
  "Prefiro fazer coisas com outras pessoas a fazê-las sozinho(a).",
  "Prefiro fazer as coisas sempre da mesma forma, repetidamente.",
  "Se tento imaginar algo, acho muito fácil criar uma imagem na minha mente.",
  "Frequentemente fico tão absorto(a) em uma coisa que perco de vista outras coisas.",
  "Frequentemente noto sons pequenos quando outras pessoas não notam.",
  "Geralmente noto placas de carro ou sequências semelhantes de informação.",
  "Outras pessoas frequentemente me dizem que o que eu disse foi indelicado, mesmo achando que foi educado.",
  "Quando estou lendo uma história, consigo facilmente imaginar como os personagens podem ser.",
  "Sou fascinado(a) por datas.",
  "Em um grupo social, consigo facilmente acompanhar as conversas de várias pessoas diferentes.",
  "Acho as situações sociais fáceis.",
  "Tendo a notar detalhes que outros não notam.",
  "Prefiro ir a uma biblioteca a ir a uma festa.",
  "Acho fácil inventar histórias.",
  "Sinto-me mais atraído(a) por pessoas do que por coisas.",
  "Tenho interesses muito fortes, com os quais fico chateado(a) se não puder segui-los.",
  "Gosto de bate-papo social.",
  "Quando falo, nem sempre é fácil para os outros conseguirem falar também.",
  "Sou fascinado(a) por números.",
  "Quando estou lendo uma história, acho difícil entender as intenções dos personagens.",
  "Não gosto particularmente de ler ficção.",
  "Acho difícil fazer novos amigos.",
  "Noto padrões nas coisas o tempo todo.",
  "Prefiro ir ao teatro a ir a um museu.",
  "Não fico chateado(a) se minha rotina diária é perturbada.",
  "Frequentemente descubro que não sei como manter uma conversa.",
  "Acho fácil “ler nas entrelinhas” quando alguém está falando comigo.",
  "Geralmente me concentro mais no quadro geral do que nos pequenos detalhes.",
  "Não sou muito bom(boa) em lembrar números de telefone.",
  "Geralmente não noto pequenas mudanças em uma situação ou na aparência de uma pessoa.",
  "Sei dizer se alguém que me escuta está ficando entediado(a).",
  "Acho fácil fazer mais de uma coisa ao mesmo tempo.",
  "Quando falo ao telefone, não tenho certeza de quando é minha vez de falar.",
  "Gosto de fazer as coisas espontaneamente.",
  "Frequentemente sou o(a) último(a) a entender a piada.",
  "Acho fácil perceber o que alguém está pensando ou sentindo só de olhar para o rosto da pessoa.",
  "Se há uma interrupção, consigo voltar muito rapidamente ao que eu estava fazendo.",
  "Sou bom(boa) em bate-papo social.",
  "As pessoas frequentemente me dizem que fico repetindo o mesmo assunto sem parar.",
  "Quando era criança, gostava de brincar de faz-de-conta com outras crianças.",
  "Gosto de colecionar informações sobre categorias de coisas (ex.: tipos de carro, de pássaro, de trem, de planta etc.).",
  "Acho difícil imaginar como seria ser outra pessoa.",
  "Gosto de planejar cuidadosamente qualquer atividade da qual participo.",
  "Gosto de ocasiões sociais.",
  "Acho difícil descobrir as intenções das pessoas.",
  "Situações novas me deixam ansioso(a).",
  "Gosto de conhecer pessoas novas.",
  "Sou um(a) bom(boa) diplomata.",
  "Não sou muito bom(boa) em lembrar a data de nascimento das pessoas.",
  "Acho muito fácil brincar com crianças em jogos que envolvem faz-de-conta.",
];

/** Ponto AQ (0/1) do item numerado n (1..50) dado o índice de resposta. */
function aqPoint(n: number, ans: number): number {
  if (ans < 0) return 0;
  const agree = ans <= 1; // Concordo totalmente/parcialmente
  const disagree = ans >= 2; // Discordo parcialmente/totalmente
  if (AGREE_SCORED.has(n)) return agree ? 1 : 0;
  return disagree ? 1 : 0;
}

const config = {
  title: "AQ-50",
  subtitle: "Autism-Spectrum Quotient — traços de TEA em adultos (QI normal) — autorrelato, ~10 min",
  icon: Puzzle,
  gradient: "from-teal-500 to-cyan-600",
  instruction:
    "Leia cada afirmação e escolha a opção que melhor descreve você. Não há respostas certas ou erradas; responda a todos os 50 itens com sinceridade. É um rastreio de traços — não um diagnóstico.",
  labels: [
    "Concordo totalmente",
    "Concordo parcialmente",
    "Discordo parcialmente",
    "Discordo totalmente",
  ],
  infoBox:
    "Pontuação 0–50 (1 ponto por item na direção do traço). Ponto de corte sugerido ≥ 32 (Baron-Cohen et al., 2001). Metade dos itens pontua na concordância e metade na discordância, conforme a chave oficial. Instrumento de rastreio de traços em adultos com QI normal — NÃO é diagnóstico. Hospedado abertamente pelo Autism Research Centre (Univ. de Cambridge).",
  domains: [
    {
      name: "AQ — 50 itens",
      color: "text-teal-600 dark:text-teal-400",
      items: ITEMS,
    },
  ],
  onCalculate: (answers: Record<string, number>) => {
    let total = 0;
    for (let i = 0; i < ITEMS.length; i++) {
      total += aqPoint(i + 1, answers[`0-${i}`] ?? -1);
    }

    const high = total >= 32;
    const classification = high
      ? "≥ 32 — traços elevados; considerar avaliação especializada"
      : "< 32 — abaixo do ponto de corte de rastreio";
    const color = high ? "orange" : "emerald";
    const description = high
      ? `Pontuação ${total}/50, no ou acima do ponto de corte sugerido (≥ 32). Sugere presença marcante de traços do espectro autista. Em contexto clínico coerente, considerar avaliação diagnóstica especializada. O AQ é rastreio de traços em adultos com QI normal — não constitui diagnóstico.`
      : `Pontuação ${total}/50, abaixo do ponto de corte sugerido (< 32). Rastreio não sugestivo de carga elevada de traços do espectro. Se houver preocupação clínica relevante, considerar avaliação individualizada.`;

    const domainResults = SUBDOMAINS.map((sd) => {
      const score = sd.items.reduce((s, n) => s + aqPoint(n, answers[`0-${n - 1}`] ?? -1), 0);
      return {
        domain: sd.name,
        score,
        classification: `${score}/10`,
        color: score >= 6 ? "orange" : score >= 4 ? "amber" : "emerald",
      };
    });

    return {
      total,
      totalLabel: "Pontuação AQ-50 (máx. 50 · corte ≥ 32)",
      classification,
      color,
      description,
      domainResults,
    };
  },
  scaleId: "aq",
};

export default function Aq50Page() {
  return <GenericScale config={config} />;
}
