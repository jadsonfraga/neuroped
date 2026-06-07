import { useEffect, useMemo, useState } from "react";

type Selo = "Ouro" | "Prata" | "Bronze";
type Politica = "embed" | "permission" | "link";

interface EscalaLivre {
  n: number;
  sigla: string;
  nome: string;
  categoria: string;
  idade: string;
  respondente: string;
  selo: Selo;
  politica: Politica;
}

type CompactRow = [number, string, string, string, string, string, Selo, Politica];

const DATA_URL = "https://raw.githubusercontent.com/jadsonfraga/neuroped/main/data/neuroped_escalas_neuropsiquiatria_infantil_100.json";

const fallbackScales: EscalaLivre[] = [
  { n: 1, sigla: "SWYC Milestones", nome: "Survey of Well-being of Young Children – Developmental Milestones", categoria: "Desenvolvimento e TEA", idade: "0–5.5", respondente: "Pais/cuidadores", selo: "Ouro", politica: "embed" },
  { n: 7, sigla: "M-CHAT-R", nome: "Modified Checklist for Autism in Toddlers, Revised", categoria: "Desenvolvimento e TEA", idade: "1.33–2.5", respondente: "Pais/cuidadores", selo: "Ouro", politica: "permission" },
  { n: 8, sigla: "M-CHAT-R/F", nome: "Modified Checklist for Autism in Toddlers, Revised with Follow-Up", categoria: "Desenvolvimento e TEA", idade: "1.33–2.5", respondente: "Pais + entrevista", selo: "Ouro", politica: "permission" },
  { n: 17, sigla: "PSC-17 Parent", nome: "Pediatric Symptom Checklist – 17 Item Parent Version", categoria: "Comportamento geral", idade: "4–17", respondente: "Pais/cuidadores", selo: "Ouro", politica: "embed" },
  { n: 19, sigla: "SDQ Parent", nome: "Strengths and Difficulties Questionnaire – Parent Version", categoria: "Comportamento geral", idade: "2–17", respondente: "Pais/cuidadores", selo: "Ouro", politica: "permission" },
  { n: 30, sigla: "SNAP-IV-26", nome: "Swanson, Nolan and Pelham Questionnaire – Fourth Edition, 26 Item Teacher and Parent Rating Scale", categoria: "TDAH", idade: "6–17", respondente: "Pais/professor", selo: "Ouro", politica: "permission" },
  { n: 34, sigla: "SCARED Child", nome: "Screen for Child Anxiety Related Emotional Disorders – Child Version", categoria: "Ansiedade e humor", idade: "8–18", respondente: "Criança/adolescente", selo: "Ouro", politica: "permission" },
  { n: 39, sigla: "RCADS-47 Child", nome: "Revised Child Anxiety and Depression Scale – 47 Item Child Version", categoria: "Ansiedade e humor", idade: "8–18", respondente: "Criança/adolescente", selo: "Ouro", politica: "permission" },
  { n: 47, sigla: "ASQ", nome: "Ask Suicide-Screening Questions", categoria: "Segurança clínica", idade: "8–24", respondente: "Paciente", selo: "Ouro", politica: "embed" },
  { n: 49, sigla: "CATS", nome: "Child and Adolescent Trauma Screen", categoria: "Trauma e TEPT", idade: "7–17", respondente: "Criança/cuidador", selo: "Ouro", politica: "permission" },
  { n: 61, sigla: "YGTSS", nome: "Yale Global Tic Severity Scale", categoria: "Tiques e bipolaridade", idade: "5–18", respondente: "Clínico", selo: "Ouro", politica: "permission" },
  { n: 75, sigla: "CRAFFT 2.1", nome: "Car, Relax, Alone, Forget, Friends, Trouble Screening Tool – Version 2.1", categoria: "Substâncias e alimentação", idade: "12–21", respondente: "Adolescente", selo: "Ouro", politica: "permission" },
  { n: 81, sigla: "PSQ-SRBD", nome: "Pediatric Sleep Questionnaire – Sleep-Related Breathing Disorder Scale", categoria: "Sono e PROMIS", idade: "2–18", respondente: "Pais/cuidadores", selo: "Ouro", politica: "permission" },
  { n: 83, sigla: "PROMIS Pediatric Anxiety", nome: "Patient-Reported Outcomes Measurement Information System Pediatric Anxiety Short Form", categoria: "Sono e PROMIS", idade: "8–17", respondente: "Criança/adolescente", selo: "Ouro", politica: "embed" },
  { n: 84, sigla: "PROMIS Pediatric Depressive Symptoms", nome: "Patient-Reported Outcomes Measurement Information System Pediatric Depressive Symptoms Short Form", categoria: "Sono e PROMIS", idade: "8–17", respondente: "Criança/adolescente", selo: "Ouro", politica: "embed" }
];

