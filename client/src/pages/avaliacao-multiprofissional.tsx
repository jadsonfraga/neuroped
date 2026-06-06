import { useState } from "react";
import {
  ClipboardCheck, Users, Clock, ArrowRight, AlertCircle,
  Baby, CheckCircle2, Info, Brain,
  Stethoscope, Layers, Star,
  MessageSquare, Eye, Search
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs, TabsList, TabsTrigger, TabsContent
} from "@/components/ui/tabs";
import teamImg from "@assets/images/team-multiprofessional.png";

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-5 h-5 ${color}`} />
      <h2 className={`text-sm font-bold uppercase tracking-wider ${color}`}>{title}</h2>
    </div>
  );
}

function PearlCard({ text, color = "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300" }: { text: string; color?: string }) {
  return (
    <div className={`rounded-xl border p-3 flex items-start gap-2 ${color}`}>
      <Star className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
      <p className="text-xs leading-relaxed">{text}</p>
    </div>
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const instrumentsByAge = {
  "18m-6a": {
    label: "18 meses – 6 anos",
    areas: [
      {
        area: "Linguagem",
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950/20",
        border: "border-blue-200 dark:border-blue-800/40",
        profissional: "Fonoaudiólogo",
        sessoes: "3–5 sessões",
        instrumentos: ["ADL — Avaliação do Desenvolvimento da Linguagem", "ABFW — Vocabulário, fluência e pragmática", "PROC — Protocolo Observacional da Comunicação", "PPVT — Vocabulário Receptivo Imagético"],
      },
      {
        area: "Desenvolvimento Global",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/20",
        border: "border-emerald-200 dark:border-emerald-800/40",
        profissional: "Neuropsicólogo / Psicólogo",
        sessoes: "2–3 sessões",
        instrumentos: ["Portage — Currículo de estimulação precoce", "Denver II — Marcos motores, linguagem, pessoal-social", "IDADI — Inventário de Desenvolvimento para bebês e crianças", "Escalas Bayley-4 — padrão ouro 0–42 meses"],
      },
      {
        area: "Inteligência (não-verbal)",
        color: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-50 dark:bg-violet-950/20",
        border: "border-violet-200 dark:border-violet-800/40",
        profissional: "Neuropsicólogo / Psicólogo",
        sessoes: "2 sessões",
        instrumentos: ["SON-R 2-8 — QI não-verbal; ideal para crianças sem linguagem verbal", "Columbia Mental Maturity Scale — raciocínio abstrato por figuras", "Matrizes Progressivas Coloridas de Raven (até 11 anos)"],
      },
      {
        area: "Suspeita TEA",
        color: "text-fuchsia-600 dark:text-fuchsia-400",
        bg: "bg-fuchsia-50 dark:bg-fuchsia-950/20",
        border: "border-fuchsia-200 dark:border-fuchsia-800/40",
        profissional: "Psicólogo / Neuropsicólogo",
        sessoes: "3–4 sessões",
        instrumentos: ["PROTEA-R — Protocolo de avaliação de TEA em pré-escolares", "ABC — Autism Behavior Checklist (versão pais)", "ATA — Avaliação do Transtorno do Espectro Autista", "CARS-2 — Childhood Autism Rating Scale", "M-CHAT-R/F — triagem 16–30 meses"],
      },
      {
        area: "Perfil Sensorial",
        color: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-cyan-50 dark:bg-cyan-950/20",
        border: "border-cyan-200 dark:border-cyan-800/40",
        profissional: "Terapeuta Ocupacional",
        sessoes: "2 sessões",
        instrumentos: ["Perfil Sensorial Infantil (Dunn) — resposta de pais/cuidadores", "IPS — Inventário de Processamento Sensorial Dr. Jadson", "Observação clínica estruturada da integração sensorial"],
      },
      {
        area: "Psicomotricidade",
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-950/20",
        border: "border-orange-200 dark:border-orange-800/40",
        profissional: "Psicomotricista / TO / Fisioterapeuta",
        sessoes: "2–3 sessões",
        instrumentos: ["Rosa Neto — Escala de Desenvolvimento Motor (EDM)", "Luria-Nebraka adaptado pré-escolar", "Observação do tônus, equilíbrio, coordenação e lateralidade"],
      },
    ],
  },
  "7-12a": {
    label: "7 – 12 anos",
    areas: [
      {
        area: "Funções Cognitivas",
        color: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-50 dark:bg-violet-950/20",
        border: "border-violet-200 dark:border-violet-800/40",
        profissional: "Neuropsicólogo",
        sessoes: "4–6 sessões",
        instrumentos: ["WISC-IV / V — QI total, verbal, visuoespacial, FE e memória operacional", "Teste de Trilhas A e B — atenção e flexibilidade", "RAVLT / TAVEC — memória verbal por ensaios", "Figura Complexa de Rey — organização visuoconstrutiva e memória", "Stroop — controle inibitório e atenção seletiva"],
      },
      {
        area: "Escalas Comportamentais",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/20",
        border: "border-amber-200 dark:border-amber-800/40",
        profissional: "Psicólogo / Neuropsicólogo",
        sessoes: "1–2 sessões (questionários)",
        instrumentos: ["SNAP-IV — TDAH (pais e professores)", "CBCL 6–18 — comportamento e emoção (pais)", "TRF — Teacher Report Form (professores)", "ASRS — Escala de Autorrelato para TDAH (adolescentes ≥ 10 anos)", "BRIEF-2 — Funções executivas no cotidiano"],
      },
      {
        area: "Desempenho e Aprendizagem",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/20",
        border: "border-emerald-200 dark:border-emerald-800/40",
        profissional: "Psicopedagogo",
        sessoes: "3–4 sessões",
        instrumentos: ["TDE-II — leitura, escrita e aritmética (1º ao 9º ano)", "Avaliação de consciência fonológica (CONFIAS)", "Análise do material escolar e cadernos", "Teste de leitura oral de palavras e pseudopalavras", "Avaliação de motivação e atitude frente ao aprendizado"],
      },
      {
        area: "Avaliação Emocional",
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-950/20",
        border: "border-rose-200 dark:border-rose-800/40",
        profissional: "Psicólogo",
        sessoes: "2–3 sessões",
        instrumentos: ["SCARED — ansiedade (7–17 anos)", "CDI-2 — depressão infanto-juvenil", "SDQ — pontos fortes e dificuldades", "CBCL — síndromes internalizantes e externalizantes", "Entrevista semiestruturada com a criança"],
      },
    ],
  },
  "13-18a": {
    label: "Adolescentes 13 – 18 anos",
    areas: [
      {
        area: "Cognição e Funções Executivas",
        color: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-50 dark:bg-violet-950/20",
        border: "border-violet-200 dark:border-violet-800/40",
        profissional: "Neuropsicólogo",
        sessoes: "4–6 sessões",
        instrumentos: ["WISC-V (até 16 anos) ou WAIS-IV (a partir de 16 anos)", "Bateria Coletiva de Atenção e Memória (BCAM)", "Torre de Londres / Hanoi — planejamento", "Wisconsin (WCST) — flexibilidade cognitiva", "Fluência Verbal FAS e Animais"],
      },
      {
        area: "Saúde Mental e Risco",
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-50 dark:bg-rose-950/20",
        border: "border-rose-200 dark:border-rose-800/40",
        profissional: "Psicólogo / Psiquiatra",
        sessoes: "2–3 sessões",
        instrumentos: ["C-SSRS — ideação e risco suicida", "CRAFFT — uso de substâncias em adolescentes", "PHQ-A — depressão adaptada para adolescentes", "SCARED — ansiedade", "Inventários de autorrelato de personalidade (IFP-2)"],
      },
      {
        area: "Aprendizagem e Escola",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/20",
        border: "border-emerald-200 dark:border-emerald-800/40",
        profissional: "Psicopedagogo",
        sessoes: "2–3 sessões",
        instrumentos: ["TDE-II para séries finais do ensino fundamental", "Avaliação de velocidade de leitura e compreensão textual", "Inventário de interesses vocacionais e profissionais", "Análise do histórico escolar e relatórios pedagógicos"],
      },
      {
        area: "Autonomia e Vida Diária",
        color: "text-teal-600 dark:text-teal-400",
        bg: "bg-teal-50 dark:bg-teal-950/20",
        border: "border-teal-200 dark:border-teal-800/40",
        profissional: "Terapeuta Ocupacional",
        sessoes: "2 sessões",
        instrumentos: ["Vineland-3 — comportamento adaptativo (comunicação, AVD, socialização, motricidade)", "EAF Dr. Jadson — Escala de Adaptação Funcional", "Avaliação de habilidades de vida independente"],
      },
    ],
  },
  "adultos": {
    label: "Adultos 18+",
    areas: [
      {
        area: "Inteligência e Cognição",
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950/20",
        border: "border-blue-200 dark:border-blue-800/40",
        profissional: "Neuropsicólogo",
        sessoes: "4–8 sessões",
        instrumentos: ["WAIS-IV — QI total, índices verbais, perceptivo-organizacional, memória operacional e VP", "NEUPSILIN — Instrumento de Avaliação Neuropsicológica Breve", "BACS — Brief Assessment of Cognition in Schizophrenia (quando indicado)", "MoCA — rastreio cognitivo breve", "Trail Making Test A e B"],
      },
      {
        area: "Escalas Diagnósticas e Funcionais",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/20",
        border: "border-amber-200 dark:border-amber-800/40",
        profissional: "Psicólogo / Neuropsicólogo",
        sessoes: "2–3 sessões",
        instrumentos: ["ASRS v1.1 — TDAH em adultos (autorrelato)", "AUDIT — consumo de álcool", "PHQ-9 — depressão em adultos", "GAD-7 — ansiedade generalizada", "Diagnóstico diferencial de TEA em adulto (RAADS-R, AQ)"],
      },
    ],
  },
};

const principios = [
  {
    icon: Users,
    title: "Interdisciplinaridade Real",
    desc: "A avaliação multiprofissional não é a soma de laudos isolados — é a integração ativa de profissionais que compartilham dados, discutem hipóteses e constroem conclusões conjuntas. Reuniões de equipe são parte do processo.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800/40",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: CheckCircle2,
    title: "Validade Científica",
    desc: "Apenas instrumentos normatizados para a população brasileira ou devidamente adaptados devem ser utilizados. A qualidade do processo depende da fidedignidade dos instrumentos e da capacitação de quem os aplica.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800/40",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: Clock,
    title: "Número Adequado de Sessões",
    desc: "Crianças pequenas (até 6 anos): 4–6 sessões de 40–50 min. Escolares (7–12 anos): 6–8 sessões. Adolescentes e adultos: conforme complexidade do caso — geralmente 6–10 sessões. Sessões fragmentadas garantem melhor cooperação.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800/40",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: MessageSquare,
    title: "Devolutiva Obrigatória",
    desc: "A devolutiva é etapa clínica essencial — não opcional. Deve ser realizada com a família (e com a criança, quando possível, de forma adaptada à faixa etária) e incluir: hipóteses diagnósticas, perfil de pontos fortes e dificuldades, orientações práticas e encaminhamentos.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800/40",
    gradient: "from-blue-500 to-indigo-600",
  },
];

const fluxoEtapas = [
  { num: 1, titulo: "Acolhimento", desc: "Entrevista inicial com pais/cuidadores. Levantamento de queixa principal, histórico de desenvolvimento, antecedentes médicos, familiares e escolares. Definição das hipóteses norteadoras.", color: "from-violet-500 to-purple-600", icon: Users },
  { num: 2, titulo: "Observação Clínica", desc: "Observação em ambiente natural (consultório, sala de espera) e, quando possível, visita escolar. Registro de comportamento espontâneo, interação com cuidadores e padrões de comunicação.", color: "from-blue-500 to-indigo-600", icon: Eye },
  { num: 3, titulo: "Avaliação por Área", desc: "Aplicação dos instrumentos por cada profissional da equipe, conforme o mapa de instrumentos para a faixa etária. Sessões breves, respeitando a capacidade de cooperação da criança.", color: "from-emerald-500 to-teal-600", icon: ClipboardCheck },
  { num: 4, titulo: "Integração de Dados", desc: "Reunião de equipe para cruzamento dos resultados. Análise convergente e divergente dos achados. Formulação das hipóteses diagnósticas integradas e do perfil funcional.", color: "from-amber-500 to-orange-600", icon: Layers },
  { num: 5, titulo: "Devolutiva", desc: "Devolução dos resultados para a família de forma acessível, empática e propositiva. Discussão de prognóstico, encaminhamentos e orientações práticas para casa e escola.", color: "from-rose-500 to-pink-600", icon: MessageSquare },
  { num: 6, titulo: "Relatório + Encaminhamentos", desc: "Emissão de relatório integrado com hipóteses diagnósticas, perfil de habilidades, recomendações terapêuticas e orientações para escola. Encaminhamentos para serviços especializados quando indicado.", color: "from-cyan-500 to-sky-600", icon: Stethoscope },
];

const quandoEnvolver = [
  { profissional: "Fonoaudiólogo", quando: "Atraso de linguagem, dificuldade de fala, alteração de leitura/escrita, suspeita de dislexia, gagueira, deglutição atípica, PAC", color: "from-blue-400 to-indigo-500" },
  { profissional: "Psicólogo", quando: "Queixa emocional, comportamento opositor, ansiedade, depressão, rastreio diagnóstico (TEA, TDAH), avaliação de personalidade, psicoterapia", color: "from-rose-400 to-pink-500" },
  { profissional: "Neuropsicólogo", quando: "Perfil cognitivo detalhado, suspeita de disfunção executiva, pós-TCE, epilepsia com declínio, QI, avaliação pré/pós cirúrgica, pesquisa diagnóstica complexa", color: "from-violet-400 to-purple-600" },
  { profissional: "Psicopedagogo", quando: "Dificuldade de aprendizagem escolar específica, dislexia, discalculia, disortografia, acompanhamento pedagógico terapêutico, relação com a escola", color: "from-emerald-400 to-teal-500" },
  { profissional: "Terapeuta Ocupacional", quando: "Integração sensorial alterada, dificuldade em AVDs (vestir, comer, higiene), motricidade fina comprometida, planejamento motor, adaptação de materiais", color: "from-amber-400 to-orange-500" },
  { profissional: "Fisioterapeuta", quando: "Atraso motor gross motor, paralisia cerebral, hipotonia, distrofia muscular, reabilitação pós-AVC pediátrico, marcha atípica", color: "from-cyan-400 to-sky-500" },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AvaliacaoMultiprofissionalPage() {
  const [activeAge, setActiveAge] = useState<string>("18m-6a");

  return (
    <div className="space-y-8" data-testid="avaliacao-multiprofissional-page">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.06),transparent_50%)]" />
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg flex-shrink-0">
            <ClipboardCheck className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-2 min-w-0">
            <h1 className="text-xl font-bold leading-tight">
              Guia de Avaliação Multiprofissional — Dr. Jadson
            </h1>
            <p className="text-white/80 text-sm leading-relaxed">
              Como estruturar, quem envolver e quais instrumentos utilizar em cada faixa etária
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge className="bg-white/20 text-white border-white/30 text-xs">18 meses – Adultos</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">4 faixas etárias</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">Guia Clínico</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── TEAM IMAGE ── */}
      <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 shadow-lg">
        <img src={teamImg} alt="" className="w-full h-full object-cover" />
      </div>

      {/* ── SEÇÃO 1: O QUE É E POR QUE FAZER ── */}
      <section className="space-y-3">
        <SectionHeader icon={Brain} title="O Que É e Por Que Fazer" color="text-emerald-600 dark:text-emerald-400" />

        <Card className="border-card-border">
          <CardContent className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A <strong className="text-foreground">Avaliação Multiprofissional</strong> é o processo sistemático de coleta, análise e integração de dados provenientes de diferentes áreas do conhecimento clínico — fonoaudiologia, psicologia, neuropsicologia, psicopedagogia, terapia ocupacional e medicina — com o objetivo de construir hipóteses diagnósticas consistentes e orientar um plano terapêutico individualizado.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Diferentemente da avaliação isolada de um único profissional, a abordagem multiprofissional adota o <strong className="text-foreground">modelo biopsicossocial</strong>: considera não apenas o biológico (genética, neuroimagem, exames), mas também o psicológico (cognição, emoção, comportamento) e o social (família, escola, contexto cultural).
            </p>

            <div className="grid grid-cols-1 gap-3 pt-1">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3 flex items-start gap-3">
                <Eye className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Observação em Ambientes Naturais</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">A criança deve ser observada em múltiplos contextos — consultório, escola, casa — pois comportamentos podem emergir apenas em ambientes específicos. Relatórios escolares e visitas domiciliares enriquecem significativamente a avaliação.</p>
                </div>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-3 flex items-start gap-3">
                <Users className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Escuta de Múltiplos Cuidadores</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Pais, avós, professores e outros cuidadores têm perspectivas complementares. Discrepâncias entre os informantes são clinicamente relevantes e devem ser investigadas, não ignoradas.</p>
                </div>
              </div>
              <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-3 flex items-start gap-3">
                <Search className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Instrumentos Formais e Informais</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">A avaliação combina testes padronizados (instrumentos formais, com normas populacionais) e observações clínicas estruturadas (instrumentos informais). Ambos são complementares — nenhum substitui o outro.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pérolas: quando envolver cada profissional */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Quando Envolver Cada Profissional</p>
          <div className="grid grid-cols-1 gap-2">
            {quandoEnvolver.map((item) => (
              <div key={item.profissional} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Stethoscope className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.profissional}</p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">{item.quando}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 2: MAPA DE INSTRUMENTOS ── */}
      <section className="space-y-3">
        <SectionHeader icon={ClipboardCheck} title="Mapa de Instrumentos por Faixa Etária" color="text-teal-600 dark:text-teal-400" />

        <Tabs value={activeAge} onValueChange={setActiveAge}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="18m-6a" className="text-xs py-2 rounded-lg">18m–6 anos</TabsTrigger>
            <TabsTrigger value="7-12a" className="text-xs py-2 rounded-lg">7–12 anos</TabsTrigger>
            <TabsTrigger value="13-18a" className="text-xs py-2 rounded-lg">13–18 anos</TabsTrigger>
            <TabsTrigger value="adultos" className="text-xs py-2 rounded-lg">Adultos</TabsTrigger>
          </TabsList>

          {Object.entries(instrumentsByAge).map(([key, band]) => (
            <TabsContent key={key} value={key} className="space-y-3 mt-3">
              <Badge variant="outline" className="text-xs">
                <Baby className="w-3 h-3 mr-1" />
                {band.label}
              </Badge>
              {band.areas.map((area) => (
                <Card key={area.area} className="border-card-border overflow-hidden">
                  <div className={`h-1 w-full bg-gradient-to-r ${area.color.includes("blue") ? "from-blue-400 to-indigo-500" : area.color.includes("emerald") ? "from-emerald-400 to-teal-500" : area.color.includes("violet") ? "from-violet-400 to-purple-600" : area.color.includes("fuchsia") ? "from-fuchsia-400 to-pink-500" : area.color.includes("cyan") ? "from-cyan-400 to-sky-500" : area.color.includes("amber") ? "from-amber-400 to-orange-500" : area.color.includes("rose") ? "from-rose-400 to-pink-500" : "from-teal-400 to-cyan-500"}`} />
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h3 className={`text-sm font-bold ${area.color}`}>{area.area}</h3>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${area.color}`}>
                          <Users className="w-3 h-3 mr-1" />
                          {area.profissional}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          {area.sessoes}
                        </Badge>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {area.instrumentos.map((inst, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${area.color.replace("text-", "bg-")}`} />
                          <p className="text-xs text-muted-foreground leading-snug">{inst}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* ── SEÇÃO 3: PRINCÍPIOS ── */}
      <section className="space-y-3">
        <SectionHeader icon={Star} title="Princípios do Processo Avaliativo" color="text-amber-600 dark:text-amber-400" />

        <div className="space-y-3">
          {principios.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.title} className="border-card-border overflow-hidden">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{p.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-2">
          <PearlCard text="Pérola clínica: nunca encerre a avaliação sem devolutiva formal. A devolutiva é terapêutica por si mesma — o momento em que a família compreende o filho é muitas vezes o mais transformador do processo." />
          <PearlCard text="Pérola clínica: em crianças muito pequenas ou com baixa cooperação, priorize a observação e os instrumentos passivos (respondidos por pais/professores) nas primeiras sessões. A confiança se constrói antes dos testes." />
        </div>
      </section>

      {/* ── SEÇÃO 4: FLUXO ── */}
      <section className="space-y-3">
        <SectionHeader icon={ArrowRight} title="Fluxo da Avaliação Multiprofissional" color="text-blue-600 dark:text-blue-400" />

        <div className="space-y-2.5">
          {fluxoEtapas.map((etapa) => {
            const Icon = etapa.icon;
            return (
              <div key={etapa.num} className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${etapa.color} flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <span className="text-xs font-bold text-white">{etapa.num}</span>
                </div>
                <Card className="border-card-border flex-1">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">{etapa.titulo}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{etapa.desc}</p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Linha conectora visual */}
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <strong>Nota clínica:</strong> O fluxo pode ser não-linear. Em casos complexos, novas avaliações podem ser solicitadas após a reunião de integração de dados, gerando um ciclo de refinamento diagnóstico antes da devolutiva final.
            </p>
          </div>
        </div>
      </section>

      {/* ── DISCLAIMER ── */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Aviso educacional:</strong> Este guia tem finalidade didática para profissionais de saúde. Não substitui treinamento especializado nem protocolos institucionais. A seleção dos instrumentos deve ser feita pelo profissional responsável, considerando a disponibilidade, a indicação clínica e o contexto cultural do paciente.
          </p>
        </div>
      </div>

    </div>
  );
}
