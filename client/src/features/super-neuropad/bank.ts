/**
 * Banco integrado do Super NeuroPad Game — uma faixa por ano, de 2 a 17 anos.
 *
 * O jogo não reinventa conteúdo: cada item vem de uma das quatro abas de origem
 * e carrega `origin` + `ref` (referência exata no banco de lá):
 *   • Sonda 10 e OBS-10 — roteiros de aplicação (`sondaDezProtocol`, `obs10/protocol`)
 *     e o banco objetivo compartilhado do Modo Fácil (`objectiveBank`: índice par = Sonda 10,
 *     ímpar = OBS-10);
 *   • Reconhecimento visual — figuras, cores e opostos do manifesto (`visual-recognition/model`),
 *     desenhados pelo próprio componente de lá; mesma graduação do Modo Fácil (2/3/4 opções);
 *   • Avaliação cognitiva infantil — `cognitive-age/bank` (um perfil por idade).
 *
 * Calibração (ver docs/SUPER_NEUROPAD_GAME.md, "Calibração por faixa"): os itens objetivos
 * vêm do perfil da PRÓPRIA idade (o banco objetivo já fica um degrau abaixo da exigência
 * escolar); tarefas julgadas seguem os marcos que os roteiros de origem já citam (CDC/AAP,
 * via OBS-10). Itens que pediam mais do que a idade costuma alcançar foram trocados
 * (ex.: numerais aos 3 anos, span de dígitos de 6 aos 10 anos). Nada aqui é norma,
 * percentil ou ponto de corte validado.
 *
 * Nada depende de objeto fora do aplicativo: desenho e escrita são feitos com o dedo
 * na tela; o ambiente (chão livre, porta, mesa, junta do piso) é o da sala.
 */
import { COGNITIVE_BANK, type CognitiveDomain, type CognitiveItem } from "../cognitive-age/bank";
import { OBJECTIVE_BANDS, type ObjectiveItem } from "../../components/jogo-facil/objectiveBank";
import { ITEMS as VR_ITEMS, eligibleItems, easyPlanSettings, itemFor as vrItemFor, makeTrial, type Item as VrItem } from "../visual-recognition/model";
import type { BuildItem, DoItem, Item, OriginId, Option, SpeakItem, TouchItem } from "./items";

export type PhaseId = "vila" | "olhos" | "palavras" | "numeros" | "memoria" | "corpo";
export const PHASE_ORDER: readonly PhaseId[] = ["vila", "olhos", "palavras", "numeros", "memoria", "corpo"];

export const MIN_AGE_YEARS = 2;
export const MAX_AGE_YEARS = 17;
export const YEARS: readonly number[] = Array.from({ length: MAX_AGE_YEARS - MIN_AGE_YEARS + 1 }, (_, index) => MIN_AGE_YEARS + index);

/** 2 a 5 anos: 4 desafios por mundo (24); 6 a 17 anos: 5 por mundo (30). */
export function itemsPerPhase(years: number): number {
  return years <= 5 ? 4 : 5;
}

// ─────────────────────────────── nomes das figuras (registro e PDF) ───────────────────────────────
export const EMOJI_NAMES: Record<string, string> = {
  "🐱": "gato", "🐶": "cachorro", "🐟": "peixe", "👁️": "olho", "👃": "nariz", "👂": "orelha", "👟": "sapato", "🎩": "chapéu",
  "🧤": "luva", "🚗": "carro", "🥄": "colher", "🐸": "sapo", "🍌": "banana", "🍎": "maçã", "🐮": "vaca", "✈️": "avião",
  "⚫": "círculo", "🔺": "triângulo", "🟥": "quadrado", "⭐": "estrela", "🔵": "círculo azul", "⚽": "bola", "🔴": "círculo vermelho",
  "🟡": "círculo amarelo", "🟢": "círculo verde", "🐢": "tartaruga", "🐛": "lagarta", "🐘": "elefante", "🪑": "cadeira", "☂️": "guarda-chuva",
  "🔷": "losango azul", "🔶": "losango laranja", "🍇": "uva", "🔑": "chave", "🦒": "girafa", "🥕": "cenoura", "🐭": "rato",
  "🌳": "árvore", "🚜": "trator", "🚌": "ônibus", "🚲": "bicicleta", "🟦": "quadrado azul", "📦": "caixa", "✏️": "lápis",
  "🕒": "relógio", "🐴": "cavalo", "🐷": "porco", "🐵": "macaco", "🐰": "coelho", "🚂": "trem", "🍊": "laranja", "🍞": "pão",
  "🥛": "leite", "🍰": "bolo", "🚪": "porta", "🛏️": "cama", "🏠": "casa", "👄": "boca", "✋": "mão", "😄": "rindo",
  "😴": "dormindo", "😢": "chorando", "☀️": "sol", "🌧️": "chuva", "🌙": "lua", "🐦": "passarinho", "🧸": "urso de pelúcia",
  "🌸": "flor", "🦆": "pato", "🍃": "folha", "🐄": "vaca",
  // figuras dos roteiros julgados e dos itens autorais do jogo
  "🦋": "borboleta", "👶": "bebê", "🤒": "bebê doente", "🧒": "criança", "💥": "batida", "🪟": "janela", "🎂": "bolo de aniversário",
  "😠": "bravo", "😳": "envergonhado", "😞": "decepcionado", "🤩": "animado", "😋": "com fome", "🥵": "com calor", "😨": "com medo",
  "🍽️": "prato", "🦩": "um pé só", "👣": "passos", "🖐️": "mão aberta", "👉": "dedo", "🗣️": "fala", "☝️": "dedo para cima",
  "👏": "palmas", "🙌": "mãos para cima", "🧱": "bloco", "🎈": "balão", "📚": "livros", "🧢": "boné", "🍐": "pera",
  "🎒": "mochila", "⏰": "relógio", "🎧": "fone", "🙋": "criança levantando a mão", "↩": "ao contrário", "➜": "depois",
  "🔒": "fechar", "🤚": "mão", "🫲": "palma da mão",
};

const SEGMENTER = new Intl.Segmenter("pt-BR", { granularity: "grapheme" });
const PICTO = /\p{Extended_Pictographic}/u;

function stripVs(text: string): string {
  return text.replace(/\uFE0F/g, "");
}

const NAME_LOOKUP = new Map(Object.entries(EMOJI_NAMES).map(([art, name]) => [stripVs(art), name]));

/** Rótulo textual de uma opção: palavra fica como está; figuras viram nomes ("maçã ×3"). */
export function labelForArt(art: string): string {
  const graphemes = [...SEGMENTER.segment(art)].map((entry) => stripVs(entry.segment)).filter((segment) => segment.trim() !== "");
  if (!graphemes.some((segment) => PICTO.test(segment))) return art;
  const names = graphemes.map((segment) => NAME_LOOKUP.get(segment));
  if (names.some((name) => !name)) throw new Error(`Figura sem nome no glossário: ${art}`);
  if (names.every((name) => name === names[0]) && names.length > 1) return `${names[0]} ×${names.length}`;
  return names.join(" ");
}

const opt = (art: string, label?: string): Option => ({ art, label: label ?? labelForArt(art) });

