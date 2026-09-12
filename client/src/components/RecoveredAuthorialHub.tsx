import { lazy, Suspense, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTHORIAL_NOTICE, recoveredAuthorialMonitors, unresolvedAuthorialSources, type RecoveredMonitor } from "@/data/recoveredAuthorialMonitors";
import { pendingAuthorialScaleIntakes } from "@/data/pendingAuthorialScaleIntake";
import { monitorWithClinicalDetails, schoolSupportOptions, supportResponseOptions } from "@/data/recoveredMonitorDetails";
import { calculateRecoveredMonitor, monitorComputedRows, monitorEligibility, monitorFocusOptions, monitorItemCount, monitorSafetyState, planRecoveredMonitors, type MonitorSelectionInput } from "@/lib/recoveredAuthorialLogic";
import { readRouteParam } from "@/lib/routeQuery";

const ClinicalReport = lazy(() => import("@/components/ClinicalReport").then((m) => ({ default: m.ClinicalReport })));
const SaveToPatient = lazy(() => import("@/components/SaveToPatient").then((m) => ({ default: m.SaveToPatient })));
const control = "min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm";
const box = "space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5";
const roleLabels: Record<string, string> = { pais: "Pais/cuidador", professor: "Professor/profissional escolar", clinico: "Profissional observador" };
const purposeLabels: Record<string, string> = { basal: "Basal funcional antes da consulta", seguimento: "Seguimento funcional" };
const safetyLabels: Record<string, string> = { nao: "Não identificado nesta janela", sim: "Presente", incerto: "Não sei informar" };
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function startOfWindow(end: string, days: number) { const d = new Date(`${end}T12:00:00Z`); if (!Number.isFinite(d.getTime())) return ""; d.setUTCDate(d.getUTCDate() - days + 1); return d.toISOString().slice(0, 10); }
function dateIsValid(value: string) { const d = new Date(`${value}T12:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value; }
function toggle(values: string[], value: string) { return values.includes(value) ? values.filter((v) => v !== value) : [...values, value]; }

export default function RecoveredAuthorialHub() {
  const [years, setYears] = useState(""); const [months, setMonths] = useState("0");
  const [respondent, setRespondent] = useState(""); const [contexts, setContexts] = useState<string[]>([]);
  const [purpose, setPurpose] = useState(""); const [focuses, setFocuses] = useState<string[]>([]);
  const [budget, setBudget] = useState(20); const [observed, setObserved] = useState(false);
  const [urgent, setUrgent] = useState(""); const [alreadySelected, setAlreadySelected] = useState<string[]>([]);
  const [active, setActive] = useState<{ definition: RecoveredMonitor; input: MonitorSelectionInput } | null>(null);
  const [requestedId] = useState(() => readRouteParam("instrumento"));
  const ageMonths = /^\d+$/.test(years) && /^\d+$/.test(months) && Number(months) <= 11 ? Number(years) * 12 + Number(months) : Number.NaN;
  const input: MonitorSelectionInput = { ageMonths, respondent, contexts, purpose, focuses, itemBudget: budget, observed, urgent, alreadySelected };
  const planned = planRecoveredMonitors(input);
  const requested = recoveredAuthorialMonitors.find((d) => d.id === requestedId);
  if (active) return <RecoveredQuestionnaire key={active.definition.id} definition={active.definition} input={active.input} onBack={() => {
    if (window.confirm("Voltar ao filtro e limpar esta aplicação? Confira antes se o registro já foi entregue ou salvo pela equipe.")) setActive(null);
  }} />;
  return <section data-testid="authorial-hub" className="mx-auto max-w-4xl space-y-5 pb-8">
    <header className={box}><p className="text-xs font-semibold text-primary">NeuroPed SDG · Reconciliação do acervo</p><h1 className="text-2xl font-bold">Escalas autorais · filtro inteligente</h1><p className="text-sm leading-6">Escolha o que precisa observar antes da consulta. Idade, observador, contexto e finalidade são obrigatórios. Não preenchemos a lista com escalas de outro assunto quando não há opção adequada.</p><p className="text-xs text-muted-foreground">{AUTHORIAL_NOTICE}</p>{requested && <p className="text-sm">Você abriu {requested.name}. Confirme o perfil abaixo; o link não dispensa o filtro.</p>}</header>
    <div className={box}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>Anos completos<Input id="authorial-years" inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)} /></label>
        <label>Meses adicionais (0–11)<Input id="authorial-months" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} /></label>
        <label>Quem responde?<select id="authorial-respondent" className={control} value={respondent} onChange={(e) => setRespondent(e.target.value)}><option value="">Selecione</option>{Object.entries(roleLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label>Finalidade<select id="authorial-purpose" className={control} value={purpose} onChange={(e) => setPurpose(e.target.value)}><option value="">Selecione</option>{Object.entries(purposeLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      </div>
      <fieldset><legend className="mb-2 font-semibold">Onde houve observação direta?</legend><div className="flex flex-wrap gap-4">{["casa", "escola", "terapia"].map((id) => <label key={id} className="flex min-h-11 items-center gap-2 capitalize"><input id={`authorial-context-${id}`} type="checkbox" checked={contexts.includes(id)} onChange={() => setContexts((v) => toggle(v, id))} />{id}</label>)}</div><p className="text-xs text-muted-foreground">Use um contexto por aplicação. A exceção é generalização, que requer observação em pelo menos dois ambientes pela mesma pessoa.</p></fieldset>
      <fieldset><legend className="mb-2 font-semibold">Até três prioridades, na ordem de importância</legend><div className="grid gap-2 sm:grid-cols-2">{monitorFocusOptions.map((f) => <button type="button" id={`authorial-focus-${f.id}`} key={f.id} aria-pressed={focuses.includes(f.id)} disabled={!focuses.includes(f.id) && focuses.length >= 3} onClick={() => setFocuses((v) => toggle(v, f.id))} className={`${control} text-left ${focuses.includes(f.id) ? "border-primary bg-primary/10" : ""}`}>{focuses.includes(f.id) && `${focuses.indexOf(f.id) + 1}. `}{f.label}</button>)}</div></fieldset>
      <label className="block">Carga máxima desta seleção<select id="authorial-budget" className={control} value={budget} onChange={(e) => setBudget(Number(e.target.value))}><option value={20}>Até 20 itens · um formulário</option><option value={40}>Até 40 itens · no máximo dois objetivos diferentes</option></select></label>
      <p className="text-xs text-muted-foreground">O teto é de itens pontuados; identificação, contexto e alertas exigem tempo adicional. Não há tempo de aplicação aferido para todo o acervo.</p>
      <label className="flex items-start gap-3 text-sm"><input id="authorial-observed" type="checkbox" checked={observed} onChange={(e) => setObserved(e.target.checked)} className="mt-1 h-5 w-5" />Observei diretamente e tenho informação suficiente para esta janela. Quando não houver oportunidade de observação, marcarei N/O.</label>
      <label className="block text-sm">Há perigo imediato ou mudança aguda que precisa de atendimento agora?<select id="authorial-urgent" className={control} value={urgent} onChange={(e) => setUrgent(e.target.value)}><option value="">Selecione</option><option value="nao">Não</option><option value="sim">Sim</option><option value="incerto">Não sei; preciso de ajuda da equipe</option></select></label>
      {urgent !== "" && urgent !== "nao" && <div role="alert" className="rounded-xl border border-destructive p-3 text-sm">Interrompa o questionário e avise a equipe. Em perigo imediato fora do serviço, acione o SAMU 192. Não aguarde um escore.</div>}
      <details><summary className="cursor-pointer text-sm font-semibold">Já aplicado nesta coleta · evitar repetição</summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{[...recoveredAuthorialMonitors.map((d) => ({ id: d.id, name: d.name })), { id: "regula-20-sdg", name: "REGULA-20 / outro monitor de irritabilidade" }].map((d) => <label key={d.id} className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={alreadySelected.includes(d.id)} onChange={() => setAlreadySelected((v) => toggle(v, d.id))} />{d.name}</label>)}</div></details>
    </div>
    <section className="space-y-3" aria-label="Seleção compatível"><h2 className="text-lg font-semibold">Seleção compatível · {planned.reduce((n, p) => n + p.itemCount, 0)} itens</h2>
      {planned.length === 0 && <p role="status" className="rounded-xl border p-4 text-sm">Nenhum formulário liberado para estes dados. Complete o perfil e as prioridades; não há substituição por escala inadequada.</p>}
      {planned.map(({ definition, reason }) => <article className={box} key={definition.id} data-testid={`authorial-card-${definition.id}`}><h3 className="font-semibold">{definition.name}</h3><p className="text-sm">{reason}</p><p className="text-xs text-muted-foreground">{definition.sourceNote}</p><Button onClick={() => { if (monitorEligibility(definition, input) === null) setActive({ definition: monitorWithClinicalDetails(definition), input: { ...input, contexts: [...contexts], focuses: [...focuses] } }); }}>Responder {definition.name}</Button></article>)}
    </section>
    <details className={box}><summary className="cursor-pointer font-semibold">Por que outras escalas não apareceram?</summary>{recoveredAuthorialMonitors.filter((d) => !planned.some((p) => p.definition.id === d.id)).map((d) => <p key={d.id} className="text-sm"><strong>{d.name}:</strong> {monitorEligibility(d, input) ?? "Já selecionada, sobreposição de objetivo ou limite de itens. Não acrescentada automaticamente."}</p>)}</details>
    <section className={box}><h2 className="font-semibold">Já existente · sem duplicar</h2><p className="text-sm">REGULA-20 mantém sua aplicação própria e os registros anteriores. VIGIA-MED 24, NEXO-FAM 24, NEXO-S 24, RITMO-18 e TRILHA-20 não foram recriados.</p><Link href="/filtro?autoral=regula-20-sdg" className="text-sm font-semibold text-primary underline">Abrir REGULA-20 existente</Link></section>
    <details className={box}><summary className="cursor-pointer font-semibold">Fontes integrais ainda pendentes · aplicação bloqueada</summary>{[...pendingAuthorialScaleIntakes.map((p) => ({ id: p.id, name: p.title, reason: p.reason })), ...unresolvedAuthorialSources].map((d) => <p key={d.id} className="text-sm"><strong>{d.name}</strong> — {d.reason}</p>)}<p className="text-xs text-muted-foreground">Nenhum item foi reconstruído a partir de resumo. Um nome parecido não permite trocar um instrumento por outro.</p></details>
  </section>;
}

function RecoveredQuestionnaire({ definition: d, input, onBack }: { definition: RecoveredMonitor; input: MonitorSelectionInput; onBack: () => void }) {
  const [answers, setAnswers] = useState<Array<number | undefined>>([]); const [safety, setSafety] = useState<string[]>([]);
  const [observer, setObserver] = useState(""); const [end, setEnd] = useState(today); const [schoolStart, setSchoolStart] = useState("");
  const [note, setNote] = useState(""); const [changes, setChanges] = useState(""); const [goal, setGoal] = useState("");
  const [supportResults, setSupportResults] = useState<Record<string, string>>({});
  const [sourceAgreed, setSourceAgreed] = useState(false); const [reviewAgreed, setReviewAgreed] = useState(false); const [nextAgreed, setNextAgreed] = useState(false);
  const [error, setError] = useState(""); const [savedView, setSavedView] = useState(false);
  const [snapshot, setSnapshot] = useState<{ date: string; responses: Array<{ question: string; answer: string }>; needsReview: boolean } | null>(null);
  const result = calculateRecoveredMonitor(d, answers); const safetyState = monitorSafetyState(d, safety);
  const start = d.schoolDays ? schoolStart : startOfWindow(end, d.windowDays);
  const nextSteps = "Apresente o registro ao profissional. Priorize uma meta funcional observável, mantenha os apoios eficazes e combine a próxima avaliação. Não ajuste medicamentos ou supervisão de segurança pelo escore. Compare somente a mesma versão, observador, contextos, janela e conjunto de itens observáveis; mudanças de contexto podem explicar variações.";
  function finish() {
    setError("");
    if (monitorEligibility(d, input) || !result.complete || !safetyState.complete || !observer.trim() || !nextAgreed || (d.sourceKind === "authored-app" && !sourceAgreed)) { setError("Complete a identificação, todos os itens (N/O é válido), alertas e confirmações. Nenhum campo em branco será convertido em zero."); return; }
    if (!dateIsValid(end) || !dateIsValid(start) || end > today() || start > end) { setError("Revise as datas reais da janela. Na escola, informe a data inicial dos 14 dias com frequência observada; não usamos 14 dias corridos automaticamente."); return; }
    if (safetyState.needsReview && !reviewAgreed) { setError("Há alerta ou informação incerta. Avise a equipe e confirme que abrirá o registro para avaliação prioritária, não para conclusão rotineira."); return; }
    const responses = [
      { question: "Instrumento, versão e fonte", answer: `${d.name} · ${d.version}. ${d.source}. ${d.sourceNote}. ${AUTHORIAL_NOTICE}` },
      { question: "Aplicação", answer: `${purposeLabels[input.purpose]}; ${input.ageMonths} meses; ${roleLabels[input.respondent]}; observador: ${observer.trim()}; contexto(s): ${input.contexts.join(", ")}; janela: ${start} a ${end}${d.schoolDays ? " — 14 dias de frequência escolar observada" : ` — ${d.windowDays} dias`}.` },
      ...d.domains.flatMap((domain) => domain.items).map((question, i) => ({ question: `Item ${i + 1}. ${question}`, answer: d.labels[answers[i]!] })),
      ...monitorComputedRows(d, answers),
      ...d.redFlags.map((question, i) => ({ question: `Alerta ${i + 1} — fora do escore: ${question}`, answer: `${safety[i] === "nao" ? "" : "AVALIAR — "}${safetyLabels[safety[i]]}` })),
      { question: "Exemplo concreto, barreiras, apoios e pontos fortes — relato", answer: note.trim() || "Não informado" },
      { question: "Mudanças de medicação, rotina, sono, saúde, cuidador ou ambiente — relato", answer: changes.trim() || "Não informado" },
      { question: "Meta funcional proposta para discutir na consulta", answer: goal.trim() || "Não informada" },
      ...(d.id === "porta-20-sdg" ? schoolSupportOptions.map((question) => ({ question: `Apoio escolar — ${question}`, answer: supportResults[question] || "Não informado; não presumir que foi testado" })) : []),
      { question: "Próximos passos", answer: `${safetyState.needsReview ? "Alertas precisam de avaliação da equipe. " : ""}${nextSteps}` },
    ];
    setSnapshot({ date: new Date().toISOString(), responses, needsReview: safetyState.needsReview });
  }
  return <article data-testid="recovered-questionnaire" className="mx-auto max-w-3xl space-y-5 pb-8">
    <header className={box}><h1 className="text-2xl font-bold">{d.name}</h1><p className="text-sm">{d.version} · {monitorItemCount(d)} itens · {purposeLabels[input.purpose]}</p><p className="text-sm">{d.instruction}</p><p className="text-xs text-muted-foreground">{d.sourceNote} {AUTHORIAL_NOTICE}</p></header>
    <p className="text-xs text-muted-foreground">Respostas apenas em memória. Alternar as abas preserva este formulário; recarregar, fechar ou sair da rota perde o registro ainda não salvo. Nenhum envio automático.</p>
    {snapshot ? <>
      {snapshot.needsReview && <p role="alert" className="rounded-xl border border-destructive p-4 font-semibold">Alerta presente ou incerto: apresente o registro à equipe antes da conclusão rotineira.</p>}
      <Suspense fallback={<p role="status">Preparando relatório…</p>}><ClinicalReport scaleName={d.name} scaleFullName={`${d.name} · ${d.version} · Autoral não validado`} items={snapshot.responses} patientAge={`${input.ageMonths} meses`} applicationDate={snapshot.date} /></Suspense>
      <Button variant="outline" onClick={() => setSavedView(true)}>Equipe: vincular ao prontuário</Button>
      {savedView && <Suspense fallback={<p role="status">Preparando salvamento…</p>}><SaveToPatient scaleName={d.name} responses={snapshot.responses} patientAge={`${input.ageMonths} meses`} instrumentVersion={d.version} applicationDate={snapshot.date} /></Suspense>}
      <Button variant="outline" onClick={() => { setSnapshot(null); setSavedView(false); setReviewAgreed(false); }}>Revisar respostas</Button>
    </> : <>
      <section className={box}><label className="block">Observador — identificação ou função<Input id="monitor-observer" maxLength={100} value={observer} onChange={(e) => setObserver(e.target.value)} /></label><label className="block">Fim da janela<Input id="monitor-window-end" type="date" max={today()} value={end} onChange={(e) => setEnd(e.target.value)} /></label>{d.schoolDays ? <label className="block">Início dos 14 dias com frequência escolar observada<Input id="monitor-window-start" type="date" max={end} value={schoolStart} onChange={(e) => setSchoolStart(e.target.value)} /></label> : <p className="text-xs">Janela: {start} a {end}.</p>}
        {d.sourceKind === "authored-app" && <label className="flex items-start gap-3 text-sm"><input id="monitor-source-agreed" type="checkbox" checked={sourceAgreed} onChange={(e) => setSourceAgreed(e.target.checked)} />Esta aplicação usa a revisão operacional já existente no app; entendo que não foi declarada equivalência a um PDF anterior não recuperado.</label>}
      </section>
      <p role="status" className="text-sm font-semibold">{answers.filter((v) => v !== undefined).length}/{result.count} respostas</p>
      {d.domains.map((domain, di) => { const offset = d.domains.slice(0, di).reduce((n, v) => n + v.items.length, 0); return <section key={domain.name} className="space-y-3"><h2 className="text-lg font-semibold">{domain.name}</h2>{domain.items.map((question, ii) => { const i = offset + ii; return <fieldset key={i} className={box} data-testid={`monitor-item-${i}`}><legend className="px-1 text-sm font-semibold">{i + 1}. {question}</legend><div className="grid gap-2 sm:grid-cols-2">{d.labels.map((label, value) => <label key={value} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${answers[i] === value ? "border-primary bg-primary/10" : "border-border"}`}><input type="radio" name={`monitor-item-${i}`} value={value} checked={answers[i] === value} onChange={() => setAnswers((v) => { const next = [...v]; next[i] = value; return next; })} className="mt-1 h-5 w-5 shrink-0" />{label}</label>)}</div></fieldset>; })}</section>; })}
      <section className={box}><h2 className="font-semibold">Contexto e participação — não pontuados</h2><label className="block text-sm">Exemplo concreto, barreiras, apoios úteis e pontos fortes<textarea className={control} maxLength={1500} rows={4} value={note} onChange={(e) => setNote(e.target.value)} /></label><label className="block text-sm">Mudanças relevantes desde o basal<textarea className={control} maxLength={1000} rows={3} value={changes} onChange={(e) => setChanges(e.target.value)} /></label><label className="block text-sm">Meta funcional para discutir com o profissional<textarea className={control} maxLength={600} rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} /></label>
        {d.id === "porta-20-sdg" && <details><summary className="font-semibold">Mapa de apoios escolares testados — sem escore</summary>{schoolSupportOptions.map((label) => <label key={label} className="mt-3 block text-sm">{label}<select className={control} value={supportResults[label] ?? ""} onChange={(e) => setSupportResults((v) => ({ ...v, [label]: e.target.value }))}><option value="">Não informado</option>{supportResponseOptions.map((value) => <option key={value}>{value}</option>)}</select></label>)}</details>}
      </section>
      <section className={box}><h2 className="font-semibold">Alertas de segurança — independentes da pontuação</h2><p className="text-sm">Presente ou Não sei exige discussão com a equipe. Pontuação favorável não descarta perigo.</p>{d.redFlags.map((label, i) => <label key={i} className="block text-sm">{label}<select id={`monitor-alert-${i}`} className={control} value={safety[i] ?? ""} onChange={(e) => { const value = e.target.value; setSafety((v) => { const next = [...v]; next[i] = value; return next; }); setReviewAgreed(false); }}><option value="">Selecione</option>{Object.entries(safetyLabels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>)}
        {safety.some((v) => v === "sim" || v === "incerto") && <div role="alert" className="space-y-3 rounded-xl border border-destructive p-4"><p className="text-sm">Avise a equipe. Em perigo imediato fora do serviço, acione o SAMU 192. Não aguarde o restante das perguntas para pedir ajuda.</p><label className="flex items-start gap-2 text-sm"><input id="monitor-review-agreed" type="checkbox" checked={reviewAgreed} onChange={(e) => setReviewAgreed(e.target.checked)} />Abrirei este registro para avaliação dos alertas pela equipe, não como conclusão rotineira.</label></div>}
      </section>
      <section className={box}><h2 className="font-semibold">Próximos passos</h2><p className="text-sm leading-6">{nextSteps}</p><label className="flex items-start gap-2 text-sm"><input id="monitor-next-agreed" type="checkbox" checked={nextAgreed} onChange={(e) => setNextAgreed(e.target.checked)} />Li os próximos passos e levarei o registro para revisão profissional.</label></section>
      {error && <p role="alert" className="rounded-xl border border-destructive p-3 text-sm">{error}</p>}
      <Button id="monitor-finish" className="min-h-12 w-full" onClick={finish}>Concluir para revisão profissional</Button>
    </>}
    <Button variant="outline" onClick={onBack}>Voltar ao filtro / nova aplicação</Button>
    <footer className="border-t pt-4 text-xs text-muted-foreground">Dr. Jadson Fraga · Neuropediatra · CRM-PE 25227 · RQE 17756<br />NeuroPed SDG · Soli Deo Gloria</footer>
  </article>;
}
