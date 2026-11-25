import { useRef, useState } from "react";
import { bands, domains } from "@/data/observacaoSocial";

const conditions = ["Interação espontânea", "Interação após apoio", "Resposta não observada nesta oportunidade", "Participante preferiu parar", "Oportunidade insuficiente"];
const blank = { condition: "", reaction: "", context: "" };
type Note = typeof blank;
const input = "mt-1 block min-h-12 w-full rounded-lg border bg-background p-3";
const button = "min-h-12 rounded-lg border bg-background px-4 py-2";
const panel = "space-y-4 rounded-xl border bg-card p-5";

export default function ObservacaoSocial() {
  const [band, setBand] = useState(0);
  const [scene, setScene] = useState(0);
  const [choice, setChoice] = useState("");
  const [records, setRecords] = useState<Record<string, Note>>({});
  const participant = useRef<HTMLDialogElement>(null);
  const id = band + "/" + scene;
  const note = records[id] ?? blank;
  const [, invitation, choices, guide] = bands[band][1][scene];
  const [domain, watch] = domains[scene];
  function record(field: keyof Note, value: string) {
    setRecords(previous => {
      const next = { ...previous, [id]: { ...(previous[id] ?? blank), [field]: value } };
      if (!Object.values(next[id]).some(text => text.trim())) delete next[id];
      return next;
    });
  }
  const summary = Object.entries(records).map(([key, entry]) => {
    const [b, s] = key.split("/").map(Number);
    return [bands[b][0] + " · " + bands[b][1][s][0] + " · " + domains[s][0],
      entry.condition, entry.reaction && "Observação direta: " + entry.reaction,
      entry.context && "Contexto e apoios: " + entry.context].filter(Boolean).join("\n");
  }).join("\n\n");
  return <article className="mx-auto max-w-3xl space-y-4 pb-8">
    <header><p className="text-sm">NeuroPed · Roteiro autoral v1.1 · Sem validação psicométrica</p>
      <h1 className="my-2 text-2xl font-bold">Observação social presencial</h1>
      <p>Use o tablet como convite para uma interação com outra pessoa. Adapte a linguagem e aceite gestos, fala, escrita e comunicação aumentativa e alternativa. A pessoa pode observar, recusar ou parar.</p></header>
    <section className={panel}>
      <label className="block">Idade na data da observação<select className={input} value={band} onChange={e => { setBand(Number(e.target.value)); setScene(0); }}>
        {bands.map(([name], i) => <option key={name} value={i}>{name}</option>)}</select></label>
      <p className="text-sm">A idade orienta o tema. Use objetos reais, figuras, gestos ou CAA conforme o acesso da pessoa. Preserve temas compatíveis com a idade e registre o apoio oferecido.</p>
      <label className="block">Situação<select className={input} value={scene} onChange={e => setScene(Number(e.target.value))}>
        {bands[band][1].map(([title], i) => <option key={title} value={i}>{title}</option>)}</select></label>
      <h2 className="text-xl font-semibold">{domain}</h2><p>{guide}</p><p>{watch}</p>
      <button className={button} onClick={() => { setChoice(""); participant.current?.showModal(); }}>Abrir tela do participante</button>
    </section>
    <dialog ref={participant} aria-labelledby="social-invitation" className="fixed inset-0 m-auto w-11/12 max-w-2xl rounded-xl bg-background p-6 text-foreground backdrop:bg-slate-900">
      <h2 id="social-invitation" className="mb-6 text-3xl font-bold">{invitation}</h2>
      <div className="grid grid-cols-2 gap-3">{choices.map(item => {
        const [symbol, ...words] = item.split(" ");
        return <button key={item} aria-pressed={choice === item} className={button + " py-6 text-xl aria-pressed:ring-4 aria-pressed:ring-primary"} onClick={() => setChoice(item)}>
          <span aria-hidden="true" className="block text-5xl">{symbol}</span>{words.join(" ")}</button>;
      })}</div>
      <button className={button + " mt-6"} onClick={() => participant.current?.close()}>Pausar e voltar</button>
    </dialog>
    <section className={panel}><h2 className="text-xl font-semibold">Registro do profissional</h2>
      <label className="block">Condição da observação<select className={input} value={note.condition} onChange={e => record("condition", e.target.value)}>
        <option value="">Selecione</option>{conditions.map(c => <option key={c}>{c}</option>)}</select></label>
      <label className="block">O que a pessoa fez ou comunicou?<textarea className={input} rows={3} value={note.reaction} onChange={e => record("reaction", e.target.value)} /></label>
      <label className="block">Contexto, apoios e limites de interpretação<textarea className={input} rows={2} value={note.context} onChange={e => record("context", e.target.value)} /></label>
    </section>
    <section className={panel}><h2 className="text-xl font-semibold">Síntese para revisão clínica</h2>
      <p>Registro temporário. Sair de Testes diretos ou atualizar a página apaga a sessão. Revise e transfira o texto necessário antes de sair.</p>
      <div className="whitespace-pre-wrap break-words">{summary ? "Observação social presencial · NeuroPed v1.1 · Roteiro autoral sem validação psicométrica\n\n" + summary + "\n\nInterpretar com história do desenvolvimento e funcionamento em outros ambientes. A sessão isolada não estabelece diagnóstico de TEA." : "Nenhuma observação registrada."}</div>
      <button className={button} disabled={!summary} onClick={() => { if (window.confirm("Apagar todas as observações desta sessão?")) { setRecords({}); setBand(0); setScene(0); } }}>Limpar sessão</button>
    </section>
  </article>;
}