// ─────────────────────────────── pontes com os bancos de origem ───────────────────────────────
type Draft<T extends Item> = Omit<T, "id">;
type AnyDraft = Draft<TouchItem> | Draft<SpeakItem> | Draft<DoItem> | Draft<BuildItem>;

function objectiveBand(years: number) {
  const band = OBJECTIVE_BANDS.find((entry) => years >= entry.minYears && years <= entry.maxYears);
  if (!band) throw new Error(`Sem perfil objetivo para ${years} anos`);
  return band;
}

/** Item do banco objetivo compartilhado pela Sonda 10 (índice par) e pelo OBS-10 (índice ímpar). */
function obj(years: number, say: string): Draft<TouchItem> {
  const band = objectiveBand(years);
  const index = band.items.findIndex((entry) => entry.say === say);
  if (index < 0) throw new Error(`Item objetivo não encontrado (${band.id}): ${say}`);
  const item: ObjectiveItem = band.items[index];
  const origin: OriginId = index % 2 === 0 ? "sonda10" : "obs10";
  const options = item.options.map((art) => opt(art));
  const answer = options[item.options.indexOf(item.answer)].label;
  const big = item.options.every((art) => [...SEGMENTER.segment(art)].length <= 6);
  return { kind: "toque", prompt: item.say, options, answer, origin, ref: `${origin === "sonda10" ? "Sonda 10" : "OBS-10"} · banco objetivo ${band.label} · item ${index + 1}`, ...(big ? { big: true } : {}) };
}

const DOMAIN_REF: Record<CognitiveDomain, string> = { visual: "visual", leitura: "fala/leitura", escrita: "letras/escrita", aritmetica: "números" };

/** Item da Avaliação cognitiva infantil (perfil da idade), procurado pelo enunciado. */
function cog(years: number, domain: CognitiveDomain, prompt: string, occurrence = 0): AnyDraft {
  const list = COGNITIVE_BANK[years]?.[domain] ?? [];
  const matches = list.map((entry, index) => ({ entry, index })).filter(({ entry }) => entry.prompt === prompt);
  const found = matches[occurrence];
  if (!found) throw new Error(`Item cognitivo não encontrado (${years} anos, ${domain}): ${prompt}`);
  const item: CognitiveItem = found.entry;
  const ref = `Cognitivos ${years} anos · ${DOMAIN_REF[domain]} ${found.index + 1}`;
  if (item.kind === "tap") {
    const options = item.options.map((art) => opt(art));
    const answer = options[item.options.indexOf(item.answer)].label;
    return { kind: "toque", prompt: item.say !== item.prompt ? item.say : item.prompt, options, answer, origin: "cognitivo", ref, ...(item.stimulus ? { stimulus: item.stimulus } : {}), ...(item.big ? { big: true } : {}) };
  }
  if (item.kind === "say") {
    return { kind: "fala", prompt: item.say, expected: item.expected, stimulus: item.stimulus, origin: "cognitivo", ref };
  }
  const word = item.target.join("");
  return {
    kind: "montar", prompt: item.show ? `Olhe a palavra e monte igual, tocando nas letras na ordem.` : "Escute a palavra e monte com as letras, tocando na ordem.",
    word, target: [...item.target], tiles: [...item.tiles], show: item.show, origin: "cognitivo", ref, seconds: 30 + word.length * 2,
  };
}

// ─────────────────────────────── Reconhecimento visual ───────────────────────────────
const vrOption = (id: string): Option => ({ art: "", vr: id, label: vrItemFor(id).label });

/** "Mostre: …" — mesma pergunta e mesma graduação de alternativas do Modo Fácil do Reconhecimento Visual. */
function vrShow(years: number, targetId: string, seed: number): Draft<TouchItem> {
  const months = years * 12;
  const settings = easyPlanSettings(months);
  const target = vrItemFor(targetId);
  const eligible = eligibleItems(months, "receptivo").filter((entry) => !entry.context);
  if (!eligible.some((entry) => entry.id === targetId)) throw new Error(`Figura ${targetId} fora do roteiro de ${years} anos`);
  const pool: VrItem[] = target.pair
    ? eligible.filter((entry) => entry.pair === target.pair)
    : target.category === "cores" || settings.distractors === "categoria"
      ? eligible.filter((entry) => entry.category === target.category)
      : eligible.filter((entry) => entry.art === target.art);
  const trial = makeTrial(targetId, "receptivo", pool, settings.choices, seed, 0);
  return {
    kind: "toque", prompt: trial.question, options: trial.optionIds.map(vrOption), answer: target.label, origin: "visual", big: true,
    ref: `Reconhecimento visual · reconhecer · ${target.label} (${settings.choices} opções, distratores ${target.pair ? "do mesmo par" : settings.distractors})`,
  };
}

/** Pareamento: "Ache a figura igual ao modelo" com o modelo visível. */
function vrMatch(years: number, targetId: string, seed: number): Draft<TouchItem> {
  const months = years * 12;
  const settings = easyPlanSettings(months);
  const target = vrItemFor(targetId);
  const pool = eligibleItems(months, "pareamento").filter((entry) => entry.art === target.art && (settings.distractors === "categoria" ? entry.category === target.category : true));
  const trial = makeTrial(targetId, "pareamento", pool, settings.choices, seed, 0);
  return {
    kind: "toque", prompt: trial.question, options: trial.optionIds.map(vrOption), answer: target.label, stimulusVr: targetId, origin: "visual", big: true,
    ref: `Reconhecimento visual · parear · ${target.label} (${settings.choices} opções)`,
  };
}

/** Nomeação: "O que é isto?" / "Que cor é esta?" — conferida pela aplicadora; aceita os sinônimos do banco visual. */
function vrName(years: number, targetId: string, gesture?: string): Draft<SpeakItem> {
  const target = vrItemFor(targetId);
  if (target.category === "cores" && years < 4) throw new Error("Nomear cores só a partir de 4 anos (roteiro do Reconhecimento Visual)");
  const aliases = target.aliases.filter((alias) => alias.toLowerCase() !== target.label.toLowerCase());
  const question = target.category === "cores" ? "Que cor é esta?" : "O que é isto?";
  return {
    kind: "fala", prompt: `Mostre a figura e pergunte: “${question}”`, stimulusVr: targetId, origin: "visual",
    expected: `Diz “${target.label.toLowerCase()}”${aliases.length ? ` (aceitar ${aliases.map((alias) => `“${alias}”`).join(", ")})` : ""}`,
    ref: `Reconhecimento visual · nomear · ${target.label}`,
    ...(gesture ? { gesture } : {}),
  };
}

/** Conceito contextualizado (quente/frio, pesado/leve): a aplicadora lê o contexto do banco visual. */
function vrContext(years: number, targetId: string, seed: number): Draft<TouchItem> {
  const months = years * 12;
  const target = vrItemFor(targetId);
  const pool = VR_ITEMS.filter((entry) => entry.pair === target.pair && entry.minMonths <= months);
  if (!target.context || pool.length !== 2) throw new Error(`Conceito contextualizado indisponível: ${targetId}`);
  const trial = makeTrial(targetId, "receptivo", pool, 2, seed, 0);
  return {
    kind: "toque", prompt: `Leia: “${target.context}” Depois: ${trial.question}`, context: target.context, options: trial.optionIds.map(vrOption), answer: target.label,
    origin: "visual", big: true, seconds: 18, ref: `Reconhecimento visual · conceito contextualizado · ${target.label}`,
  };
}

