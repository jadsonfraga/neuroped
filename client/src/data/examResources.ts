import { examBands } from "./exame-por-idade";
import { examExamples } from "./clinicalAssistantGuide";

export type Picture = "ball" | "book" | "bag" | "bottle" | "dog" | "cup" | "bench" | "tree" | "sun" | "moon" | "line" | "wave" | "home" | "kite" | "pencil";
export type Visual = { title: string; pictures?: readonly Picture[]; prompts?: readonly string[]; drawing?: boolean };
export const examVisuals = {
  pretend: { title: "Cena de faz de conta", pictures: ["home", "moon"] },
  freeDraw: { title: "Prancha em branco", drawing: true },
  lineDraw: { title: "Modelo de um traço", pictures: ["line"], drawing: true },
  routes: { title: "Percursos para indicar com o dedo", pictures: ["line", "wave"], drawing: true },
  traceChoice: { title: "Traço reto ou ondulado", pictures: ["line", "wave"], drawing: true },
  twoPlaces: { title: "Dois lugares da história", pictures: ["home", "tree"] },
  everyday: { title: "Duas cenas para contar", pictures: ["bottle", "cup"] },
  backpack: { title: "Objetos da mochila", pictures: ["bottle", "book", "bag"] },
  morning: { title: "Figuras para narrar", pictures: ["sun", "book", "kite"] },
  school: { title: "Objetos para organizar o começo", pictures: ["bag", "pencil", "book"] },
  ways: { title: "Como prefere responder?", prompts: ["Falar", "Escrever ou desenhar", "Usar outro meio", "Passar"] },
  firstThen: { title: "Organizar dois passos", prompts: ["Primeiro…", "Depois…"], drawing: true },
  instruction: { title: "Frase para apresentar por escrito ou ler", prompts: ["Imagine um parque. Escolha um lugar para começar e mostre sua escolha."] },
  alternate: { title: "Pedir outra forma de explicar", prompts: ["Imagine que você vai ensinar uma brincadeira. Mostre por onde começaria."] },
  story: { title: "Cenas para desenvolver uma história", pictures: ["dog", "bench", "moon"] },
  recall: { title: "Figuras para mostrar e depois fechar", pictures: ["ball", "cup", "book"] },
  face: { title: "Alvo visual estático, sem brilho", pictures: ["ball"] },
  turn: { title: "Sinais manuais para combinar", prompts: ["Começar", "Parar"], pictures: ["line", "wave"] },
} satisfies Record<string, Visual>;

type VisualId = keyof typeof examVisuals;
export type ExamResource = { title: string; preparation: string; materials: readonly string[]; visual?: VisualId };
type ResourceSpec = Omit<ExamResource, "title">;
const r = (preparation: string, materials: readonly string[] = [], visual?: VisualId): ResourceSpec => ({ preparation, materials, visual });
const voice = r("Sem material de mesa. Voz e rosto do cuidador; espere a reação espontânea.");
const spontaneous = r("Sem material de mesa. Observe apenas na posição habitual, sem toque ou manobra.");
const paper = "Papel e giz grosso ou lápis apropriado";
const toy = "Brinquedo grande e seguro, lavável, sem peças pequenas";
const ball = "Bola grande, macia e segura";
const cloth = "Pano limpo, mantido fora da face do bebê";
const doll = "Boneco grande sem peças pequenas";
const book = "Livro de figuras grandes";
const bowl = "Cesto ou pote grande, baixo e estável";
const floor = "Piso firme, área livre e apoio adequado";
const target = "Alvo visual manual apropriado";
const light = "Lanterna clínica para pupilas";
const acuity = "Material de acuidade visual apropriado e oclusor";
const hammer = "Martelo de reflexos";
const touch = "Algodão ou outro estímulo tátil leve apropriado";

