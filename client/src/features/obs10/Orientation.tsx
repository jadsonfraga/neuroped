import { useState } from "react";
import { BookOpen, CalendarDays, HelpCircle, ListChecks, Users } from "lucide-react";
import { OUTCOMES } from "./protocol";
import { monthsBetween } from "./session";

/** End-to-end orientation for an adult applying the sheet for the first time. Screen and room side by side; no clinical judgement. */
export const FIRST_TIME_STEPS = [
  { key: "setup", title: "Antes de chamar a criança", screen: "Preencha a idade no bloco 1; a ficha certa aparece sozinha. Confira o kit item a item e use Imprimir roteiro completo da ficha para ler ao lado da câmera.", room: "Separe os materiais numa mesa baixa, fixe o celular na horizontal e deixe uma cadeira para o responsável ao lado da criança. Sala silenciosa, sem tela ligada." },
  { key: "setup", title: "Contexto e segurança", screen: "No bloco 2, informe código sem nome, escolaridade, apoios, condições do dia e o relato do responsável. No bloco 3, marque as seis confirmações.", room: "Pergunte ao responsável como a criança dormiu, se comeu, se tomou remédio e o que a família nota. Explique que vai filmar para o médico e que pode parar a qualquer momento." },
  { key: "running", title: "Iniciar", screen: "Quando a lista de prontidão ficar toda verde, toque em Iniciar aplicação. O cronômetro começa na hora e não pausa.", room: "Diga a frase de acolhimento à criança e a orientação ao responsável, ambas escritas logo abaixo do botão de início." },
  { key: "running", title: "Durante os dez minutos", screen: "Siga os seis blocos na ordem. Em cada cartão: leia o comando destacado, faça os passos numerados, toque no botão que descreve o que a criança fez e passe à próxima tarefa ou bloco.", room: "Fale o comando uma vez, espere cerca de cinco segundos, repita uma única vez. Não ensine nem corrija. Se a criança recusar, marque Recusou e siga em frente." },
  { key: "review", title: "Encerrar", screen: "O aplicativo encerra sozinho aos dez minutos. Use Encerrar antes se a criança cansar ou recusar tudo. Interromper e chamar médico é para urgência. Sair desta aba também encerra a coleta.", room: "Agradeça a criança, devolva o objeto de conforto e avise o responsável que a parte filmada terminou." },
  { key: "deliver", title: "Depois", screen: "Descreva literalmente o que a criança fez em cada tarefa marcada, exporte TXT e JSON, salve o vídeo, gere o dossiê se a clínica autorizar e marque as conferências. A lista O que fazer agora mostra a ordem; só depois use Nova aplicação.", room: "Guarde os arquivos no destino institucional. Nada fica no aplicativo depois de fechar ou recarregar a página." },
] as const;
export const TROUBLE = [
  ["A criança chora ou recusa tudo", "Não force. Marque Recusou nas tarefas propostas, encerre antes e registre o que viu. Recusa não é resultado."],
  ["Queda, crise, mal-estar ou relato sensível", "Toque em Interromper e chamar médico. A coleta encerra e a tela mostra o que fazer."],
  ["A página recarregou ou a aba fechou", "Os dados desta tela foram perdidos. Refaça a preparação somente se a criança ainda estiver disposta; senão, avise o médico."],
  ["O celular ficou sem espaço ou a câmera falhou", "Continue anotando na tela. Registre na exportação que o vídeo não existe; nunca refaça tarefas para filmar de novo."],
] as const;
export function FirstTimeGuide() {
  return <details className="obs10-first-time obs10-no-print" data-testid="obs10-first-time" open>
    <summary><BookOpen size={18} aria-hidden="true" /> Primeira vez aplicando? Leia isto antes de começar · três minutos</summary>
    <p>Você vai propor brincadeiras e pequenos movimentos a uma criança por até dez minutos, filmar e anotar o que ela fez. Você não avalia nem conclui nada: o médico interpreta. Tudo o que precisa está nesta página, de cima para baixo.</p>
    <ol className="obs10-first-steps">{FIRST_TIME_STEPS.map((step, index) => <li key={step.title}><strong>{index + 1}. {step.title}</strong><p><span>Na tela</span>{step.screen}</p><p><span>Na sala</span>{step.room}</p></li>)}</ol>
    <h2 className="obs10-subtitle"><HelpCircle size={16} aria-hidden="true" /> Se algo der errado</h2>
    <dl className="obs10-trouble">{TROUBLE.map(([problem, action]) => <div key={problem}><dt>{problem}</dt><dd>{action}</dd></div>)}</dl>
  </details>;
}