/** Figura do Reconhecimento Visual por idade de 10 a 17 anos (uma por faixa, sem repetir). */
const TEEN_VR: Record<number, string> = { 10: "limao", 11: "pessego", 12: "tesoura", 13: "chapeu", 14: "trem", 15: "girafa", 16: "chave", 17: "pera" };

// ─────────────────────────────── itens julgados (roteiros Sonda 10 / OBS-10) ───────────────────────────────
function fala(origin: OriginId, ref: string, prompt: string, expected: string, extra: Partial<Pick<SpeakItem, "stimulus" | "gesture" | "seconds">> = {}): Draft<SpeakItem> {
  return { kind: "fala", prompt, expected, origin, ref, ...extra };
}
function fazer(origin: OriginId, ref: string, prompt: string, expected: string, extra: Partial<Pick<DoItem, "stimulus" | "shape" | "draw" | "gesture" | "seconds">> = {}): Draft<DoItem> {
  return { kind: "fazer", prompt, expected, origin, ref, ...extra };
}
function toque(origin: OriginId, ref: string, prompt: string, options: Option[], answer: string, extra: Partial<Pick<TouchItem, "stimulus" | "preview" | "big" | "seconds">> = {}): Draft<TouchItem> {
  if (!options.some((entry) => entry.label === answer)) throw new Error(`Resposta fora das opções: ${prompt}`);
  return { kind: "toque", prompt, options, answer, origin, ref, ...extra };
}

const SONDA = (band: string, mission: string) => `Sonda 10 · ${band} · ${mission}`;
const OBS = (band: string, part: string) => `OBS-10 · ${band} · ${part}`;

// Interação e comunicação — Sonda 10 (entrada social, atenção conjunta, simbolismo, pragmática,
// cognição social) e OBS-10 ("Acolher e observar", "Interagir e conversar").
const nameCall = (band: string): Draft<DoItem> => fazer("sonda10", SONDA(band, "entrada social + resposta ao nome"),
  "Enquanto a criança olha para outra coisa, chame o nome dela 2 vezes, sem tocar, com uns 5 segundos entre as chamadas.",
  "Vira o rosto ou olha para você em pelo menos 1 das 2 chamadas", { seconds: 20 });
const jointAttention = (band: string, figure: string): Draft<DoItem> => fazer("sonda10", SONDA(band, "atenção conjunta"),
  "Aponte para a figura na tela e diga: “Olha!”", "Segue o seu apontar e olha para a figura", { stimulus: figure, seconds: 15 });

