import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Baby, Puzzle, Zap, Flame, AlertTriangle, CloudRain, Activity,
  Accessibility, MessageCircle, Moon, UtensilsCrossed, HeartPulse,
  Brain, GraduationCap, Users, ShieldAlert, Sparkles, Pill,
  Search, X, Filter, ArrowRight, Clock, UserCheck, CheckCircle2,
  Droplet, Move, Lightbulb, Stethoscope, BookOpen, School,
  ClipboardCheck, BrainCog, Ear, SmilePlus, Star, ChevronRight, Target
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { allScales, filterScales, type ScaleEntry } from "@/data/scaleFilter";
import { pharmCategories, type PharmCategory, type Drug } from "@/data/farmacologia";
import { motion } from "framer-motion";
import { softTap, softTick, softHover } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { easing, duration } from "@/lib/motion";
import { Mascote } from "@/components/Mascote";
import { celebrate } from "@/lib/confetti";
import { useFavorites } from "@/hooks/useFavorites";

const iconMap: Record<string, any> = {
  baby: Baby, puzzle: Puzzle, zap: Zap, flame: Flame,
  "alert-triangle": AlertTriangle, "cloud-rain": CloudRain,
  activity: Activity, accessibility: Accessibility,
  "message-circle": MessageCircle, moon: Moon,
  "utensils-crossed": UtensilsCrossed, "heart-pulse": HeartPulse,
  brain: Brain, "graduation-cap": GraduationCap, users: Users,
  "shield-alert": ShieldAlert, sparkles: Sparkles, pill: Pill,
  droplet: Droplet, move: Move,
};

// ══════════════════════════════════════════════════════════
// FERRAMENTAS EXTRAS (páginas que não estão no scaleFilter)
// ══════════════════════════════════════════════════════════
interface ExtraTool {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: any;
  gradient: string;
  tags: string[];
}

const extraTools: ExtraTool[] = [
  { id: "testes-reconhecimento", name: "Reconhecimento (2-7a)", description: "Cores, letras, animais e partes do corpo por faixa etária", route: "/testes-reconhecimento", icon: Baby, gradient: "from-pink-500 to-rose-500", tags: ["pedagogico", "teste", "reconhecimento", "cores", "letras", "animais", "corpo", "crianca", "menor", "2 anos", "3 anos", "4 anos", "5 anos", "atraso"] },
  { id: "testes-academicos", name: "Acadêmico (5-14a)", description: "Leitura, escrita e aritmética por faixa etária", route: "/testes-academicos", icon: GraduationCap, gradient: "from-blue-500 to-indigo-600", tags: ["pedagogico", "teste", "leitura", "escrita", "aritmetica", "matematica", "escola", "estudo", "academico", "tde", "aprendizagem", "nota", "reprovado"] },
  { id: "inventarios-auto", name: "Autoavaliação (8-17a)", description: "8 inventários: humor, ansiedade, atenção, sono, alimentação, social, escola, comportamento", route: "/inventarios-auto", icon: ClipboardCheck, gradient: "from-violet-500 to-purple-600", tags: ["autoaplicavel", "inventario", "humor", "ansiedade", "atencao", "sono", "alimentacao", "social", "escola", "comportamento", "crianca", "adolescente"] },
  { id: "inventarios-escola", name: "Inventários p/ Escola", description: "4 questionários para professores: comportamento, TEA, alfabetização, funções executivas", route: "/inventarios-escola", icon: School, gradient: "from-emerald-500 to-teal-600", tags: ["escola", "professor", "pedagogico", "comportamento", "tea", "autismo", "alfabetizacao", "funcoes executivas", "inventario", "questionario"] },
  { id: "tde2", name: "TDE-2 Adaptado Dr. Jadson", description: "Teste de desempenho escolar: leitura, escrita, aritmética (4-14 anos)", route: "/tde2", icon: BookOpen, gradient: "from-cyan-500 to-blue-600", tags: ["tde", "pedagogico", "leitura", "escrita", "aritmetica", "desempenho", "escola", "estudo", "teste", "academico", "nota"] },
  { id: "ahsd-tea", name: "Triagem AH/SD × TEA", description: "50 itens — diagnóstico diferencial superdotação vs autismo (resposta da professora)", route: "/ahsd-tea", icon: Sparkles, gradient: "from-amber-500 to-yellow-500", tags: ["ahsd", "superdotado", "superdotacao", "tea", "autismo", "professor", "escola", "inteligente", "genio", "altas habilidades"] },
  { id: "satisfacao-medicacao", name: "Satisfação com Medicação", description: "Eficácia, efeitos adversos, dose, forma de administrar — resposta dos pais", route: "/satisfacao-medicacao", icon: SmilePlus, gradient: "from-emerald-500 to-green-600", tags: ["medicacao", "medicamento", "efeito", "adverso", "dose", "eficacia", "remedio", "risperidona", "metilfenidato", "ritalina", "satisfacao"] },
  { id: "prontuario", name: "Prontuário Clínico", description: "Anamnese, marcos, medicações, terapias, exames — gera relatório completo", route: "/prontuario", icon: Stethoscope, gradient: "from-violet-500 to-purple-600", tags: ["prontuario", "anamnese", "consulta", "relatorio", "marcos", "desenvolvimento", "medicacao", "terapia", "exame"] },
  { id: "neuropsicologia", name: "Avaliação Neuropsicológica", description: "Guia didático: o que é, quando pedir, testes, como interpretar", route: "/neuropsicologia", icon: BrainCog, gradient: "from-indigo-500 to-violet-600", tags: ["neuropsicologico", "neuropsicologia", "cognicao", "memoria", "atencao", "funcao executiva", "qi", "wisc", "avaliacao"] },
  { id: "pac", name: "Processamento Auditivo", description: "PAC: habilidades auditivas, avaliação, diferencial com TDAH", route: "/pac", icon: Ear, gradient: "from-fuchsia-500 to-purple-600", tags: ["pac", "auditivo", "processamento", "ouvir", "troca letra", "nao entende", "fala errado", "audiologia"] },
  { id: "avaliacao-multiprofissional", name: "Avaliação Multiprofissional", description: "Guia de instrumentos por faixa etária: linguagem, cognição, inteligência, TEA, aprendizagem", route: "/avaliacao-multiprofissional", icon: ClipboardCheck, gradient: "from-emerald-500 to-teal-600", tags: ["avaliacao", "multiprofissional", "instrumento", "protocolo", "wisc", "son-r", "denver", "portage", "tde", "fono", "psicologo", "neuropsicologico", "to"] },
  { id: "plano-terapeutico", name: "Plano Terapêutico (PTI)", description: "Gerador de plano terapêutico individualizado multiprofissional", route: "/plano-terapeutico", icon: Target, gradient: "from-rose-500 to-pink-600", tags: ["plano", "terapeutico", "intervencao", "objetivo", "estrategia", "multiprofissional", "pti", "tratamento", "metas"] },
  { id: "plano-intervencao", name: "Intervenção por Habilidades", description: "Como intervir em 7 áreas: social, cognitiva, linguagem, matemática, atenção, sensorial, inclusão", route: "/plano-intervencao", icon: Lightbulb, gradient: "from-amber-500 to-orange-500", tags: ["intervencao", "habilidade", "social", "cognitivo", "linguagem", "matematica", "atencao", "sensorial", "inclusao", "estrategia", "atividade"] },
];

