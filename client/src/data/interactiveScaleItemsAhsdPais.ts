// ============================================================
// Inventário de Altas Habilidades/Superdotação — versão para PAIS
// (Dr. Jadson Fraga / NeuroPed, 2026). Adaptação familiar do inventário
// escolar autoral: mesmos 10 domínios, itens reescritos para a vida em casa,
// passeios e rotina. Instrumento de OBSERVAÇÃO — sem ponto de corte, sem
// normas e sem valor diagnóstico. O resultado mostra apenas soma e média
// por domínio, de forma descritiva.
// ============================================================
import { Sparkles } from "lucide-react";
import type { InteractiveScaleDef, InteractiveDomainDef } from "./interactiveScaleItems";

export const AHSD_PAIS_ID = "ahsd-inventario-pais";

export const AHSD_PAIS_LABELS = [
  "Nunca / quase nunca",
  "Às vezes",
  "Com frequência",
  "Quase sempre",
];

const exemplo = (dominio: string) => ({
  text: `Conte um exemplo concreto do dia a dia (${dominio}).`,
  responseType: "text" as const,
  required: false,
  maxLength: 600,
  placeholder: "O que a criança fez, quando e em que situação. Campo opcional.",
});

const dom = (name: string, color: string, items: string[], exemploLabel: string): InteractiveDomainDef => ({
  name,
  color,
  items: [...items, exemplo(exemploLabel)],
});

export const ahsdPaisDomains: InteractiveDomainDef[] = [
  dom("1. Capacidade intelectual geral", "text-purple-600 dark:text-purple-400", [
    "Aprende coisas novas com poucas explicações e lembra delas depois.",
    "Faz perguntas que vão muito além do que foi explicado em casa ou no passeio.",
    "Percebe ligações entre assuntos que parecem não ter nada a ver um com o outro.",
    "Usa palavras mais variadas ou precisas do que outras crianças da mesma idade.",
    "Pensa sobre o porquê das coisas e o que vai acontecer depois, e não só sobre os fatos.",
    "Resolve problemas do dia a dia do próprio jeito, por caminhos que ninguém ensinou.",
    "Se interessa por assuntos complexos ou abstratos, como o tempo, o universo, a justiça ou o corpo humano.",
  ], "capacidade intelectual"),
  dom("2. Interesses e conhecimentos por área", "text-blue-600 dark:text-blue-400", [
    "Leitura: lê sozinho por vontade própria e conta ou comenta o que leu.",
    "Escrita e fala: inventa e conta histórias organizadas, com começo, meio e fim e palavras bem escolhidas.",
    "Números: faz contas de cabeça com facilidade no dia a dia, como troco, placar ou tempo que falta.",
    "Lógica: gosta de quebra-cabeças, jogos de estratégia, padrões e desafios.",
    "Natureza e ciência: observa como as coisas funcionam, dá explicações e quer testá-las.",
    "Pesquisa: busca informação por conta própria em livros, vídeos ou perguntando a adultos.",
    "Sabe muito sobre pelo menos um assunto do seu interesse, mais do que se espera para a idade.",
  ], "interesses e conhecimentos"),
  dom("3. Criatividade", "text-pink-600 dark:text-pink-400", [
    "Tem muitas ideias diferentes para uma mesma pergunta, brincadeira ou situação.",
    "Inventa soluções originais, que surpreendem os adultos da casa.",
    "Tem humor elaborado para a idade, com trocadilhos, jogos de palavras ou ironia.",
    "Questiona regras e combinados da casa, querendo entender o porquê delas.",
    "Gosta de inventar, construir, adaptar objetos ou criar histórias e brincadeiras.",
    "Arrisca ideias novas e não se intimida com o erro quando está experimentando.",
  ], "criatividade"),
  dom("4. Envolvimento e motivação", "text-amber-600 dark:text-amber-400", [
    "Fica muito tempo concentrado em atividades de que gosta.",
    "Cria metas próprias, como terminar um projeto ou aprender algo, e se esforça para cumpri-las.",
    "É muito exigente com a qualidade do que faz.",
    "Se envolve tanto com um projeto que às vezes esquece o que acontece ao redor.",
    "Perde o interesse por tarefas repetitivas ou por coisas que já sabe fazer.",
  ], "envolvimento e motivação"),
  dom("5. Liderança e relações sociais", "text-teal-600 dark:text-teal-400", [
    "Primos, vizinhos ou amigos o procuram para organizar as brincadeiras.",
    "Explica suas ideias com clareza e convence os outros.",
    "Assume responsabilidades em casa e as cumpre sem precisar ser lembrado.",
    "Percebe quando alguém da família está triste ou precisando de algo e reage a isso.",
    "Ajuda a resolver brigas entre irmãos, primos ou amigos com propostas justas.",
  ], "liderança e relações"),
  dom("6. Expressão artística", "text-indigo-600 dark:text-indigo-400", [
    "Música: tem ouvido para ritmo, afinação ou melodia, cantando, tocando ou dançando.",
    "Artes visuais: desenha, pinta ou modela com detalhes, perspectiva ou estilo próprio.",
    "Teatro e expressão: interpreta personagens, imita vozes e gestos com muita expressividade.",
    "Procura atividades artísticas por conta própria, sem ninguém pedir.",
  ], "expressão artística"),
  dom("7. Habilidades motoras e esportivas", "text-green-600 dark:text-green-400", [
    "Aprende rapidamente movimentos novos e regras de jogos e esportes.",
    "Tem coordenação, equilíbrio ou força acima do esperado para a idade.",
    "Usa estratégia e entende o jogo em brincadeiras e esportes com outras crianças.",
    "Tem habilidade manual destacada, como montar peças, recortar, consertar ou tocar instrumento.",
  ], "habilidades motoras"),
  dom("8. Aspectos emocionais", "text-orange-600 dark:text-orange-400", [
    "Reage com muita intensidade a injustiças, críticas ou frustrações.",
    "É tão perfeccionista que demora ou deixa de terminar o que começa.",
    "Prefere a companhia de crianças mais velhas ou de adultos.",
    "Tem dificuldade de se sentir parte do grupo de crianças da mesma idade.",
    "O jeito de pensar parece mais avançado que o jeito de lidar com as emoções ou com o corpo.",
    "Tem preocupações incomuns para a idade, como morte, meio ambiente ou o que é certo e errado.",
    "Se incomoda muito com barulho, texturas de roupa ou comida, luz forte ou lugares cheios.",
  ], "aspectos emocionais"),
  dom("9. Jeito de aprender", "text-sky-600 dark:text-sky-400", [
    "Termina rápido as tarefas de casa ou da escola e logo procura outra coisa para fazer.",
    "Prefere entender a ideia geral antes de se preocupar com os detalhes.",
    "Aprende melhor explorando sozinho do que seguindo instruções passo a passo.",
    "Fica entediado ou inquieto quando as explicações são lentas ou repetidas.",
    "Rende mais em projetos e pesquisas do próprio interesse do que em exercícios repetitivos.",
  ], "jeito de aprender"),
  dom("10. Pontos para conversar com o médico", "text-gray-600 dark:text-gray-400", [
    "Se distrai com frequência ou deixa coisas pela metade, mesmo as de que gosta.",
    "Age por impulso, interrompe as pessoas ou tem dificuldade de esperar a vez.",
    "Tem interesses muito restritos e intensos e fica rígido diante de mudanças na rotina.",
    "Tem dificuldade em conversas de ida e volta ou em entender sinais sociais, como expressões e tom de voz.",
    "Conversa e raciocina de forma avançada, mas a leitura, a escrita ou as contas ficam abaixo do esperado.",
    "Tem letra muito difícil de ler ou faz muito esforço para escrever.",
  ], "pontos para conversar"),
];

