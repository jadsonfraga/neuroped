import { useRef, useState } from "react";
import { MaterialPicture, TaskPicture } from "./PracticalVisuals";
import { framePlan, preparationsForBand, type ChildResource, type PaperModel, type PrintableScene } from "./framePlan";
import type { MaterialId, PracticalTask } from "./practical";
import { GUIDED_STYLE } from "./guidedStyle";

/** Prints only the allowlisted resource node: no answer, command, patient data or application chrome. */
export function printChildResource(node: HTMLElement, enabled: boolean): boolean {
  if (!enabled) return false;
  const page = window.open("", "_blank");
  if (!page) return false;
  page.opener = null;
  page.document.documentElement.lang = "pt-BR";
  page.document.title = "OBS-10 — recurso da criança";
  const style = page.document.createElement("style");
  style.textContent = "@page{size:A4;margin:20mm}body{font:24pt/1.8 Arial;color:CanvasText;background:Canvas;margin:0;overflow-wrap:anywhere}svg{display:block;width:100%;height:auto;max-height:230mm}p{white-space:pre-wrap}*{box-sizing:border-box}:root{--o-ink:CanvasText;--o-paper:Canvas;--o-primary:CanvasText;--o-lilac:color-mix(in srgb,CanvasText 10%,Canvas);--o-mint:color-mix(in srgb,CanvasText 6%,Canvas);--o-cream:color-mix(in srgb,CanvasText 15%,Canvas)}";
  page.document.head.appendChild(style);
  const copy = node.cloneNode(true) as HTMLElement;
  copy.removeAttribute("class");
  copy.removeAttribute("data-testid");
  page.document.body.appendChild(copy);
  page.focus();
  page.setTimeout(() => page.print(), 100);
  return true;
}
function SceneResource({ scene, printable }: { scene: PrintableScene; printable: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const label = scene === "picture-play" ? "A" : scene === "picture-eat" ? "B" : "C";
  return <div className="obs10-print-resource" data-resource-scene={scene}>
    <strong>Cena {label} · preparar em papel</strong>
    <div ref={root} data-testid="obs10-child-resource"><TaskPicture scene={scene} label="Cena para observar e descrever" /></div>
    {printable && <button type="button" onClick={() => { if (root.current && !printChildResource(root.current, printable)) setError("A impressão não abriu. Libere a janela de impressão ou use a página de um livro com cena simples."); }}>Imprimir somente a cena {label}</button>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
export function ChildPrintout({ resource, printable }: { resource: ChildResource; printable: boolean }) {
  const root = useRef<HTMLParagraphElement>(null);
  const [error, setError] = useState("");
  return <div data-testid="obs10-child-printout">
    <p><strong>Recurso da criança, separado do guia.</strong> {resource.instruction}</p>
    {resource.kind === "scene" ? resource.scenes.map((scene) => <SceneResource key={scene} scene={scene} printable={printable} />) : <div className="obs10-print-resource">
      <p ref={root} className="obs10-reading-resource" data-testid="obs10-child-resource">{resource.text}</p>
      {printable && <button type="button" onClick={() => { if (root.current && !printChildResource(root.current, printable)) setError("A impressão não abriu. Escreva somente o texto acima em uma folha separada antes da coleta."); }}>Imprimir somente o texto de leitura</button>}
      {error && <p role="alert">{error}</p>}
    </div>}
    {!printable && <p className="obs10-caution">Use o recurso separado antes do início. Não abra impressão, outra aba ou outro aplicativo durante a coleta. Esta tela continua sendo da aplicadora.</p>}
  </div>;
}
export function ModelOnPaper({ model }: { model: PaperModel }) {
  return <div className="obs10-print-resource" data-testid="obs10-model-on-paper">
    <strong>Faça o modelo na SUA folha: {model}.</strong>
    <svg className="obs10-paper-model" viewBox="0 0 160 100" role="img" aria-label={`Orientação da aplicadora: desenhar ${model} em papel`}>
      <g fill="none" stroke="currentColor" strokeWidth="3">{model === "círculo" ? <circle cx="80" cy="50" r="30" /> : model === "cruz" ? <path d="M80 18v64M48 50h64" /> : <rect x="50" y="20" width="60" height="60" />}</g>
    </svg>
    <p>Depois ofereça outra folha à criança. Esta imagem orienta você; não substitui a demonstração em papel. Não desenhe na folha da criança nem corrija o traçado.</p>
  </div>;
}
export function TaskResources({ task, bandId, kit }: { task: PracticalTask; bandId: string; kit: Partial<Record<MaterialId, "ready" | "missing">> }) {
  const plan = framePlan(task, bandId);
  return <section className="obs10-frame-section" aria-label="Materiais desta tarefa" data-testid="obs10-frame-resources">
    <div className="obs10-frame-section-title"><span aria-hidden="true">1</span>Pegue e prepare</div>
    {plan.materials.length ? <div className="obs10-frame-materials">{plan.materials.map((material) => <article className="obs10-frame-material" key={material.id} data-task-material={material.id}>
      <MaterialPicture id={material.id} label={`Objeto físico: ${material.label}`} />
      <strong>{material.label}</strong><span className="obs10-quantity">{material.quantity}</span>
      {kit[material.id] === "missing" && <p><strong>Ausente na preparação. Não improvise.</strong></p>}
      <details><summary>Como preparar e substituir com segurança</summary><p>{material.detail}</p><p><strong>Substituto:</strong> {material.substitute}</p>{material.id === "book" && <p>Uma cena impressa substitui somente apontar/descrever figuras. Para folhear ou virar páginas, é necessário livro físico.</p>}</details>
    </article>)}</div> : <p>Não precisa pegar um objeto para esta proposta. Siga a interação ou o movimento descrito abaixo.</p>}
    {plan.furniture && <p>{plan.furniture}</p>}
    <p className="obs10-frame-camera"><strong>Câmera:</strong> {plan.camera}</p>
    {plan.child && <details><summary>Ver o recurso desta tarefa que deve estar separado</summary><ChildPrintout resource={plan.child} printable={false} /></details>}
    {plan.model && <ModelOnPaper model={plan.model} />}
    {task.title === "Folheie o livro" && <p className="obs10-caution"><strong>Livro físico obrigatório nesta tarefa.</strong> Cenas avulsas e tela não permitem observar o ato de virar páginas.</p>}
  </section>;
}
export function PreparationResources({ bandId, locked }: { bandId: string; locked: boolean }) {
  const resources = preparationsForBand(bandId);
  return <section className="obs10-integrated-preparation" data-testid="obs10-integrated-preparation" aria-label="O que o aplicativo fornece e o que separar">
    <style>{GUIDED_STYLE}</style>
    <h3>Antes de começar: o que está aqui e o que pegar na sala</h3>
    <div className="obs10-resource-legend">
      <div><strong>Já está no aplicativo</strong><p>Comando, passo a passo, ilustração da aplicadora, cronômetro e registro. Você não precisa procurar outro manual.</p></div>
      <div><strong>Prepare em papel, quando indicado</strong><p>As cenas e os textos desta faixa estão logo abaixo. Imprima só o recurso da criança, sem as instruções.</p></div>
      <div><strong>Pegue os objetos reais</strong><p>A lista do kit mostra o que buscar na sala. Desenhos de bola, boneco e blocos não substituem esses objetos.</p></div>
    </div>
    <p>Durante a aplicação, cada tarefa repetirá o que pegar, o que dizer, o que observar e onde registrar. As primeiras aplicações devem ser supervisionadas.</p>
    {resources.length ? resources.map(({ task, plan }) => <details key={task.id} data-preparation-task={task.id}>
      <summary>Preparar recurso: {task.title}</summary>
      {plan.child && <ChildPrintout resource={plan.child} printable={!locked} />}
      {plan.model && <ModelOnPaper model={plan.model} />}
    </details>) : <p><strong>Nesta faixa, não há cena ou texto de leitura a imprimir.</strong> Separe os objetos indicados no kit.</p>}
    <p className="obs10-caution">Memória, história e regra SOL/LUA são orais. Não entregue as respostas nem as ilustrações dessas tarefas à criança. Imprima antes do cronômetro.</p>
  </section>;
}