function vila(years: number): Draft<Item>[] {
  if (years === 2) return [
    nameCall("24–35 meses"),
    jointAttention("24–35 meses", "🦋"),
    fazer("sonda10", SONDA("24–35 meses", "brincadeira simbólica"), "Mostre o bebê e a colher na tela: “O bebê está com fome. Dá comida pra ele?”",
      "Faz de conta de dar comida ao bebê da tela (leva a colher de mentira até ele) ou diz “papá”/“comer”", { stimulus: "👶 🥄", gesture: "Aceita só o gesto de dar comida, sem falar", seconds: 20 }),
    obj(2, "Quem está chorando?"),
  ];
  if (years === 3) return [
    nameCall("3–4 anos"),
    fala("obs10", OBS("3 anos", "interagir e conversar"), "Pergunte: “Do que você gosta de brincar?”", "Responde com uma palavra ou frase sobre uma brincadeira",
      { gesture: "Aceita mostrar ou imitar a brincadeira", seconds: 20 }),
    fazer("sonda10", SONDA("3–4 anos", "brincadeira simbólica"), "Mostre a figura: “O bebê está dodói. O que a gente pode fazer?”",
      "Propõe ou faz de conta um cuidado (remédio, colo, dormir, levar ao médico, beijinho)", { stimulus: "🤒", gesture: "Aceita fazer de conta o cuidado sem falar", seconds: 20 }),
    obj(2, "Quem está rindo?"),
  ];
  if (years === 4) return [
    fala("obs10", OBS("4 anos", "interagir e conversar"), "Pergunte: “Como você se chama?”", "Diz o próprio nome"),
    fala("obs10", OBS("4 anos", "interagir e conversar"), "Peça: “Conta uma coisa que você fez hoje.”", "Conta algo do dia numa frase de 3 palavras ou mais", { seconds: 30 }),
    fala("sonda10", SONDA("3–4 anos", "brincadeira simbólica"), "Mostre a figura: “O bebê está com frio. O que a gente faz?”", "Propõe um cuidado que resolve (cobrir, agasalhar, abraçar, fechar a janela)", { stimulus: "👶" }),
    toque("sonda10", SONDA("3–4 anos", "inferência de emoção (toque)"), "O menino caiu e machucou o joelho. Como ele ficou?", [opt("😄", "feliz"), opt("😢", "triste"), opt("😴", "com sono")], "triste", { big: true }),
  ];
  if (years === 5) return [
    fala("obs10", OBS("5 anos", "interagir e conversar"), "Pergunte: “O que foi legal nos últimos dias?”", "Conta pelo menos 2 acontecimentos ligados, que dá para entender", { seconds: 35 }),
    fala("sonda10", SONDA("5–7 anos", "conversação (reciprocidade)"), "Diga: “Eu gosto de banana. E você, do que gosta de comer?”", "Responde na vez dela, dentro do assunto"),
    fala("sonda10", SONDA("3–4 anos", "atenção conjunta + pedir ajuda"), "Pergunte: “Se você se machucar no parquinho, o que você faz?”", "Diz que pede ajuda a um adulto (mãe, pai, professora)"),
    toque("sonda10", SONDA("5–7 anos", "narrativa + inferência (adaptado para toque)"), "O menino ganhou um sorvete. Como ele ficou?", [opt("😄", "feliz"), opt("😢", "triste"), opt("😠", "bravo")], "feliz", { big: true }),
  ];
  if (years <= 7) return [
    fala("sonda10", SONDA("5–7 anos", "conversação"), "Peça: “Me conta alguma coisa legal que aconteceu hoje ou ontem.”", "Relato com pelo menos 2 acontecimentos em ordem, que dá para entender", { seconds: 40 }),
    fala("obs10", OBS("6–8 anos", "interagir e conversar"), "Pergunte: “Você sabe por que veio aqui hoje?”", "Responde à pergunta de forma coerente (vale “não sei” dito com naturalidade), sem fugir do assunto"),
    fala("sonda10", SONDA("5–7 anos", "narrativa + inferência"), "Mostre a cena: “O que está acontecendo? Por quê?”", "Diz que está chovendo e por isso a criança usa o guarda-chuva (causa e efeito)", { stimulus: "🌧️ 🧒 ☂️", seconds: 30 }),
    years === 6
      ? toque("sonda10", SONDA("5–7 anos", "inferência de emoção (toque)"), "A menina ganhou um presente. Como ela ficou?", [opt("😄", "feliz"), opt("😢", "triste"), opt("😠", "brava")], "feliz", { big: true })
      : toque("sonda10", SONDA("5–7 anos", "inferência de emoção (toque)"), "O menino perdeu o brinquedo preferido. Como ele ficou?", [opt("😄", "feliz"), opt("😢", "triste"), opt("😴", "com sono")], "triste", { big: true }),
    years === 6
      ? fala("sonda10", SONDA("5–7 anos", "resolução de problema social"), "Pergunte: “Se você se perder da sua mãe no mercado, o que você faz?”", "Pede ajuda a um funcionário, segurança ou caixa, ou fica parado esperando")
      : fala("sonda10", SONDA("5–7 anos", "resolução de problema social"), "Pergunte: “Um colega caiu no recreio. O que você faz?”", "Ajuda, pergunta se está bem ou chama um adulto"),
  ];
  if (years <= 11) return [
    fala("sonda10", SONDA("8–11 anos", "pragmática espontânea"), "Peça: “Me conta como foi seu dia até chegar aqui.”", "Relato em ordem (começo, meio e fim), mantendo o assunto", { seconds: 40 }),
    years <= 9
      ? fala("sonda10", SONDA("8–11 anos", "inferência social"), "Mostre a cena: “O que aconteceu? Como o menino se sente?”", "Diz que a bola quebrou a janela e que o menino fica preocupado, com medo ou culpado", { stimulus: "⚽ 💥 🪟 🧒", seconds: 30 })
      : fala("sonda10", SONDA("8–11 anos", "inferência social"), "Diga: “Era aniversário do Lucas e nenhum amigo apareceu na festa.” Pergunte: “Como ele se sente? Por quê?”", "Diz que ele fica triste ou decepcionado porque ninguém foi", { stimulus: "🎂 🧒", seconds: 30 }),
    years <= 9
      ? toque("sonda10", SONDA("8–11 anos", "inferência de emoção (toque)"), "Pedro esqueceu a fala na apresentação e a turma toda olhou. Como ele se sentiu?", [opt("😳", "envergonhado"), opt("😄", "feliz"), opt("😴", "com sono"), opt("😋", "com fome")], "envergonhado", { big: true })
      : toque("sonda10", SONDA("8–11 anos", "inferência de emoção (toque)"), "Ana esperou a amiga no cinema, mas ela não veio. Como Ana ficou?", [opt("😞", "decepcionada"), opt("🤩", "animada"), opt("😴", "com sono"), opt("🥵", "com calor")], "decepcionada", { big: true }),
    years <= 9
      ? fala("sonda10", SONDA("8–11 anos", "flexibilidade social"), "Pergunte: “Um colega pegou seu lápis sem pedir. O que você faz?”", "Resolve sem agressão: pede de volta, conversa ou chama a professora")
      : fala("sonda10", SONDA("8–11 anos", "flexibilidade social"), "Pergunte: “Um amigo contou para a turma um segredo seu. O que você faz?”", "Propõe conversar com o amigo ou pedir ajuda a um adulto, sem vingança nem agressão"),
    fala("obs10", OBS("9–11 anos", "interagir e conversar"), "Pergunte: “Onde você está agora e por que veio?”", "Diz o lugar (consultório, clínica, médico) e um motivo plausível"),
  ];
  const older = years >= 15;
  return [
    fala("sonda10", SONDA("12–17 anos", "narrativa da rotina"), "Peça: “Me conta como está sendo sua rotina ultimamente.”", "Descreve a rotina de forma organizada (horários ou sequência) e mantém a conversa", { seconds: 40 }),
    fala("sonda10", SONDA("12–17 anos", "cognição social"), "Pergunte: “Você mandou uma mensagem, ela foi visualizada e ninguém respondeu. Que explicações podem existir?”", "Dá pelo menos 2 explicações diferentes e plausíveis (ocupado, sem bateria, esqueceu…)", { seconds: 30 }),
    fala("sonda10", SONDA("12–17 anos", "cognição social + flexibilidade"), "Pergunte: “E qual seria uma resposta adequada nessa situação?”", "Propõe uma atitude adequada (esperar, perguntar com calma), sem hostilidade"),
    older
      ? toque("sonda10", SONDA("12–17 anos", "cognição social (ironia, toque)"), "No meio de uma tempestade, alguém diz: “Que dia lindo para ir à praia!” A pessoa quer dizer que:", [opt("o dia está ótimo para praia"), opt("está sendo irônica: o dia está ruim"), opt("vai à praia agora"), opt("gosta muito de chuva")], "está sendo irônica: o dia está ruim")
      : toque("sonda10", SONDA("12–17 anos", "cognição social (ironia, toque)"), "Chove forte e alguém diz: “Que dia lindo para passear!” A pessoa quer dizer que:", [opt("o dia está ótimo"), opt("está fazendo ironia: o dia está ruim"), opt("vai passear agora"), opt("gosta de chuva forte")], "está fazendo ironia: o dia está ruim"),
    fala("obs10", OBS("12–17 anos", "interagir e conversar"), "Confirme: “Você sabe onde está e por que veio hoje?”", "Diz onde está e um motivo plausível para a consulta"),
  ];
}

// ─────────────────────────────── Floresta dos Olhos (reconhecimento visual) ───────────────────────────────
function olhos(years: number): Draft<Item>[] {
  const s = years * 100;
  switch (years) {
    case 2: return [
      vrShow(2, "gato", s + 1),
      vrShow(2, "sapato", s + 2),
      vrMatch(2, "cachorro", s + 3),
      vrName(2, "carro", "Se não falar: pergunte “Cadê o carro?” entre duas figuras e aceite apontar"),
    ];
    case 3: return [
      vrShow(3, "onibus", s + 1),
      vrShow(3, "vermelho", s + 2),
      vrShow(3, "tamanho-0", s + 3),
      cog(3, "visual", "Qual NÃO é bicho?"),
    ];
    case 4: return [
      vrShow(4, "elefante", s + 1),
      vrName(4, "azul"),
      vrShow(4, "conteudo-0", s + 3),
      cog(4, "visual", "Qual é a forma igual a esta?"),
    ];
    case 5: return [
      vrShow(5, "tartaruga", s + 1),
      vrShow(5, "quantidade-1", s + 2),
      vrContext(5, "temperatura-1", s + 3),
      cog(5, "visual", "O que vem depois?"),
    ];
    case 6: return [
      vrShow(6, "leao", s + 1),
      vrContext(6, "massa-0", s + 2),
      cog(6, "visual", "O que vem depois?"),
      cog(6, "visual", "Qual NÃO é fruta?"),
      cog(6, "visual", "Quantos triângulos?"),
    ];
    case 7: return [
      vrShow(7, "ambulancia", s + 1),
      vrMatch(7, "helicoptero", s + 2),
      cog(7, "visual", "O que vem depois?"),
      cog(7, "visual", "Qual é igual a esta?"),
      cog(7, "visual", "Quantos quadrados?"),
    ];
    case 8: return [vrMatch(8, "abelha", s + 1), ...COGNITIVE_BANK[8].visual.map((entry) => cog(8, "visual", entry.prompt))];
    case 9: return [vrMatch(9, "coco", s + 1), ...COGNITIVE_BANK[9].visual.map((entry) => cog(9, "visual", entry.prompt))];
    default: {
      // 10 a 17 anos: uma amostra breve do Reconhecimento Visual (4 opções da mesma categoria, figura de
      // repertório comum; o roteiro visual lembra que desconhecer uma figura não define déficit) + os quatro
      // itens visuais da Avaliação Cognitiva da idade.
      const own = COGNITIVE_BANK[years].visual.map((entry, index, list) => cog(years, "visual", entry.prompt, list.slice(0, index).filter((other) => other.prompt === entry.prompt).length));
      return [vrShow(years, TEEN_VR[years], s + 1), ...own];
    }
  }
}