export const AHSD_PAIS_INFO =
  "Instrumento de observação e triagem, respondido pela família. Não tem ponto de corte, não tem normas e não faz diagnóstico de altas habilidades/superdotação nem de qualquer outra condição. O resultado mostra apenas a soma e a média das respostas em cada área, de forma descritiva, para orientar a conversa com o médico. O domínio 10 não indica diagnóstico: serve para o médico saber se há algo a acompanhar junto com as habilidades.";

export const ahsdPaisItems: Record<string, InteractiveScaleDef> = {
  [AHSD_PAIS_ID]: {
    icon: Sparkles,
    gradient: "from-amber-500 to-purple-600",
    instruction:
      "Pense nos últimos seis meses e compare seu filho com crianças da mesma idade que você conhece. Marque com que frequência você observa cada comportamento em casa, em passeios e na rotina da família. Não existe resposta certa ou errada. Ao final de cada área há um espaço opcional para contar um exemplo concreto.",
    infoBox: AHSD_PAIS_INFO,
    labels: AHSD_PAIS_LABELS,
    optionPoints: [1, 2, 3, 4],
    scoreDirection: "higher_better",
    totalLabel: "Perfil descritivo — soma das respostas (sem ponto de corte)",
    descriptiveDomainSummary: true,
    instrumentVersion: "ahsd-pais-v1",
    bands: [
      {
        minPct: 0,
        classification: "Perfil descritivo — interpretar por área, com o médico",
        color: "emerald",
        description:
          "A soma e as médias por área apenas organizam as respostas. Não existe ponto de corte, percentil ou classificação. O médico interpreta o perfil junto com a consulta, os exemplos da família e as informações da escola.",
      },
    ],
    domains: ahsdPaisDomains,
  },
};