// ══════════════════════════════════════════════════════════
// QUEIXAS — termos coloquiais
// ══════════════════════════════════════════════════════════

const queixas = [
  { id: "agitado", label: "Agitado", emoji: "⚡", q: ["tdah"] },
  { id: "desatento", label: "Desatento", emoji: "💭", q: ["tdah", "cognicao"] },
  { id: "agressivo", label: "Agressivo", emoji: "👊", q: ["comportamento", "tea"] },
  { id: "irritado", label: "Irritado / Birra", emoji: "😤", q: ["comportamento", "depressao"] },
  { id: "autismo", label: "Autismo / TEA", emoji: "🧩", q: ["tea"] },
  { id: "nao-fala", label: "Não fala", emoji: "🤐", q: ["linguagem", "atraso", "tea"] },
  { id: "atrasado", label: "Atrasado", emoji: "🐢", q: ["atraso", "cognicao"] },
  { id: "estudo", label: "Estudo / Escola", emoji: "📉", q: ["aprendizagem", "tdah", "cognicao"] },
  { id: "ansioso", label: "Ansioso", emoji: "😰", q: ["ansiedade"] },
  { id: "triste", label: "Triste", emoji: "😢", q: ["depressao"] },
  { id: "convulsao", label: "Convulsão", emoji: "⚡", q: ["epilepsia"] },
  { id: "nao-dorme", label: "Não dorme", emoji: "🌙", q: ["sono"] },
  { id: "nao-anda", label: "Não anda", emoji: "🚶", q: ["motor", "pc", "atraso"] },
  { id: "nao-come", label: "Não come", emoji: "🍽️", q: ["alimentacao"] },
  { id: "xixi", label: "Xixi na cama", emoji: "💧", q: ["enurese"] },
  { id: "tiques", label: "Tiques", emoji: "😜", q: ["tiques"] },
  { id: "teimoso", label: "Teimoso", emoji: "🚫", q: ["comportamento"] },
  { id: "preguicoso", label: "Preguiçoso", emoji: "😴", q: ["depressao", "tdah"] },
  { id: "pedagogico", label: "Pedagógico", emoji: "📝", q: ["aprendizagem", "cognicao"] },
  { id: "dor-cabeca", label: "Dor de cabeça", emoji: "🤕", q: ["dor"] },
  { id: "se-machuca", label: "Autolesão", emoji: "🆘", q: ["suicidio"] },
  { id: "isolado", label: "Isolado", emoji: "🙈", q: ["tea", "ansiedade"] },
  { id: "superdotado", label: "Superdotado", emoji: "⭐", q: ["cognicao"] },
  { id: "trauma", label: "Trauma", emoji: "🛡️", q: ["trauma"] },
  { id: "substancias", label: "Drogas / Álcool", emoji: "🍷", q: ["substancias"] },
  { id: "sensorial", label: "Sensorial", emoji: "🖐️", q: ["sensorial"] },
  { id: "coordenacao", label: "Desajeitado", emoji: "🤸", q: ["motor", "pc"] },
  { id: "independencia", label: "Dependente", emoji: "🏠", q: ["autonomia", "funcionalidade"] },
  { id: "social-isolado", label: "Sem amigos", emoji: "😶", q: ["social", "tea"] },
  { id: "evolucao", label: "Reavaliação", emoji: "📈", q: ["evolucao"] },
  { id: "pos-tratamento", label: "Pós-tratamento", emoji: "🔄", q: ["evolucao", "efeitos"] },
];

const idades = [
  { id: "0-1", label: "0–1a", min: 0, max: 12 },
  { id: "1-3", label: "1–3a", min: 12, max: 36 },
  { id: "3-6", label: "3–6a", min: 36, max: 72 },
  { id: "6-10", label: "6–10a", min: 72, max: 120 },
  { id: "10-14", label: "10–14a", min: 120, max: 168 },
  { id: "14-18", label: "14–18a", min: 168, max: 216 },
];