const assistantSpecs: Record<string, readonly [ResourceSpec, ResourceSpec]> = {
  "Nascimento a 27 dias": [voice, spontaneous],
  "28 dias a 2 meses": [voice, spontaneous],
  "3 a 5 meses": [voice, r("O cuidador apresenta o pano sem tocar. Sem tela.", [cloth])],
  "6 a 8 meses": [r("Use a bandeja ou superfície estável apenas com o apoio habitual. Sem tela.", [toy]), voice],
  "9 a 11 meses": [r("Ofereça as duas opções reais e familiares. Uma figura não substitui o brinquedo.", [ball, doll]), voice],
  "12 a 14 meses": [r("Separe o cesto e a bola antes da proposta; manter a superfície estável.", [bowl, ball]), r("Deixe o livro ao alcance. Sem tela para preservar o manuseio.", [book])],
  "15 a 17 meses": [r("Role a bola na superfície baixa, sem pedir que se levante.", [ball]), r("Use dois objetos familiares grandes, na posição habitual.", ["Dois objetos familiares grandes"])],
  "18 a 23 meses": [r("A proposta precisa de encaixe real adequado à idade.", ["Encaixe com duas peças grandes e seguras"]), r("Abra o livro numa figura que o cuidador reconheça.", [book])],
  "2 anos": [r("Use o boneco e o tecido; a figura é apoio para imaginar, não substitui a manipulação.", [doll, cloth], "pretend"), r("A tela permite rabiscar com o dedo. Use papel e giz se a proposta for observar a pega.", [paper], "freeDraw")],
  "3 anos": [r("Mostre um traço. O dedo na tela não demonstra como segurou o giz.", [paper], "lineDraw"), r("Os dois destinos já estão desenhados na tela. Use o boneco se quiser observar como o manuseia.", [doll], "twoPlaces")],
  "4 anos": [r("Os dois desenhos estão disponíveis no app. Não dê uma ordem correta.", [], "everyday"), r("Use os modelos no app. Observe a execução com lápis apenas se ele for usado.", [paper], "traceChoice")],
  "5 anos": [r("Revezem na prancha em branco ou no papel. Ninguém precisa fazer uma marca.", [], "freeDraw"), r("Abra as figuras antes de fazer a pergunta. Os objetos reais são opcionais para a conversa.", [], "backpack")],
  "6 a 8 anos": [r("Mostre os dois percursos. Aceite indicação sem tocar ou use papel se a pega importar.", [], "routes"), r("Abra as três figuras antes de propor a narração.", [], "morning")],
  "9 a 11 anos": [r("Use a prancha em branco ou deixe a criança responder oralmente.", [], "freeDraw"), r("Mostre o conjunto na tela, sem sugerir uma ordem.", [], "school")],
  "12 a 14 anos": [r("Apresente os modos de resposta; a pessoa pode recusar.", [], "ways"), r("A prancha mostra dois passos que podem ser descritos ou desenhados.", [], "firstThen")],
  "15 a 17 anos": [r("Use os dois campos da prancha ou convide a responder por outro meio.", [], "firstThen"), r("Mostre a instrução ou leia a mesma frase em voz habitual.", [], "instruction")],
  "18 a 19 anos": [r("Use somente situação inventada. A prancha é opcional.", [], "firstThen"), r("Mostre ou leia a instrução neutra. Não peça dados pessoais.", [], "alternate")],
};

const infant: readonly ResourceSpec[] = [
  r("Aferição e palpação são presenciais. Confira a curva apropriada para interpretar a medida.", ["Fita não extensível", "Curva de perímetro cefálico apropriada", "Superfície firme e apoio"]),
  r("Use o equipamento conforme a técnica médica. Mantenha o apoio do bebê.", [hammer, "Superfície firme e apoio"]),
  r("A tela não examina pupilas, reflexo vermelho, sensibilidade ou sucção.", [touch, light, "Oftalmoscópio para reflexo vermelho"]),
];
const play: readonly ResourceSpec[] = [
  r("A etapa exige exame presencial e apoio confortável. Não use a tela como resistência.", [floor]),
  r("Confira o martelo, um boneco para demonstrar se útil e um estímulo leve para a comparação.", [hammer, doll, touch]),
  r("Figuras do app não aferem acuidade. Use o material apropriado, correção habitual e dispositivos da criança.", [light, acuity]),
];
const older: readonly ResourceSpec[] = [
  r("Posicione a pessoa para comparação segmentar, com apoio e privacidade.", ["Cadeira ou maca estável"]),
  r("Use instrumentos apropriados conforme o exame dirigido. A tela não mede reflexo, vibração ou posição articular.", [hammer, touch, "Diapasão, se indicado"]),
  r("Separe recursos para pupilas, visão e fundo de olho. O alvo de tela não substitui os instrumentos.", [light, acuity, "Oftalmoscópio, se indicado"]),
];

