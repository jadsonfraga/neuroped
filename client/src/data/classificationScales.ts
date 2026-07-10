import { Hand, MessageCircle, Utensils, type LucideIcon } from "lucide-react";
import type { ClassificationScaleConfig } from "@/components/ClassificationScale";

/**
 * Sistemas de CLASSIFICAÇÃO (escolha-de-um-nível) de uso livre — texto integral
 * das fontes oficiais (10/07/2026). Não são escalas somativas: o clínico
 * seleciona o nível que descreve o paciente. Renderizados por ClassificationScale
 * na rota /classificacao/:id.
 */
export const classificationScales: Record<string, ClassificationScaleConfig & { icon: LucideIcon }> = {
  // ── MACS ──────────────────────────────────────────────────────────────────
  macs: {
    title: "MACS",
    subtitle: "Manual Ability Classification System — habilidade manual na PC · 4–18 anos",
    icon: Hand,
    gradient: "from-cyan-500 to-blue-600",
    instruction:
      "Classifique como a criança/adolescente com paralisia cerebral habitualmente manuseia objetos em atividades do dia a dia (não o melhor desempenho possível). Escolha um único nível.",
    infoBox:
      "MACS classifica a habilidade manual em 5 níveis. Uso funcionalmente livre (macs.nu, download aberto). Versão PT-BR oficial em macs.nu/files/MACS_Portuguese-Brazil_2010.pdf.",
    scaleId: "macs",
    levels: [
      { code: "I", color: "emerald", title: "Manuseia objetos facilmente e com sucesso",
        description: "No máximo, apresenta limitações na facilidade de realizar tarefas manuais que exigem velocidade e precisão. Entretanto, quaisquer limitações nas habilidades manuais não restringem a independência nas atividades diárias." },
      { code: "II", color: "lime", title: "Manuseia a maioria dos objetos, com qualidade/velocidade um pouco reduzidas",
        description: "Certas atividades podem ser evitadas ou realizadas com alguma dificuldade; formas alternativas de realização podem ser usadas, mas as habilidades manuais geralmente não restringem a independência nas atividades diárias." },
      { code: "III", color: "amber", title: "Manuseia objetos com dificuldade; precisa de ajuda para preparar/modificar atividades",
        description: "O desempenho é lento e alcançado com sucesso limitado quanto à qualidade e quantidade. As atividades são realizadas de forma independente se tiverem sido organizadas ou adaptadas previamente." },
      { code: "IV", color: "orange", title: "Manuseia uma seleção limitada de objetos de fácil manipulação em situações adaptadas",
        description: "Realiza partes de atividades com esforço e com sucesso limitado. Requer suporte contínuo e/ou equipamento adaptado, mesmo para a realização parcial da atividade." },
      { code: "V", color: "red", title: "Não manuseia objetos; habilidade severamente limitada",
        description: "Tem habilidade severamente limitada para realizar até mesmo ações simples. Requer assistência total." },
    ],
    distinctions: [
      "I–II: no Nível I pode haver limitações com objetos muito pequenos, pesados ou frágeis que exigem controle motor fino detalhado ou coordenação eficiente entre as mãos; no Nível II realiza quase as mesmas atividades, mas com qualidade reduzida ou mais lentamente.",
      "II–III: no Nível II manuseia a maioria dos objetos, embora lentamente ou com qualidade reduzida; no Nível III geralmente precisa de ajuda para preparar a atividade e/ou de ajustes no ambiente.",
      "III–IV: no Nível III realiza atividades selecionadas se a situação estiver pré-organizada, com supervisão e tempo suficiente; no Nível IV precisa de ajuda contínua durante a atividade e participa de forma significativa apenas em partes dela.",
      "IV–V: no Nível IV realiza parte de uma atividade com ajuda contínua; no Nível V, no máximo, participa com um movimento simples em situações especiais (ex.: pressionar um botão ou segurar objetos que não exijam esforço).",
    ],
    note: "Fonte: macs.nu/files/MACS_English_2010.pdf (Eliasson AC et al., 2006, atualizado 2010).",
  },

  // ── CFCS ──────────────────────────────────────────────────────────────────
  cfcs: {
    title: "CFCS",
    subtitle: "Communication Function Classification System — comunicação na PC",
    icon: MessageCircle,
    gradient: "from-violet-500 to-purple-600",
    instruction:
      "Classifique a efetividade da comunicação do dia a dia, considerando os papéis de emissor e receptor com parceiros familiares e não familiares. Escolha um único nível.",
    infoBox:
      "CFCS classifica a função comunicativa em 5 níveis. Download aberto (cfcs.us), sem tela de licença restritiva.",
    scaleId: "cfcs",
    levels: [
      { code: "I", color: "emerald", title: "Emissor e Receptor Efetivo com parceiros familiares e não familiares",
        description: "Alterna independentemente entre os papéis de emissor e receptor com a maioria das pessoas na maioria dos ambientes. A comunicação ocorre facilmente e em ritmo confortável, com parceiros familiares e não familiares. Mal-entendidos são rapidamente reparados e não interferem na efetividade geral." },
      { code: "II", color: "lime", title: "Emissor e/ou Receptor Efetivo, porém com ritmo mais lento",
        description: "Alterna independentemente entre os papéis de emissor e receptor com a maioria das pessoas na maioria dos ambientes, mas o ritmo da conversa é lento e pode tornar a interação mais difícil. Pode precisar de tempo extra para compreender, compor mensagens e/ou reparar mal-entendidos." },
      { code: "III", color: "amber", title: "Emissor e Receptor Efetivo com parceiros familiares",
        description: "Alterna entre os papéis de emissor e receptor com parceiros familiares (mas não não familiares) na maioria dos ambientes. A comunicação não é consistentemente efetiva com a maioria dos parceiros não familiares, mas geralmente é efetiva com parceiros familiares." },
      { code: "IV", color: "orange", title: "Emissor e/ou Receptor Inconsistente com parceiros familiares",
        description: "Não alterna consistentemente entre os papéis. Pode ser: a) emissor e receptor ocasionalmente efetivo; b) emissor efetivo mas receptor limitado; c) emissor limitado mas receptor efetivo. A comunicação é às vezes efetiva com parceiros familiares." },
      { code: "V", color: "red", title: "Emissor e Receptor Raramente Efetivo, mesmo com parceiros familiares",
        description: "Limitado tanto como emissor quanto como receptor. Sua comunicação é difícil de entender para a maioria das pessoas, e ele parece ter compreensão limitada das mensagens da maioria. A comunicação raramente é efetiva mesmo com parceiros familiares." },
    ],
    distinctions: [
      "I–II: diferença no ritmo da conversa.",
      "II–III: diferença no ritmo e no tipo de parceiro conversacional.",
      "III–IV: diferença na consistência ao alternar papéis com parceiros familiares.",
      "IV–V: diferença no grau de dificuldade ao se comunicar mesmo com parceiros familiares.",
    ],
    note: "Fonte: cfcs.us — CFCS_universal_2012_06_06.pdf (Hidecker MJC et al., 2011).",
  },

  // ── EDACS ─────────────────────────────────────────────────────────────────
  edacs: {
    title: "EDACS",
    subtitle: "Eating and Drinking Ability Classification System — PC · a partir de 3 anos",
    icon: Utensils,
    gradient: "from-orange-500 to-amber-600",
    instruction:
      "Classifique a habilidade de comer e beber quanto à segurança e à eficiência, e depois selecione o nível de assistência necessário. Escolha um nível e um modificador.",
    infoBox:
      "EDACS classifica comer/beber em 5 níveis de segurança-eficiência + modificador de assistência. Livremente disponível para download (Chailey Clinical Services / Sussex Community NHS).",
    scaleId: "edacs",
    levels: [
      { code: "I", color: "emerald", title: "Come e bebe com segurança e eficiência",
        description: "Come ampla variedade de texturas apropriadas para a idade; pode ser desafiado por texturas muito firmes de morder e mastigar; come e bebe em velocidade semelhante aos pares; retém a maior parte do alimento/líquido na boca." },
      { code: "II", color: "lime", title: "Come e bebe com segurança, mas com algumas limitações de eficiência",
        description: "É desafiado por algumas texturas firmes de morder, de mastigação laboriosa, mistas e pegajosas; pode tossir ou engasgar com texturas novas/desafiadoras ou ao se cansar; refeições demoram mais que para os pares." },
      { code: "III", color: "amber", title: "Come e bebe com algumas limitações à segurança; pode haver limitações à eficiência",
        description: "Come purê e alimentos amassados, podendo morder e mastigar algumas texturas macias; é desafiado por pedaços grandes e texturas firmes, com risco de engasgo; pode beber de copo aberto mas frequentemente precisa de copo com tampa/bico para controlar o fluxo." },
      { code: "IV", color: "orange", title: "Come e bebe com limitações significativas à segurança",
        description: "Come purês lisos ou bem amassados; é desafiado por alimentos que exigem mastigação, com risco de engasgo se houver pedaços; pode haver dificuldade em coordenar deglutição e respiração, com sinais de aspiração; alimentação suplementar por sonda pode ser considerada." },
      { code: "V", color: "red", title: "Incapaz de comer ou beber com segurança — considerar sonda",
        description: "Pode tolerar, no máximo, pequenas provas ou sabores; incapaz de deglutir alimento/líquido com segurança devido a limitações no alcance e coordenação dos movimentos de deglutição e respiração; aspiração e engasgo são muito prováveis." },
    ],
    modifierLabel: "Assistência necessária",
    modifiers: [
      { code: "Ind", label: "Independente", description: "Leva alimento/líquido à própria boca sem ajuda." },
      { code: "RA", label: "Requer Assistência", description: "Precisa de ajuda de outra pessoa ou de equipamento adaptado." },
      { code: "TD", label: "Totalmente Dependente", description: "Depende totalmente de outra pessoa para levar alimento/líquido à boca." },
    ],
    note: "Notação de exemplo: “EDACS Nível II RA”. Fonte: sussexcommunity.nhs.uk — © Chailey Clinical Services 2013 (Sellers D et al., Dev Med Child Neurol 2013). Espasticidade (Ashworth/Tardieu) tem ferramenta própria em /espasticidade.",
  },
};

export function getClassificationScale(id: string): (ClassificationScaleConfig & { icon: LucideIcon }) | null {
  return classificationScales[id] ?? null;
}
