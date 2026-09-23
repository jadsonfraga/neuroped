import { AGE_BANDS } from "../protocol";

/** New modality, NOT a digital equivalence of the physical OBS-10 tasks. */
export const TABLET_VERSION = "obs10-tablet/1.0.0" as const;
export const TABLET_LIMIT = 600;
export const TABLET_LIMITS = "Roteiro digital autoral e experimental, sem validação diagnóstica. Toque e desenho com o dedo não equivalem a manipulação real, preensão de lápis ou escrita no papel. Não produz nota, QI, idade cognitiva, diagnóstico ou exame neurológico normal.";
export const TABLET_UNEXAMINED = [
  "Manipulação de objetos reais, empilhamento, abertura de recipientes e brincar simbólico com objetos.",
  "Preensão do lápis, escrita no papel, força, tônus, reflexos e sensibilidade.",
  "Chute/recepção de bola, marcha provocada, transferências posturais e equilíbrio formal.",
  "Frequência habitual dos comportamentos, funcionamento em outros ambientes e investigação confidencial de risco.",
] as const;
export type TabletKind = "quiet" | "scene" | "reading" | "choice" | "drawing" | "count";
export interface TabletTask {
  id: string;
  title: string;
  kind: TabletKind;
  prepare: string;
  command: string;
  observe: string;
  caution: string;
  scene?: "picture-play" | "picture-eat" | "picture-cat";
  text?: string;
  model?: "circle";
  memory?: "encoding" | "recall";
}
export interface TabletPlan {
  bandId: string;
  bandLabel: string;
  months: number;
  childScreen: boolean;
  tasks: TabletTask[];
  limitations: readonly string[];
}
const task = (id: string, title: string, kind: TabletKind, command: string, observe: string, extra: Partial<TabletTask> = {}): TabletTask => ({
  id, title, kind, command, observe,
  prepare: kind === "quiet" ? "Tablet voltado para você. Mostre rosto e mãos na câmera, sem retirar apoios habituais." : "Explique antes. Ao tocar em Abrir atividade, só o estímulo aparece. A criança pode apontar, falar ou tocar; não precisa dominar o tablet.",
  caution: "Não ensine até acertar. Uma repetição quando necessária; descreva a ajuda. Recusa não significa incapacidade.",
  ...extra,
});
const arrival = task("arrival", "Receba sem dar comandos", "quiet", "Deixe a criança se acomodar na posição confortável que já utiliza. Observe antes de pedir.", "Registre iniciativa, comunicação e movimentos que realmente apareceram; sem interpretar normalidade.");
const caregiver = task("caregiver", "Converse com o cuidador", "quiet", "Cuidador, converse e sorria como costuma fazer. Faça uma pausa e espere a resposta.", "Descreva sons, orientação, gestos e interação observados. Não exigir olhar nos olhos.");
const babyVoice = task("vocal", "Espere a comunicação acontecer", "quiet", "Responda a um som ou gesto que o bebê produziu e espere. Se não houver, continue a conversa habitual, sem provocar choro.", "Registre literalmente os sons/gestos e quem iniciou. Silêncio na amostra não prova ausência da habilidade.");
const posture = task("posture", "Observe a posição habitual", "quiet", "Cuidador, mantenha a posição e os apoios habituais. Deixe o bebê movimentar-se espontaneamente.", "Observe os movimentos visíveis das mãos e do corpo; não faça tração, prono provocado, reflexos ou mudanças de posição para testar.");
const handsBaby = task("hands-free", "Observe as mãos sem objetos", "quiet", "Deixe as mãos livres na posição habitual. Não abra os dedos à força e não coloque o tablet na mão do bebê.", "Descreva abertura, movimentos e mãos aproximadas do corpo, quando presentes. Alcance de brinquedos e manipulação não foram examinados.");
const talk = task("conversation", "Faça uma pergunta e escute", "quiet", "Do que você gosta de brincar ou fazer?", "Registre as palavras e gestos da criança, sem completar sua resposta. Conteúdo sensível segue conversa reservada com o médico.");
const scene = task("scene", "Converse sobre uma cena", "scene", "O que está acontecendo aqui?", "Descreva o que apontou, falou ou comunicou. A cena é digital e não padronizada.", { scene: "picture-play" });
const choice = task("choice", "Ofereça duas escolhas na tela", "choice", "Qual destes você escolhe? Pode apontar, falar ou tocar.", "Registre escolha e ajuda. Não existe resposta certa. Um toque registra somente a interação com a tela.");
const count = task("count", "Observe uma contagem na tela", "count", "Você pode contar estes círculos?", "Registre a sequência falada. Tocar cada círculo não é obrigatório e os toques não geram escore.");
const draw = task("drawing", "Desenhe com o dedo", "drawing", "Pode fazer um desenho do seu jeito usando o dedo aqui.", "O traçado digital será preservado. Descreva tentativa, mão utilizada e ajuda. Não conclua habilidade de escrita ou preensão do lápis.", { caution: "É grafismo digital exploratório. Não fornecer modelo no desenho livre. A criança pode recusar; não exija familiaridade com telas." });
const copy = task("circle-copy", "Experimente uma cópia digital", "drawing", "Faça um parecido com este usando o dedo.", "Modelo digital previsto. Registre o que fez sem pontuar geometria; esta proposta não equivale à cópia em papel.", { model: "circle" });
const manual = task("hands", "Faça um gesto simples", "quiet", "Mostre uma vez: tocar o polegar nos outros dedos. Convide: agora pode fazer do seu jeito, uma mão de cada vez.", "Registre movimentos e ajuda. Não conduza os dedos, não exija rapidez e não conclua exame motor normal.", { caution: "Somente na posição habitual confortável. Dor ou recusa: omitir. O modelo integra esta proposta exploratória." });
const encode = task("encoding", "Apresente três palavras oralmente", "quiet", "Guarde estas palavras para me contar depois: casa, gato, pão. Repita para mim.", "Anote exatamente o que repetiu e quantas apresentações ouviu, no máximo duas. Sem registro inicial não se interpreta retenção.", { memory: "encoding", caution: "Somente oral. Não mostrar palavras nem imagens à criança; não dar treino adicional." });
const recall = task("recall", "Retome as palavras sem pistas", "quiet", "Quais eram as três palavras que pedi para guardar?", "Registre literalmente a evocação. O intervalo é entre aberturas registradas das atividades, não tempo verificado do vídeo nem medida isolada de memória.", { memory: "recall", caution: "Não dar categorias, sílabas, figuras ou outras pistas. Sem aprendizagem inicial registrada, não interpretar retenção." });
const finish = task("closing", "Avise e encerre com tranquilidade", "quiet", "Terminamos. Obrigado por participar. Você pode ficar à vontade.", "Descreva apenas a transição que ocorreu. Não repetir tarefas para melhorar a resposta.");