const medicalSpecs: Record<string, readonly [ResourceSpec, ResourceSpec, ResourceSpec]> = {
  "Nascimento a 27 dias": [voice, spontaneous, voice],
  "28 dias a 2 meses": [voice, r("Prepare a superfície firme e tenha supervisão direta durante a observação.", [floor]), voice],
  "3 a 5 meses": [r("Use brinquedo físico, sem brilho intenso.", [toy]), r("Prepare apoio para o tronco e um alvo que possa ser alcançado.", [toy, "Apoio estável para o tronco"]), voice],
  "6 a 8 meses": [r("Separe a bola para rolar devagar; use a voz habitual.", [ball]), r("Separe a bola e um segundo brinquedo para observar o movimento real.", [ball, toy]), r("O pano é para o rosto do adulto, não para cobrir o bebê.", [cloth])],
  "9 a 11 meses": [r("Mostre um brinquedo seguro sobre tapete ou superfície firme.", [toy, floor]), r("Disponha dois objetos alcançáveis com apoio habitual.", ["Dois objetos familiares grandes", "Apoio estável para o tronco"]), r("Use o brinquedo físico e um pano, sem encobrir a criança.", [toy, cloth])],
  "12 a 14 meses": [r("Use a bola macia e a voz habitual.", [ball]), r("Prepare o pote, a bola e área livre na posição habitual.", [ball, bowl, floor]), r("Use a mesma bola para manter a brincadeira familiar.", [ball])],
  "15 a 17 meses": [r("Separe dois objetos conhecidos da criança.", ["Dois objetos familiares grandes"]), r("Monte um trajeto curto, sem obstáculo solto.", ["Dois objetos familiares grandes", bowl, floor]), r("Separe a bola e a cesta para guardar.", [ball, bowl])],
  "18 a 23 meses": [r("Use o boneco real e um convite sem pressão.", [doll]), r("Separe boneco, colher grande e banco baixo estável.", [doll, "Colher grande sem ponta e banco baixo estável", floor]), r("Deixe o boneco e a colher à vista, sem dar a resposta.", [doll, "Colher grande sem ponta"])],
  "2 anos": [r("Use bloco real como previsto; alvo na tela é só apoio para olhar.", [toy], "face"), r("A coordenação pedida precisa de objetos reais e área livre.", ["Caixa leve e blocos grandes", ball, floor]), r("Use a caixa e os blocos se quiser observar a entrega de verdade.", ["Caixa leve e blocos grandes"], "twoPlaces")],
  "3 anos": [r("O copo real facilita mover o alvo lateral. A figura não mede amplitude.", ["Copo grande e leve"], "face"), r("Confira mesa estável, copos grandes e piso livre.", ["Copos grandes e mesa estável", floor]), r("A cena ilustra o convite; piquenique manipulado pede os objetos.", [doll, "Copos e pratos grandes"], "everyday")],
  "4 anos": [r("O cartão é estático. Para movimentar o alvo, use um objeto em mãos.", [target], "face"), r("Use linha no piso e proteção conforme a avaliação, nunca o traço do tablet como linha física.", ["Marca firme no piso", floor]), r("Mostre as figuras apenas para iniciar a conversa, sem sugerir uma resposta.", [], "story")],
  "5 anos": [r("Separe um alvo e as marcas reais para apontar a próxima posição.", [target, "Duas marcas firmes no piso"], "face"), r("Prepare o percurso físico e combinação de sinais; não peça salto sem segurança.", ["Duas marcas firmes no piso", floor]), r("Combine o sinal e mostre a proposta visual só se ajudar a entender.", [], "turn")],
  "6 a 8 anos": [r("Figuras não substituem acuidade monocular. Use instrumentos adequados quando essa for a pergunta.", [acuity], "face"), r("Prepare um percurso livre e mesa firme; o mapa pode ser feito na tela.", [floor, "Mesa estável"], "routes"), r("Mostre as figuras e feche antes de pedir evocação; use itens do percurso se preferir.", [], "recall")],
  "9 a 11 anos": [r("Use oclusão e material apropriados para acuidade. O alvo visual é só auxiliar.", [acuity], "face"), r("A marcha e coordenação exigem espaço livre e proteção.", [floor]), r("Convide a explicar um jogo familiar; as figuras são apoio opcional.", [], "school")],
  "12 a 14 anos": [r("Mova o alvo manual para testar posições; a frase pode ser apresentada no app.", [target], "instruction"), r("Prepare o espaço e proteção de marcha antes de pedir giros.", [floor]), r("Prepare privacidade; a pessoa pode usar fala, escrita ou outro meio.", ["Ambiente que permita conversa reservada"], "ways")],
  "15 a 17 anos": [r("Separe os instrumentos e estímulo manual necessários ao exame dirigido.", [target, light]), r("Prepare maca ou cadeira e espaço seguro para a marcha comparativa.", ["Cadeira ou maca estável", floor]), r("O roteiro é clínico e privado; não coloque relatos íntimos em prancha de estímulo.", ["Ambiente que permita conversa reservada"], "ways")],
  "18 a 19 anos": [r("Use texto de apoio se ajudar a conversar; escolha instrumentos pela queixa.", [target, light], "instruction"), r("Mantenha cadeira estável, piso livre e proteção quando necessária.", ["Cadeira ou maca estável", floor]), r("Ofereça modo de resposta e conversa reservada, sem roteiro automático de interpretação.", ["Ambiente que permita conversa reservada"], "ways")],
};

export const assistantExamResources: Record<string, ExamResource[]> = Object.fromEntries(
  Object.entries(examExamples).map(([age, items]) => [age, items.map((item, index) =>
    ({ ...assistantSpecs[age][index], title: item.title }))]),
);

export const medicalExamResources: Record<string, ExamResource[]> = Object.fromEntries(
  examBands.map(({ age, steps }, index) => {
    const specs = [...medicalSpecs[age], ...(index < 5 ? infant : index < 12 ? play : older)];
    return [age, steps.map((step, position) => ({ ...specs[position], title: step.title }))];
  }),
);

export function materialChecklist(activities: readonly ExamResource[]): string[] {
  return [...new Set(activities.flatMap(activity => activity.materials))];
}