// ─────────────────────────────── Ilha das Palavras (linguagem, leitura, escrita) ───────────────────────────────
const register = (band: string): Draft<SpeakItem> => fala("obs10", OBS(band, "linguagem e raciocínio (registro das palavras)"),
  "Diga: “Guarde estas palavras para me contar depois: CASA, GATO, PÃO.” Peça para repetir agora (pode apresentar 2 vezes).",
  "Repete as 3 palavras (qualquer ordem). Avise que vai perguntar de novo mais tarde", { stimulus: "CASA · GATO · PÃO", seconds: 25 });

function palavras(years: number): Draft<Item>[] {
  switch (years) {
    case 2: return [
      { ...(cog(2, "leitura", "O que é isto?") as Draft<SpeakItem>), gesture: "Se não falar: pergunte “Cadê a banana?” entre duas figuras e aceite apontar" },
      { ...(cog(2, "leitura", "Que bicho é este? Como ele faz?") as Draft<SpeakItem>), gesture: "Aceita imitar o som (muu) sem dizer o nome" },
      fazer("obs10", OBS("24–35 meses", "linguagem (compreensão)"), "Diga: “Mostre o seu nariz.” Depois: “Cadê a sua barriga?”", "Aponta ou toca as 2 partes do corpo", { stimulus: "👃" }),
      fala("sonda10", SONDA("24–35 meses", "linguagem expressiva + fala"), "Mostre as figuras e converse: “O que tem aqui? O que o cachorro faz?”", "Junta 2 palavras numa fala (ex.: “au-au bola”, “cachorro corre”)", { stimulus: "🐶 ⚽", seconds: 25 }),
    ];
    case 3: return [
      cog(3, "leitura", "O que é isto?", 0),
      cog(3, "leitura", "O que é isto?", 2),
      fala("obs10", OBS("3 anos", "linguagem e raciocínio"), "Mostre a figura: “O que está acontecendo?”", "Descreve a ação (ex.: “comendo”, “o menino come”)", { stimulus: "🧒 🍽️", gesture: "Aceita imitar a ação de comer" }),
      fazer("sonda10", SONDA("24–35 meses", "compreensão verbal (duas etapas)"), "Diga, sem apontar: “Toque no cachorro e depois na bola.”", "Toca os dois na ordem pedida", { stimulus: "🐱 🐶 ⚽ 🚗" }),
    ];
    case 4: return [
      fala("obs10", OBS("4 anos", "linguagem e raciocínio"), "Pergunte: “Para que serve um guarda-chuva?”", "Explica o uso (para a chuva, para não molhar)"),
      cog(4, "leitura", "O que é isto?", 0),
      obj(4, "Toque na letra E."),
      cog(4, "escrita", "Que letra é esta?", 0),
    ];
    case 5: return [
      fala("obs10", OBS("5 anos", "linguagem e raciocínio (história)"), "Conte: “Um gato ficou preso numa árvore. Uma pessoa trouxe uma escada e ajudou o gato a descer.” Pergunte: “O que aconteceu? Como ele desceu?”",
        "Diz que o gato ficou preso e desceu pela escada (com ajuda da pessoa)", { seconds: 35 }),
      cog(5, "leitura", "Qual palavra rima com PÃO? Leia as opções em voz alta para a criança."),
      obj(5, "Com que letra começa SAPO?"),
      cog(5, "leitura", "Com que som começa FACA?"),
    ];
    case 6: return [
      register("6–8 anos"),
      cog(6, "leitura", "Leia em voz alta.", 0),
      cog(6, "leitura", "Leia a frase. O sol é…"),
      obj(6, "Quantas sílabas tem BA-NA-NA?"),
      obj(6, "Qual está escrita certa?"),
    ];
    case 7: return [
      register("6–8 anos"),
      cog(7, "leitura", "Leia a frase em voz alta."),
      cog(7, "leitura", "Por que Lia levou o guarda-chuva?"),
      obj(7, "Leia: Ana tem um cachorro preto. De que cor é o cachorro?"),
      obj(7, "Qual é o plural de FLOR?"),
    ];
    case 8: return [
      register("6–8 anos"),
      cog(8, "leitura", "Leia o texto em voz alta."),
      cog(8, "leitura", "Por que usa regadores pequenos?"),
      obj(8, "Leia: O carro parou porque acabou a gasolina. Por que o carro parou?"),
      obj(8, "Qual frase faz uma pergunta?"),
    ];
    case 9: return [
      register("9–11 anos"),
      cog(9, "leitura", "Leia o texto em voz alta."),
      cog(9, "leitura", "O que Ana foi buscar?"),
      obj(9, "Leia: 'Depois do almoço, Lia foi ao parque.' Quando Lia foi ao parque?"),
      obj(9, "Qual é o plural de PÃO?"),
    ];
    case 10: return [
      register("9–11 anos"),
      cog(10, "leitura", "Leia o texto em voz alta."),
      cog(10, "leitura", "Quando o João passeia com o Rex?"),
      obj(10, "Leia: 'Se chover, o passeio será adiado.' O passeio será adiado se:"),
      obj(10, "Qual palavra é sinônimo de RÁPIDO?"),
    ];
    case 11: return [
      register("9–11 anos"),
      cog(11, "leitura", "Leia o texto em voz alta."),
      cog(11, "leitura", "Como Maria ficou com a nota?"),
      obj(11, "Leia: 'Embora estivesse cansada, Júlia ajudou a mãe.' Júlia:"),
      obj(11, "Qual está escrita certa?"),
    ];
    default: {
      const abstraction = fala("obs10", OBS("12–17 anos", "linguagem e raciocínio"), "Pergunte: “Em que uma bicicleta e um ônibus se parecem?”",
        "Dá uma semelhança plausível (meios de transporte, têm rodas, levam pessoas)");
      const reading = COGNITIVE_BANK[years].leitura;
      const objectiveReading = objectiveBand(years).items.filter((entry) => entry.domain === "leitura");
      return [
        register("12–17 anos"),
        abstraction,
        cog(years, "leitura", reading[1].prompt),
        cog(years, "leitura", reading[3].prompt),
        obj(years, objectiveReading[years % 2 === 0 ? 2 : 3].say),
      ];
    }
  }
}