function norm(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// ── Sinônimos coloquiais → clínicos ──
const syn: Record<string, string[]> = {
  "agitado": ["tdah", "hiperatividade", "hiperativo", "eletrico", "nao para", "inquieto", "pilha"],
  "desatento": ["tdah", "desatencao", "distraido", "avoado", "nao presta atencao", "nao se concentra"],
  "agressivo": ["comportamento", "agressividade", "bate", "morde", "briga", "tod"],
  "irritado": ["comportamento", "irritabilidade", "birra", "nervoso", "birrento", "explosivo", "tod"],
  "autismo": ["tea", "autista", "espectro", "asd", "asperger", "f84", "nao olha", "nao brinca", "mundo dele"],
  "nao fala": ["linguagem", "atraso", "fala", "mudo", "fala errado", "fala pouco", "demora pra falar"],
  "atrasado": ["atraso", "lento", "desenvolvimento", "cognicao", "motor", "linguagem"],
  "estudo": ["aprendizagem", "escola", "pedagogico", "leitura", "escrita", "nota", "reprovado", "prova", "tde", "academico"],
  "pedagogico": ["aprendizagem", "escola", "tde", "alfabetizacao", "inventario", "teste", "professor", "leitura", "escrita"],
  "ansioso": ["ansiedade", "medo", "fobia", "panico", "nervoso", "medroso", "timido"],
  "triste": ["depressao", "humor", "choro", "apatico", "desanimado", "sem vontade"],
  "convulsao": ["epilepsia", "crise", "ausencia", "desliga", "tonico", "clonico", "g40"],
  "nao dorme": ["sono", "insonia", "dormir", "pesadelo", "acorda"],
  "nao anda": ["motor", "pc", "paralisia", "hipotonia", "espasticidade", "desajeitado", "cai muito"],
  "nao come": ["alimentacao", "seletividade", "recusa alimentar", "engasga"],
  "xixi": ["enurese", "cama", "fralda", "noturno"],
  "tiques": ["tiques", "tourette", "piscar", "grunhir", "careta"],
  "teimoso": ["comportamento", "tod", "oposicao", "desafiador", "desobediente", "rebelde"],
  "preguicoso": ["depressao", "tdah", "desatencao", "apatico", "motivacao", "desanimado"],
  "isolado": ["tea", "ansiedade", "social", "nao brinca"],
  "superdotado": ["cognicao", "ahsd", "altas habilidades", "genio", "inteligente"],
  "trauma": ["trauma", "tept", "abuso", "violencia"],
  "se machuca": ["suicidio", "autolesao", "autoagressao", "se corta", "cutting"],
  "dor cabeca": ["dor", "cefaleia", "enxaqueca", "migranea"],
  // Termos diretos
  "tdah": ["deficit", "atencao", "hiperatividade", "adhd", "f90", "agitado", "desatento"],
  "tea": ["autismo", "autista", "espectro", "f84", "asperger"],
  "epilepsia": ["convulsao", "crise", "g40", "anticonvulsivante"],
  "depressao": ["depressivo", "triste", "humor", "f32", "f33"],
  "ansiedade": ["ansioso", "medo", "fobia", "panico", "f41", "f40"],
  "aprendizagem": ["escola", "estudo", "leitura", "escrita", "dislexia", "discalculia", "f81", "pedagogico", "tde", "academico"],
  "comportamento": ["agressividade", "birra", "tod", "f91", "irritado", "agressivo", "teimoso"],
  "linguagem": ["fala", "comunicacao", "fonologia", "gagueira", "f80", "troca letra"],
  "sono": ["insonia", "dormir", "pesadelo", "melatonina", "g47"],
  "motor": ["paralisia", "coordenacao", "hipotonia", "gmfcs", "g80"],
  "cognicao": ["intelectual", "qi", "neuropsicologico", "memoria", "funcao executiva"],
  // Medicações comuns
  "risperidona": ["antipsicotico", "irritabilidade", "tea"],
  "metilfenidato": ["ritalina", "concerta", "tdah"],
  "carbamazepina": ["tegretol", "epilepsia"],
  "valproato": ["depakene", "epilepsia", "valproico"],
  "fluoxetina": ["prozac", "depressao", "ansiedade"],
};

const q2cat: Record<string, string[]> = {
  "tea": ["tea"], "tdah": ["tdah"], "comportamento": ["tod", "comportamento"],
  "ansiedade": ["ansiedade-separacao", "ansiedade-social", "tag", "ansiedade"],
  "depressao": ["depressao"], "sono": ["sono"], "epilepsia": ["epilepsia", "crise-febril"],
  "pc": ["paralisia-cerebral"], "tiques": ["tiques"], "enurese": ["enurese"],
  "dor": ["cefaleia", "dor-neuropatica"], "suicidio": ["depressao"],
  "alimentacao": ["transtorno-alimentar"], "cognicao": ["di"],
  "atraso": ["di"], "motor": ["movimento", "paralisia-cerebral"],
  "linguagem": ["tea"], "trauma": ["tept"],
};

const prioConfig = {
  triagem: { label: "Triagem", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  diagnostica: { label: "Diagnóstica", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  monitorizacao: { label: "Acompanhamento", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
};

function ageStr(m: number) {
  if (m < 12) return `${m}m`;
  const y = Math.floor(m / 12);
  const r = m % 12;
  return r === 0 ? `${y}a` : `${y}a${r}m`;
}

// ── Expandir tokens com sinônimos ──
function expandTokens(tokens: string[]): string[][] {
  return tokens.map(tk => {
    const set = new Set([tk]);
    for (const [key, vals] of Object.entries(syn)) {
      const nk = norm(key);
      if (nk.includes(tk) || tk.includes(nk) || vals.some(v => norm(v).includes(tk) || tk.includes(norm(v)))) {
        set.add(nk);
        vals.forEach(v => set.add(norm(v)));
      }
    }
    return [...set];
  });
}

// ── Busca inteligente ──
function smartSearch(query: string) {
  const raw = norm(query);
  if (!raw || raw.length < 2) return { inScales: [] as ScaleEntry[], inPharm: [] as { cat: PharmCategory; drug: Drug }[], inTools: [] as ExtraTool[] };
  const tokens = raw.split(/\s+/).filter(t => t.length >= 1);
  if (tokens.length === 0) return { inScales: [], inPharm: [], inTools: [] };

  const expanded = expandTokens(tokens);

  // Escalas
  const scaleResults = allScales.map(s => {
    const hay = norm(`${s.name} ${s.fullName} ${s.description} ${s.queixas.join(" ")}`);
    let score = 0;
    for (const group of expanded) {
      if (group.some(t => hay.includes(t))) {
        score += group.some(t => norm(s.name).includes(t)) ? 5 : group.some(t => norm(s.fullName).includes(t)) ? 3 : 1;
      }
    }
    if (score > 0 && s.appRoute) score += 2;
    return { s, score };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);

  // Medicações
  const pharmResults: { cat: PharmCategory; drug: Drug; score: number }[] = [];
  for (const cat of pharmCategories) {
    for (const drug of cat.drugs) {
      const hay = norm(`${drug.name} ${drug.dose} ${drug.comment} ${cat.title} ${(drug.alerts || []).join(" ")}`);
      let score = 0;
      for (const group of expanded) {
        if (group.some(t => hay.includes(t))) {
          score += group.some(t => norm(drug.name).includes(t)) ? 5 : 1;
        }
      }
      if (score > 0) pharmResults.push({ cat, drug, score });
    }
  }
  pharmResults.sort((a, b) => b.score - a.score);

  // Ferramentas extras
  const toolResults = extraTools.filter(tool => {
    const hay = norm(`${tool.name} ${tool.description} ${tool.tags.join(" ")}`);
    return expanded.some(group => group.some(t => hay.includes(t)));
  });

  return {
    inScales: scaleResults.map(r => r.s),
    inPharm: pharmResults.map(r => ({ cat: r.cat, drug: r.drug })),
    inTools: toolResults,
  };
}

// ══════════════════════════════════════════════════════════
// COMPONENTE
// ══════════════════════════════════════════════════════════

export default function FiltroPage() {
  const [selQueixas, setSelQueixas] = useState<string[]>([]);
  const [selIdade, setSelIdade] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"tudo" | "escalas" | "meds" | "tools">("tudo");

  const idade = idades.find(i => i.id === selIdade);
  const ageRange = idade ? { min: idade.min, max: idade.max } : null;

  const techQ = useMemo(() => {
    const ids = new Set<string>();
    selQueixas.forEach(qid => {
      const q = queixas.find(x => x.id === qid);
      if (q) q.q.forEach(id => ids.add(id));
    });
    return [...ids];
  }, [selQueixas]);

  const results = useMemo(() => {
    const hasText = search.trim().length >= 2;
    const hasQ = techQ.length > 0;
    const hasAge = ageRange !== null;

    if (!hasText && !hasQ && !hasAge) return { scales: [] as ScaleEntry[], pharm: [] as { cat: PharmCategory; drug: Drug }[], tools: [] as ExtraTool[] };

    let resultScales: ScaleEntry[] = [];
    let resultPharm: { cat: PharmCategory; drug: Drug }[] = [];
    let resultTools: ExtraTool[] = [];

    if (hasText) {
      const sr = smartSearch(search);
      resultScales = sr.inScales;
      resultPharm = sr.inPharm;
      resultTools = sr.inTools;

      // Se tem filtros de queixa/idade, boost quem bate com ambos
      if (hasQ || hasAge) {
        const baseIds = new Set(filterScales(techQ, ageRange).map(s => s.id));
        const boosted = resultScales.map(s => ({ s, inFilter: baseIds.has(s.id) }));
        // Adicionar escalas do filtro que não apareceram no texto
        const textIds = new Set(resultScales.map(s => s.id));
        const extraFromFilter = filterScales(techQ, ageRange).filter(s => !textIds.has(s.id));
        resultScales = [
          ...boosted.filter(b => b.inFilter).map(b => b.s),
          ...boosted.filter(b => !b.inFilter).map(b => b.s),
          ...extraFromFilter,
        ];
      }
    } else {
      resultScales = filterScales(techQ, ageRange);
      // Medicações por queixa
      if (hasQ) {
        const catIds = new Set<string>();
        techQ.forEach(q => (q2cat[q] || []).forEach(id => catIds.add(id)));
        for (const cat of pharmCategories) {
          if ([...catIds].some(id => norm(cat.id).includes(norm(id)) || norm(cat.title).includes(norm(id)))) {
            cat.drugs.forEach(drug => resultPharm.push({ cat, drug }));
          }
        }
      }
      // Ferramentas extras por queixa
      const qTexts = selQueixas.flatMap(qid => {
        const q = queixas.find(x => x.id === qid);
        return q ? [q.id, q.label, ...q.q] : [];
      });
      resultTools = extraTools.filter(tool =>
        tool.tags.some(tag => qTexts.some(qt => norm(tag).includes(norm(qt)) || norm(qt).includes(norm(tag))))
      );
    }

    // Escalas com rota primeiro
    resultScales.sort((a, b) => {
      if (a.appRoute && !b.appRoute) return -1;
      if (!a.appRoute && b.appRoute) return 1;
      return 0;
    });

    return { scales: resultScales, pharm: resultPharm, tools: resultTools };
  }, [techQ, ageRange, search]);

  const toggleQ = (id: string) => setSelQueixas(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const hasFilters = selQueixas.length > 0 || selIdade !== null || search.trim().length >= 2;
  const total = results.scales.length + results.pharm.length + results.tools.length;

  // Confetti quando o filtro passa a apresentar resultados (transição 0 → >0)
  const prevTotal = useRef(0);
  useEffect(() => {
    if (hasFilters && total > 0 && prevTotal.current === 0) {
      celebrate();
    }
    prevTotal.current = hasFilters ? total : 0;
  }, [total, hasFilters]);

  // Escala ideal (destaque dourado)
  const idealResult = useMemo(() => getIdealScale(techQ, ageRange), [techQ, ageRange]);
  const idealId = idealResult?.id || null;
  const idealReason = idealResult?.reason || "";

  return (
    <div className="space-y-4 page-enter">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="flex items-center gap-3"
      >
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-md">
          <Filter className="w-5 h-5 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <h1
            className="text-xl text-foreground leading-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Filtro Inteligente
          </h1>
          <p className="text-xs text-muted-foreground italic">Escalas, testes, medicações e ferramentas</p>
        </div>
      </motion.div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="agitado, autismo, risperidona, SNAP, pedagógico, escola..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 pr-10 h-12 rounded-xl text-sm"
          data-testid="input-search"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Idade */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Idade</p>
        <div className="flex gap-1.5">
          {idades.map(f => (
            <button
              key={f.id}
              onMouseEnter={() => softHover()}
              onClick={() => {
                softTick();
                haptic.select();
                setSelIdade(selIdade === f.id ? null : f.id);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                selIdade === f.id ? "bg-primary text-white border-primary shadow-md" : "bg-card text-foreground border-border hover:bg-muted hover:border-primary/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Queixas */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Queixa</p>
          {selQueixas.length > 0 && (
            <button onClick={() => setSelQueixas([])} className="text-[11px] text-primary hover:underline">
              Limpar ({selQueixas.length})
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {queixas.map(q => {
            const sel = selQueixas.includes(q.id);
            return (
              <button
                key={q.id}
                onMouseEnter={() => softHover()}
                onClick={() => {
                  softTick();
                  haptic.select();
                  toggleQ(q.id);
                }}
                className={`flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl text-[10px] font-medium border transition-all ${
                  sel ? "bg-primary text-white border-primary shadow-md" : "bg-card text-foreground border-border hover:bg-muted hover:border-primary/30"
                }`}
              >
                <span className="text-base leading-none">{q.emoji}</span>
                <span className="truncate w-full text-center">{q.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resumo */}
      {hasFilters && (
        <div className="flex items-center justify-between bg-primary/5 rounded-xl px-3 py-2 border border-primary/10">
          <p className="text-xs">
            <strong className="text-primary text-sm">{total}</strong> resultado{total !== 1 ? "s" : ""}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              softTap();
              haptic.tap();
              setSelQueixas([]);
              setSelIdade(null);
              setSearch("");
              setTab("tudo");
            }}
            className="text-xs h-7 gap-1"
          >
            <X className="w-3 h-3" /> Limpar
          </Button>
        </div>
      )}

      {/* Resultados */}
      {!hasFilters ? (
        <div className="rounded-2xl border-2 border-dashed border-primary/15 p-6 text-center space-y-3">
          <Lightbulb className="w-7 h-7 text-primary mx-auto opacity-50" />
          <p className="text-sm text-muted-foreground">Selecione <strong>queixa</strong>, <strong>idade</strong> ou <strong>busque</strong></p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {["agitado", "desatento", "autismo", "estudo", "pedagógico", "risperidona", "escola"].map(s => (
              <button key={s} onClick={() => setSearch(s)} className="px-2.5 py-1 rounded-lg text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3" role="region" aria-live="polite" aria-label="Resultados do filtro inteligente">
          {total > 0 && (
            <Mascote
              contexto="resultado"
              size="sm"
              fala={`Encontrei ${total} recurso${total !== 1 ? "s" : ""} para esse perfil. Confira abaixo.`}
            />
          )}
          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
            {[
              { key: "tudo" as const, label: `Tudo (${total})` },
              { key: "escalas" as const, label: `Escalas (${results.scales.length})` },
              ...(results.pharm.length > 0 ? [{ key: "meds" as const, label: `Medicações (${results.pharm.length})` }] : []),
              ...(results.tools.length > 0 ? [{ key: "tools" as const, label: `Ferramentas (${results.tools.length})` }] : []),
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${tab === t.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Fluxograma de recomendação */}
          {idealId && tab === "tudo" && (() => {
            const idealScaleEntry = results.scales.find(s => s.id === idealId);
            if (!idealScaleEntry) return null;
            const mainQueixa = selQueixas[0];
            const qLabel = queixas.find(q => q.id === mainQueixa)?.label || mainQueixa;
            return (
              <div className="rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border-2 border-amber-300/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Recomendação para: {qLabel}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium">{qLabel}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <span className="px-2 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-800/40 text-amber-800 dark:text-amber-200 font-bold">{idealScaleEntry.name}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">Resultado</span>
                </div>
                {idealReason && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 italic">{idealReason}</p>
                )}
              </div>
            );
          })()}

          {/* Ferramentas extras (sempre no topo quando tab = tudo) */}
          {(tab === "tudo" || tab === "tools") && results.tools.length > 0 && (
            <div className="space-y-2">
              {tab === "tudo" && <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Ferramentas</p>}
              <div className="stagger-in space-y-2">
                {results.tools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
              </div>
            </div>
          )}

          {/* Escalas */}
          {(tab === "tudo" || tab === "escalas") && results.scales.length > 0 && (
            <div className="space-y-2">
              {tab === "tudo" && <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Escalas</p>}
              <div className="space-y-1.5">
                {results.scales.slice(0, tab === "tudo" ? 10 : undefined).map(s => (
                  <ScaleCard key={s.id} scale={s} isIdeal={s.id === idealId} />
                ))}
                {tab === "tudo" && results.scales.length > 10 && (
                  <button onClick={() => setTab("escalas")} className="w-full text-xs text-primary hover:underline py-2">
                    Ver todas {results.scales.length} escalas →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Medicações */}
          {(tab === "tudo" || tab === "meds") && results.pharm.length > 0 && (
            <div className="space-y-2">
              {tab === "tudo" && <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Medicações</p>}
              <div className="space-y-1.5">
                {results.pharm.slice(0, tab === "tudo" ? 8 : undefined).map((r, i) => (
                  <MedCard key={`${r.cat.id}-${r.drug.name}-${i}`} cat={r.cat} drug={r.drug} />
                ))}
                {tab === "tudo" && results.pharm.length > 8 && (
                  <button onClick={() => setTab("meds")} className="w-full text-xs text-primary hover:underline py-2">
                    Ver todas {results.pharm.length} medicações →
                  </button>
                )}
              </div>
            </div>
          )}

          {total === 0 && (
            <div className="text-center py-8">
              <Search className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum resultado. Tente outro termo.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CARDS
// ═══════════════════════════════════════════════════════════

function ToolCard({ tool }: { tool: ExtraTool }) {
  const Icon = tool.icon;
  return (
    <Link href={tool.route}>
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent cursor-pointer hover:shadow-md group transition-all card-hover">
        <CardContent className="p-3 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground">{tool.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════
// FLUXOGRAMA CLÍNICO DE RECOMENDAÇÃO DOURADA
// Sistema de scoring multi-critério — Dr. Jadson J26
// ═══════════════════════════════════════════════════════════

interface GoldRule {
  queixas: string[];      // queixas que ativam esta regra (OR)
  ageMin?: number;        // meses — se omitido, qualquer idade
  ageMax?: number;        // meses — se omitido, qualquer idade
  scaleId: string;        // ID da escala recomendada
  score: number;          // prioridade (maior = mais específico)
  reason: string;         // justificativa clínica (exibida ao usuário)
}

// Regras organizadas da MAIS ESPECÍFICA para a MAIS GENÉRICA
// O sistema seleciona a regra com maior score que corresponde ao perfil
const goldRules: GoldRule[] = [
  // ── TEA por faixa etária (altamente específicas) ──
  { queixas: ["tea"], ageMin: 16, ageMax: 30, scaleId: "mchat", score: 100, reason: "M-CHAT-R/F é padrão-ouro de triagem de TEA entre 16-30 meses" },
  { queixas: ["tea"], ageMin: 0, ageMax: 15, scaleId: "j26-005", score: 95, reason: "Antes de 16 meses: triagem de regulação sensorial e marcos precoces" },
  { queixas: ["tea"], ageMin: 31, ageMax: 72, scaleId: "cars", score: 98, reason: "CARS-2 é referência para classificar gravidade de TEA em pré-escolares" },
  { queixas: ["tea"], ageMin: 73, ageMax: 144, scaleId: "srs2", score: 95, reason: "SRS-2 quantifica responsividade social — ideal em escolares" },
  { queixas: ["tea"], ageMin: 145, ageMax: 216, scaleId: "assq", score: 90, reason: "ASSQ detecta TEA de alto funcionamento em adolescentes" },

  // ── TDAH por faixa etária ──
  { queixas: ["tdah"], ageMin: 72, ageMax: 144, scaleId: "snap", score: 100, reason: "SNAP-IV é o instrumento de triagem mais validado para TDAH escolar" },
  { queixas: ["tdah"], ageMin: 72, ageMax: 216, scaleId: "vanderbilt", score: 90, reason: "Vanderbilt NICHQ — triagem com domínios de desatenção e hiperatividade" },
  { queixas: ["tdah"], ageMin: 36, ageMax: 71, scaleId: "sdq", score: 85, reason: "SDQ cobre hiperatividade em pré-escolares quando SNAP-IV não se aplica" },
  { queixas: ["tdah"], ageMin: 145, ageMax: 216, scaleId: "conners", score: 95, reason: "Conners-3 é mais completo para adolescentes com suspeita de TDAH" },

  // ── Ansiedade por faixa etária ──
  { queixas: ["ansiedade"], ageMin: 96, ageMax: 216, scaleId: "scared", score: 100, reason: "SCARED é padrão-ouro para triagem de ansiedade a partir de 8 anos" },
  { queixas: ["ansiedade"], ageMin: 48, ageMax: 95, scaleId: "scas", score: 90, reason: "SCAS cobre ansiedade em crianças mais novas (4-7 anos)" },
  { queixas: ["ansiedade"], ageMin: 36, ageMax: 47, scaleId: "eai", score: 85, reason: "EAI-J26 para triagem de ansiedade em crianças pequenas" },

  // ── Depressão por faixa etária ──
  { queixas: ["depressao"], ageMin: 84, ageMax: 144, scaleId: "cdi2", score: 100, reason: "CDI-2 é o inventário padrão de depressão para crianças de 7-12 anos" },
  { queixas: ["depressao"], ageMin: 132, ageMax: 216, scaleId: "phqa", score: 98, reason: "PHQ-A é validado para depressão em adolescentes a partir de 11 anos" },
  { queixas: ["depressao"], ageMin: 48, ageMax: 83, scaleId: "edi", score: 90, reason: "EDI-J26 adaptado para triagem de depressão em pré-escolares e escolares iniciais" },

  // ── Atraso do desenvolvimento ──
  { queixas: ["atraso"], ageMin: 0, ageMax: 72, scaleId: "denver", score: 100, reason: "Denver II é o triagem clássico de marcos do desenvolvimento até 6 anos" },
  { queixas: ["atraso"], ageMin: 1, ageMax: 60, scaleId: "asq3", score: 95, reason: "ASQ-3 triagem com questionário para pais — 5 domínios" },
  { queixas: ["atraso"], ageMin: 0, ageMax: 12, scaleId: "j26-001", score: 92, reason: "Protocolo de triagem motora precoce para o primeiro ano" },

  // ── Comportamento ──
  { queixas: ["comportamento"], ageMin: 48, ageMax: 204, scaleId: "sdq", score: 100, reason: "SDQ é a triagem comportamental mais rápida e validada" },
  { queixas: ["comportamento"], ageMin: 48, ageMax: 216, scaleId: "cbcl", score: 90, reason: "CBCL é o padrão-ouro para avaliação abrangente de problemas comportamentais" },

  // ── Epilepsia ──
  { queixas: ["epilepsia"], scaleId: "epilepsia-diario", score: 100, reason: "Diário de crises é essencial para quantificar e caracterizar episódios" },
  { queixas: ["epilepsia"], scaleId: "chalfont", score: 85, reason: "Escala de gravidade de crises de Chalfont para monitorização" },

  // ── Sono ──
  { queixas: ["sono"], ageMin: 48, ageMax: 120, scaleId: "cshq", score: 100, reason: "CSHQ é o questionário mais completo para hábitos de sono em crianças" },
  { queixas: ["sono"], ageMin: 0, ageMax: 47, scaleId: "bisq", score: 90, reason: "BISQ para triagem rápida de sono em lactentes" },
  { queixas: ["sono"], ageMin: 121, ageMax: 216, scaleId: "j26-130", score: 88, reason: "Protocolo de higiene do sono para adolescentes" },

  // ── Linguagem ──
  { queixas: ["linguagem"], ageMin: 0, ageMax: 36, scaleId: "cdi-macarthur", score: 100, reason: "CDI MacArthur é padrão para vocabulário e gestos em lactentes" },
  { queixas: ["linguagem"], ageMin: 37, ageMax: 72, scaleId: "pls5", score: 95, reason: "PLS-5 avalia linguagem receptiva e expressiva em pré-escolares" },
  { queixas: ["linguagem"], ageMin: 73, ageMax: 216, scaleId: "celf5", score: 90, reason: "CELF-5 para avaliação abrangente de linguagem em escolares" },

  // ── Motor ──
  { queixas: ["motor", "pc"], ageMin: 0, ageMax: 216, scaleId: "gmfcs", score: 100, reason: "GMFCS classifica função motora grossa na paralisia cerebral" },
  { queixas: ["motor"], ageMin: 36, ageMax: 144, scaleId: "mabc2", score: 88, reason: "MABC-2 avalia coordenação motora em crianças escolares" },
  { queixas: ["motor"], ageMin: 0, ageMax: 18, scaleId: "aims", score: 92, reason: "AIMS avalia motricidade em lactentes de risco" },

  // ── Aprendizagem ──
  { queixas: ["aprendizagem"], ageMin: 72, ageMax: 168, scaleId: "tde", score: 100, reason: "TDE-II é o teste padronizado brasileiro de desempenho escolar" },
  { queixas: ["aprendizagem"], ageMin: 72, ageMax: 144, scaleId: "prolec", score: 88, reason: "PROLEC avalia processos de leitura — triagem de dislexia" },

  // ── Cognição / QI ──
  { queixas: ["cognicao"], ageMin: 72, ageMax: 192, scaleId: "wisc5", score: 100, reason: "WISC-V é padrão-ouro para avaliação de inteligência em escolares" },
  { queixas: ["cognicao"], ageMin: 30, ageMax: 84, scaleId: "wppsi", score: 95, reason: "WPPSI-IV para avaliação de inteligência em pré-escolares" },
  { queixas: ["cognicao"], ageMin: 48, ageMax: 144, scaleId: "raven", score: 85, reason: "Raven Colorido como triagem rápida de raciocínio não-verbal" },

  // ── Tiques ──
  { queixas: ["tiques"], scaleId: "ygtss", score: 100, reason: "YGTSS é o padrão-ouro para gravidade de tiques motores e vocais" },

  // ── Suicídio / Autolesão ──
  { queixas: ["suicidio"], scaleId: "cssrs", score: 100, reason: "C-SSRS é o padrão mundial para avaliação de risco suicida" },
  { queixas: ["suicidio"], scaleId: "ecar-si", score: 90, reason: "ECAR-SI J26 para avaliação expandida de autoagressão em crianças" },

  // ── TOC ──
  { queixas: ["toc"], scaleId: "cybocs", score: 100, reason: "CY-BOCS é padrão-ouro para gravidade de TOC em crianças" },
  { queixas: ["toc"], scaleId: "oci-cv", score: 85, reason: "OCI-CV triagem rápida de sintomas obsessivo-compulsivos" },

  // ── Trauma ──
  { queixas: ["trauma"], scaleId: "ucla-ptsd", score: 100, reason: "UCLA PTSD-RI é referência para TEPT em crianças e adolescentes" },
  { queixas: ["trauma"], scaleId: "cats", score: 85, reason: "CATS triagem de exposição e resposta traumática" },

  // ── Alimentação ──
  { queixas: ["alimentacao"], ageMin: 0, ageMax: 60, scaleId: "soma", score: 100, reason: "SOMA avalia função motora oral durante alimentação" },
  { queixas: ["alimentacao"], ageMin: 24, ageMax: 216, scaleId: "etare", score: 90, reason: "ETARE-J26 para triagem de transtorno alimentar restritivo evitativo" },

  // ── Funcionalidade ──
  { queixas: ["funcionalidade"], scaleId: "vineland", score: 100, reason: "Vineland-3 é referência para comportamento adaptativo" },
  { queixas: ["funcionalidade"], scaleId: "eaf", score: 85, reason: "EAF-J26 para adaptação funcional em contextos diários" },

  // ── Dor ──
  { queixas: ["dor"], scaleId: "cefaleia-calendario", score: 100, reason: "Calendário de cefaleia para registro e acompanhamento" },
  { queixas: ["dor"], ageMin: 0, ageMax: 36, scaleId: "flacc", score: 95, reason: "FLACC para avaliação de dor em crianças pré-verbais" },
  { queixas: ["dor"], ageMin: 84, ageMax: 216, scaleId: "eva-ped", score: 88, reason: "EVA pediátrica para autoavaliação de dor" },

  // ── Substâncias ──
  { queixas: ["substancias"], scaleId: "crafft", score: 100, reason: "CRAFFT é o triagem padrão de uso de substâncias em adolescentes" },

  // ── Neonatal ──
  { queixas: ["neonatal"], scaleId: "apgar", score: 100, reason: "APGAR Score para avaliação imediata do recém-nascido" },
  { queixas: ["neonatal"], scaleId: "gma", score: 92, reason: "GMA para avaliação de movimentos generalizados — preditor precoce de PC" },

  // ── Psicose ──
  { queixas: ["psicose"], scaleId: "prime-screen", score: 100, reason: "PRIME Screen para triagem de risco ultra-alto de psicose" },

  // ── Enurese ──
  { queixas: ["enurese"], scaleId: "dvss", score: 100, reason: "DVSS para avaliação de disfunção miccional" },
  { queixas: ["enurese"], scaleId: "bladder-diary", score: 90, reason: "Diário vesical pediátrico para registro de padrão urinário" },

  // ── Efeitos colaterais ──
  { queixas: ["efeitos"], scaleId: "uku", score: 100, reason: "UKU para monitorização abrangente de efeitos colaterais" },

  // ── Sensorial ──
  { queixas: ["sensorial"], scaleId: "ips", score: 100, reason: "IPS-J26 para perfil de processamento sensorial" },
  { queixas: ["sensorial"], scaleId: "j26-118", score: 85, reason: "Protocolo de processamento tátil Dr. Jadson" },

  // ── Social ──
  { queixas: ["social"], scaleId: "ecsm", score: 100, reason: "ECSM-J26 para cognição social e mentalização" },
  { queixas: ["social"], scaleId: "easi", score: 88, reason: "EASI-J26 para ansiedade social infantil" },

  // ── Autonomia ──
  { queixas: ["autonomia"], scaleId: "vineland", score: 100, reason: "Vineland-3 para habilidades adaptativas e autonomia" },
  { queixas: ["autonomia"], scaleId: "eaf", score: 90, reason: "EAF-J26 para adaptação funcional em AVDs" },

  // ── Evolução / Reavaliação ──
  { queixas: ["evolucao", "tea"], scaleId: "j26-211", score: 100, reason: "Registro evolutivo de comunicação social em TEA — compara com consulta anterior" },
  { queixas: ["evolucao", "tdah"], scaleId: "j26-219", score: 100, reason: "SNAP-IV de monitorização — compara pré e pós-medicação" },
  { queixas: ["evolucao", "epilepsia"], scaleId: "j26-227", score: 100, reason: "Diário de frequência de crises — acompanhamento mensal" },
  { queixas: ["evolucao", "linguagem"], scaleId: "j26-233", score: 100, reason: "Evolução de vocabulário expressivo — acompanhamento trimestral" },
  { queixas: ["evolucao", "motor"], scaleId: "j26-238", score: 100, reason: "Evolução de classificação motora GMFCS" },
  { queixas: ["evolucao", "pc"], scaleId: "j26-238", score: 100, reason: "Evolução motora em paralisia cerebral" },
  { queixas: ["evolucao", "aprendizagem"], scaleId: "j26-244", score: 100, reason: "Evolução de leitura e fluência — acompanhamento escolar" },
  { queixas: ["evolucao", "ansiedade"], scaleId: "j26-249", score: 100, reason: "Monitorização de ansiedade pós-tratamento" },
  { queixas: ["evolucao", "depressao"], scaleId: "j26-250", score: 100, reason: "Evolução de sintomas depressivos — comparação sequencial" },
  { queixas: ["evolucao", "efeitos"], scaleId: "j26-255", score: 100, reason: "Monitorização metabólica de antipsicóticos" },
  { queixas: ["evolucao"], scaleId: "j26-259", score: 80, reason: "CGI — Impressão Clínica Global de gravidade e melhora" },
];

function getIdealScale(queixas: string[], ageRange: { min: number; max: number } | null): { id: string; reason: string } | null {
  if (queixas.length === 0) return null;

  // Calcula a idade média da faixa selecionada (em meses)
  const ageMid = ageRange ? Math.round((ageRange.min + ageRange.max) / 2) : null;

  let bestRule: GoldRule | null = null;
  let bestScore = -1;

  for (const rule of goldRules) {
    // Verifica se a queixa corresponde
    const matchesQueixa = rule.queixas.some(rq => queixas.includes(rq));
    if (!matchesQueixa) continue;

    // Verifica idade (se a regra e o filtro especificam)
    if (ageMid !== null && rule.ageMin !== undefined && rule.ageMax !== undefined) {
      if (ageMid < rule.ageMin || ageMid > rule.ageMax) continue;
    }

    // Calcula score composto
    let compositeScore = rule.score;

    // Bonus: queixa é a primeira selecionada (principal)
    if (rule.queixas.includes(queixas[0])) compositeScore += 10;

    // Bonus: regra tem faixa etária E idade foi selecionada (mais específica)
    if (ageMid !== null && rule.ageMin !== undefined) compositeScore += 5;

    // Bonus: match de múltiplas queixas
    const matchCount = rule.queixas.filter(rq => queixas.includes(rq)).length;
    if (matchCount > 1) compositeScore += 15;

    if (compositeScore > bestScore) {
      bestScore = compositeScore;
      bestRule = rule;
    }
  }

  if (!bestRule) return null;
  return { id: bestRule.scaleId, reason: bestRule.reason };
}

function ScaleCard({ scale, isIdeal }: { scale: ScaleEntry; isIdeal?: boolean }) {
  const prio = prioConfig[scale.prioridade];
  const hasRoute = !!scale.appRoute;
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(scale.id);

  const favButton = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        softTick();
        haptic.tap();
        toggle(scale.id);
      }}
      data-testid={`fav-${scale.id}`}
      aria-pressed={fav}
      aria-label={fav ? `Remover ${scale.name} dos favoritos` : `Adicionar ${scale.name} aos favoritos`}
      title={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className="flex-shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
    >
      <Star className={`w-3.5 h-3.5 transition-colors ${fav ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
    </button>
  );

  const inner = (
    <Card className={`relative transition-all ${isIdeal ? "golden-glow border-2 border-amber-400 bg-gradient-to-r from-amber-50/80 to-yellow-50/50 dark:from-amber-950/30 dark:to-yellow-950/20 shadow-lg shadow-amber-200/30 dark:shadow-amber-900/20 ring-2 ring-amber-400/50 mt-3" : `border-card-border ${hasRoute ? "hover:shadow-md hover:border-primary/20" : "opacity-80"}`} ${hasRoute ? "cursor-pointer group card-hover" : ""}`}>
      <CardContent className="p-3 flex items-start gap-2.5">
        {isIdeal && (
          <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 text-[10px] font-bold rounded-full shadow-sm flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400" /> SELO DE OURO
          </div>
        )}
        <div className={`w-1.5 rounded-full self-stretch flex-shrink-0 ${isIdeal ? "bg-amber-400" : scale.prioridade === "triagem" ? "bg-blue-400" : scale.prioridade === "diagnostica" ? "bg-purple-400" : "bg-green-400"}`} />
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-foreground">{scale.name}</h3>
            <Badge className={`text-[10px] h-4 px-1.5 ${prio.color}`}>{prio.label}</Badge>
            {hasRoute && (
              <Badge className="text-[10px] h-4 px-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> Aplicar
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-1">{scale.description}</p>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5">
              <Clock className="w-2 h-2" /> {scale.tempo}
            </Badge>
            <Badge variant="outline" className="text-[9px] h-4 px-1">
              {ageStr(scale.ageMin)}–{ageStr(scale.ageMax)}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-0.5">
          {favButton}
          {hasRoute && <ArrowRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
      </CardContent>
    </Card>
  );

  if (hasRoute) return <Link href={scale.appRoute!}>{inner}</Link>;
  return inner;
}

function MedCard({ cat, drug }: { cat: PharmCategory; drug: Drug }) {
  const Icon = iconMap[cat.iconName] || Pill;
  return (
    <Card className="border-card-border">
      <CardContent className="p-3 flex items-start gap-2.5">
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-foreground">{drug.name}</h3>
            <Badge variant="outline" className="text-[9px] h-4 px-1">{cat.title}</Badge>
          </div>
          <p className="text-[11px] text-primary font-mono">{drug.dose}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{drug.comment}</p>
        </div>
      </CardContent>
    </Card>
  );
}