export const CHILD_PHRASE = "Vamos fazer algumas brincadeiras e movimentos para o médico conhecer seu jeito de fazer as coisas. Você pode pedir ajuda ou parar.";
export const CAREGIVER_BRIEFING = "Vou propor brincadeiras e movimentos por uns dez minutos e filmar para o médico ver depois. Fique perto, mas deixe a criança tentar sozinha: não dê dicas nem respostas. Se ela ficar desconfortável ou você quiser parar, é só me avisar. Isso não é prova nem nota.";
export function OpeningScripts() {
  return <div className="obs10-scripts" data-testid="obs10-scripts">
    <div className="obs10-kind"><Users size={18} aria-hidden="true" /><p><strong>Diga ao responsável, antes de iniciar:</strong> “{CAREGIVER_BRIEFING}”</p></div>
    <div className="obs10-kind"><p><strong>Diga à criança, ao iniciar:</strong> “{CHILD_PHRASE}”</p></div>
  </div>;
}

/** Optional helper: computes completed years and months from two dates; the dates are discarded after filling the fields. */
export function AgeFromBirthDate({ onFill, disabled }: { onFill: (years: string, months: string) => void; disabled: boolean }) {
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const [birth, setBirth] = useState("");
  const [reference, setReference] = useState(today);
  const [status, setStatus] = useState("");
  const months = monthsBetween(birth, reference);
  function fill() {
    if (months === null || months > 17 * 12 + 11) { setStatus("Confira as datas: a aplicação precisa ser depois do nascimento e a idade, de 0 a 17 anos."); return; }
    onFill(String(Math.floor(months / 12)), String(months % 12));
    setBirth(""); setStatus(`Preenchido: ${Math.floor(months / 12)} ano(s) e ${months % 12} mês(es). A data de nascimento foi apagada desta tela.`);
  }
  return <details className="obs10-age-helper" data-testid="obs10-age-helper">
    <summary><CalendarDays size={16} aria-hidden="true" /> Calcular pela data de nascimento</summary>
    <p className="obs10-muted">As datas servem só para a conta; não ficam no registro nem na exportação. Só anos e meses entram.</p>
    <div className="obs10-fields">
      <label>Data de nascimento<input type="date" value={birth} disabled={disabled} onChange={(e) => { setBirth(e.target.value); setStatus(""); }} /></label>
      <label>Data da aplicação<input type="date" value={reference} disabled={disabled} onChange={(e) => { setReference(e.target.value); setStatus(""); }} /></label>
    </div>
    <button type="button" disabled={disabled || months === null} onClick={fill}>Preencher anos e meses</button>
    <p role="status">{status}</p>
  </details>;
}

/** What the screen does during the timed collection, plus the meaning of each response button. */
export function LiveHelp() {
  return <details className="obs10-live-help obs10-no-print" data-testid="obs10-live-help">
    <summary><HelpCircle size={16} aria-hidden="true" /> Primeira vez nesta tela? O que cada coisa faz</summary>
    <ul>
      <li><strong>Cronômetro:</strong> conta até 10:00 sem pausa e encerra a coleta sozinho. Fica vermelho nos últimos 90 segundos.</li>
      <li><strong>Seis blocos:</strong> a ordem e a janela de tempo são sugestões. O aviso amarelo indica o bloco previsto para o momento; troque quando terminar a tentativa em curso.</li>
      <li><strong>Cartão da tarefa:</strong> comando em destaque, passos numerados, o que registrar e os botões de resposta. Marque o botão e siga; a descrição literal é escrita depois, no painel ao lado.</li>
      <li><strong>Encerrar antes:</strong> termina a coleta quando a criança cansa ou recusa. <strong>Interromper e chamar médico:</strong> só em urgência.</li>
      <li><strong>Sair desta aba,</strong> trocar de aplicativo ou bloquear a tela encerra a coleta. Filmagem externa fica em outro dispositivo.</li>
    </ul>
    <h2 className="obs10-subtitle">O que significa cada botão de resposta</h2>
    <dl className="obs10-legend">{OUTCOMES.map((outcome) => <div key={outcome.id}><dt>{outcome.label}</dt><dd>{outcome.description}</dd></div>)}</dl>
  </details>;
}