// ─────────────────────────────── Montanha dos Números ───────────────────────────────
function numeros(years: number): Draft<Item>[] {
  switch (years) {
    case 2: return [
      cog(2, "aritmetica", "Onde tem MAIS maçãs?"),
      obj(2, "Onde tem só uma bola?"),
      obj(2, "Onde tem mais gatos?"),
      cog(2, "aritmetica", "Onde tem só UMA maçã?"),
    ];
    case 3: return [
      // Aos 3 anos, quantidade contra quantidade: os itens do perfil que pedem numeral ficaram de fora.
      obj(3, "Toque onde tem 2 flores."),
      obj(3, "Onde tem menos peixes?"),
      cog(3, "aritmetica", "Onde tem UMA bola?"),
      cog(3, "aritmetica", "Conte as estrelas em voz alta."),
    ];
    case 4: return [
      obj(4, "Toque onde tem 4 bolas."),
      cog(4, "aritmetica", "Onde tem MAIS cachorros?"),
      cog(4, "aritmetica", "Conte as estrelas em voz alta."),
      cog(4, "aritmetica", "Toque no número 3."),
    ];
    case 5: return [
      cog(5, "aritmetica", "Quantas bolas? Toque no número."),
      cog(5, "aritmetica", "Qual número vem depois do 4?"),
      obj(5, "Toque no número 7."),
      cog(5, "aritmetica", "2 + 1 = ?"),
    ];
    default: {
      const objective = objectiveBand(years).items.filter((entry) => entry.domain === "numeros");
      const cognitive = COGNITIVE_BANK[years].aritmetica;
      const picks = years % 2 === 0 ? [0, 2, 4] : [1, 3, 5];
      return [
        ...picks.map((index) => obj(years, objective[index].say)),
        cog(years, "aritmetica", cognitive[0].prompt),
        cog(years, "aritmetica", cognitive[2].prompt),
      ];
    }
  }
}

// ─────────────────────────────── Caverna da Memória (memória, atenção, funções executivas) ───────────────────────────────
const DIGITS: Record<number, string[]> = {
  2: ["BOLA"], 3: ["2", "5"], 4: ["4", "9", "2"], 5: ["7", "1", "5"], 6: ["6", "1", "8", "3"], 7: ["5", "2", "9", "4"], 8: ["3", "8", "1", "6"],
  9: ["3", "8", "1", "6", "4"], 10: ["7", "2", "9", "4", "1"], 11: ["5", "9", "2", "7", "3"], 12: ["5", "2", "8", "1", "9", "4"], 13: ["7", "2", "9", "4", "1", "6"],
  14: ["4", "8", "2", "6", "9", "3"], 15: ["6", "1", "7", "3", "8", "5"], 16: ["2", "9", "5", "1", "7", "4"], 17: ["8", "3", "6", "2", "9", "5"],
};
const BACKWARD: Record<number, string[]> = {
  6: ["2", "7"], 7: ["4", "9"], 8: ["5", "1", "9"], 9: ["3", "6", "2"], 10: ["8", "3", "5"], 11: ["6", "2", "9"], 12: ["7", "4", "1"],
  13: ["8", "3", "5", "1"], 14: ["6", "2", "9", "4"], 15: ["5", "8", "1", "7"], 16: ["9", "4", "7", "2"], 17: ["3", "7", "2", "8"],
};
const NUM_WORDS = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];

function forward(years: number): Draft<SpeakItem> {
  const sequence = DIGITS[years];
  if (years === 2) return fala("sonda10", SONDA("24–35 meses", "memória inicial"), "Diga: “Repita: BOLA.”", "Repete a palavra “bola”", { stimulus: "🗣️" });
  return fala(years >= 6 ? "obs10" : "sonda10", years >= 6 ? OBS("6–17 anos", "memória (repetição imediata)") : SONDA("3–4 anos", "memória operacional"),
    `Diga, um número por segundo: “Repita: ${sequence.join(" – ")}.”`, `Repete os ${NUM_WORDS[sequence.length]} números na mesma ordem`, { stimulus: sequence.join(" · ") });
}

function backward(years: number): Draft<SpeakItem> {
  const sequence = BACKWARD[years];
  return fala("sonda10", SONDA(years >= 12 ? "12–17 anos" : years >= 8 ? "8–11 anos" : "5–7 anos", "memória operacional (ordem inversa)"),
    `Diga, um número por segundo: “Repita ao contrário: ${sequence.join(" – ")}.”`, `Diz “${[...sequence].reverse().join(" – ")}”`, { stimulus: `${sequence.join(" · ")} ↩` });
}

const recall = (years: number): Draft<SpeakItem> => fala("obs10", OBS(years >= 12 ? "12–17 anos" : years >= 9 ? "9–11 anos" : "6–8 anos", "retomar e encerrar (evocação das palavras)"),
  "Pergunte, sem dica: “Lembra das 3 palavras que pedi para você guardar na Ilha das Palavras?” (CASA, GATO, PÃO)",
  years <= 7 ? "Lembra pelo menos 2 das 3 palavras, sem dica" : "Lembra as 3 palavras, sem dica", { seconds: 20 });

const sunMoon = (ref: string, sequence: string[], action = "bata uma vez na mesa"): Draft<SpeakItem> => fala(ref.startsWith("OBS") ? "obs10" : "sonda10", ref,
  `Regra: “Quando eu disser SOL, ${action}; quando disser LUA, mãos paradas.” Uma prática de cada. Sequência (2–3 s entre cada): ${sequence.join(" – ")}`,
  `Acerta as ${sequence.length} (reage só no SOL)`, { stimulus: "☀️ 🌙", seconds: 20 + sequence.length * 3 });

