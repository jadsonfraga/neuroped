import { useEffect, useMemo, useState } from "react";
import { CONTROL, DITADO, DITADO_PSEUDO, CF, FLUENCY_TEXT, PSEUDO, RAN, WORDS, scoreIced, type IcedInput, type Tri } from "@/features/dyslexia-risk/model";
import "@/styles/super-neuropad-arcade.css";
import "@/styles/dyslexia-risk.css";

const KEY = "neuroped-dyslexia-risk-v1";
type GateField = "nome" | "data" | "nasc" | "idade" | "escola" | "anosEsc" | "examinador";
type PersistenceField = "a" | "b" | "c" | "d";
type Phase = "mapa" | "portao" | "escudo" | "transicao" | "palavras" | "pseudo" | "fluencia" | "ditado" | "sons" | "formas" | "familia" | "ponte" | "tesouro";
const WORLDS: { id: Phase; nome: string; emoji: string; fala: string }[] = [
  { id: "portao", nome: "Portão", emoji: "🚪", fala: "Nome, ano e escola." },
  { id: "escudo", nome: "Escudo", emoji: "🛡️", fala: "Bloco 0 antes de pontuar." },
  { id: "palavras", nome: "Vila das Palavras", emoji: "📖", fala: "Cartão A. Sem figura, sem pista." },
  { id: "pseudo", nome: "Floresta Inventada", emoji: "🌲", fala: "Não são palavras de verdade." },
  { id: "fluencia", nome: "Corrida do Parque", emoji: "🏃", fala: "60 segundos. O ano manda na âncora." },
  { id: "ditado", nome: "Caverna do Ditado", emoji: "✏️", fala: "12 + 5. Erro de regra não pontua." },
  { id: "sons", nome: "Templo dos Sons", emoji: "👂", fala: "12 itens. Exemplo não pontua." },
  { id: "formas", nome: "Arena das Formas", emoji: "🔺", fala: "Nomeia a forma, não a cor." },
  { id: "familia", nome: "Árvore", emoji: "🌳", fala: "Só pai, mãe ou irmão." },
  { id: "ponte", nome: "Ponte", emoji: "🌉", fala: "Quatro sim ou zero." },
  { id: "tesouro", nome: "Tesouro", emoji: "💎", fala: "Escore interno. Não diagnostica." },
];

function blank() {
  return {
    nome: "", data: "", nasc: "", idade: "8", ano: "" as "" | "2" | "3" | "outro", escola: "", anosEsc: "", examinador: "",
    controle: Object.fromEntries(CONTROL.map(([k]) => [k, "" as Tri])),
    palavras: WORDS.map(() => ({ ok: false, err: false, prod: "" })),
    pseudo: PSEUDO.map(() => ({ ok: false, err: false, lex: false, prod: "" })),
    flu: { tempo: 60, lidas: 0, erros: 0 },
    ditado: DITADO.map(() => ({ grafia: "", f: false, o: false })),
    ditadoP: DITADO_PSEUDO.map(() => ({ grafia: "", ok: false })),
    cf: CF.map(() => ({ ok: false, err: false })),
    ran: { seg: 0, erros: 0, norma: false },
    fam: { pai: "" as Tri, mae: "" as Tri, irmao: "" as Tri, nome: "" },
    pers: { a: "" as Tri, b: "" as Tri, c: "" as Tri, d: "" as Tri, nota: "" },
    normas: { palavras: false, pseudo: false, flu: false, ditado: false, cf: false },
    fenomeno: "",
    done: {} as Record<string, boolean>,
  };
}
function pcpmOf(lidas: number, erros: number, tempo: number) {
  if (!tempo) return null;
  if (tempo >= 60) return Math.max(0, lidas - erros);
  return Math.round(((136 - erros) * 60) / tempo);
}

