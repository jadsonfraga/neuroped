import {
  BrainCog, CheckCircle2, AlertCircle, BookOpen, Clock, Users, Target,
  Layers, Zap, MessageSquare, Eye, Hand, Gauge, Lightbulb, Heart,
  FileText, BarChart2, ArrowRight, HelpCircle, School, RefreshCw,
  Stethoscope, ClipboardList, Star, Info, TrendingUp,
  Activity, Puzzle, Search
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroBrainImg from "@assets/images/hero-brain.png";

// ─── Data ────────────────────────────────────────────────────────────────────

const indicacoes = [
  { icon: BookOpen,     label: "Dificuldades de aprendizagem",        color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-950/20",   border: "border-blue-200 dark:border-blue-800/40" },
  { icon: Zap,          label: "Suspeita de TDAH",                    color: "text-amber-500",  bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-800/40" },
  { icon: Puzzle,       label: "Investigação de TEA",                 color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/20", border: "border-violet-200 dark:border-violet-800/40" },
  { icon: TrendingUp,   label: "Atraso no desenvolvimento",           color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800/40" },
  { icon: Activity,     label: "Após lesão cerebral (TCE, AVC)",      color: "text-red-500",    bg: "bg-red-50 dark:bg-red-950/20",     border: "border-red-200 dark:border-red-800/40" },
  { icon: Zap,          label: "Epilepsia com declínio cognitivo",    color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-200 dark:border-orange-800/40" },
  { icon: BrainCog,     label: "Deficiência intelectual",             color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/20", border: "border-indigo-200 dark:border-indigo-800/40" },
  { icon: Target,       label: "Planejamento de reabilitação",        color: "text-teal-500",   bg: "bg-teal-50 dark:bg-teal-950/20",   border: "border-teal-200 dark:border-teal-800/40" },
  { icon: Stethoscope,  label: "Avaliação pré/pós cirúrgica",        color: "text-cyan-500",   bg: "bg-cyan-50 dark:bg-cyan-950/20",   border: "border-cyan-200 dark:border-cyan-800/40" },
  { icon: AlertCircle,  label: "Dificuldades comportamentais",        color: "text-rose-500",   bg: "bg-rose-50 dark:bg-rose-950/20",   border: "border-rose-200 dark:border-rose-800/40" },
];

const dominios = [
  {
    icon: Zap,
    title: "Atenção",
    gradient: "from-amber-400 to-orange-500",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800/40",
    subtypes: [
      { name: "Sustentada", desc: "Capacidade de manter o foco por período prolongado (ex: assistir a uma aula)." },
      { name: "Alternada", desc: "Alternar o foco entre tarefas diferentes sem perder o fio (ex: tomar notas enquanto ouve)." },
      { name: "Dividida", desc: "Focar em dois estímulos ao mesmo tempo (ex: dirigir e conversar)." },
      { name: "Seletiva", desc: "Ignorar distrações e focalizar no estímulo relevante (ex: ler em ambiente barulhento)." },
    ],
  },
  {
    icon: Layers,
    title: "Memória",
    gradient: "from-blue-400 to-indigo-500",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800/40",
    subtypes: [
      { name: "Curto prazo", desc: "Armazena informações por segundos a minutos (ex: reter um número de telefone)." },
      { name: "Operacional (de trabalho)", desc: "Manipulação ativa de informações na mente (ex: fazer cálculo mental)." },
      { name: "Episódica", desc: "Memória de eventos autobiográficos com contexto temporal e espacial." },
      { name: "Semântica", desc: "Conhecimento geral e fatos sobre o mundo (ex: saber que Paris é capital da França)." },
      { name: "Procedural", desc: "Habilidades automatizadas (ex: andar de bicicleta, escrever)." },
      { name: "Longo prazo", desc: "Consolidação de informações de forma durável após repetição e sono." },
    ],
  },
  {
    icon: BrainCog,
    title: "Funções Executivas",
    gradient: "from-violet-400 to-purple-600",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800/40",
    subtypes: [
      { name: "Planejamento", desc: "Capacidade de organizar etapas para atingir um objetivo." },
      { name: "Flexibilidade cognitiva", desc: "Adaptar o comportamento a mudanças de regras ou contexto." },
      { name: "Inibição", desc: "Suprimir respostas automáticas inapropriadas (controle de impulsos)." },
      { name: "Organização", desc: "Estruturar materiais, tempo e ideias de forma eficiente." },
      { name: "Monitoramento", desc: "Avaliar o próprio desempenho e corrigir erros em tempo real." },
    ],
  },
  {
    icon: MessageSquare,
    title: "Linguagem",
    gradient: "from-emerald-400 to-teal-500",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800/40",
    subtypes: [
      { name: "Expressão", desc: "Capacidade de produzir fala e comunicar ideias verbalmente." },
      { name: "Compreensão", desc: "Entender o que é falado ou lido." },
      { name: "Nomeação", desc: "Recuperar o nome de objetos, pessoas ou conceitos (confrontação visual)." },
      { name: "Fluência verbal", desc: "Gerar palavras de uma categoria em tempo limitado (semântica e fonológica)." },
      { name: "Leitura e escrita", desc: "Decodificação fonológica, compreensão textual e expressão gráfica." },
    ],
  },
  {
    icon: Eye,
    title: "Habilidades Visuoespaciais",
    gradient: "from-cyan-400 to-sky-500",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/20",
    border: "border-cyan-200 dark:border-cyan-800/40",
    subtypes: [
      { name: "Percepção visual", desc: "Discriminar, organizar e interpretar informações visuais." },
      { name: "Construção visuoespacial", desc: "Reproduzir figuras, montar quebra-cabeças, copiar desenhos." },
      { name: "Orientação espacial", desc: "Noção de direção, lateralidade e localização no espaço." },
    ],
  },
  {
    icon: Hand,
    title: "Praxias",
    gradient: "from-rose-400 to-pink-500",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-800/40",
    subtypes: [
      { name: "Ideomotora", desc: "Executar gestos simples com ou sem objeto (ex: acenar, bater palmas)." },
      { name: "Construtiva", desc: "Montar ou construir arranjos com peças ou desenhos." },
      { name: "De vestir", desc: "Sequenciar corretamente a ação de se vestir e manipular roupas." },
    ],
  },
  {
    icon: Gauge,
    title: "Velocidade de Processamento",
    gradient: "from-orange-400 to-red-500",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800/40",
    subtypes: [
      { name: "Tempo de reação", desc: "Rapidez para responder a um estímulo simples." },
      { name: "Velocidade cognitiva", desc: "Rapidez para processar e responder a informações complexas sob pressão." },
    ],
  },
  {
    icon: Star,
    title: "Inteligência / QI",
    gradient: "from-yellow-400 to-amber-500",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    border: "border-yellow-200 dark:border-yellow-800/40",
    subtypes: [
      { name: "Verbal (ICV)", desc: "Raciocínio com palavras, vocabulário e compreensão verbal." },
      { name: "Não-verbal / Visuoespacial", desc: "Raciocínio com figuras, padrões e relações espaciais." },
      { name: "Raciocínio fluido (IRP)", desc: "Resolução de problemas novos, independente do conhecimento adquirido." },
      { name: "Escalas: WISC-V, SON-R, Raven", desc: "Instrumentos padronizados para avaliar o QI em diferentes faixas etárias." },
    ],
  },
  {
    icon: Heart,
    title: "Cognição Social",
    gradient: "from-pink-400 to-rose-600",
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-950/20",
    border: "border-pink-200 dark:border-pink-800/40",
    subtypes: [
      { name: "Teoria da mente", desc: "Capacidade de atribuir estados mentais (crenças, desejos) a outras pessoas." },
      { name: "Empatia", desc: "Reconhecer e compartilhar emoções alheias." },
      { name: "Reconhecimento emocional", desc: "Identificar emoções nas expressões faciais e na voz." },
    ],
  },
];

const testes = [
  { nome: "WISC-V",                              faixa: "6–16 anos",  mede: "QI total, verbal, visuoespacial, raciocínio fluido, memória operacional, velocidade" },
  { nome: "SON-R",                               faixa: "2–8 anos",   mede: "QI não-verbal — ideal para crianças não-verbais ou com TEA" },
  { nome: "Matrizes Progressivas de Raven",      faixa: "5–11 anos",  mede: "Raciocínio indutivo não-verbal e inteligência fluida" },
  { nome: "NEPSY-II",                            faixa: "3–16 anos",  mede: "Bateria neuropsicológica completa: 32 subtestes em 6 domínios" },
  { nome: "Teste de Trilhas A e B",              faixa: "6+ anos",    mede: "Atenção, velocidade de processamento e flexibilidade cognitiva" },
  { nome: "Teste de Stroop",                     faixa: "7+ anos",    mede: "Controle inibitório e atenção seletiva" },
  { nome: "Torre de Londres / Hanoi",            faixa: "6+ anos",    mede: "Planejamento e resolução de problemas" },
  { nome: "Fluência Verbal (FAS / Animais)",     faixa: "6+ anos",    mede: "Fluência fonológica e semântica, velocidade de recuperação lexical" },
  { nome: "Figura Complexa de Rey",              faixa: "6+ anos",    mede: "Organização visuoconstrutiva, planejamento e memória visual" },
  { nome: "TAVEC / RAVLT",                       faixa: "7+ anos",    mede: "Aprendizagem e memória verbal ao longo de múltiplos ensaios" },
  { nome: "Teste de Wisconsin (WCST)",           faixa: "7+ anos",    mede: "Flexibilidade cognitiva e formação de conceitos" },
  { nome: "CPT (Conners)",                       faixa: "6+ anos",    mede: "Atenção sustentada, impulsividade e vigilância" },
  { nome: "BRIEF-2",                             faixa: "5–18 anos",  mede: "Funções executivas no cotidiano — questionário para pais/professores" },
  { nome: "Vineland-3",                          faixa: "0–90 anos",  mede: "Comportamento adaptativo em comunicação, vida diária, socialização e motricidade" },
  { nome: "TDE-II",                              faixa: "1º–9º ano",  mede: "Desempenho escolar: leitura, escrita, aritmética" },
];

const etapas = [
  { num: 1, titulo: "Entrevista inicial (anamnese)",  desc: "Conversa aprofundada com pais/cuidadores sobre histórico do desenvolvimento, queixas principais, antecedentes médicos, familiares e escolares.", color: "from-violet-500 to-purple-600", icon: Users },
  { num: 2, titulo: "Sessões de testagem",            desc: "Aplicação dos testes neuropsicológicos em 2–4 sessões de 1–2 horas cada, conforme a tolerância e a faixa etária da criança.", color: "from-blue-500 to-indigo-600", icon: ClipboardList },
  { num: 3, titulo: "Observação comportamental",      desc: "Registro sistemático do comportamento durante os testes: nível de engajamento, regulação emocional, estratégias utilizadas e padrões de erro.", color: "from-emerald-500 to-teal-600", icon: Search },
  { num: 4, titulo: "Análise dos resultados",         desc: "Comparação do desempenho com normas populacionais por idade, análise do perfil cognitivo e integração com os dados da anamnese.", color: "from-amber-500 to-orange-600", icon: BarChart2 },
  { num: 5, titulo: "Relatório neuropsicológico",     desc: "Documento técnico detalhando resultados, pontuações padronizadas, análise qualitativa, hipóteses diagnósticas e recomendações.", color: "from-rose-500 to-pink-600", icon: FileText },
  { num: 6, titulo: "Devolutiva",                     desc: "Reunião com a família (e escola, quando indicado) para explicar os resultados de forma didática e planejar os encaminhamentos necessários.", color: "from-cyan-500 to-sky-600", icon: MessageSquare },
];

const classificacoes = [
  { label: "Muito Superior",    range: "> 130",  color: "bg-violet-500", text: "text-violet-700 dark:text-violet-300", bg: "bg-violet-50 dark:bg-violet-950/20", pct: 100 },
  { label: "Superior",          range: "120–129", color: "bg-blue-500",   text: "text-blue-700 dark:text-blue-300",   bg: "bg-blue-50 dark:bg-blue-950/20",   pct: 87 },
  { label: "Acima da Média",    range: "110–119", color: "bg-cyan-500",   text: "text-cyan-700 dark:text-cyan-300",   bg: "bg-cyan-50 dark:bg-cyan-950/20",   pct: 75 },
  { label: "Média",             range: "90–109",  color: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/20", pct: 60 },
  { label: "Abaixo da Média",   range: "80–89",  color: "bg-amber-500",  text: "text-amber-700 dark:text-amber-300",  bg: "bg-amber-50 dark:bg-amber-950/20",  pct: 45 },
  { label: "Limítrofe",         range: "70–79",  color: "bg-orange-500", text: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-950/20", pct: 30 },
  { label: "Deficitário",       range: "< 70",   color: "bg-red-500",    text: "text-red-700 dark:text-red-300",    bg: "bg-red-50 dark:bg-red-950/20",    pct: 18 },
];

const encaminhamentos = [
  { icon: MessageSquare, title: "Fonoaudiologia",         desc: "Indicada para dificuldades de linguagem, leitura (dislexia), processamento auditivo e comunicação social.", color: "from-blue-400 to-indigo-500" },
  { icon: Hand,          title: "Terapia Ocupacional",    desc: "Para dificuldades motoras finas, integração sensorial, praxias e habilidades de vida diária.", color: "from-emerald-400 to-teal-500" },
  { icon: BookOpen,      title: "Psicopedagogia",         desc: "Apoio especializado nas dificuldades de aprendizagem escolar: leitura, escrita e matemática.", color: "from-amber-400 to-orange-500" },
  { icon: Heart,         title: "Psicoterapia",           desc: "Para questões emocionais, regulação comportamental, ansiedade e impacto emocional das dificuldades.", color: "from-rose-400 to-pink-500" },
  { icon: School,        title: "Adaptações escolares",   desc: "Tempo extra, sala de recursos, material adaptado, redução de demandas grafomotoras e apoio pedagógico.", color: "from-violet-400 to-purple-500" },
  { icon: RefreshCw,     title: "Reavaliação periódica",  desc: "Recomenda-se reavaliar a cada 1–2 anos para monitorar o desenvolvimento e ajustar intervenções.", color: "from-cyan-400 to-sky-500" },
];

const faqs = [
  {
    id: "rotulo",
    question: "\"Meu filho vai ficar com um rótulo?\"",
    answer: "Não. O objetivo da avaliação é compreender o perfil cognitivo único da criança — pontos fortes e dificuldades — para planejar intervenções individualizadas. O resultado é um mapa de como a criança aprende e processa informações, não uma etiqueta definitiva. Muitos profissionais preferem o termo \"laudo\" ao \"rótulo\", pois o documento orienta e abre portas (como adaptações escolares e terapias), sem limitar o potencial da criança."
  },
  {
    id: "tempo",
    question: "Quanto tempo demora a avaliação completa?",
    answer: "No total, o processo costuma envolver de 4 a 6 encontros: 1 sessão de anamnese com os pais (1–1,5h), de 2 a 4 sessões de testagem com a criança (1–2h cada), e 1 sessão de devolutiva com a família. O tempo total varia conforme a complexidade do caso, a faixa etária e a capacidade de cooperação da criança."
  },
  {
    id: "pedido",
    question: "Precisa de pedido médico?",
    answer: "Não é obrigatório. A avaliação neuropsicológica pode ser solicitada pela família diretamente, sem encaminhamento médico. Porém, uma solicitação do neuropediatra, neurologista ou psiquiatra infantil enriquece o processo, pois fornece contexto clínico relevante e facilita a integração dos resultados com o acompanhamento médico. O pedido médico também pode ser necessário para planos de saúde."
  },
  {
    id: "idade",
    question: "A partir de que idade pode ser feita?",
    answer: "A partir dos 2 anos de idade, utilizando instrumentos adaptados à faixa etária (ex: SON-R, escalas Bayley). Abaixo de 3 anos, o processo é mais qualitativo e observacional. Entre 3 e 5 anos, existem testes específicos (NEPSY-II, escalas pré-escolares). A partir dos 6 anos, o leque de instrumentos é mais amplo e os resultados mais precisos."
  },
  {
    id: "levar",
    question: "O que levar no dia da avaliação?",
    answer: "Recomenda-se trazer: relatórios médicos e de outros especialistas (laudos anteriores, exames de neuroimagem, EEG), cadernos e atividades escolares recentes, avaliações pedagógicas da escola, carteira de vacinação (para verificar desenvolvimento precoce), e qualquer documentação de atendimento terapêutico. A criança deve estar descansada e não em jejum."
  },
  {
    id: "mudanca",
    question: "O resultado muda com o tempo?",
    answer: "Sim. O cérebro em desenvolvimento é dinâmico, especialmente na infância. O perfil cognitivo pode mudar com a maturação neurológica, com as intervenções terapêuticas e com as experiências educacionais. Por isso, recomenda-se reavaliar a cada 1 a 2 anos, ou sempre que houver mudança clínica significativa, inicio de novo tratamento ou transição escolar importante."
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function NeuropsicologiaPage() {
  return (
    <div className="space-y-8" data-testid="neuropsicologia-page">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.06),transparent_50%)]" />
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg flex-shrink-0">
            <BrainCog className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-2 min-w-0">
            <h1 className="text-xl font-bold leading-tight">
              Entendendo a Avaliação Neuropsicológica
            </h1>
            <p className="text-white/80 text-sm leading-relaxed">
              Guia didático para profissionais e famílias
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge className="bg-white/20 text-white border-white/30 text-xs">Educacional</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">PT-BR</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">Neuropediatria</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── HERO IMAGE ── */}
      <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 shadow-lg">
        <img src={heroBrainImg} alt="" className="w-full h-full object-cover" />
      </div>

      {/* ── 1. O QUE É ── */}
      <section className="space-y-3">
        <SectionHeader icon={BrainCog} title="O que é Avaliação Neuropsicológica?" color="text-violet-600 dark:text-violet-400" />

        <Card className="border-card-border">
          <CardContent className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A <strong className="text-foreground">Avaliação Neuropsicológica</strong> é um processo científico e estruturado que investiga o funcionamento das funções cognitivas do cérebro — atenção, memória, linguagem, funções executivas, habilidades visuoespaciais, praxias e cognição social — por meio de testes padronizados, entrevistas e observação clínica.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Diferentemente da avaliação psicológica tradicional (que foca em personalidade, emoções e saúde mental), a avaliação neuropsicológica mapeia especificamente <strong className="text-foreground">como o cérebro processa e executa tarefas cognitivas</strong>, identificando pontos fortes e dificuldades no perfil da criança.
            </p>

            <div className="grid grid-cols-1 gap-3 pt-1">
              <InfoCard
                icon={Users}
                title="Quem realiza?"
                desc="O Neuropsicólogo — psicólogo com especialização em neuropsicologia, habilitado para aplicar, corrigir e interpretar testes neuropsicológicos padronizados."
                color="text-violet-500"
                bg="bg-violet-50 dark:bg-violet-950/20"
              />
              <InfoCard
                icon={Target}
                title="Qual o objetivo?"
                desc="Traçar um perfil detalhado do funcionamento cognitivo da criança, orientar diagnósticos, planejar intervenções e acompanhar a evolução ao longo do tempo."
                color="text-blue-500"
                bg="bg-blue-50 dark:bg-blue-950/20"
              />
              <InfoCard
                icon={CheckCircle2}
                title="O que a diferencia?"
                desc="Usa instrumentos padronizados e normatizados por faixa etária, permitindo comparar o desempenho da criança com seus pares. É muito mais detalhada que uma triagem escolar ou consulta clínica."
                color="text-emerald-500"
                bg="bg-emerald-50 dark:bg-emerald-950/20"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── 2. QUANDO SOLICITAR ── */}
      <section className="space-y-3">
        <SectionHeader icon={AlertCircle} title="Quando Solicitar?" color="text-amber-600 dark:text-amber-400" />
        <div className="grid grid-cols-2 gap-2">
          {indicacoes.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className={`rounded-xl border ${item.border} ${item.bg} p-3 flex items-start gap-2.5`}
              >
                <Icon className={`w-4 h-4 ${item.color} mt-0.5 flex-shrink-0`} />
                <p className="text-xs font-medium text-foreground leading-snug">{item.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. FUNÇÕES COGNITIVAS ── */}
      <section className="space-y-3">
        <SectionHeader icon={Layers} title="O que é Avaliado? Funções Cognitivas" color="text-blue-600 dark:text-blue-400" />

        <div className="space-y-3">
          {dominios.map((dominio) => {
            const Icon = dominio.icon;
            return (
              <Card key={dominio.title} className="border-card-border overflow-hidden">
                <div className={`h-1.5 w-full bg-gradient-to-r ${dominio.gradient}`} />
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${dominio.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className={`text-sm font-bold ${dominio.color}`}>{dominio.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {dominio.subtypes.map((sub) => (
                      <div key={sub.name} className={`rounded-lg ${dominio.bg} border ${dominio.border} px-3 py-2`}>
                        <p className="text-xs font-semibold text-foreground mb-0.5">{sub.name}</p>
                        <p className="text-xs text-muted-foreground leading-snug">{sub.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── 4. PRINCIPAIS TESTES ── */}
      <section className="space-y-3">
        <SectionHeader icon={ClipboardList} title="Principais Testes Utilizados" color="text-indigo-600 dark:text-indigo-400" />

        <Card className="border-card-border">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {testes.map((teste, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground">{teste.nome}</p>
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                        <Clock className="w-3 h-3 mr-1" />
                        {teste.faixa}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">{teste.mede}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── 5. COMO FUNCIONA ── */}
      <section className="space-y-3">
        <SectionHeader icon={ArrowRight} title="Como Funciona a Avaliação?" color="text-emerald-600 dark:text-emerald-400" />

        <div className="space-y-2.5">
          {etapas.map((etapa) => {
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
      </section>

      {/* ── 6. COMO INTERPRETAR ── */}
      <section className="space-y-3">
        <SectionHeader icon={BarChart2} title="Como Interpretar o Relatório?" color="text-rose-600 dark:text-rose-400" />

        <Card className="border-card-border">
          <CardContent className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Os resultados são expressos em <strong className="text-foreground">pontuações padronizadas</strong> que permitem comparar o desempenho da criança com uma amostra normativa de sua faixa etária:
            </p>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="font-semibold text-foreground">Escore padrão</p>
                <p className="text-muted-foreground">Média 100, DP 15</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="font-semibold text-foreground">Percentil</p>
                <p className="text-muted-foreground">0–100% dos pares</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="font-semibold text-foreground">Z-escore</p>
                <p className="text-muted-foreground">Desvios da média</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Classificação por Escore Padrão (QI / Índices)</p>
              {classificacoes.map((cls) => (
                <div key={cls.label} className={`flex items-center gap-3 rounded-lg ${cls.bg} border border-transparent px-3 py-2`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-xs font-semibold ${cls.text}`}>{cls.label}</p>
                      <Badge variant="outline" className={`text-xs ${cls.text}`}>{cls.range}</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${cls.color}`}
                        style={{ width: `${cls.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                  <strong>Lembre-se:</strong> o relatório é muito mais que números. A análise qualitativa — como a criança abordou as tarefas, seus padrões de erro, nível de esforço e comportamento durante os testes — é igualmente importante para a compreensão do perfil cognitivo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── 7. O QUE FAZER COM O RESULTADO ── */}
      <section className="space-y-3">
        <SectionHeader icon={Lightbulb} title="O que Fazer com o Resultado?" color="text-cyan-600 dark:text-cyan-400" />

        <div className="grid grid-cols-1 gap-3">
          {encaminhamentos.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border-card-border overflow-hidden">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Integração médica */}
        <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-4">
          <div className="flex items-start gap-2">
            <Stethoscope className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-violet-800 dark:text-violet-300 space-y-1">
              <p className="font-semibold">Integração com a avaliação médica</p>
              <p className="leading-relaxed">O relatório neuropsicológico deve ser compartilhado com o neuropediatra, psiquiatra infantil ou neurologista. A integração dos dados neuropsicológicos com os dados clínicos, de neuroimagem e eletrofisiológicos resulta em diagnósticos mais precisos e planos terapêuticos mais eficazes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. PERGUNTAS FREQUENTES ── */}
      <section className="space-y-3">
        <SectionHeader icon={HelpCircle} title="Perguntas Frequentes" color="text-amber-600 dark:text-amber-400" />

        <Card className="border-card-border">
          <CardContent className="p-4">
            <Accordion type="single" collapsible className="space-y-0">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="border-b last:border-b-0">
                  <AccordionTrigger className="hover:no-underline py-4 text-left">
                    <span className="text-sm font-semibold text-foreground pr-2 leading-snug">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* ── DISCLAIMER ── */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Aviso educacional:</strong> Este guia tem finalidade informativa e didática para profissionais de saúde e famílias. Não substitui a avaliação clínica individualizada nem o trabalho do neuropsicólogo. Para uma avaliação completa, procure um profissional habilitado.
          </p>
        </div>
      </div>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4.5 h-4.5 ${color}`} />
      <h2 className={`text-sm font-bold uppercase tracking-wider ${color}`}>{title}</h2>
    </div>
  );
}

function InfoCard({ icon: Icon, title, desc, color, bg }: { icon: any; title: string; desc: string; color: string; bg: string }) {
  return (
    <div className={`rounded-xl ${bg} p-3 flex items-start gap-3`}>
      <Icon className={`w-4 h-4 ${color} mt-0.5 flex-shrink-0`} />
      <div>
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