function memoria(years: number): Draft<Item>[] {
  switch (years) {
    case 2: return [
      forward(2),
      toque("sonda10", SONDA("24–35 meses", "memória inicial (visual)"), "Toque na figura que você VIU", [opt("🐶"), opt("🚗")], "cachorro", { preview: "🐶", big: true }),
      fazer("sonda10", SONDA("24–35 meses", "inibição inicial (espera)"), "Mostre a estrela e diga: “Espera… só toque quando eu disser JÁ.” Conte 3 segundos em silêncio e diga “JÁ!”",
        "Espera o JÁ (não toca antes) e toca depois", { stimulus: "⭐", seconds: 20 }),
      fazer("sonda10", SONDA("24–35 meses", "memória inicial (sequência)"), "Diga: “Primeiro toque no carro, depois na bola.”", "Toca os dois na ordem pedida", { stimulus: "⚽ 🚗 🧸" }),
    ];
    case 3: return [
      forward(3),
      toque("sonda10", SONDA("3–4 anos", "memória (visual)"), "Toque na figura que você VIU", [opt("🐶"), opt("🐱"), opt("🚗")], "cachorro", { preview: "🐶 🍌", big: true }),
      fazer("sonda10", SONDA("24–35 meses", "inibição inicial (espera)"), "Mostre a estrela e diga: “Espera… só toque quando eu disser JÁ.” Conte 3 segundos em silêncio e diga “JÁ!”",
        "Espera o JÁ (não toca antes) e toca depois", { stimulus: "⭐", seconds: 20 }),
      fazer("sonda10", SONDA("3–4 anos", "atenção sustentada (adaptada, auditiva)"), "Diga: “Bata palma quando eu falar CACHORRO.” Fale devagar: gato – CACHORRO – bola – CACHORRO – casa.",
        "Bate palma só nas 2 vezes do CACHORRO", { stimulus: "👏 🐶", seconds: 25 }),
    ];
    case 4: return [
      forward(4),
      fala("sonda10", SONDA("3–4 anos", "memória operacional (palavras)"), "Diga: “Repita: gato, bola, casa.”", "Repete as três palavras (qualquer ordem)", { stimulus: "🐱 ⚽ 🏠" }),
      sunMoon(SONDA("3–4 anos", "inibição"), ["SOL", "LUA", "SOL", "LUA"], "bata palma"),
      toque("sonda10", SONDA("3–4 anos", "memória (visual)"), "Toque na figura que você VIU", [opt("🐶"), opt("🐱"), opt("🍎"), opt("🚗")], "cachorro", { preview: "🐶 🍌", big: true }),
    ];
    case 5: return [
      forward(5),
      toque("sonda10", SONDA("5–7 anos", "memória (visual)"), "Qual figura NÃO apareceu?", [opt("🍎"), opt("🚗"), opt("🐸"), opt("🐱")], "sapo", { preview: "🍎 🚗 🐱", big: true }),
      sunMoon(OBS("5 anos", "retomar e encerrar (regra SOL/LUA)"), ["SOL", "LUA", "SOL", "LUA"]),
      fazer("sonda10", SONDA("5–7 anos", "atenção sustentada (adaptada, auditiva)"), "Diga: “Bata palma quando eu falar CACHORRO.” Fale devagar: gato – CACHORRO – bola – casa – CACHORRO – pato – CACHORRO.",
        "Bate palma só nas 3 vezes do CACHORRO", { stimulus: "👏 🐶", seconds: 25 }),
    ];
    case 6:
    case 7: return [
      forward(years),
      backward(years),
      sunMoon(SONDA("5–7 anos", "controle inibitório"), years === 6 ? ["SOL", "LUA", "SOL", "SOL", "LUA"] : ["SOL", "SOL", "LUA", "SOL", "LUA"]),
      fala("sonda10", SONDA("5–7 anos", "flexibilidade cognitiva"), "Diga: “Agora mudou: LUA = bata na mesa; SOL = mãos paradas.” Sequência: LUA – SOL – LUA – LUA – SOL",
        "Acerta as 5 com a regra nova (reage só na LUA)", { stimulus: "🌙 ☀️", seconds: 30 }),
      recall(years),
    ];
    case 8:
    case 9: return [
      forward(years),
      backward(years),
      sunMoon(OBS("6–11 anos", "retomar e encerrar (regra SOL/LUA)"), ["SOL", "SOL", "LUA", "SOL", "LUA", "LUA", "SOL", "LUA"]),
      fala("sonda10", SONDA("8–11 anos", "inibição verbal"), "Regra: “Quando eu disser DIA, você responde NOITE; quando eu disser NOITE, responde DIA.” Uma prática. Sequência: DIA – NOITE – NOITE – DIA – NOITE – DIA",
        "Erra no máximo 1 das 6 respostas", { stimulus: "☀️ 🌙", seconds: 35 }),
      recall(years),
    ];
    case 10:
    case 11: return [
      forward(years),
      backward(years),
      fala("sonda10", SONDA("8–11 anos", "flexibilidade"), "Regra: “DIA → responda NOITE; NOITE → responda DIA.” Três estímulos. Depois: “Agora mudou: DIA → SOL; NOITE → LUA.” Sequência nova: NOITE – DIA – DIA – NOITE",
        "Acerta as 4 respostas da regra nova", { stimulus: "☀️ 🌙", seconds: 40 }),
      fala("sonda10", SONDA("8–11 anos", "planejamento"), "Diga: “Você precisa sair de casa às 7h30. Em que ordem faz: tomar café, pegar a mochila, tomar banho, vestir o uniforme?”",
        "Dá uma ordem viável sem esquecer nenhuma etapa (mochila por último)", { seconds: 35 }),
      recall(years),
    ];
    default: return [
      fala("sonda10", SONDA("12–17 anos", "memória operacional verbal"), `Diga, uma palavra por segundo: “Repita ao contrário: ${years >= 15 ? "mar – pé – luz – céu" : "sol – pão – mar"}.”`,
        years >= 15 ? "Diz “céu – luz – pé – mar”" : "Diz “mar – pão – sol”", { stimulus: "🗣️ ↩" }),
      forward(years),
      fala("sonda10", SONDA("12–17 anos", "inibição + troca de regra"), "Regra: “DIREITA → responda ESQUERDA; ESQUERDA → responda DIREITA.” Sequência: DIREITA – ESQUERDA – ESQUERDA – DIREITA – ESQUERDA – DIREITA",
        "Erra no máximo 1 das 6 respostas", { seconds: 35 }),
      fala("sonda10", SONDA("12–17 anos", "planejamento executivo"), "Diga: “Entre 18h e 22h você tem prova amanhã, um trabalho da escola, banho, jantar e quer 30 minutos livres. Como organiza?”",
        "Encaixa todas as tarefas no horário e deixa o tempo livre depois do estudo", { seconds: 60 }),
      recall(years),
    ];
  }
}

// ─────────────────────────────── Torre do Corpo (motor, mãos, desenho e escrita) ───────────────────────────────
const MOTOR = (band: string) => OBS(band, "movimentar com segurança (núcleo motor)");
const HANDS = (band: string) => OBS(band, "mãos, desenho e escrita");
const oneFoot = (band: string, seconds: number, both = false): Draft<DoItem> => fazer("obs10", MOTOR(band),
  `Peça: “Fique em um pé só${both ? ", depois no outro" : ""}.” Conte até ${seconds} em voz alta. Fique perto; olhos abertos.`,
  `Mantém ${seconds} segundos${both ? " em cada pé" : ""} sem apoiar o outro pé`, { stimulus: "🦩", seconds: 15 + seconds * (both ? 2 : 1) });
const copyShape = (band: string, shape: DoItem["shape"] & string, name: string, criterion: string): Draft<DoItem> => fazer("obs10", HANDS(band),
  `Mostre ${name} e peça: “Desenhe igual aqui, com o dedo.”`, criterion, { shape, draw: true, seconds: 30 });