export interface NextStep { label: string; detail: string; target: string; done?: boolean }

export interface VideoDeliveryState {
  integratedRecordingAvailable: boolean;
  integratedRecordingConfirmedSaved: boolean;
  externalClipConfirmed: boolean;
  externalRecordingConfirmedSaved: boolean;
  unavailableDocumented: boolean;
}
/**
 * A clip associated in the evidence panel must never stand in for saving a recording created by the integrated recorder.
 * When the integrated recorder produced a file, that exact file has precedence and requires an explicit storage confirmation.
 * External files may resolve the step only when there is no integrated recording to preserve.
 */
export function videoDeliveryDone(state: VideoDeliveryState): boolean {
  if (state.integratedRecordingAvailable) return state.integratedRecordingConfirmedSaved;
  return state.externalClipConfirmed || state.externalRecordingConfirmedSaved || state.unavailableDocumented;
}
/**
 * Each flag must be something the screen actually witnessed or the operator explicitly confirmed.
 * Artifact freshness is evaluated per artifact: a later change only invalidates outputs whose generated text changed.
 */
export function nextSteps(state: { described: boolean; reviewed: boolean; exported: boolean; video: boolean; dossier: boolean; declared: boolean }): NextStep[] {
  return [
    { label: "Descreva o que a criança fez em cada tarefa marcada", detail: "Bloco a bloco, com as palavras e ações observadas. Não escreva “normal” nem complete por suposição.", target: ".obs10-records", done: state.described },
    { label: "Confira as pendências e os cartões sem marcação", detail: "Abra a revisão por bloco e declare lá que conferiu. Ausência de pendência automática não é a mesma coisa que ter revisado.", target: '[data-testid="obs10-review-board"]', done: state.reviewed },
    { label: "Exporte ou reexporte o registro TXT e o JSON atuais", detail: "Guarde os dois no destino institucional. Depois de qualquer conferência ou declaração, reexporte para registrar a versão final.", target: ".obs10-delivery", done: state.exported },
    { label: "Resolva o vídeo separado do registro", detail: "Gravação deste dispositivo: salve e confirme o arquivo no armazenamento institucional. Filmagem externa: confirme o fluxo institucional ou documente a indisponibilidade. O JSON não contém vídeo.", target: ".obs10-delivery", done: state.video },
    { label: "Gere o dossiê, se a clínica autorizar análise externa", detail: "Copie ou baixe e cole junto da lei PRÉ na ferramenta autorizada. Este aplicativo não envia nada.", target: '[data-testid="obs10-dossier"]', done: state.dossier },
    { label: "Marque as conferências e declare o encaminhamento", detail: "A conclusão final só permanece registrada quando o TXT/JSON atual contém a declaração. Depois de declarar, reexporte se necessário.", target: '[data-testid="obs10-review-board"]', done: state.declared },
  ];
}
export function NextSteps({ steps }: { steps: NextStep[] }) {
  const pending = steps.filter((step) => !step.done).length;
  return <section className="obs10-next obs10-no-print" data-testid="obs10-next-steps" aria-labelledby="obs10-next-title">
    <h2 id="obs10-next-title"><ListChecks size={20} aria-hidden="true" /> O que fazer agora, nesta ordem</h2>
    <p className="obs10-muted" role="status">{pending ? `${pending} passo(s) ainda sem conclusão registrada nesta tela.` : "Todos os passos desta tela têm conclusão registrada. Guarde os arquivos antes de sair."}</p>
    <ol className="obs10-next-list">{steps.map((step, index) => <li key={step.label} className={step.done ? "is-done" : ""}>
      <span aria-hidden="true">{step.done ? "✓" : index + 1}</span>
      <div><strong>{step.label}</strong><span className="sr-only">{step.done ? " · concluído" : " · pendente"}</span><small>{step.detail}</small></div>
      <button type="button" onClick={() => document.querySelector(step.target)?.scrollIntoView({ block: "start", behavior: "auto" })}>Abrir</button>
    </li>)}</ol>
  </section>;
}