export function tabletPlan(months: number): TabletPlan | null {
  const band = Number.isInteger(months) && months >= 0 ? AGE_BANDS.find((b) => months >= b.min && months < b.max) : undefined;
  if (!band) return null;
  let tasks: TabletTask[];
  if (months < 24) {
    tasks = [arrival, caregiver, babyVoice, posture, handsBaby, finish];
  } else if (months < 36) {
    tasks = [arrival, caregiver, { ...scene, scene: "picture-cat", command: "Onde está o gato? Pode apontar ou mostrar do seu jeito." }, choice, handsBaby, finish];
  } else if (months < 60) {
    tasks = [arrival, talk, scene, choice, draw, copy, manual, finish];
  } else if (months < 72) {
    tasks = [arrival, talk, scene, count, draw, copy, manual, finish];
  } else {
    const reading = task("reading", "Leia o texto na tela", "reading", "Leia este texto e me conte o que entendeu.", "Registre texto utilizado, leitura e explicação literal. Só aplicar se compatível com o ensino recebido; não mede dislexia ou inteligência.", { text: months < 108 ? "O gato dorme na cadeira." : "O gato dorme na cadeira. Quando acorda, vai brincar com a bola." });
    // Reading and picture content precede encoding, never repeat a memory target during retention.
    tasks = [arrival, talk, months < 144 ? reading : { ...scene, command: "Descreva esta situação e diga o que poderia acontecer depois." }, encode, draw, manual, recall, finish];
  }
  return {
    bandId: band.id, bandLabel: band.label, months, childScreen: months >= 24,
    tasks: tasks.map((t) => ({ ...t, id: `${band.id}:${t.id}` })),
    limitations: months < 24 ? ["Abaixo de 24 meses: sem estímulos de tela dirigidos à criança. O tablet serve ao adulto e à captação; cobertura observacional reduzida.", ...TABLET_UNEXAMINED] : TABLET_UNEXAMINED,
  };
}