function corpo(years: number): Draft<Item>[] {
  switch (years) {
    case 2: return [
      fazer("obs10", MOTOR("24–35 meses"), "Peça: “Vai até a porta e volta!” (uns 3 metros, piso livre).", "Anda ou corre até lá e volta sem cair", { stimulus: "🏃", seconds: 25 }),
      fazer("obs10", MOTOR("24–35 meses"), "Peça: “Senta no chão e levanta do seu jeito.”", "Senta e levanta sozinha (pode apoiar as mãos)", { seconds: 20 }),
      fazer("sonda10", SONDA("24–35 meses", "imitação + gestos"), "Diga “Faz igual!” e faça: bata palmas; depois mãos na cabeça.", "Imita os 2 gestos", { stimulus: "👏 🙌", seconds: 20 }),
      fazer("obs10", HANDS("24–35 meses"), "Diga: “Faz um risco aqui!” e deixe a criança desenhar com o dedo na tela.", "Faz um traço ou rabisco na tela", { draw: true, seconds: 20 }),
    ];
    case 3: return [
      fazer("obs10", MOTOR("3 anos"), "Peça: “Caminhe até a porta, vire e volte.”", "Vai, vira e volta sem cair", { stimulus: "🏃", seconds: 25 }),
      fazer("obs10", MOTOR("3 anos"), "Mostre e peça: “Pula com os dois pés juntos!” (só se for seguro)", "Salta com os dois pés saindo do chão ao mesmo tempo", { stimulus: "🐸", seconds: 20 }),
      fazer("sonda10", SONDA("3–4 anos", "imitação"), "Diga “Faz igual!” e faça: mãos para cima, bata palmas, mãos na barriga.", "Imita os 3 gestos na ordem", { stimulus: "🙌 👏", seconds: 20 }),
      copyShape("3 anos", "circulo", "o círculo", "Desenha uma forma fechada e arredondada"),
    ];
    case 4: return [
      oneFoot("4 anos", 2),
      fazer("obs10", MOTOR("4 anos"), "Peça: “Pula com os dois pés juntos, 3 vezes seguidas.”", "Faz 3 saltos com os dois pés juntos sem cair", { stimulus: "🐸", seconds: 20 }),
      copyShape("4 anos", "cruz", "a cruz", "Desenha duas linhas que se cruzam"),
      fazer("obs10", HANDS("4 anos"), "Peça: “Desenhe uma pessoa aqui, com o dedo.”", "A pessoa tem cabeça e pelo menos 2 outras partes (olhos, braços, pernas…)", { draw: true, seconds: 40 }),
    ];
    case 5: return [
      oneFoot("5 anos", 3),
      fazer("obs10", MOTOR("5 anos"), "Mostre e peça: “Pule num pé só, 2 vezes.”", "Dá 2 pulos num pé só sem apoiar o outro", { stimulus: "🦩", seconds: 20 }),
      copyShape("5 anos", "quadrado", "o quadrado", "Desenha quatro lados com cantos"),
      fazer("obs10", HANDS("5 anos"), "Peça: “Escreva aqui, com o dedo, as letras que você conhece.”", "Escreve pelo menos 2 letras reconhecíveis", { draw: true, seconds: 40 }),
    ];
    case 6:
    case 7: return [
      oneFoot("6–8 anos", 5),
      fazer("obs10", MOTOR("6–8 anos"), "Peça: “Estique os braços à frente, palmas para cima, e fique assim.” Conte até 10.", "Mantém os dois braços esticados, palmas para cima, por 10 segundos", { stimulus: "🫲", seconds: 25 }),
      fazer("obs10", MOTOR("6–8 anos"), "Peça: “Toque o seu nariz com este dedo e depois o meu dedo.” 3 vezes de cada lado, devagar.", "Acerta o nariz e o seu dedo nas 3 vezes, dos dois lados", { stimulus: "👉 👃", seconds: 30 }),
      copyShape("6–8 anos", "quadrado", "o quadrado", "Desenha quatro lados com cantos"),
      years === 6
        ? fazer("obs10", HANDS("6–8 anos"), "Peça: “Escreva o seu nome aqui, com o dedo.”", "Escreve o primeiro nome de forma legível", { draw: true, seconds: 40 })
        : cog(7, "escrita", "Escreva a palavra ditada: GATO"),
    ];
    case 8:
    case 9: return [
      oneFoot("6–11 anos", 8),
      fazer("obs10", MOTOR("6–11 anos"), "Peça: “Ande em cima da junta do piso, um pé na frente do outro, calcanhar encostando na ponta.” 6 passos.", "Dá 6 passos sem sair da linha", { stimulus: "👣", seconds: 30 }),
      fazer("obs10", HANDS("6–8 anos"), "Demonstre e peça: “Toque o polegar em cada dedo, do indicador ao mindinho.” Uma mão, depois a outra.", "Faz a sequência completa nas duas mãos sem pular dedo", { stimulus: "🖐️", seconds: 30 }),
      copyShape("6–11 anos", "triangulo", "o triângulo", "Desenha três lados com cantos fechados"),
      cog(years, "escrita", COGNITIVE_BANK[years].escrita[0].prompt),
    ];
    case 10:
    case 11: return [
      oneFoot("9–11 anos", 10),
      fazer("obs10", HANDS("9–11 anos"), "Demonstre e peça: “Bata na mesa alternando a palma e as costas da mão, rápido.” 5 segundos em cada mão.", "Alterna palma e dorso de forma regular nas duas mãos", { stimulus: "🤚", seconds: 30 }),
      fazer("obs10", MOTOR("9–11 anos"), "Peça: “Ande em cima da junta do piso, calcanhar encostando na ponta.” 8 passos.", "Dá 8 passos sem sair da linha", { stimulus: "👣", seconds: 30 }),
      copyShape("9–11 anos", "losango", "o losango", "Desenha quatro lados com as pontas em cima e embaixo"),
      cog(years, "escrita", COGNITIVE_BANK[years].escrita[0].prompt),
    ];
    default: return [
      oneFoot("12–17 anos", 10, true),
      fazer("obs10", MOTOR("12–17 anos"), "Peça: “Ande em cima da junta do piso, calcanhar encostando na ponta, 8 passos, e volte.”", "Ida e volta sem sair da linha", { stimulus: "👣", seconds: 35 }),
      fazer("obs10", HANDS("12–17 anos"), "Demonstre e peça: “Bata na mesa alternando a palma e as costas da mão, rápido.” 5 segundos em cada mão.", "Alterna palma e dorso de forma regular nas duas mãos", { stimulus: "🤚", seconds: 30 }),
      years === 12
        ? copyShape("12–17 anos", "losango", "o losango", "Desenha quatro lados com as pontas em cima e embaixo")
        : copyShape("12–17 anos", "pentagono", "o pentágono", "Desenha cinco lados fechados"),
      cog(years - 1, "escrita", COGNITIVE_BANK[years - 1].escrita[0].prompt),
    ];
  }
}

// ─────────────────────────────── montagem ───────────────────────────────
const BUILDERS: Record<PhaseId, (years: number) => Draft<Item>[]> = { vila, olhos, palavras, numeros, memoria, corpo };

function build(): Record<number, Record<PhaseId, Item[]>> {
  const bank: Record<number, Record<PhaseId, Item[]>> = {};
  for (const years of YEARS) {
    const perPhase = {} as Record<PhaseId, Item[]>;
    for (const phaseId of PHASE_ORDER) {
      const drafts = BUILDERS[phaseId](years);
      perPhase[phaseId] = drafts.map((draft, index) => ({ ...draft, id: `${years}.${phaseId}.${index + 1}` }) as Item);
    }
    bank[years] = perPhase;
  }
  return bank;
}

export const INTEGRATED_BANK: Record<number, Record<PhaseId, Item[]>> = build();
