import { useRef, useState, type ReactNode } from "react";
import { AGE_BANDS, OUTCOMES, PHASES, type AgeBand, type Outcome } from "./protocol";
import { KITS, MATERIALS, PRACTICAL_TASKS, taskOmission, type MaterialId, type PracticalTask } from "./practical";
import { MaterialPicture, TaskPicture } from "./PracticalVisuals";
import type { Observation } from "./session";

export type KitState = Partial<Record<MaterialId, "ready" | "missing">>;
export function completeKit(bandId: string, state: KitState): boolean {
  return Boolean(KITS[bandId]?.every((item) => state[item.id] === "ready" || state[item.id] === "missing"));
}
export function missingForTask(task: PracticalTask, kit: KitState): string | null {
  const missing = task.materials.filter((id) => kit[id] === "missing").map((id) => MATERIALS[id].label);
  return missing.length ? `Material ausente, sem substituto seguro: ${missing.join(", ")}. Omitir esta tarefa.` : null;
}
function printVisualKit(root: HTMLElement, title: string): boolean {
  const target = window.open("", "_blank");
  if (!target) return false;
  target.opener = null;
  target.document.title = title;
  target.document.documentElement.lang = "pt-BR";
  const style = target.document.createElement("style");
  style.textContent = "@page{size:A4;margin:15mm}body{font:11pt/1.5 Arial;color:CanvasText;background:Canvas}button,input,.obs10-kit-actions{display:none!important}h2{font-size:18pt}.obs10-kit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.obs10-material{border:1px solid GrayText;border-radius:12px;padding:12px;break-inside:avoid}.obs10-material svg{width:100%;height:80px}.obs10-material p{font-size:9pt}svg{max-width:100%;height:140px}details>summary{display:none}details>*{display:block}.obs10-print-cards{break-before:page;display:grid;gap:24px}.obs10-print-cards>div{border:1px solid GrayText;min-height:240px;display:grid;place-items:center}.obs10-print-cards svg{width:90%;height:220px}";
  target.document.head.appendChild(style);
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("button, input").forEach((node) => node.remove());
  clone.querySelectorAll("details").forEach((node) => { node.open = true; });
  // Static SVGs use the existing app tokens. Copy only these colors, never user HTML.
  const printTokens: Record<string, string> = {
    "--o-ink": "CanvasText", "--o-paper": "Canvas", "--o-primary": "CanvasText",
    "--o-lilac": "color-mix(in srgb, CanvasText 9%, Canvas)",
    "--o-mint": "color-mix(in srgb, CanvasText 5%, Canvas)",
    "--o-cream": "color-mix(in srgb, CanvasText 15%, Canvas)",
  };
  for (const [name, value] of Object.entries(printTokens)) target.document.documentElement.style.setProperty(name, value);
  target.document.body.appendChild(clone);
  target.focus();
  window.setTimeout(() => target.print(), 100);
  return true;
}
export function PracticalMaterials({ actualBand, previewId, onPreview, state, onState, children, locked = false }: {
  actualBand?: AgeBand; previewId: string | null; onPreview: (id: string | null) => void;
  state: KitState; onState: (state: KitState) => void; children: ReactNode; locked?: boolean;
}) {
  const band = AGE_BANDS.find((item) => item.id === previewId) ?? actualBand ?? AGE_BANDS[0];
  const isActual = actualBand?.id === band.id;
  const root = useRef<HTMLDivElement>(null);
  const [printError, setPrintError] = useState("");
  const items = KITS[band.id];
  return <section className="obs10-panel obs10-materials-first obs10-no-print" data-testid="obs10-materials-first">
    <div className="obs10-section-title"><div><div className="obs10-eyebrow">ANTES DA CRIANÇA CHEGAR</div><h2>1. Idade e materiais: separe este kit</h2></div><span className="obs10-chip">Preparação fora do cronômetro</span></div>
    {children}
    <details className="obs10-browse"><summary>Consultar material por faixa etária</summary><div className="obs10-age-tabs" aria-label="Consultar kits por faixa etária">{AGE_BANDS.map((item) => <button key={item.id} type="button" aria-pressed={item.id === band.id} disabled={locked} onClick={() => onPreview(item.id)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}</div><p>Consultar outra faixa não muda a idade da aplicação.</p></details>
    {!isActual && <p className="obs10-caution">Consulta do kit de <strong>{band.label}</strong>. {actualBand ? <>A ficha da criança continua <strong>{actualBand.label}</strong>. <button type="button" onClick={() => onPreview(null)}>Voltar ao kit da criança</button></> : "Preencha a idade acima para selecionar a ficha da criança e conferir seus materiais."}</p>}
    <div ref={root} className="obs10-printable-kit">
      <h3>{band.icon} Kit de {band.label}</h3>
      <p className="obs10-muted">Quantidades para organizar a sala, não critérios de avaliação. Higienize entre crianças. Nunca usar peças pequenas, alimentos ou vidro.</p>
      <fieldset disabled={locked} className="obs10-kit-grid">{items.map(({ id, quantity }) => <article className="obs10-material" key={id} data-material={id}>
        <MaterialPicture id={id} label={`Material: ${MATERIALS[id].label}`} />
        <div><strong>{MATERIALS[id].label}</strong><span className="obs10-quantity">{quantity ?? MATERIALS[id].quantity}</span><p>{MATERIALS[id].detail}</p><details><summary>Substituto seguro</summary><p>{MATERIALS[id].substitute}</p></details></div>
        {isActual && <div className="obs10-kit-actions" role="group" aria-label={`Conferência de ${MATERIALS[id].label}`}><button type="button" aria-pressed={state[id] === "ready"} onClick={() => onState({ ...state, [id]: "ready" })}>Separado / substituído</button><button type="button" aria-pressed={state[id] === "missing"} onClick={() => onState({ ...state, [id]: "missing" })}>Ausente</button></div>}
      </article>)}</fieldset>
      <details className="obs10-scenes"><summary>Cenas simples para imprimir antes da consulta</summary><p>Alternativa ao livro. Escolha a cena antes. Mostre apenas o desenho, sem legenda ou resposta. Não são estímulos padronizados. Não usar estas figuras para ensinar respostas de memória.</p><div className="obs10-print-cards"><div><TaskPicture scene="picture-play" label="Cena A para apontar ou descrever" /></div><div><TaskPicture scene="picture-eat" label="Cena B para apontar ou descrever" /></div><div><TaskPicture scene="picture-cat" label="Cena C para apontar ou descrever" /></div></div></details>
    </div>
    <div className="obs10-actions">
      <button type="button" className="obs10-secondary" disabled={!isActual || locked} onClick={() => onState(Object.fromEntries(items.map((item) => [item.id, "ready"])) as KitState)}>Separei o kit completo</button>
      <button type="button" disabled={locked} onClick={() => { if (root.current && !printVisualKit(root.current, `OBS-10 — kit ${band.label}`)) setPrintError("O navegador bloqueou a janela de impressão. Permita pop-ups para este aplicativo e tente novamente."); }}>Imprimir kit e cenas</button>
    </div>
    {isActual && <p className="obs10-kit-status" role="status">{items.filter((item) => state[item.id]).length}/{items.length} itens conferidos. {items.some((item) => state[item.id] === "missing") ? "Tarefas que dependem dos itens ausentes serão sinalizadas para omissão; não improvise material inseguro." : "Marque ‘separado’ também quando usar o substituto seguro. Descreva a troca em adaptações."}</p>}
    {printError && <p role="alert" className="obs10-error">{printError}</p>}
  </section>;
}
export function FramingGuide() {
  return <section className="obs10-framing"><h3>Onde colocar a câmera</h3><div className="obs10-framing-grid">
    <figure><TaskPicture scene="frame-face" label="Enquadramento da interação: rosto, mãos e interlocutor" /><figcaption><strong>Conversar</strong>Rosto, mãos e interlocutor. Ouvir as duas vozes.</figcaption></figure>
    <figure><TaskPicture scene="frame-body" label="Enquadramento motor: corpo inteiro e pés com cuidador perto" /><figcaption><strong>Movimentar</strong>Corpo inteiro e pés. Cuidador ao alcance.</figcaption></figure>
    <figure><TaskPicture scene="frame-hands" label="Enquadramento de mesa: as duas mãos e a folha por cima e de lado" /><figcaption><strong>Desenhar</strong>Duas mãos, lápis e folha. Não encobrir a execução.</figcaption></figure>
  </div><p className="obs10-muted">Desenhos esquemáticos para a aplicadora, não modelos a imitar. Mantenha esta tela fora da visão da criança nas tarefas de memória e regras.</p></section>;
}
const QUICK_LABELS: Record<Outcome, string> = { E: "Na proposta inicial", V: "Após repetição", M: "Após gesto/modelo", A: "Com apoio habitual", ND: "Não demonstrado", R: "Recusou", NA: "Não aplicado" };
export function PracticalTaskGuide({ band, phase, months, proneAllowed, kit, observations, running, finished, onRecord, onNextPhase }: {
  band: AgeBand; phase: number; months: number; proneAllowed: boolean; kit: KitState; observations: Observation[];
  running: boolean; finished: boolean; onRecord: (task: PracticalTask, outcome: Outcome, reason: string) => void; onNextPhase: () => void;
}) {
  const tasks = PRACTICAL_TASKS[band.id].filter((task) => task.phase === phase);
  const [index, setIndex] = useState(0);
  const item = tasks[Math.min(index, tasks.length - 1)];
  const omission = taskOmission(item, months, proneAllowed) ?? missingForTask(item, kit);
  const current = observations.find((record) => record.id === `guided-${item.id}`);
  const heading = useRef<HTMLHeadingElement>(null);
  function move(next: number) { setIndex(next); window.setTimeout(() => heading.current?.focus(), 0); }
  return <div className="obs10-practical-task" data-testid="obs10-practical-task">
    <div className="obs10-task-position"><strong>Tarefa {Math.min(index, tasks.length - 1) + 1} de {tasks.length}</strong><span>Até {item.seconds}s nesta tarefa · sem obrigação de preencher</span></div>
    <h3 ref={heading} tabIndex={-1}>{item.title}</h3>
    <TaskPicture scene={item.scene} label={`Guia visual: ${item.title}`} />
    {omission ? <div className="obs10-caution" role="note"><strong>Não aplicar esta tarefa.</strong> {omission}<button type="button" onClick={() => onRecord(item, "NA", omission)}>Registrar omissão</button></div> : <>
      <div className="obs10-say"><span>DIGA / FAÇA</span><p>{item.say}</p></div>
      <ol className="obs10-microsteps">{item.steps.map((instruction, n) => <li key={instruction}><span>{n + 1}</span><p>{instruction}</p></li>)}</ol>
      {item.walking && <p className="obs10-caution">Marcha instável, dor, recusa ou falta de proteção/espaço seguro: não execute; registre a omissão. Preserve os apoios habituais.</p>}
      {item.model && <p className="obs10-model-note"><strong>Modelo previsto:</strong> demonstrar faz parte da proposta desta tarefa. Não chame uma cópia após modelo de produção espontânea; registre ajuda extra separadamente.</p>}
      <div className="obs10-record-tip"><strong>O que registrar</strong><p>{item.record}</p></div>
      <div className="obs10-quick-responses" role="group" aria-label="Registro rápido desta tarefa">{OUTCOMES.map((option) => <button type="button" key={option.id} aria-pressed={current?.outcome === option.id} disabled={!running && !finished} onClick={() => onRecord(item, option.id, "")}>{QUICK_LABELS[option.id]}</button>)}</div>
    </>}
    <p className="obs10-muted">{finished ? "Registro posterior: só anote o que já ocorreu; não aplique novas tarefas." : "Durante a coleta, marque a categoria. Complete a descrição literal depois, sem inventar detalhes."} Categoria marcada não cria achado clínico automaticamente.</p>
    {current && <p className="obs10-response-saved" role="status">✓ {QUICK_LABELS[current.outcome as Outcome] ?? "Registro aberto"} · salvo apenas nesta tela.{!current.response && " Falta detalhar o fato observado."}</p>}
    <div className="obs10-actions"><button type="button" disabled={index === 0} onClick={() => move(index - 1)}>Tarefa anterior</button>{index + 1 < tasks.length ? <button type="button" className="obs10-primary" onClick={() => move(index + 1)}>Próxima tarefa</button> : <button type="button" className="obs10-secondary" disabled={phase === PHASES.length - 1} onClick={onNextPhase}>Próximo bloco</button>}</div>
    <details><summary>Ver todas as tarefas deste bloco</summary><div className="obs10-task-links">{tasks.map((task, n) => <button type="button" key={task.id} aria-pressed={index === n} onClick={() => move(n)}>{n + 1}. {task.title}</button>)}</div></details>
  </div>;
}
const REHEARSAL = [
  { question: "A criança só fez depois de ouvir o comando novamente.", answer: "V", explanation: "Registre ‘após repetição’ e a resposta literal. Isso, sozinho, não demonstra desatenção." },
  { question: "Ela não quis desenhar e afastou a folha.", answer: "R", explanation: "Registre recusa. Não transforme ‘não quis’ em ‘não sabe’." },
  { question: "A câmera cortou os pés na caminhada.", answer: "NA", explanation: "Esse aspecto não é avaliável no trecho. Não escrever ‘marcha normal’." },
] as const;
export function OperatorRehearsal() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  return <details className="obs10-rehearsal"><summary>Treinar o registro sem criança nem câmera</summary><p>Três exemplos fictícios. Não substitui treinamento supervisionado com o médico.</p>{REHEARSAL.map((case_, i) => <fieldset key={case_.question}><legend>{i + 1}. {case_.question}</legend><div className="obs10-actions">{(["V", "R", "NA"] as const).map((value) => <button type="button" key={value} aria-pressed={answers[i] === value} onClick={() => setAnswers((current) => ({ ...current, [i]: value }))}>{QUICK_LABELS[value]}</button>)}</div>{answers[i] && <p role="status">{answers[i] === case_.answer ? "✓ " : "Revise: "}{case_.explanation}</p>}</fieldset>)}</details>;
}
