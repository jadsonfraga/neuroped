import {
  Ear, CheckCircle2, AlertCircle, BookOpen, Clock, Users, Target,
  Layers, Zap, MessageSquare, Eye, Lightbulb, Heart,
  FileText, BarChart2, HelpCircle, School, RefreshCw,
  Stethoscope, ClipboardList, Info, Volume2, Radio, Filter,
  Brain, Headphones, Activity, Puzzle, Shuffle,
  Settings2, Home, TriangleAlert
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ─── Data ────────────────────────────────────────────────────────────────────

const habilidades = [
  {
    icon: Volume2,
    title: "Detecção",
    desc: "Perceber a presença ou ausência do som no ambiente.",
    gradient: "from-violet-400 to-purple-500",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800/40",
  },
  {
    icon: Shuffle,
    title: "Discriminação",
    desc: "Diferenciar sons semelhantes: /p/ vs /b/, /t/ vs /d/, /f/ vs /v/.",
    gradient: "from-blue-400 to-indigo-500",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800/40",
  },
  {
    icon: Radio,
    title: "Localização",
    desc: "Identificar de onde vem o som no espaço (direita, esquerda, frente, atrás).",
    gradient: "from-emerald-400 to-teal-500",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800/40",
  },
  {
    icon: Eye,
    title: "Reconhecimento",
    desc: "Identificar e nomear o som ouvido, associando-o a uma fonte conhecida.",
    gradient: "from-amber-400 to-orange-500",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800/40",
  },
  {
    icon: Target,
    title: "Atenção Auditiva",
    desc: "Manter o foco em um estímulo sonoro por período prolongado, ignorando distrações.",
    gradient: "from-rose-400 to-pink-500",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-800/40",
  },
  {
    icon: Brain,
    title: "Memória Auditiva",
    desc: "Reter e recordar informações apresentadas oralmente após um intervalo de tempo.",
    gradient: "from-cyan-400 to-sky-500",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-sky-950/20",
    border: "border-cyan-200 dark:border-sky-800/40",
  },
  {
    icon: Layers,
    title: "Sequenciação Auditiva",
    desc: "Ordenar sons, sílabas ou palavras na sequência correta em que foram apresentados.",
    gradient: "from-indigo-400 to-violet-500",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    border: "border-indigo-200 dark:border-indigo-800/40",
  },
  {
    icon: Filter,
    title: "Figura-Fundo Auditivo",
    desc: "Separar o som relevante (figura) do ruído de fundo — essencial em sala de aula.",
    gradient: "from-fuchsia-400 to-purple-500",
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/20",
    border: "border-fuchsia-200 dark:border-fuchsia-800/40",
  },
  {
    icon: MessageSquare,
    title: "Fechamento Auditivo",
    desc: "Completar uma mensagem quando parte dela foi perdida ou distorcida.",
    gradient: "from-orange-400 to-red-500",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800/40",
  },
  {
    icon: Headphones,
    title: "Integração Binaural",
    desc: "Combinar e integrar informações sonoras recebidas pelos dois ouvidos simultaneamente.",
    gradient: "from-teal-400 to-emerald-500",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/20",
    border: "border-teal-200 dark:border-teal-800/40",
  },
  {
    icon: Activity,
    title: "Resolução Temporal",
    desc: "Perceber mudanças rápidas nos sons ao longo do tempo — base para entender a fala.",
    gradient: "from-lime-400 to-green-500",
    color: "text-lime-600 dark:text-lime-400",
    bg: "bg-lime-50 dark:bg-lime-950/20",
    border: "border-lime-200 dark:border-lime-800/40",
  },
];

const sinaisAlerta = [
  { label: "\"Hein?\" e \"O quê?\" frequentes", icon: MessageSquare },
  { label: "Dificuldade em seguir instruções verbais", icon: AlertCircle },
  { label: "Demora para responder quando chamado", icon: Clock },
  { label: "Dificuldade em ambientes ruidosos (escola, festas)", icon: Volume2 },
  { label: "Troca letras na escrita (p/b, t/d, f/v)", icon: BookOpen },
  { label: "Desatenção que parece TDAH", icon: Zap },
  { label: "Dificuldade com ditado e cópia", icon: FileText },
  { label: "Problemas de linguagem oral", icon: MessageSquare },
  { label: "Dificuldade com leitura e escrita", icon: BookOpen },
  { label: "Necessidade de repetição frequente", icon: RefreshCw },
  { label: "Parece não ouvir quando está distraído", icon: Ear },
  { label: "Dificuldade em conversas em grupo", icon: Users },
];

const tabelaComparativa = [
  { aspecto: "Atenção",               tpac: "Específica para sons", tdah: "Geral (visual + auditivo)" },
  { aspecto: "Ambiente ruidoso",      tpac: "Piora muito",          tdah: "Piora moderada" },
  { aspecto: "Instruções escritas",   tpac: "Sem dificuldade",      tdah: "Também tem dificuldade" },
  { aspecto: "Memória",               tpac: "Auditiva prejudicada", tdah: "Operacional geral" },
  { aspecto: "Comportamento",         tpac: "Geralmente adequado",  tdah: "Impulsividade / hiperatividade" },
  { aspecto: "Audiometria",           tpac: "Normal",               tdah: "Normal" },
  { aspecto: "Testes de PAC",         tpac: "Alterados",            tdah: "Podem estar normais" },
];

const testes = [
  { nome: "SSW (Staggered Spondaic Word)",       habilidade: "Integração binaural" },
  { nome: "Fala com Ruído",                       habilidade: "Figura-fundo auditivo" },
  { nome: "Teste Dicótico de Dígitos",            habilidade: "Atenção dividida" },
  { nome: "Teste de Padrão de Frequência (TPF)", habilidade: "Resolução temporal" },
  { nome: "Teste de Padrão de Duração (TPD)",    habilidade: "Resolução temporal" },
  { nome: "PSI (Pediatric Speech Intelligibility)", habilidade: "Figura-fundo" },
  { nome: "RGDT (Random Gap Detection Test)",    habilidade: "Resolução temporal" },
  { nome: "Teste de Fala Filtrada",              habilidade: "Fechamento auditivo" },
  { nome: "PEATE (Potencial Evocado Auditivo)",  habilidade: "Integridade da via auditiva" },
  { nome: "P300",                                 habilidade: "Processamento cortical" },
];

const etapasAvaliacao = [
  {
    num: 1,
    titulo: "Audiometria tonal e vocal",
    desc: "Etapa obrigatória para excluir perda auditiva periférica. A audição precisa estar normal para o diagnóstico de TPAC.",
    color: "from-violet-500 to-purple-600",
    icon: Volume2,
  },
  {
    num: 2,
    titulo: "Avaliação do PAC propriamente dita",
    desc: "Realizada geralmente a partir dos 7 anos, quando a maturação do sistema auditivo permite resultados mais confiáveis. Triagem pode ser feita a partir dos 5 anos.",
    color: "from-blue-500 to-indigo-600",
    icon: ClipboardList,
  },
  {
    num: 3,
    titulo: "Aplicação dos testes específicos",
    desc: "Bateria de testes auditivos comportamentais e eletrofisiológicos selecionados conforme a queixa e a faixa etária.",
    color: "from-emerald-500 to-teal-600",
    icon: Activity,
  },
  {
    num: 4,
    titulo: "Análise e interpretação",
    desc: "Comparação com normas populacionais, identificação do perfil de alteração e elaboração de hipóteses diagnósticas.",
    color: "from-amber-500 to-orange-600",
    icon: BarChart2,
  },
  {
    num: 5,
    titulo: "Relatório e devolutiva",
    desc: "Documento técnico com resultados, classificação do TPAC e recomendações para escola e família.",
    color: "from-rose-500 to-pink-600",
    icon: FileText,
  },
];

const tiposTpac = [
  {
    tipo: "Decodificação",
    desc: "Dificuldade em compreender a fala, especialmente em condições degradadas. Associado a alterações temporais.",
    gradient: "from-violet-400 to-purple-500",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800/40",
  },
  {
    tipo: "Integração",
    desc: "Dificuldade em combinar informações auditivas com outras modalidades sensoriais (visual, tátil).",
    gradient: "from-blue-400 to-indigo-500",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800/40",
  },
  {
    tipo: "Associação",
    desc: "Dificuldade em atribuir significado ao que ouve, mesmo quando a percepção do som está preservada.",
    gradient: "from-emerald-400 to-teal-500",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800/40",
  },
  {
    tipo: "Organização de Saída",
    desc: "Dificuldade em planejar e organizar a resposta verbal após compreender a mensagem auditiva.",
    gradient: "from-amber-400 to-orange-500",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800/40",
  },
  {
    tipo: "Prosódia",
    desc: "Dificuldade em interpretar entonação, ritmo e emoção na fala — impacto na comunicação social.",
    gradient: "from-rose-400 to-pink-500",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-800/40",
  },
];

const intervencoes = [
  {
    icon: Headphones,
    title: "Treinamento Auditivo Formal",
    desc: "Realizado em cabine acústica pela fonoaudióloga especialista em audiologia. Em média 8–12 sessões.",
    gradient: "from-violet-400 to-purple-500",
  },
  {
    icon: Home,
    title: "Treinamento Auditivo Informal",
    desc: "Exercícios e atividades em casa para estimular as habilidades auditivas no dia a dia.",
    gradient: "from-blue-400 to-indigo-500",
  },
  {
    icon: School,
    title: "Estratégias Ambientais",
    desc: "Lugar preferencial na sala (frente, longe da janela e do ventilador), redução de ruído de fundo.",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    icon: Radio,
    title: "Sistema FM",
    desc: "Dispositivo que capta a voz do professor e transmite diretamente ao ouvido da criança, reduzindo o ruído.",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    icon: BookOpen,
    title: "Consciência Fonológica",
    desc: "Trabalho de metalinguagem e consciência fonológica — base para leitura e escrita corretas.",
    gradient: "from-rose-400 to-pink-500",
  },
  {
    icon: Puzzle,
    title: "Estimulação Multissensorial",
    desc: "Associar o estímulo auditivo a pistas visuais, táteis e cinestésicas para fortalecer a memória.",
    gradient: "from-cyan-400 to-sky-500",
  },
  {
    icon: FileText,
    title: "Apoio Escolar",
    desc: "Adaptações pedagógicas: instruções escritas, tempo extra, prova oral, apoio visual e resumos.",
    gradient: "from-fuchsia-400 to-purple-500",
  },
  {
    icon: Heart,
    title: "Orientação Familiar",
    desc: "Estratégias de comunicação em casa: falar de frente, ambiente silencioso, uma instrução por vez.",
    gradient: "from-orange-400 to-red-500",
  },
];

const dicasPais = [
  "Fale sempre de frente, com contato visual direto",
  "Escolha um ambiente silencioso para instruções importantes",
  "Dê uma instrução de cada vez — nunca em sequência longa",
  "Peça à criança para repetir o que entendeu",
  "Use apoio visual: imagens, gestos e expressões faciais",
  "Evite falar de longe ou de costas",
];

const dicasProfessores = [
  "Sentar a criança na frente, longe de janelas e ventiladores",
  "Falar pausadamente, articulando bem as palavras",
  "Usar apoio visual no quadro junto às instruções orais",
  "Dar instruções escritas além de verbais",
  "Verificar compreensão antes de prosseguir (perguntar)",
  "Reduzir o ruído de fundo (fechar portas, usar tapetes)",
  "Considerar sistema FM se disponível na escola",
];

const faqs = [
  {
    id: "surdez",
    question: "PAC é o mesmo que surdez?",
    answer:
      "Não. A criança com Transtorno do PAC tem audição periférica normal — ela ouve os sons. O problema está em como o sistema nervoso central processa, interpreta e usa essas informações sonoras. Por isso a audiometria é normal, mas ela tem dificuldades reais de compreensão auditiva.",
  },
  {
    id: "idade",
    question: "A partir de que idade pode ser avaliada?",
    answer:
      "A avaliação completa do PAC é geralmente realizada a partir dos 7 anos, quando a maturação do sistema auditivo central está mais estável e os testes têm maior confiabilidade. Porém, triagens comportamentais podem ser realizadas a partir dos 5 anos.",
  },
  {
    id: "cura",
    question: "Tem cura?",
    answer:
      "O cérebro tem grande plasticidade, especialmente na infância. Com treinamento auditivo adequado e intervenções multidisciplinares, a grande maioria das crianças apresenta melhora significativa das habilidades auditivas. Quanto mais precoce a intervenção, melhores os resultados.",
  },
  {
    id: "tempo",
    question: "Quanto tempo dura o tratamento?",
    answer:
      "O treinamento auditivo formal em cabine acústica costuma durar em média 8 a 12 sessões semanais ou quinzenais. Além disso, as estratégias ambientais e de comunicação devem ser mantidas de forma contínua em casa e na escola.",
  },
  {
    id: "tdah",
    question: "Meu filho tem TDAH — ele também pode ter PAC?",
    answer:
      "Sim. A comorbidade entre TPAC e TDAH é frequente — estima-se que 30 a 50% dos casos apresentem as duas condições simultaneamente. Isso ocorre porque ambos afetam a atenção auditiva, porém por mecanismos diferentes. A avaliação específica de PAC é importante nesses casos.",
  },
  {
    id: "fm",
    question: "O sistema FM é caro? Os planos cobrem?",
    answer:
      "O custo dos sistemas FM pessoais varia bastante. Existem opções de diferentes valores e alguns planos de saúde cobrem total ou parcialmente o equipamento com prescrição fonoaudiológica. Algumas escolas também têm sistemas FM coletivos. Vale verificar com seu plano.",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function PacPage() {
  return (
    <div className="space-y-8" data-testid="pac-page">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 p-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.06),transparent_50%)]" />
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg flex-shrink-0">
            <Ear className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-2 min-w-0">
            <h1 className="text-xl font-bold leading-tight">
              Entendendo o Processamento Auditivo Central
            </h1>
            <p className="text-white/80 text-sm leading-relaxed">
              Guia didático para profissionais e famílias
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge className="bg-white/20 text-white border-white/30 text-xs">PAC / TPAC</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">Educacional</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">Fonoaudiologia</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── 1. O QUE É PAC ── */}
      <section className="space-y-3">
        <SectionHeader icon={Brain} title="O que é Processamento Auditivo Central (PAC)?" color="text-violet-600 dark:text-violet-400" />

        <Card className="border-card-border">
          <CardContent className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              O <strong className="text-foreground">Processamento Auditivo Central (PAC)</strong> é a capacidade do sistema nervoso central de interpretar, analisar, organizar e usar as informações captadas pelos ouvidos. Não se trata de audição periférica — os ouvidos funcionam normalmente. O problema está em <strong className="text-foreground">como o cérebro processa esses sons</strong>.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A criança com <strong className="text-foreground">Transtorno do PAC (TPAC)</strong> ouve, mas não compreende com facilidade — especialmente em ambientes ruidosos. Isso afeta diretamente a aprendizagem, o desenvolvimento da linguagem e a interação social.
            </p>

            <div className="grid grid-cols-1 gap-3 pt-1">
              <InfoCard
                icon={Ear}
                title="NÃO é problema de audição (periférica)"
                desc="A audiometria é normal. Os ouvidos funcionam bem. O problema está no caminho que o som percorre do ouvido até o cérebro e em como o cérebro o interpreta."
                color="text-emerald-500"
                bg="bg-emerald-50 dark:bg-emerald-950/20"
              />
              <InfoCard
                icon={Brain}
                title="É um problema de processamento (central)"
                desc="O sistema nervoso central tem dificuldade em detectar, discriminar, reconhecer, ordenar e interpretar os sons recebidos pelos ouvidos."
                color="text-violet-500"
                bg="bg-violet-50 dark:bg-violet-950/20"
              />
              <InfoCard
                icon={School}
                title="Impacto real no cotidiano"
                desc="Afeta aprendizagem (leitura, escrita, ditado), linguagem oral, atenção em sala de aula e interação social — especialmente em ambientes barulhentos."
                color="text-rose-500"
                bg="bg-rose-50 dark:bg-rose-950/20"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── 2. HABILIDADES AUDITIVAS ── */}
      <section className="space-y-3">
        <SectionHeader icon={Headphones} title="Habilidades Auditivas" color="text-blue-600 dark:text-blue-400" />

        <div className="grid grid-cols-1 gap-2.5">
          {habilidades.map((hab) => {
            const Icon = hab.icon;
            return (
              <div
                key={hab.title}
                className={`rounded-xl border ${hab.border} ${hab.bg} p-3.5 flex items-start gap-3`}
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${hab.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold uppercase tracking-wider ${hab.color}`}>{hab.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{hab.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. SINAIS DE ALERTA ── */}
      <section className="space-y-3">
        <SectionHeader icon={AlertCircle} title="Sinais de Alerta — Quando Suspeitar?" color="text-rose-600 dark:text-rose-400" />

        <Card className="border-card-border overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-400 to-red-500" />
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Os sinais abaixo, quando frequentes e persistentes, devem motivar encaminhamento para avaliação fonoaudiológica especializada:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {sinaisAlerta.map((sinal, i) => {
                const Icon = sinal.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 px-3 py-2.5"
                  >
                    <TriangleAlert className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                    <p className="text-xs font-medium text-foreground">{sinal.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── 4. PAC x TDAH ── */}
      <section className="space-y-3">
        <SectionHeader icon={Puzzle} title="PAC × TDAH — Como Diferenciar?" color="text-amber-600 dark:text-amber-400" />

        <Card className="border-card-border overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
          <CardContent className="p-4 space-y-4">
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-2 text-muted-foreground font-semibold uppercase tracking-wider w-32">Aspecto</th>
                    <th className="py-2 px-2 text-center">
                      <div className="inline-flex items-center gap-1 rounded-lg bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/40 px-2.5 py-1">
                        <Ear className="w-3 h-3 text-violet-500" />
                        <span className="font-bold text-violet-700 dark:text-violet-300">TPAC</span>
                      </div>
                    </th>
                    <th className="py-2 px-2 text-center">
                      <div className="inline-flex items-center gap-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/40 px-2.5 py-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span className="font-bold text-amber-700 dark:text-amber-300">TDAH</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tabelaComparativa.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                      <td className="py-2.5 px-2 font-semibold text-foreground">{row.aspecto}</td>
                      <td className="py-2.5 px-2 text-center text-violet-700 dark:text-violet-300">{row.tpac}</td>
                      <td className="py-2.5 px-2 text-center text-amber-700 dark:text-amber-300">{row.tdah}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
                  <strong>Atenção:</strong> TPAC e TDAH podem coexistir! A comorbidade é frequente (30–50% dos casos). Uma condição não exclui a outra — ambas devem ser investigadas e tratadas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── 5. COMO É FEITA A AVALIAÇÃO ── */}
      <section className="space-y-3">
        <SectionHeader icon={ClipboardList} title="Como é Feita a Avaliação?" color="text-emerald-600 dark:text-emerald-400" />

        <div className="space-y-2.5">
          {etapasAvaliacao.map((etapa) => {
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

        {/* Testes */}
        <Card className="border-card-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Settings2 className="w-4 h-4 text-emerald-500" />
              <p className="text-sm font-bold text-foreground">Testes Utilizados na Avaliação</p>
            </div>
            <div className="divide-y divide-border">
              {testes.map((teste, i) => (
                <div key={i} className="py-2.5 flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold text-foreground">{teste.nome}</p>
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700">
                        {teste.habilidade}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3 flex items-start gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                <strong>Quem realiza:</strong> Fonoaudiólogo especializado em audiologia. A avaliação é realizada em cabine acústica com equipamentos específicos.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── 6. CLASSIFICAÇÃO DO TPAC ── */}
      <section className="space-y-3">
        <SectionHeader icon={Layers} title="Classificação do TPAC" color="text-indigo-600 dark:text-indigo-400" />

        <div className="space-y-2.5">
          {tiposTpac.map((tipo) => (
            <div
              key={tipo.tipo}
              className={`rounded-xl border ${tipo.border} ${tipo.bg} p-4 flex items-start gap-3`}
            >
              <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${tipo.gradient} mt-1.5 flex-shrink-0`} />
              <div className="min-w-0">
                <p className={`text-sm font-bold ${tipo.color}`}>{tipo.tipo}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{tipo.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. TRATAMENTO E INTERVENÇÃO ── */}
      <section className="space-y-3">
        <SectionHeader icon={Activity} title="Tratamento e Intervenção" color="text-cyan-600 dark:text-cyan-400" />

        <div className="grid grid-cols-1 gap-3">
          {intervencoes.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border-card-border overflow-hidden">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
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
      </section>

      {/* ── 8. DICAS ── */}
      <section className="space-y-3">
        <SectionHeader icon={Lightbulb} title="Dicas para Pais e Professores" color="text-orange-600 dark:text-orange-400" />

        <div className="grid grid-cols-1 gap-3">
          {/* Pais */}
          <Card className="border-card-border overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-rose-400 to-pink-500" />
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-sm">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-bold text-foreground">Para os Pais</p>
              </div>
              <div className="space-y-2">
                {dicasPais.map((dica, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-foreground leading-snug">{dica}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Professores */}
          <Card className="border-card-border overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm">
                  <School className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-bold text-foreground">Para os Professores</p>
              </div>
              <div className="space-y-2">
                {dicasProfessores.map((dica, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-foreground leading-snug">{dica}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── 9. PERGUNTAS FREQUENTES ── */}
      <section className="space-y-3">
        <SectionHeader icon={HelpCircle} title="Perguntas Frequentes" color="text-fuchsia-600 dark:text-fuchsia-400" />

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
            <strong>Aviso educacional:</strong> Este guia tem finalidade informativa e didática para profissionais de saúde e famílias. Não substitui a avaliação clínica individualizada nem o trabalho do fonoaudiólogo especializado. Para avaliação e diagnóstico, procure um profissional habilitado em audiologia.
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
