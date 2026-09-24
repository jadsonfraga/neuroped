import { AGE_BANDS } from "../protocol";

/** New modality, NOT a digital equivalence of the physical OBS-10 tasks. */
export const TABLET_VERSION = "obs10-tablet/1.0.0" as const;
export const TABLET_LIMIT = 600;
export const TABLET_LIMITS = "Roteiro digital autoral e experimental, sem validação diagnóstica. Toque e desenho com o dedo não equivalem a manipulação real, preensão de lápis ou escrita no papel. Não produz nota, QI, idade cognitiva, diagnóstico ou exame neurológico normal.";
export const TABLET_UNEXAMINED = [
  "Manipulação de objetos reais, empilhamento, abertura de recipientes e brincar simbólico com objetos.",
  "Preensão do lápis, escrita no papel, força contra resistência, tônus, reflexos e sensibilidade.",
  "Chute e recepção de bola, provas provocadas de postura e medidas formais de equilíbrio ou de marcha.",
  "Frequência habitual dos comportamentos, funcionamento em outros ambientes e investigação confidencial de risco.",
] as const;
/** Movement and oral proposals need only the camera and the room; they are observed, never measured. */
export const TABLET_CAMERA_OBSERVED = "A partir de cinco anos, marcha, levantar, braços, dedo ao nariz e apoio em um pé são observados pela câmera, sem instrumento e sem tempo cronometrado por segmento. Observação descritiva não é exame neurológico nem prova de normalidade." as const;
export type TabletKind = "quiet" | "scene" | "reading" | "choice" | "drawing" | "count";
export interface TabletTask {
  id: string;
  title: string;
  kind: TabletKind;
  /** Suggested pacing only, taken from the in-person script. Never a deadline or a scored duration. */
  seconds: number;
  prepare: string;
  command: string;
  observe: string;
  caution: string;
  steps?: readonly string[];
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
const task = (id: string, title: string, kind: TabletKind, seconds: number, command: string, observe: string, extra: Partial<TabletTask> = {}): TabletTask => ({
  id, title, kind, seconds, command, observe,
  prepare: kind === "quiet" ? "Tablet voltado para você. Mostre rosto e mãos na câmera, sem retirar apoios habituais." : "Explique antes. Ao tocar em Abrir atividade, só o estímulo aparece. A criança pode apontar, falar ou tocar; não precisa dominar o tablet.",
  caution: "Não ensine até acertar. Uma repetição quando necessária; descreva a ajuda. Recusa não significa incapacidade.",
  ...extra,
});
const arrival = task("arrival", "Receba sem dar comandos", "quiet", 30, "Deixe a criança se acomodar na posição confortável que já utiliza. Observe antes de pedir.", "Registre iniciativa, comunicação e movimentos que realmente apareceram; sem interpretar normalidade.");
const caregiver = task("caregiver", "Converse com o cuidador", "quiet", 90, "Cuidador, converse e sorria como costuma fazer. Faça uma pausa e espere a resposta.", "Descreva sons, orientação, gestos e interação observados. Não exigir olhar nos olhos.");
const babyVoice = task("vocal", "Espere a comunicação acontecer", "quiet", 40, "Responda a um som ou gesto que o bebê produziu e espere. Se não houver, continue a conversa habitual, sem provocar choro.", "Registre literalmente os sons/gestos e quem iniciou. Silêncio na amostra não prova ausência da habilidade.");
const posture = task("posture", "Observe a posição habitual", "quiet", 70, "Cuidador, mantenha a posição e os apoios habituais. Deixe o bebê movimentar-se espontaneamente.", "Observe os movimentos visíveis das mãos e do corpo; não faça tração, prono provocado, reflexos ou mudanças de posição para testar.");
const handsBaby = task("hands-free", "Observe as mãos sem objetos", "quiet", 60, "Deixe as mãos livres na posição habitual. Não abra os dedos à força e não coloque o tablet na mão do bebê.", "Descreva abertura, movimentos e mãos aproximadas do corpo, quando presentes. Alcance de brinquedos e manipulação não foram examinados.");
const talk = task("conversation", "Faça uma pergunta e escute", "quiet", 90, "Do que você gosta de brincar ou fazer?", "Registre as palavras e gestos da criança, sem completar sua resposta. Conteúdo sensível segue conversa reservada com o médico.");
const scene = task("scene", "Converse sobre uma cena", "scene", 45, "O que está acontecendo aqui?", "Descreva o que apontou, falou ou comunicou. A cena é digital e não padronizada.", { scene: "picture-play" });
const choice = task("choice", "Ofereça duas escolhas na tela", "choice", 50, "Qual destes você escolhe? Pode apontar, falar ou tocar.", "Registre escolha e ajuda. Não existe resposta certa. Um toque registra somente a interação com a tela.");
const count = task("count", "Observe uma contagem na tela", "count", 45, "Você pode contar estes círculos?", "Registre a sequência falada. Tocar cada círculo não é obrigatório e os toques não geram escore.");
const draw = task("drawing", "Desenhe com o dedo", "drawing", 70, "Pode fazer um desenho do seu jeito usando o dedo aqui.", "O traçado digital será preservado. Descreva tentativa, mão utilizada e ajuda. Não conclua habilidade de escrita ou preensão do lápis.", { caution: "É grafismo digital exploratório. Não fornecer modelo no desenho livre. A criança pode recusar; não exija familiaridade com telas." });
const copy = task("circle-copy", "Experimente uma cópia digital", "drawing", 30, "Faça um parecido com este usando o dedo.", "Modelo digital previsto. Registre o que fez sem pontuar geometria; esta proposta não equivale à cópia em papel.", { model: "circle" });
const manual = task("hands", "Faça um gesto simples", "quiet", 35, "Mostre uma vez: tocar o polegar nos outros dedos. Convide: agora pode fazer do seu jeito, uma mão de cada vez.", "Registre movimentos e ajuda. Não conduza os dedos, não exija rapidez e não conclua exame motor normal.", { caution: "Somente na posição habitual confortável. Dor ou recusa: omitir. O modelo integra esta proposta exploratória." });
const encode = task("encoding", "Apresente três palavras oralmente", "quiet", 40, "Guarde estas palavras para me contar depois: casa, gato, pão. Repita para mim.", "Anote exatamente o que repetiu e quantas apresentações ouviu, no máximo duas. Sem registro inicial não se interpreta retenção.", { memory: "encoding", caution: "Somente oral. Não mostrar palavras nem imagens à criança; não dar treino adicional." });
const recall = task("recall", "Retome as palavras sem pistas", "quiet", 30, "Quais eram as três palavras que pedi para guardar?", "Registre literalmente a evocação. O intervalo é entre aberturas registradas das atividades, não tempo verificado do vídeo nem medida isolada de memória.", { memory: "recall", caution: "Não dar categorias, sílabas, figuras ou outras pistas. Sem aprendizagem inicial registrada, não interpretar retenção." });
const finish = task("closing", "Avise e encerre com tranquilidade", "quiet", 60, "Terminamos. Obrigado por participar. Você pode ficar à vontade.", "Descreva apenas a transição que ocorreu. Não repetir tarefas para melhorar a resposta.");
// Movement observed by the camera: no instrument, no kit. Commands are the in-person script's own wording.
const movement = task("movement", "Observe quatro movimentos pela câmera", "quiet", 100, "Vamos fazer quatro coisas devagar, uma de cada vez. Você pode parar quando quiser.", "Descreva o que foi efetivamente observado em cada movimento, os apoios usados e o que ficou fora do enquadramento. Não escreva ‘marcha normal’, não estime força e não conclua exame neurológico.", {
  prepare: "Afaste o tablet e apoie-o de pé, mostrando o corpo inteiro e os pés. Espaço livre, piso antiderrapante e cuidador ao alcance. Sem tirar apoios habituais, calçado ou órtese.",
  steps: [
    "“Caminhe até ali, vire e volte no seu ritmo.” Cerca de três metros, se o espaço permitir; sem marcha estável, dor ou espaço seguro, omita.",
    "“Estique os braços à frente com as palmas para cima.” Pode ficar sentado, com apoio habitual; até dez segundos, olhos abertos. Sem empurrar nem corrigir assimetrias.",
    "“Toque o nariz com este dedo e depois o meu dedo.” Três movimentos lentos de cada lado; alvo ao alcance, sem tocar os olhos.",
    "“Fique em um pé um pouquinho; depois no outro.” Somente com marcha estável e proteção próxima; até cinco segundos de cada lado.",
  ],
  caution: "Omita qualquer movimento inseguro e registre o motivo: isso não significa incapacidade. Nunca solte o apoio, empurre, prolongue a tentativa, use escada ou peça olhos fechados. Um modelo lento é permitido; não exija rapidez.",
});
const oralRule = task("rule", "Experimente uma regra simples, só falando", "quiet", 45, "Quando eu disser SOL, bata uma vez na mesa. Quando eu disser LUA, deixe as mãos paradas.", "Descreva a compreensão e o que a criança fez. Erros podem refletir compreensão, audição, novidade ou atenção e não diagnosticam TDAH; não some acertos.", {
  steps: [
    "Pratique uma vez cada palavra. Se não compreender, omita e registre.",
    "Diga SOL–SOL–LUA–SOL–LUA–LUA–SOL–LUA, com dois a três segundos entre as palavras.",
    "Não acelere, não repita para treinar e não mostre esta tela à criança.",
  ],
  caution: "Proposta exploratória e apenas oral. Nenhuma palavra ou imagem desta regra aparece na tela da criança. Não somar erros nem transformar a sequência em escore.",
});

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
    // Movement and the oral rule need only the camera and the room, so they return from the in-person script.
    tasks = [arrival, talk, scene, count, draw, copy, manual, movement, oralRule, finish];
  } else {
    const reading = task("reading", "Leia o texto na tela", "reading", 75, "Leia este texto e me conte o que entendeu.", "Registre texto utilizado, leitura e explicação literal. Só aplicar se compatível com o ensino recebido; não mede dislexia ou inteligência.", { text: months < 108 ? "O gato dorme na cadeira." : "O gato dorme na cadeira. Quando acorda, vai brincar com a bola." });
    // Reading and picture content precede encoding, never repeat a memory target during retention.
    // Movement fills the retention interval, as in the in-person script, without re-presenting any target word.
    tasks = [arrival, talk, months < 144 ? reading : { ...scene, command: "Descreva esta situação e diga o que poderia acontecer depois." }, encode, draw, manual, movement, recall, oralRule, finish];
  }
  const cameraObserved = tasks.includes(movement);
  return {
    bandId: band.id, bandLabel: band.label, months, childScreen: months >= 24,
    tasks: tasks.map((t) => ({ ...t, id: `${band.id}:${t.id}` })),
    limitations: [
      ...(months < 24 ? ["Abaixo de 24 meses: sem estímulos de tela dirigidos à criança. O tablet serve ao adulto e à captação; cobertura observacional reduzida."] : []),
      ...TABLET_UNEXAMINED,
      ...(cameraObserved ? [TABLET_CAMERA_OBSERVED] : ["Nesta faixa, marcha, equilíbrio e coordenação apendicular não são propostos neste modo."]),
    ],
  };
}
/** Suggested pacing total. The hard limit stays at TABLET_LIMIT and belongs to the controller, not to this sum. */
export function plannedSeconds(plan: TabletPlan): number {
  return plan.tasks.reduce((total, item) => total + item.seconds, 0);
}