const politicaLabel: Record<Politica, string> = {
  embed: "Candidato a incorporar",
  permission: "Verificar permissão",
  link: "Fonte oficial"
};

const politicaDescricao: Record<Politica, string> = {
  embed: "Pode ser candidato a uso no app com atribuição e conferência da fonte oficial.",
  permission: "Não embutir itens, respostas, normas ou algoritmos sem permissão formal.",
  link: "Usar como ficha clínica e encaminhar para a fonte oficial."
};

const seloPeso: Record<Selo, number> = { Ouro: 0, Prata: 1, Bronze: 2 };

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function badgeSelo(selo: Selo) {
  if (selo === "Ouro") return "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100";
  if (selo === "Prata") return "border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100";
  return "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-100";
}

function badgePolitica(politica: Politica) {
  if (politica === "embed") return "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100";
  if (politica === "permission") return "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100";
  return "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100";
}

function compactRowToScale(row: CompactRow): EscalaLivre {
  return {
    n: row[0],
    sigla: row[1],
    nome: row[2],
    categoria: row[3],
    idade: row[4],
    respondente: row[5],
    selo: row[6],
    politica: row[7]
  };
}

export default function EscalasNeuropsiquiatriaPage() {
  const [escalas, setEscalas] = useState<EscalaLivre[]>(fallbackScales);
  const [status, setStatus] = useState<"loading" | "ok" | "fallback">("loading");
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [selo, setSelo] = useState<"Todos" | Selo>("Todos");
  const [politica, setPolitica] = useState<"Todas" | Politica>("Todas");

  useEffect(() => {
    let alive = true;
    async function loadRegistry() {
      try {
        const response = await fetch(DATA_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`Falha ao carregar registro: ${response.status}`);
        const payload = await response.json() as { escalas?: CompactRow[] };
        const parsed = (payload.escalas || []).map(compactRowToScale);
        if (parsed.length !== 100) throw new Error(`Registro incompleto: ${parsed.length}`);
        if (alive) {
          setEscalas(parsed);
          setStatus("ok");
        }
      } catch {
        if (alive) setStatus("fallback");
      }
    }
    loadRegistry();
    return () => { alive = false; };
  }, []);

  const categorias = useMemo(() => ["Todas", ...Array.from(new Set(escalas.map((escala) => escala.categoria))).sort()], [escalas]);
  const totalOuro = escalas.filter((escala) => escala.selo === "Ouro").length;
  const totalEmbed = escalas.filter((escala) => escala.politica === "embed").length;

  const filtradas = useMemo(() => {
    const q = normalizar(busca);
    return escalas
      .filter((escala) => {
        const texto = normalizar(`${escala.sigla} ${escala.nome} ${escala.categoria} ${escala.respondente} ${escala.idade}`);
        const matchBusca = !q || texto.includes(q);
        const matchCategoria = categoria === "Todas" || escala.categoria === categoria;
        const matchSelo = selo === "Todos" || escala.selo === selo;
        const matchPolitica = politica === "Todas" || escala.politica === politica;
        return matchBusca && matchCategoria && matchSelo && matchPolitica;
      })
      .sort((a, b) => seloPeso[a.selo] - seloPeso[b.selo] || a.n - b.n);
  }, [busca, categoria, selo, politica, escalas]);

  return (
    <main className="page-enter space-y-5 pb-10">
      <section className="rounded-[2rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/40 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">NeuroPed · catálogo mundial gratuito/sem custo</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">100 escalas de neuropsiquiatria infantil</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Registro operacional para triagem, escolha de instrumento e curadoria clínica. A tela não copia itens protegidos: mostra metadados, idade, respondente, prioridade e política de incorporação.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
              <div className="text-xl font-black text-foreground">{escalas.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">total</div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="text-xl font-black text-amber-900 dark:text-amber-100">{totalOuro}</div>
              <div className="text-[10px] uppercase tracking-wide text-amber-800 dark:text-amber-200">ouro</div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
              <div className="text-xl font-black text-emerald-900 dark:text-emerald-100">{totalEmbed}</div>
              <div className="text-[10px] uppercase tracking-wide text-emerald-800 dark:text-emerald-200">embed</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-border/70 bg-card/90 p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-4">
          <label className="space-y-1 lg:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Busca</span>
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Ex.: autismo, TDAH, ansiedade, trauma, PROMIS..."
              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Categoria</span>
            <select value={categoria} onChange={(event) => setCategoria(event.target.value)} className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm">
              {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Selo</span>
            <select value={selo} onChange={(event) => setSelo(event.target.value as "Todos" | Selo)} className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm">
              <option>Todos</option>
              <option>Ouro</option>
              <option>Prata</option>
              <option>Bronze</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(["Todas", "embed", "permission", "link"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPolitica(item)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${politica === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"}`}
            >
              {item === "Todas" ? "Todas políticas" : politicaLabel[item]}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200/70 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
        <strong>Trava de segurança:</strong> gratuito não significa domínio público. Para instrumentos marcados como “verificar permissão”, o NeuroPed deve exibir apenas ficha clínica e fonte oficial até autorização formal. Nenhuma escala confirma diagnóstico isoladamente.
        {status !== "ok" && <span className="mt-2 block font-bold">Modo atual: {status === "loading" ? "carregando base completa" : "fallback local com instrumentos prioritários"}.</span>}
      </section>

      <section className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">resultado</p>
          <h2 className="text-lg font-black text-foreground">{filtradas.length} instrumentos encontrados</h2>
        </div>
        <button
          type="button"
          onClick={() => { setBusca(""); setCategoria("Todas"); setSelo("Todos"); setPolitica("Todas"); }}
          className="rounded-full border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary/50"
        >
          Limpar filtros
        </button>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtradas.map((escala) => (
          <article key={escala.n} className="flex min-h-[220px] flex-col rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">#{String(escala.n).padStart(3, "0")}</p>
                <h3 className="mt-1 text-base font-black text-foreground">{escala.sigla}</h3>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{escala.nome}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase ${badgeSelo(escala.selo)}`}>
                {escala.selo}
              </span>
            </div>

            <div className="mt-4 grid gap-2 text-xs">
              <div className="rounded-2xl bg-muted/50 p-3">
                <strong className="text-foreground">Categoria:</strong> <span className="text-muted-foreground">{escala.categoria}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-muted/50 p-3">
                  <strong className="text-foreground">Idade:</strong><br />
                  <span className="text-muted-foreground">{escala.idade} anos</span>
                </div>
                <div className="rounded-2xl bg-muted/50 p-3">
                  <strong className="text-foreground">Respondente:</strong><br />
                  <span className="text-muted-foreground">{escala.respondente}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4">
              <div className={`rounded-2xl border p-3 text-xs leading-relaxed ${badgePolitica(escala.politica)}`}>
                <strong>{politicaLabel[escala.politica]}:</strong> {politicaDescricao[escala.politica]}
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
