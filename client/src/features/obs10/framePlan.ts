import { KITS, MATERIALS, PRACTICAL_TASKS, type MaterialId, type PracticalTask, type Scene } from "./practical";
import { PHASES } from "./protocol";

/** Presentation metadata only. Never changes commands, response categories or clinical interpretation. */
export const EXECUTION_GUIDE_REVISION = "2026-09-23";
export type PrintableScene = Extract<Scene, "picture-play" | "picture-eat" | "picture-cat">;
export type PaperModel = "círculo" | "cruz" | "quadrado";
export type ChildResource =
  | { kind: "scene"; scenes: readonly PrintableScene[]; instruction: string }
  | { kind: "reading"; text: string; instruction: string };
export interface PhysicalResource {
  id: MaterialId;
  label: string;
  quantity: string;
  detail: string;
  substitute: string;
}
export interface FramePlan {
  materials: PhysicalResource[];
  child: ChildResource | null;
  model: PaperModel | null;
  camera: string;
  furniture: string | null;
  adultOnly: string;
}
export const PRINTABLE_SCENES: readonly PrintableScene[] = ["picture-play", "picture-eat", "picture-cat"];
const SCENE_TASKS: Readonly<Record<string, readonly PrintableScene[]>> = {
  "m12-2-1": PRINTABLE_SCENES,
  "m24-2-0": ["picture-cat"],
  "y03-2-0": PRINTABLE_SCENES,
  "y04-2-0": PRINTABLE_SCENES,
};
function isReadingTask(task: PracticalTask, bandId: string): boolean {
  return (bandId === "y06" || bandId === "y09") && task.title === "Amostra de leitura e escrita";
}
function quantityFor(task: PracticalTask, id: MaterialId, bandId: string): string {
  if (id === "paper") {
    if (paperModel(task)) return "1 folha para o modelo + 1 em branco para a criança; 1 reserva";
    if (isReadingTask(task, bandId)) return "1 folha com o texto + 1 em branco para escrever; 1 reserva";
    return "1 folha em branco; mantenha as demais folhas do kit de reserva";
  }
  if (id === "target") return task.title === "Dois brinquedos, duas mãos" ? "2 brinquedos grandes" : "1 brinquedo grande";
  if (id === "blocks") {
    if (["Ofereça uma escolha", "Observe o deslocamento habitual", "Convide a pegar o brinquedo"].includes(task.title)) return "1 bloco grande";
    if (["Bater dois blocos", "Empilhar dois blocos", "Ofereça os dois blocos"].includes(task.title)) return "2 blocos grandes";
    if (task.title === "Separe objetos parecidos") return "4 blocos grandes, com cores para agrupar";
    if (task.title === "Conte objetos") return "5 blocos grandes";
    if (task.title === "Convide a colocar no recipiente" || task.title === "Comando de dois passos, aos 30 meses") return "1 bloco grande";
  }
  const kitEntry = KITS[bandId]?.find((entry) => entry.id === id);
  return kitEntry?.quantity ?? MATERIALS[id].quantity;
}
function paperModel(task: PracticalTask): PaperModel | null {
  if (!task.model) return null;
  if (task.title === "Copie um círculo após o modelo" || task.title === "Cópia de círculo") return "círculo";
  if (task.title === "Cópia de cruz") return "cruz";
  if (task.title === "Cópia de quadrado") return "quadrado";
  return null;
}
function paperDetail(task: PracticalTask, bandId: string): string {
  if (paperModel(task)) return "Faça o modelo somente na folha da aplicadora. A criança recebe outra folha em branco. Sem nome completo.";
  if (isReadingTask(task, bandId)) return "Prepare o texto indicado antes da coleta e mostre somente essa folha. Use outra folha em branco para a escrita, sem copiar uma resposta pronta.";
  return "Use papel em branco, sem letras, figuras, respostas ou nome completo. Siga apenas a proposta da tarefa; não forneça algo pronto para copiar.";
}
/** Only these picture/reading tasks can produce child-facing printouts. Memory, rules and story never can. */
export function framePlan(task: PracticalTask, bandId: string): FramePlan {
  let child: ChildResource | null = null;
  const scenes = SCENE_TASKS[task.id];
  if (scenes && task.materials.includes("book")) {
    child = { kind: "scene", scenes, instruction: "Mostre uma cena impressa ou a página escolhida do livro. Somente a imagem, sem legenda e sem ensinar a resposta." };
  } else if (isReadingTask(task, bandId)) {
    // The text is extracted from the actual task, not maintained as a second clinical authority.
    const text = task.steps[0]?.match(/[‘“]([^’”]+)[’”]/u)?.[1];
    if (text) child = { kind: "reading", text, instruction: "Mostre somente este texto em papel, se compatível com o ensino recebido. Não mostre os comandos nem o roteiro." };
  }
  const oralOnly = task.scene === "words" || task.scene === "rule";
  return {
    materials: task.materials.map((id) => ({ id, ...MATERIALS[id], quantity: quantityFor(task, id, bandId), detail: id === "paper" ? paperDetail(task, bandId) : MATERIALS[id].detail })),
    child,
    model: paperModel(task),
    camera: PHASES[task.phase].camera,
    furniture: /mesa|escrev|folha|desenh|rabis|lápis|giz/i.test([task.say, ...task.steps].join(" ")) ? "Use mesa ou superfície de apoio firme, acessível à criança, sem retirar seus apoios habituais." : null,
    adultOnly: oralOnly
      ? "Somente para quem aplica. Não mostre palavras, história, SOL/LUA ou esta ilustração à criança. A proposta é oral."
      : "Ilustração para quem aplica. Não é estímulo da criança e não substitui os objetos reais.",
  };
}
export function preparationsForBand(bandId: string): Array<{ task: PracticalTask; plan: FramePlan }> {
  return (PRACTICAL_TASKS[bandId] ?? []).map((task) => ({ task, plan: framePlan(task, bandId) })).filter(({ plan }) => plan.child || plan.model);
}
export function resourceIssues(): string[] {
  const issues: string[] = [];
  const all = Object.values(PRACTICAL_TASKS).flat();
  for (const id of Object.keys(SCENE_TASKS)) if (!all.some((task) => task.id === id && task.materials.includes("book"))) issues.push(`Cena sem tarefa de figura: ${id}`);
  for (const [bandId, tasks] of Object.entries(PRACTICAL_TASKS)) {
    for (const task of tasks) {
      const plan = framePlan(task, bandId);
      if (plan.materials.map((item) => item.id).join(",") !== task.materials.join(",")) issues.push(`Materiais divergentes: ${task.id}`);
      if ((task.scene === "words" || task.scene === "rule") && plan.child) issues.push(`Resposta exposta: ${task.id}`);
      if (task.title === "Folheie o livro" && plan.child) issues.push("Folhear exige livro físico, não cena avulsa");
      if (isReadingTask(task, bandId) && plan.child?.kind !== "reading") issues.push(`Texto de leitura ausente: ${task.id}`);
      if (!plan.camera || plan.materials.some((item) => !item.label || !item.quantity || !item.detail)) issues.push(`Recurso incompleto: ${task.id}`);
    }
  }
  return issues;
}
