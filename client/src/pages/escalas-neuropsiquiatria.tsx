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
  score: string;
  cutoff: string;
  diagnostico: string;
  sintomas: string[];
  queixas: string[];
  pubmed: string;
  // Faixa etária numérica em meses (derivada do texto de idade) — usada pelo
  // filtro inteligente de idade. 0–216 quando a idade não foi informada.
  idadeMinMeses: number;
  idadeMaxMeses: number;
}

type CompactRow =
  | [number, string, string, string, string, string, Selo, Politica]
  | [
      number, string, string, string, string, string, Selo, Politica,
      string, string, string, string, string, string,
    ];

// Mesma cópia servida pela própria origem que o filtro usa — ver a nota em
// client/src/pages/filtro.tsx sobre por que o fetch saiu do raw.githubusercontent.
const DATA_URL = `${import.meta.env.BASE_URL}data/neuroped_escalas_neuropsiquiatria_infantil_100.json`;

const fallbackScales: EscalaLivre[] = [
  { n: 1, sigla: "SWYC Milestones", nome: "Survey of Well-being of Young Children – Developmental Milestones", categoria: "Desenvolvimento e TEA", idade: "0–5.5", respondente: "Pais/cuidadores", selo: "Ouro", politica: "embed", score: "Marcos por idade; atraso = marcos ausentes", cutoff: "Marcos ausentes para a idade = atraso", diagnostico: "Triagem do desenvolvimento (0–60 meses)", sintomas: ["marcos ausentes", "atraso de linguagem", "atraso motor"], queixas: ["atraso", "funcionalidade"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/26708859/", idadeMinMeses: 0, idadeMaxMeses: 66 },
  { n: 7, sigla: "M-CHAT-R", nome: "Modified Checklist for Autism in Toddlers, Revised", categoria: "Desenvolvimento e TEA", idade: "1.33–2.5", respondente: "Pais/cuidadores", selo: "Ouro", politica: "permission", score: "23 itens sim/não", cutoff: "≥ 2–3 itens de risco = encaminhamento", diagnostico: "Rastreio de TEA (16–30 meses)", sintomas: ["não atende pelo nome", "não aponta", "contato visual reduzido"], queixas: ["tea"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/24366990/", idadeMinMeses: 16, idadeMaxMeses: 30 },
  { n: 8, sigla: "M-CHAT-R/F", nome: "Modified Checklist for Autism in Toddlers, Revised with Follow-Up", categoria: "Desenvolvimento e TEA", idade: "1.33–2.5", respondente: "Pais + entrevista", selo: "Ouro", politica: "permission", score: "20 itens + entrevista follow-up", cutoff: "Score 0–2 baixo; 3–7 moderado (follow-up); ≥ 8 alto", diagnostico: "Rastreio de TEA (16–30 meses)", sintomas: ["não atende pelo nome", "não aponta", "contato visual reduzido", "jogo simbólico ausente"], queixas: ["tea"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/24366990/", idadeMinMeses: 16, idadeMaxMeses: 30 },
  { n: 17, sigla: "PSC-17 Parent", nome: "Pediatric Symptom Checklist – 17 Item Parent Version", categoria: "Comportamento geral", idade: "4–17", respondente: "Pais/cuidadores", selo: "Ouro", politica: "embed", score: "3 subescalas (atenção, internalização, externalização), 0–2 por item", cutoff: "Subescalas: atenção ≥ 7; internalização ≥ 9; externalização ≥ 8 (pais)", diagnostico: "Problemas psicossociais pediátricos (4–16 anos)", sintomas: ["problemas de atenção", "queixas internalizantes", "comportamento externalizante"], queixas: ["tdah", "comportamento", "ansiedade"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/16487850/", idadeMinMeses: 48, idadeMaxMeses: 192 },
  { n: 19, sigla: "SDQ Parent", nome: "Strengths and Difficulties Questionnaire – Parent Version", categoria: "Comportamento geral", idade: "2–17", respondente: "Pais/cuidadores", selo: "Ouro", politica: "permission", score: "25 itens 0–2; 5 subescalas + total 0–40", cutoff: "Total: 0–13 normal; 14–16 limítrofe; ≥ 17 anormal", diagnostico: "Rastreio de problemas emocionais/comportamentais (2–17 anos)", sintomas: ["hiperatividade", "problemas de conduta", "sintomas emocionais", "dificuldade com colegas"], queixas: ["tdah", "comportamento", "ansiedade"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/11699809/", idadeMinMeses: 24, idadeMaxMeses: 204 },
  { n: 30, sigla: "SNAP-IV-26", nome: "Swanson, Nolan and Pelham Questionnaire – Fourth Edition, 26 Item Teacher and Parent Rating Scale", categoria: "TDAH", idade: "6–17", respondente: "Pais/professor", selo: "Ouro", politica: "permission", score: "26 itens 0–3; média ≥ 2 = presente no limiar clínico", cutoff: "Itens 1–9 (desatenção) e 10–18 (hiperatividade/impulsividade) ≥ 2", diagnostico: "TDAH e transtorno opositivo-desafiador (6–18 anos)", sintomas: ["desatenção", "hiperatividade", "impulsividade", "oposição"], queixas: ["tdah", "comportamento"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/30236592/", idadeMinMeses: 72, idadeMaxMeses: 216 },
  { n: 34, sigla: "SCARED Child", nome: "Screen for Child Anxiety Related Emotional Disorders – Child Version", categoria: "Ansiedade e humor", idade: "8–18", respondente: "Criança/adolescente", selo: "Ouro", politica: "permission", score: "41 itens 0–2; total 0–82 e 5 subescalas", cutoff: "Total ≥ 25; subescalas: separação ≥ 9; AG ≥ 9; fobia social ≥ 8; pânico ≥ 7; escolar ≥ 3", diagnostico: "Transtornos de ansiedade infantil (8–18 anos)", sintomas: ["ansiedade de separação", "fobia social", "sintomas de pânico", "ansiedade escolar"], queixas: ["ansiedade"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/9100430/", idadeMinMeses: 96, idadeMaxMeses: 216 },
  { n: 39, sigla: "RCADS-47 Child", nome: "Revised Child Anxiety and Depression Scale – 47 Item Child Version", categoria: "Ansiedade e humor", idade: "8–18", respondente: "Criança/adolescente", selo: "Ouro", politica: "permission", score: "47 itens 0–3; escores-T por subescala (média 50, DP 10)", cutoff: "T ≥ 70 clinicamente significativo; 60–69 limítrofe", diagnostico: "Ansiedade e depressão alinhado ao DSM-5 (8–18 anos)", sintomas: ["ansiedade de separação", "fobia social", "obsessões/compulsões", "sintomas depressivos"], queixas: ["ansiedade", "depressao", "toc"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/21135052/", idadeMinMeses: 96, idadeMaxMeses: 216 },
  { n: 47, sigla: "ASQ", nome: "Ask Suicide-Screening Questions", categoria: "Segurança clínica", idade: "8–24", respondente: "Paciente", selo: "Ouro", politica: "embed", score: "4 itens + 1 de acuidade; sim/não", cutoff: "≥ 1 resposta sim = triagem positiva → avaliação imediata", diagnostico: "Risco de suicídio em contexto de saúde (8–24 anos)", sintomas: ["ideação suicida", "desejo de morrer", "autolesão"], queixas: ["suicidio"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/22584701/", idadeMinMeses: 96, idadeMaxMeses: 288 },
  { n: 49, sigla: "CATS", nome: "Child and Adolescent Trauma Screen", categoria: "Trauma e TEPT", idade: "7–17", respondente: "Criança/cuidador", selo: "Ouro", politica: "permission", score: "20 itens; 10 sintomas de estresse pós-traumático (DSM-5)", cutoff: "≥ 4 sintomas presentes no último mês = risco de TEPT", diagnostico: "Trauma e TEPT em crianças/adolescentes (7–17 anos)", sintomas: ["revivescência", "evitação", "hiperalerta", "embotamento"], queixas: ["trauma"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/26950378/", idadeMinMeses: 84, idadeMaxMeses: 204 },
  { n: 61, sigla: "YGTSS", nome: "Yale Global Tic Severity Scale", categoria: "Tiques e bipolaridade", idade: "5–18", respondente: "Clínico", selo: "Ouro", politica: "permission", score: "Número, frequência, intensidade, complexidade, interferência × 5 (motores e fônicos); total 0–100", cutoff: "Tiques motores + fônicos ≤ 15 leve; 16–24 moderado; 25–33 acentuado; 34–42 grave; ≥ 43 extremo", diagnostico: "Gravidade de tiques / síndrome de Tourette (6–17 anos)", sintomas: ["tiques motores", "tiques fônicos", "interferência funcional"], queixas: ["tiques"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/7995646/", idadeMinMeses: 60, idadeMaxMeses: 216 },
  { n: 75, sigla: "CRAFFT 2.1", nome: "Car, Relax, Alone, Forget, Friends, Trouble Screening Tool – Version 2.1", categoria: "Substâncias e alimentação", idade: "12–21", respondente: "Adolescente", selo: "Ouro", politica: "permission", score: "6 itens sim/não", cutoff: "≥ 2 sim = risco alto → avaliação adicional", diagnostico: "Uso problemático de substâncias em adolescentes (12–21 anos)", sintomas: ["uso de álcool/cannabis", "uso de risco", "consequências sociais do uso"], queixas: ["substancias"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/19336617/", idadeMinMeses: 144, idadeMaxMeses: 252 },
  { n: 81, sigla: "PSQ-SRBD", nome: "Pediatric Sleep Questionnaire – Sleep-Related Breathing Disorder Scale", categoria: "Sono e PROMIS", idade: "2–18", respondente: "Pais/cuidadores", selo: "Ouro", politica: "permission", score: "22 itens; proporção de respostas sim", cutoff: "Proporção ≥ 0,33 = risco de AOS", diagnostico: "Risco de apneia obstrutiva do sono (2–18 anos)", sintomas: ["ronco", "pausas respiratórias", "sonolência diurna"], queixas: ["sono", "tdah"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/10760296/", idadeMinMeses: 24, idadeMaxMeses: 216 },
  { n: 83, sigla: "PROMIS Pediatric Anxiety", nome: "Patient-Reported Outcomes Measurement Information System Pediatric Anxiety Short Form", categoria: "Sono e PROMIS", idade: "8–17", respondente: "Criança/adolescente", selo: "Ouro", politica: "embed", score: "Escore-T (média 50, DP 10)", cutoff: "T > 60 = ansiedade moderada; T > 70 = ansiedade severa", diagnostico: "Sintomas de ansiedade por relato do paciente (8–17 anos)", sintomas: ["preocupação", "medo", "tensão"], queixas: ["ansiedade"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/34516285/", idadeMinMeses: 96, idadeMaxMeses: 204 },
  { n: 84, sigla: "PROMIS Pediatric Depressive Symptoms", nome: "Patient-Reported Outcomes Measurement Information System Pediatric Depressive Symptoms Short Form", categoria: "Sono e PROMIS", idade: "8–17", respondente: "Criança/adolescente", selo: "Ouro", politica: "embed", score: "Escore-T (média 50, DP 10)", cutoff: "T > 60 = sintomas depressivos moderados; T > 70 = severos", diagnostico: "Sintomas depressivos por relato do paciente (8–17 anos)", sintomas: ["tristeza", "desânimo", "anedonia"], queixas: ["depressao"], pubmed: "https://pubmed.ncbi.nlm.nih.gov/34516285/", idadeMinMeses: 96, idadeMaxMeses: 204 },
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

// Faixas etárias para o filtro inteligente (meses) — coerentes com o app.
const FAIXAS_ETARIAS = [
  { id: "0-2a", label: "0–2 anos", min: 0, max: 23.99 },
  { id: "2-6a", label: "2–6 anos", min: 24, max: 71.99 },
  { id: "6-12a", label: "6–12 anos", min: 72, max: 143.99 },
  { id: "12-18a", label: "12–18 anos", min: 144, max: 215.99 },
];

// Queixas/diagnósticos-alvo canônicos do app (client/src/data/scaleFilter.ts)
const QUEIXAS_DEF: { id: string; label: string }[] = [
  { id: "atraso", label: "Atraso do desenvolvimento" },
  { id: "tea", label: "Autismo / TEA" },
  { id: "tdah", label: "TDAH" },
  { id: "comportamento", label: "Comportamento" },
  { id: "ansiedade", label: "Ansiedade" },
  { id: "depressao", label: "Depressão / Humor" },
  { id: "epilepsia", label: "Epilepsia" },
  { id: "pc", label: "Paralisia cerebral / Motor" },
  { id: "linguagem", label: "Linguagem" },
  { id: "sono", label: "Sono" },
  { id: "cognicao", label: "Cognição" },
  { id: "aprendizagem", label: "Aprendizagem" },
  { id: "funcionalidade", label: "Funcionalidade" },
  { id: "neonatal", label: "Neonatal" },
  { id: "suicidio", label: "Risco de suicídio" },
  { id: "tiques", label: "Tiques / Tourette" },
  { id: "trauma", label: "Trauma / TEPT" },
  { id: "sensorial", label: "Sensorial" },
  { id: "dor", label: "Dor" },
  { id: "substancias", label: "Substâncias" },
  { id: "social", label: "Social" },
  { id: "autonomia", label: "Autonomia" },
  { id: "efeitos", label: "Monitorização de efeitos" },
];

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
  return "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-amber-950/30 dark:text-orange-100";
}

function badgePolitica(politica: Politica) {
  if (politica === "embed") return "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100";
  if (politica === "permission") return "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100";
  return "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100";
}

/**
 * Converte o texto de faixa etária ("16 dias a 42 meses", "3–17 anos"…) em
 * meses. Retorna { min, max } com máximo limitado a 216 meses (18 anos).
 */
function parseIdadeMeses(texto: string): { min: number; max: number } {
  // Em "N a M unidade" / "N–M unidade" o primeiro número não traz unidade
  // própria — ele herda a unidade do segundo (ex.: "3 a 22 anos" = 3 a 22
  // anos, não 3 meses a 22 anos). Sem essa expansão o número inicial ficava
  // sem conversão (ou, em ranges com travessão, era descartado), produzindo
  // faixas invertidas (min > max) que excluíam a escala de qualquer filtro.
  const t = texto
    .toLowerCase()
    .replace(
      /(\d+(?:[.,]\d+)?)\s*(?:a|-|–|—)\s*(\d+(?:[.,]\d+)?)\s*(dias?|semanas?|meses?|anos?)/g,
      "$1 $3 a $2 $3",
    );
  const itens = t.match(/(\d+(?:[.,]\d+)?)\s*(dias?|semanas?|meses?|anos?)/g) ?? [];
  const pares = itens.map((it) => {
    const m = it.match(/([\d.,]+)\s*(dias?|semanas?|meses?|anos?)/);
    if (!m) return null;
    const v = Number(m[1].replace(",", "."));
    const u = m[2];
    if (u.startsWith("dia")) return v / 30;
    if (u.startsWith("sem")) return v / 4.345;
    if (u.startsWith("mes")) return v;
    return v * 12;
  }).filter((x): x is number => x !== null);
  if (pares.length === 0) return { min: 0, max: 216 };
  return { min: Math.max(0, Math.round(Math.min(...pares))), max: Math.min(Math.round(Math.max(...pares)), 216) };
}

function compactRowToScale(row: CompactRow): EscalaLivre {
  const idadeMeses = parseIdadeMeses(row[4]);
  return {
    n: row[0],
    sigla: row[1],
    nome: row[2],
    categoria: row[3],
    idade: row[4],
    respondente: row[5],
    selo: row[6],
    politica: row[7],
    score: row.length >= 10 && row[8] ? row[8] : "",
    cutoff: row.length >= 11 && row[9] ? row[9] : "",
    diagnostico: row.length >= 12 && row[10] ? row[10] : "",
    sintomas: (row.length >= 13 && row[11] ? row[11] : "").split("|").filter(Boolean),
    queixas: (row.length >= 14 && row[12] ? row[12] : "").split("|").filter(Boolean),
    pubmed: row.length >= 15 && row[13] ? row[13] : "",
    idadeMinMeses: idadeMeses.min,
    idadeMaxMeses: idadeMeses.max,
  };
}

/** Remove negrito residual (**) dos textos do registro. */
function limpar(texto: string): string {
  return texto.replace(/\*\*/g, "");
}

function EscalaChip({ rotulo }: { rotulo: string }) {
  return (
    <span className="inline-block rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-foreground/80">
      {rotulo}
    </span>
  );
}

export default function EscalasNeuropsiquiatriaPage() {
  const [escalas, setEscalas] = useState<EscalaLivre[]>(fallbackScales);
  const [status, setStatus] = useState<"loading" | "ok" | "fallback">("loading");
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [selo, setSelo] = useState<"Todos" | Selo>("Todos");
  const [politica, setPolitica] = useState<"Todas" | Politica>("Todas");
  const [faixaEtaria, setFaixaEtaria] = useState("Todas");
  const [queixasSelecionadas, setQueixasSelecionadas] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    async function loadRegistry() {
      try {
        const response = await fetch(DATA_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`Falha ao carregar registro: ${response.status}`);
        const payload = await response.json() as { escalas?: CompactRow[] };
        const parsed = (payload.escalas || []).map(compactRowToScale);
        if (parsed.length < 100) throw new Error(`Registro incompleto: ${parsed.length}`);
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

  const sintomasDisponiveis = useMemo(() => {
    const contador = new Map<string, number>();
    for (const escala of escalas)
      for (const s of escala.sintomas) contador.set(s, (contador.get(s) ?? 0) + 1);
    return Array.from(contador.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([rotulo]) => rotulo);
  }, [escalas]);

  const totalOuro = escalas.filter((escala) => escala.selo === "Ouro").length;
  const totalEmbed = escalas.filter((escala) => escala.politica === "embed").length;
  const totalComDiagnostico = escalas.filter((escala) => escala.diagnostico).length;

  const filtradas = useMemo(() => {
    const q = normalizar(busca);
    return escalas
      .filter((escala) => {
        const texto = normalizar(
          `${escala.sigla} ${escala.nome} ${escala.categoria} ${escala.respondente} ${escala.idade} ${escala.score} ${escala.cutoff} ${escala.diagnostico} ${escala.sintomas.join(" ")} ${escala.queixas.join(" ")}`,
        );
        const matchBusca = !q || texto.includes(q);
        const matchCategoria = categoria === "Todas" || escala.categoria === categoria;
        const matchSelo = selo === "Todos" || escala.selo === selo;
        const matchPolitica = politica === "Todas" || escala.politica === politica;
        // Filtro de faixa etária: a escala atende se algum mês da faixa
        // selecionada estiver dentro do intervalo de indicação dela.
        const faixa = FAIXAS_ETARIAS.find((f) => f.id === faixaEtaria) ?? null;
        const matchIdade = !faixa || (escala.idadeMaxMeses >= faixa.min && escala.idadeMinMeses <= faixa.max);
        // Filtro de queixa/diagnóstico: escala marcada com a queixa canônica.
        const matchQueixas =
          queixasSelecionadas.length === 0 ||
          queixasSelecionadas.some((qid) => escala.queixas.includes(qid));
        return matchBusca && matchCategoria && matchSelo && matchPolitica && matchIdade && matchQueixas;
      })
      .sort((a, b) => seloPeso[a.selo] - seloPeso[b.selo] || a.n - b.n);
  }, [busca, categoria, selo, politica, faixaEtaria, queixasSelecionadas, escalas]);

  function alternarQueixa(qid: string) {
    setQueixasSelecionadas((atual) =>
      atual.includes(qid) ? atual.filter((q) => q !== qid) : [...atual, qid],
    );
  }

  const filtrosAtivos =
    busca || categoria !== "Todas" || selo !== "Todos" || politica !== "Todas" ||
    faixaEtaria !== "Todas" || queixasSelecionadas.length > 0;

  return (
    <div className="page-enter space-y-5 pb-10">
      <section className="rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/40 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">NeuroPed · catálogo mundial gratuito/sem custo</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">100 escalas de neuropsiquiatria infantil</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Registro operacional para triagem, escolha de instrumento e curadoria clínica, com filtros inteligentes por faixa etária, sinais/sintomas e diagnóstico-alvo (curadoria baseada em evidência e referências PubMed). A tela não copia itens protegidos: mostra metadados, nome por extenso, sistema de escore, pontos de corte e política de incorporação.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="text-xl font-bold text-amber-900 dark:text-amber-100">{escalas.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-amber-800 dark:text-amber-200">escalas</div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="text-xl font-bold text-amber-900 dark:text-amber-100">{totalOuro}</div>
              <div className="text-[10px] uppercase tracking-wide text-amber-800 dark:text-amber-200">ouro</div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
              <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{totalEmbed}</div>
              <div className="text-[10px] uppercase tracking-wide text-emerald-800 dark:text-emerald-200">embed</div>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-3 dark:border-violet-900 dark:bg-violet-950/20">
              <div className="text-xl font-bold text-violet-900 dark:text-violet-100">{totalComDiagnostico}</div>
              <div className="text-[10px] uppercase tracking-wide text-violet-800 dark:text-violet-200">com corte</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros clássicos */}
      <section className="rounded-[1.5rem] border border-border/70 bg-card/90 p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-4">
          <label htmlFor="escalas-busca" className="space-y-1 lg:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Busca</span>
            <input
              id="escalas-busca"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Ex.: autismo, TDAH, ansiedade, trauma, dislexia, escala…"
              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
            />
          </label>
          <label htmlFor="escalas-categoria" className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Categoria</span>
            <select id="escalas-categoria" value={categoria} onChange={(event) => setCategoria(event.target.value)} className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm">
              {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label htmlFor="escalas-selo" className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Selo</span>
            <select id="escalas-selo" value={selo} onChange={(event) => setSelo(event.target.value as "Todos" | Selo)} className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm">
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

      {/* Filtros inteligentes: idade + queixa (diagnóstico) + sintomas */}
      <section className="rounded-[1.5rem] border border-primary/25 bg-card/90 p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Filtros inteligentes · idade, diagnóstico e sinais/sintomas</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Todas", ...FAIXAS_ETARIAS.map((f) => f.id)].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFaixaEtaria(item)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${faixaEtaria === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"}`}
            >
              {item === "Todas" ? "Todas as idades" : FAIXAS_ETARIAS.find((f) => f.id === item)?.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="flex w-full items-center text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Diagnóstico / suspeita clínica <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/70">(multi-seleção)</span>
          </span>
          {QUEIXAS_DEF.map((queixa) => {
            const ativa = queixasSelecionadas.includes(queixa.id);
            const nComQueixa = escalas.filter((e) => e.queixas.includes(queixa.id)).length;
            return (
              <button
                key={queixa.id}
                type="button"
                onClick={() => alternarQueixa(queixa.id)}
                aria-pressed={ativa}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${ativa ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"}`}
              >
                {queixa.label} <span className={`text-[10px] font-semibold ${ativa ? "text-primary-foreground/70" : "text-muted-foreground"}`}>· {nComQueixa}</span>
              </button>
            );
          })}
        </div>
        {sintomasDisponiveis.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Sinais e sintomas mais frequentes (busca)</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sintomasDisponiveis.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] text-foreground/80">
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Digite o sinal/sintoma na busca acima — por exemplo <em>“desatenção”</em>, <em>“ronco”</em>, <em>“regressão de marcos”</em> — para encontrar as escalas indicadas para aquele quadro.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-amber-200/70 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
        <strong>Trava de segurança:</strong> gratuito não significa domínio público. Para instrumentos marcados como “verificar permissão”, o NeuroPed deve exibir apenas ficha clínica e fonte oficial até autorização formal. Nenhuma escala confirma diagnóstico isoladamente — cortes e pontos de corte dependem de normas, contexto e julgamento clínico.
        {status !== "ok" && <span className="mt-2 block font-bold">Modo atual: {status === "loading" ? "carregando base completa" : "fallback local com instrumentos prioritários"}.</span>}
      </section>

      <section className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">resultado</p>
          <h2 className="text-lg font-bold text-foreground">{filtradas.length} instrumentos encontrados</h2>
        </div>
        <button
          type="button"
          onClick={() => { setBusca(""); setCategoria("Todas"); setSelo("Todos"); setPolitica("Todas"); setFaixaEtaria("Todas"); setQueixasSelecionadas([]); }}
          className={`rounded-full border border-border bg-background px-3 py-2 text-xs font-bold hover:border-primary/50 ${!filtrosAtivos ? "pointer-events-none opacity-50" : ""}`}
        >
          Limpar filtros
        </button>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtradas.map((escala) => (
          <article key={escala.n} className="flex min-h-[300px] flex-col rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">#{String(escala.n).padStart(3, "0")}</p>
                <h3 className="mt-1 text-base font-bold text-foreground">{escala.sigla}</h3>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{escala.nome}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${badgeSelo(escala.selo)}`}>
                {escala.selo}
              </span>
            </div>
            <div className="mt-4 grid gap-2 text-xs">
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
              {escala.diagnostico && (
                <div className="rounded-2xl bg-primary/5 p-3">
                  <strong className="text-foreground">Diagnóstico-alvo:</strong><br />
                  <span className="text-muted-foreground">{escala.diagnostico}</span>
                </div>
              )}
              {escala.score && (
                <details className="group rounded-2xl bg-muted/50 p-3">
                  <summary className="cursor-pointer list-none">
                    <strong className="text-foreground">Sistema de escore</strong>
                    <span className="ml-1 text-[10px] text-muted-foreground">(ver)</span>
                  </summary>
                  <p className="mt-2 text-muted-foreground">{limpar(escala.score)}</p>
                  {escala.cutoff && (
                    <p className="mt-2 font-semibold text-foreground">
                      Corte: <span className="font-normal text-muted-foreground">{limpar(escala.cutoff)}</span>
                    </p>
                  )}
                </details>
              )}
              {escala.sintomas.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {escala.sintomas.slice(0, 5).map((s) => <EscalaChip key={s} rotulo={s} />)}
                  {escala.sintomas.length > 5 && (
                    <span className="text-[10px] text-muted-foreground">+{escala.sintomas.length - 5}</span>
                  )}
                </div>
              )}
              {escala.pubmed && (
                <a
                  href={escala.pubmed}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  Referência PubMed ↗
                </a>
              )}
            </div>
            <div className="mt-auto pt-4">
              <div className={`rounded-2xl border p-3 text-xs leading-relaxed ${badgePolitica(escala.politica)}`}>
                <strong>{politicaLabel[escala.politica]}:</strong> {politicaDescricao[escala.politica]}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
