import { Link } from "wouter";
import {
  Baby, Users, GraduationCap, Brain, Waves, ArrowRight, Stethoscope,
  ClipboardList, FileText, ShieldAlert, CloudRain, AlertTriangle, VolumeX,
  UtensilsCrossed, Flame
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const scales = [
  {
    href: "/emdi",
    title: "EMDI-J26",
    subtitle: "Escala Médica do Desenvolvimento Infantil",
    ageRange: "12m–8 anos",
    items: 36,
    domains: 8,
    icon: Baby,
    gradient: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/eaf",
    title: "EAF-J26",
    subtitle: "Escala de Adaptação Funcional",
    ageRange: "2–18 anos",
    items: 24,
    domains: 6,
    icon: Users,
    gradient: "from-blue-500 to-cyan-600",
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    href: "/pdae",
    title: "PDAE-J26",
    subtitle: "Protocolo de Desempenho Acadêmico e Escolar",
    ageRange: "Ed. Inf. final – 9º ano",
    items: 24,
    domains: 5,
    icon: GraduationCap,
    gradient: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    href: "/ecsm",
    title: "ECSM-J26",
    subtitle: "Escala de Cognição Social e Mentalização",
    ageRange: "4–14 anos",
    items: 15,
    domains: 1,
    icon: Brain,
    gradient: "from-purple-500 to-violet-600",
    bgLight: "bg-purple-50 dark:bg-purple-950/30",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    href: "/ips",
    title: "IPS-J26",
    subtitle: "Inventário de Processamento Sensorial",
    ageRange: "18m–14 anos",
    items: 24,
    domains: 6,
    icon: Waves,
    gradient: "from-rose-500 to-pink-600",
    bgLight: "bg-rose-50 dark:bg-rose-950/30",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
];

const regulacaoScales = [
  {
    href: "/ecar-si",
    title: "ECAR-SI J26",
    subtitle: "Escala Clínica de Risco de Autoagressão e Suicidalidade",
    ageRange: "Pediatria",
    items: 36,
    domains: 9,
    icon: ShieldAlert,
    gradient: "from-red-600 to-rose-700",
    bgLight: "bg-red-50 dark:bg-red-950/30",
    iconColor: "text-red-600 dark:text-red-400",
  },
  {
    href: "/edi",
    title: "EDI-J26",
    subtitle: "Escala de Depressão Infantil",
    ageRange: "Pediatria",
    items: 24,
    domains: 1,
    icon: CloudRain,
    gradient: "from-sky-500 to-blue-600",
    bgLight: "bg-sky-50 dark:bg-sky-950/30",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    href: "/eai",
    title: "EAI-J26",
    subtitle: "Escala de Ansiedade Infantil",
    ageRange: "Pediatria",
    items: 20,
    domains: 1,
    icon: AlertTriangle,
    gradient: "from-amber-500 to-yellow-600",
    bgLight: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    href: "/easi",
    title: "EASI-J26",
    subtitle: "Escala de Ansiedade Social Infantil",
    ageRange: "Pediatria",
    items: 15,
    domains: 1,
    icon: Users,
    gradient: "from-orange-500 to-red-500",
    bgLight: "bg-orange-50 dark:bg-orange-950/30",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    href: "/ems",
    title: "EMS-J26",
    subtitle: "Escala de Mutismo Seletivo",
    ageRange: "Pediatria",
    items: 15,
    domains: 1,
    icon: VolumeX,
    gradient: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50 dark:bg-violet-950/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    href: "/etare",
    title: "ETARE-J26",
    subtitle: "Escala de Transtorno Alimentar Restritivo Evitativo",
    ageRange: "Pediatria",
    items: 18,
    domains: 1,
    icon: UtensilsCrossed,
    gradient: "from-lime-500 to-green-600",
    bgLight: "bg-lime-50 dark:bg-lime-950/30",
    iconColor: "text-lime-600 dark:text-lime-400",
  },
  {
    href: "/eaah",
    title: "EAAH-J26",
    subtitle: "Escala de Autoagressividade e Heteroagressividade",
    ageRange: "Pediatria",
    items: 20,
    domains: 3,
    icon: Flame,
    gradient: "from-red-500 to-orange-600",
    bgLight: "bg-red-50 dark:bg-red-950/30",
    iconColor: "text-red-600 dark:text-red-400",
  },
];

export default function BateriaJadsonPage() {
  return (
    <div className="space-y-6" data-testid="bateria-jadson-page">
      {/* Header */}
      <div className="text-center space-y-3 py-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">
          Bateria Autoral Dr. Jadson — Versão 2026
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Protocolos estruturados de triagem e acompanhamento do neurodesenvolvimento
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <Badge variant="secondary" className="gap-1.5">
            <ClipboardList className="w-3 h-3" />
            5 Escalas
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <FileText className="w-3 h-3" />
            Autoral 2026
          </Badge>
        </div>
      </div>

      {/* Scale cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {scales.map((scale) => (
          <Link key={scale.href} href={scale.href}>
            <Card className={`cursor-pointer group transition-all duration-200 hover:shadow-md border-card-border ${scale.bgLight}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${scale.gradient} flex items-center justify-center shadow-sm`}>
                    <scale.icon className="w-4 h-4 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-foreground">{scale.title}</h2>
                    <Badge variant="outline" className="text-xs">{scale.ageRange}</Badge>
                  </div>
                  <p className={`text-xs font-medium mt-0.5 ${scale.iconColor}`}>{scale.subtitle}</p>
                </div>
                <div className="flex gap-1.5">
                  <Badge variant="outline" className="text-xs">{scale.items} itens</Badge>
                  <Badge variant="outline" className="text-xs">{scale.domains} {scale.domains === 1 ? "domínio" : "domínios"}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Clinical conclusion template */}
      <Card className="border-emerald-300/40 dark:border-emerald-700/40 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-foreground">Modelo de Conclusão Clínica</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            "A aplicação da Bateria Autoral Dr. Jadson – Versão 2026 evidenciou perfil de desenvolvimento heterogêneo, com maior comprometimento nos eixos de __________, __________ e __________, ao passo que se observam melhores recursos relativos em __________, __________ e __________. O conjunto dos achados sugere repercussão funcional em contexto de vida diária, interação social, aprendizagem e/ou regulação comportamental, devendo os resultados ser interpretados em correlação com anamnese, exame clínico, observação comportamental, relatórios multiprofissionais e evolução longitudinal."
          </p>
        </CardContent>
      </Card>

      {/* Regulação Emocional e Psiquiatria Infantil */}
      <div className="text-center space-y-3 py-4 mt-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Regulação Emocional e Psiquiatria Infantil
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Escalas de rastreio e acompanhamento em saúde mental pediátrica
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <Badge variant="secondary" className="gap-1.5">
            <ClipboardList className="w-3 h-3" />
            7 Escalas
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <FileText className="w-3 h-3" />
            Autoral 2026
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {regulacaoScales.map((scale) => (
          <Link key={scale.href} href={scale.href}>
            <Card className={`cursor-pointer group transition-all duration-200 hover:shadow-md border-card-border ${scale.bgLight}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${scale.gradient} flex items-center justify-center shadow-sm`}>
                    <scale.icon className="w-4 h-4 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-foreground">{scale.title}</h2>
                    <Badge variant="outline" className="text-xs">{scale.ageRange}</Badge>
                  </div>
                  <p className={`text-xs font-medium mt-0.5 ${scale.iconColor}`}>{scale.subtitle}</p>
                </div>
                <div className="flex gap-1.5">
                  <Badge variant="outline" className="text-xs">{scale.items} itens</Badge>
                  <Badge variant="outline" className="text-xs">{scale.domains} {scale.domains === 1 ? "domínio" : "domínios"}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Second clinical conclusion template */}
      <Card className="border-red-300/40 dark:border-red-700/40 bg-gradient-to-br from-red-50/80 to-rose-50/80 dark:from-red-950/20 dark:to-rose-950/20">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 className="text-sm font-bold text-foreground">Modelo de Conclusão Clínica — Regulação Emocional</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            "A aplicação das escalas de regulação emocional e psiquiatria infantil (Bateria Dr. Jadson – 2026) evidenciou perfil clínico com indicadores significativos nos eixos de __________, __________ e __________, enquanto se observam fatores protetores relativos em __________. O escore de risco global e os alarmes clínicos identificados sugerem necessidade de __________, devendo os resultados ser interpretados em correlação com anamnese, exame clínico, observação comportamental, contexto familiar e escolar, relatórios multiprofissionais e evolução longitudinal."
          </p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Aviso:</strong> Instrumento autoral de uso educacional e clínico. Os resultados devem ser interpretados por profissional habilitado em contexto de avaliação multidisciplinar completa.
        </p>
      </div>
    </div>
  );
}