export default function DyslexiaRiskPage() {
  const [s, setS] = useState(blank);
  const [phase, setPhase] = useState<Phase>("mapa");
  const [cursor, setCursor] = useState(0);
  const [nextWorld, setNextWorld] = useState(0);
  const [child, setChild] = useState(false);
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setS({ ...blank(), ...JSON.parse(raw) }); } catch { /* sessão nova */ }
  }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(s)); }, [s]);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSecs((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const input: IcedInput = useMemo(() => {
    const famSim = [s.fam.pai, s.fam.mae, s.fam.irmao].includes("sim");
    const famNao = [s.fam.pai, s.fam.mae, s.fam.irmao].includes("nao");
    const four = s.pers.a === "sim" && s.pers.b === "sim" && s.pers.c === "sim" && s.pers.d === "sim";
    const persSeen = [s.pers.a, s.pers.b, s.pers.c, s.pers.d].some(Boolean);
    return {
      ano: s.ano, controle: s.controle,
      palavrasAcertos: s.done.palavras ? s.palavras.filter((x) => x.ok).length : null,
      palavrasF: s.done.palavras ? s.palavras.filter((x) => x.err).length : null,
      palavrasNorma: s.normas.palavras,
      pseudoAcertos: s.done.pseudo ? s.pseudo.filter((x) => x.ok).length : null,
      pseudoLex: s.done.pseudo ? s.pseudo.filter((x) => x.lex).length : null,
      pseudoNorma: s.normas.pseudo,
      pcpm: s.done.fluencia ? pcpmOf(s.flu.lidas, s.flu.erros, s.flu.tempo) : null,
      fluenciaNorma: s.normas.flu,
      ditadoF: s.done.ditado ? s.ditado.filter((x) => x.f).length : null,
      ditadoPseudoCertas: s.done.ditado ? s.ditadoP.filter((x) => x.ok).length : null,
      ditadoNorma: s.normas.ditado,
      cfAcertos: s.done.sons ? s.cf.filter((x) => x.ok).length : null,
      cfNorma: s.normas.cf,
      ranSeg: s.done.formas ? s.ran.seg : null,
      ranErros: s.done.formas ? s.ran.erros : null,
      ranNorma: s.ran.norma,
      familiar: s.done.familia ? (famSim ? "sim" : famNao ? "nao" : "nv") : "",
      persistencia4: s.done.ponte && persSeen ? four : null,
    };
  }, [s]);
  const result = scoreIced(input);
  const words = FLUENCY_TEXT.split(/\s+/);

  function stamp(id: string, next: Phase) {
    setS((prev) => ({ ...prev, done: { ...prev.done, [id]: true } }));
    setCursor(0);
    setNextWorld(WORLDS.findIndex((w) => w.id === next));
    setPhase("transicao");
  }

  return (
    <main className="snp space-y-4 pb-8" data-testid="dyslexia-risk">
      <header className="snp-panel snp-scanlines snp-sky-bg relative overflow-hidden p-4 sm:p-6">
        <div className="relative flex items-center gap-3">
          <img src="/dr-jadson-shield-badge.webp" alt="Dr. Jadson Fraga" width="256" height="256" decoding="async" className="drx-logo snp-sprite shrink-0 rounded-2xl border-[3px] border-[var(--snp-ink-fixed)]" />
          <div className="min-w-0 text-[var(--snp-stage-text)]">
            <div className="mb-1 flex flex-wrap gap-1.5">
              <span className="snp-chip">ICED-8 · 8 anos</span>
              <span className="snp-chip">operacional interno</span>
              <span className="snp-chip">não diagnostica</span>
              <span className="snp-chip">Soli Deo Gloria</span>
            </div>
            <h1 className="snp-pixel snp-title text-xl text-[var(--snp-paper-fixed)] sm:text-3xl">dyslexia risk</h1>
          </div>
        </div>
      </header>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="snp-btn snp-btn--paper px-3 py-2 text-xs" onClick={() => setChild((v) => !v)}>{child ? "Tela da criança" : "Tela do examinador"}</button>
        <button type="button" className="snp-btn snp-btn--sky px-3 py-2 text-xs" onClick={() => setPhase("mapa")}>Mapa</button>
        <ol className="flex flex-wrap gap-1" aria-label="Trilha">
          {WORLDS.map((w, i) => <li key={w.id} className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--snp-ink-fixed)] text-[10px] font-black ${s.done[w.id] ? "bg-[var(--snp-grass)]" : phase === w.id ? "bg-[var(--snp-sun)]" : "bg-white"}`}>{s.done[w.id] ? "★" : i + 1}</li>)}
        </ol>
      </div>

      {phase === "mapa" && (
        <ol className="grid gap-2">
          {WORLDS.map((w, i) => (
            <li key={w.id}>
              <button type="button" className="snp-option flex w-full items-center gap-3 bg-[var(--snp-paper-fixed)] p-3 text-left" onClick={() => { setPhase(w.id); setCursor(0); }}>
                <span className="text-2xl">{s.done[w.id] ? "★" : w.emoji}</span>
                <span><strong className="snp-pixel text-xs">{i + 1}. {w.nome}</strong><br /><small>{w.fala}</small></span>
              </button>
            </li>
          ))}
        </ol>
      )}

      {phase === "transicao" && (
        <section className="snp-panel snp-scanlines snp-panel--sky p-6 text-center">
          <div className="snp-float text-6xl">{WORLDS[nextWorld]?.emoji}</div>
          <h2 className="snp-pixel text-2xl">{WORLDS[nextWorld]?.nome}</h2>
          <p className="font-bold">{WORLDS[nextWorld]?.fala}</p>
          <button type="button" className="snp-btn snp-btn--sun mt-4 px-6 py-3" onClick={() => setPhase(WORLDS[nextWorld].id)}>Entrar na fase</button>
        </section>
      )}

      {phase === "portao" && (
        <section className="snp-panel space-y-2 p-4">
          <h2 className="snp-pixel text-base">Portão</h2>
          {([["nome", "Nome completo"], ["data", "Data"], ["nasc", "Nascimento"], ["idade", "Idade"], ["escola", "Tipo de escola"], ["anosEsc", "Escolarização formal (anos)"], ["examinador", "Examinador"]] as const).map(([k, lab]) => (
            <label key={k} className="grid text-sm font-bold">{lab}<input className="mt-1 rounded-xl border-[3px] border-[var(--snp-ink-fixed)] px-2 py-1" value={s[k as GateField]} onChange={(e) => setS((prev) => ({ ...prev, [k]: e.target.value }))} /></label>
          ))}
          <label className="grid text-sm font-bold">Ano escolar
            <select className="mt-1 rounded-xl border-[3px] border-[var(--snp-ink-fixed)] px-2 py-1" value={s.ano} onChange={(e) => setS({ ...s, ano: e.target.value as typeof s.ano })}>
              <option value="">escolher</option><option value="2">2º</option><option value="3">3º</option><option value="outro">outro</option>
            </select>
          </label>
          <button type="button" className="snp-btn snp-btn--sun px-4 py-2" onClick={() => stamp("portao", "escudo")}>Escudo</button>
        </section>
      )}

      {phase === "escudo" && (
        <section className="snp-panel space-y-2 p-4">
          <h2 className="snp-pixel text-base">Bloco 0</h2>
          <p className="text-sm font-semibold">Branco não é “não”.</p>
          {CONTROL.map(([k, lab]) => (
            <div key={k} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 font-bold">{lab}</span>
              {(["sim", "nao", "nv"] as Tri[]).map((v) => <button type="button" key={v} className={`snp-chip ${s.controle[k] === v ? "bg-[var(--snp-sun)]" : ""}`} onClick={() => setS({ ...s, controle: { ...s.controle, [k]: v } })}>{v === "nv" ? "não verificado" : v}</button>)}
            </div>
          ))}
          {result.trava && <p className="rounded-xl border-[3px] border-[var(--snp-berry)] bg-[var(--snp-berry-tint)] p-2 text-sm font-bold">Trava: {result.travaMotivo}. Não interpretar como evidência de dislexia.</p>}
          <button type="button" className="snp-btn snp-btn--sun px-4 py-2" onClick={() => stamp("escudo", "palavras")}>Vila das Palavras</button>
        </section>
      )}

      {phase === "palavras" && (
        <section className="snp-panel p-4 text-center">
          {cursor < 20 ? <>
            <p className="snp-pixel text-xs">{cursor + 1}/20 · lista {WORDS[cursor][1]}</p>
            <p className="my-3 text-5xl font-black">{WORDS[cursor][0]}</p>
            {!child && <input className="w-full rounded-xl border-[3px] border-[var(--snp-ink-fixed)] px-2 py-1" placeholder="produção / tipo" value={s.palavras[cursor].prod} onChange={(e) => { const palavras = s.palavras.slice(); palavras[cursor] = { ...palavras[cursor], prod: e.target.value }; setS({ ...s, palavras }); }} />}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button type="button" className="snp-btn snp-btn--grass px-4 py-2" onClick={() => { const palavras = s.palavras.slice(); palavras[cursor] = { ...palavras[cursor], ok: true, err: false }; setS({ ...s, palavras }); setCursor(cursor + 1); }}>Certo</button>
              <button type="button" className="snp-btn snp-btn--berry px-4 py-2" onClick={() => { const palavras = s.palavras.slice(); palavras[cursor] = { ...palavras[cursor], ok: false, err: true }; setS({ ...s, palavras }); setCursor(cursor + 1); }}>Erro fonológico</button>
            </div>
          </> : <button type="button" className="snp-btn snp-btn--sun px-4 py-2" onClick={() => stamp("palavras", "pseudo")}>Floresta inventada</button>}
          <label className="mt-3 flex items-center justify-center gap-2 text-xs font-bold"><input type="checkbox" checked={s.normas.palavras} onChange={(e) => setS({ ...s, normas: { ...s.normas, palavras: e.target.checked } })} /> Norma ≤ −1 DP prevalece</label>
        </section>
      )}

      {phase === "pseudo" && (
        <section className="snp-panel p-4 text-center">
          {cursor < 16 ? <>
            <p className="snp-pixel text-xs">{cursor + 1}/16</p>
            <p className="my-3 text-5xl font-black">{PSEUDO[cursor]}</p>
            <p className="text-sm font-bold">Estas não são palavras de verdade.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button type="button" className="snp-btn snp-btn--grass px-4 py-2" onClick={() => { const pseudo = s.pseudo.slice(); pseudo[cursor] = { ...pseudo[cursor], ok: true, err: false }; setS({ ...s, pseudo }); setCursor(cursor + 1); }}>Certo</button>
              <button type="button" className="snp-btn snp-btn--berry px-4 py-2" onClick={() => { const pseudo = s.pseudo.slice(); pseudo[cursor] = { ...pseudo[cursor], ok: false, err: true }; setS({ ...s, pseudo }); setCursor(cursor + 1); }}>Erro</button>
              <button type="button" className="snp-btn snp-btn--sun px-4 py-2" onClick={() => { const pseudo = s.pseudo.slice(); pseudo[cursor] = { ...pseudo[cursor], lex: !pseudo[cursor].lex, ok: false, err: true }; setS({ ...s, pseudo }); }}>Lexicalizou</button>
            </div>
          </> : <button type="button" className="snp-btn snp-btn--sun px-4 py-2" onClick={() => stamp("pseudo", "fluencia")}>Corrida do parque</button>}
        </section>
      )}

      {phase === "fluencia" && (
        <section className="snp-panel p-4">
          <h2 className="snp-pixel text-base">O passeio · 136</h2>
          <p className="text-sm font-semibold">{child ? "Leia em voz alta, do começo, no seu ritmo." : "Toque a última palavra lida. PCPM = lidas − erros em 60 s."}</p>
          <p className="mt-2 leading-7">{words.map((w, i) => <button type="button" key={i} className={`drx-word ${i < s.flu.lidas ? "read" : ""}`} onClick={() => setS({ ...s, flu: { ...s.flu, lidas: i + 1 } })}>{w} </button>)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="snp-btn snp-btn--sun px-3 py-2" onClick={() => { setSecs(0); setRunning(true); }}>{running ? `${secs} s` : "Iniciar 60 s"}</button>
            <button type="button" className="snp-btn snp-btn--paper px-3 py-2" onClick={() => { setRunning(false); setS({ ...s, flu: { ...s.flu, tempo: secs || 60 } }); }}>Parar</button>
          </div>
          <label className="mt-2 grid text-sm font-bold">Erros<input type="number" className="rounded-xl border-[3px] border-[var(--snp-ink-fixed)] px-2 py-1" value={s.flu.erros} onChange={(e) => setS({ ...s, flu: { ...s.flu, erros: Number(e.target.value) } })} /></label>
          <p className="text-sm font-black">PCPM {pcpmOf(s.flu.lidas, s.flu.erros, s.flu.tempo || 60) ?? "—"} · ano {s.ano || "não escolhido"}</p>
          <button type="button" className="snp-btn snp-btn--sun mt-2 px-4 py-2" onClick={() => stamp("fluencia", "ditado")}>Caverna do ditado</button>
        </section>
      )}

      {phase === "ditado" && (
        <section className="snp-panel space-y-2 p-4">
          <h2 className="snp-pixel text-base">Ditado</h2>
          <p className="text-sm">F = fonológico. O = regra, não pontua aos 8 anos.</p>
          {DITADO.map(([alvo, frase], i) => (
            <div key={alvo} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-40 font-bold">{alvo}</span>
              <input className="min-w-28 flex-1 rounded-xl border-[3px] border-[var(--snp-ink-fixed)] px-2 py-1" value={s.ditado[i].grafia} placeholder={frase} onChange={(e) => { const ditado = s.ditado.slice(); ditado[i] = { ...ditado[i], grafia: e.target.value }; setS({ ...s, ditado }); }} />
              <button type="button" className={`snp-chip ${s.ditado[i].f ? "bg-[var(--snp-sun)]" : ""}`} onClick={() => { const ditado = s.ditado.slice(); ditado[i] = { ...ditado[i], f: !ditado[i].f }; setS({ ...s, ditado }); }}>F</button>
              <button type="button" className={`snp-chip ${s.ditado[i].o ? "bg-[var(--snp-sun)]" : ""}`} onClick={() => { const ditado = s.ditado.slice(); ditado[i] = { ...ditado[i], o: !ditado[i].o }; setS({ ...s, ditado }); }}>O</button>
            </div>
          ))}
          {DITADO_PSEUDO.map((alvo, i) => (
            <div key={alvo} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="w-24 font-bold">{alvo}</span>
              <input className="min-w-28 flex-1 rounded-xl border-[3px] border-[var(--snp-ink-fixed)] px-2 py-1" value={s.ditadoP[i].grafia} onChange={(e) => { const ditadoP = s.ditadoP.slice(); ditadoP[i] = { ...ditadoP[i], grafia: e.target.value }; setS({ ...s, ditadoP }); }} />
              <button type="button" className={`snp-chip ${s.ditadoP[i].ok ? "bg-[var(--snp-sun)]" : ""}`} onClick={() => { const ditadoP = s.ditadoP.slice(); ditadoP[i] = { ...ditadoP[i], ok: !ditadoP[i].ok }; setS({ ...s, ditadoP }); }}>certa</button>
            </div>
          ))}
          <button type="button" className="snp-btn snp-btn--sun px-4 py-2" onClick={() => stamp("ditado", "sons")}>Templo dos sons</button>
        </section>
      )}

      {phase === "sons" && (
        <section className="snp-panel space-y-2 p-4">
          <h2 className="snp-pixel text-base">Sons</h2>
          {CF.map((item, i) => (
            <div key={item.cmd} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 font-bold">{item.exemplo ? `Ex.: ${item.exemplo}. ` : ""}{item.cmd} → {item.esp}</span>
              <button type="button" className={`snp-chip ${s.cf[i].ok ? "bg-[var(--snp-sun)]" : ""}`} onClick={() => { const cf = s.cf.slice(); cf[i] = { ok: true, err: false }; setS({ ...s, cf }); }}>certo</button>
              <button type="button" className={`snp-chip ${s.cf[i].err ? "bg-[var(--snp-sun)]" : ""}`} onClick={() => { const cf = s.cf.slice(); cf[i] = { ok: false, err: true }; setS({ ...s, cf }); }}>erro</button>
            </div>
          ))}
          <button type="button" className="snp-btn snp-btn--sun px-4 py-2" onClick={() => stamp("sons", "formas")}>Arena das formas</button>
        </section>
      )}

      {phase === "formas" && (
        <section className="snp-panel p-4">
          <h2 className="snp-pixel text-base">Formas · 40</h2>
          <p className="text-sm font-semibold">Treino fora do cronômetro. Forma, não cor.</p>
          <div className="drx-shapes my-3">{RAN.map((sh, i) => <i key={i} data-s={sh} />)}</div>
          <label className="grid text-sm font-bold">Tempo (s)<input type="number" className="rounded-xl border-[3px] border-[var(--snp-ink-fixed)] px-2 py-1" value={s.ran.seg} onChange={(e) => setS({ ...s, ran: { ...s.ran, seg: Number(e.target.value) } })} /></label>
          <label className="grid text-sm font-bold">Erros<input type="number" className="rounded-xl border-[3px] border-[var(--snp-ink-fixed)] px-2 py-1" value={s.ran.erros} onChange={(e) => setS({ ...s, ran: { ...s.ran, erros: Number(e.target.value) } })} /></label>
          <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={s.ran.norma} onChange={(e) => setS({ ...s, ran: { ...s.ran, norma: e.target.checked } })} /> RAN normatizado ≤ −1 DP prevalece</label>
          <button type="button" className="snp-btn snp-btn--sun mt-2 px-4 py-2" onClick={() => stamp("formas", "familia")}>Árvore</button>
        </section>
      )}

      {phase === "familia" && (
        <section className="snp-panel space-y-2 p-4">
          <h2 className="snp-pixel text-base">1º grau</h2>
          <p className="text-sm">Primo, tio e avô não pontuam. “Não sei” não zera.</p>
          {(["pai", "mae", "irmao"] as const).map((k) => (
            <div key={k} className="flex flex-wrap gap-2 text-sm">
              <span className="w-16 font-bold">{k}</span>
              {(["sim", "nao", "nv"] as Tri[]).map((v) => <button type="button" key={v} className={`snp-chip ${s.fam[k] === v ? "bg-[var(--snp-sun)]" : ""}`} onClick={() => setS({ ...s, fam: { ...s.fam, [k]: v } })}>{v}</button>)}
            </div>
          ))}
          <button type="button" className="snp-btn snp-btn--sun px-4 py-2" onClick={() => stamp("familia", "ponte")}>Ponte</button>
        </section>
      )}

      {phase === "ponte" && (
        <section className="snp-panel space-y-2 p-4">
          <h2 className="snp-pixel text-base">Persistência</h2>
          <p className="text-sm">Os quatro precisam ser sim. Zero não é ausência de transtorno.</p>
          {[["a", "Intervenção estruturada"], ["b", "Duração ≥ 3 meses"], ["c", "Frequência ≥ 1×/semana"], ["d", "Dificuldade desproporcional ao ganho"]].map(([k, lab]) => (
            <div key={k} className="flex flex-wrap gap-2 text-sm">
              <span className="min-w-0 flex-1 font-bold">{lab}</span>
              {(["sim", "nao", "nv"] as Tri[]).map((v) => <button type="button" key={v} className={`snp-chip ${s.pers[k as PersistenceField] === v ? "bg-[var(--snp-sun)]" : ""}`} onClick={() => setS({ ...s, pers: { ...s.pers, [k]: v } })}>{v}</button>)}
            </div>
          ))}
          <textarea className="w-full rounded-xl border-[3px] border-[var(--snp-ink-fixed)] p-2" placeholder="qual, com quem, tempo, progresso" value={s.pers.nota} onChange={(e) => setS({ ...s, pers: { ...s.pers, nota: e.target.value } })} />
          <button type="button" className="snp-btn snp-btn--sun px-4 py-2" onClick={() => stamp("ponte", "tesouro")}>Tesouro</button>
        </section>
      )}

      {phase === "tesouro" && (
        <section className="snp-panel space-y-2 p-4">
          <h2 className="snp-pixel text-base">{result.total}/15 · {result.faixa}</h2>
          {result.trava && <p className="rounded-xl border-[3px] border-[var(--snp-berry)] bg-[var(--snp-berry-tint)] p-2 text-sm font-bold">Trava ativa. Não interpretado como evidência de dislexia.</p>}
          <p className="text-sm font-bold">{result.leitura} Núcleo: {result.nucleo}.</p>
          <ul className="space-y-1 text-sm">{result.dominios.map((d) => <li key={d.id}><b>{d.nome}:</b> {d.examinado ? d.pontos : "não examinado"} / {d.peso} — {d.detalhe}</li>)}</ul>
          <textarea className="w-full rounded-xl border-[3px] border-[var(--snp-ink-fixed)] p-2" placeholder="Fenômeno observado" value={s.fenomeno} onChange={(e) => setS({ ...s, fenomeno: e.target.value })} />
          <p className="text-sm leading-relaxed">{result.frase}</p>
          <button type="button" className="snp-btn snp-btn--sky px-4 py-2" onClick={() => navigator.clipboard.writeText(result.frase)}>Copiar devolução</button>
          <p className="text-xs font-bold opacity-70">Fora da soma: compreensão isolada, TDAH, TDL, TEA, ansiedade, inteligência, matemática, motivação. Diagnóstico permanece com o médico.</p>
        </section>
      )}
    </main>
  );
}
