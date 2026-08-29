import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  HeartHandshake,
  Lock,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { CANONICAL_TRIAL_DAYS } from "@shared/billing";

/**
 * Página institucional B2B — apresenta o NeuroPed para outras clínicas.
 * Conteúdo exclusivamente de marketing/educacional: nenhum dado clínico,
 * nenhuma chamada de API. Rota pública aprovada na allowlist exata.
 */

interface ValueBlock {
  icon: typeof Filter;
  title: string;
  description: string;
}

const VALUE_BLOCKS: ValueBlock[] = [
  {
    icon: Filter,
    title: "Filtro inteligente de escalas",
    description:
      "Catálogo com centenas de instrumentos de neurodesenvolvimento, filtrados por idade, queixa e contexto — a equipe encontra o instrumento certo em segundos.",
  },
  {
    icon: ClipboardCheck,
    title: "Escalas interativas com resultado imediato",
    description:
      "Aplicação guiada em linguagem acessível para famílias e escolas, com pontuação automática, interpretação por faixas e exportação em PDF.",
  },
  {
    icon: HeartHandshake,
    title: "Jornada da família integrada",
    description:
      "Portal da Família, pré-consulta, pré-retorno, diários (sono, alimentar, epilepsia, cefaleia) e orientação parental — a família participa antes, durante e depois da consulta.",
  },
  {
    icon: Calendar,
    title: "Operação da clínica",
    description:
      "Agenda, recepção com fila de atendimento, autoagendamento público e marcação com Secretaria IA reduzem trabalho administrativo da equipe.",
  },
  {
    icon: Users,
    title: "Multi-clínica com papéis e assentos",
    description:
      "Cada clínica é um espaço isolado, com papéis (gestão, profissional, assistente, financeiro), convites por e-mail e assentos sob controle do gestor.",
  },
  {
    icon: Lock,
    title: "Segurança e LGPD por padrão",
    description:
      "Criptografia AES-256-GCM no servidor, trilha de auditoria, consentimento LGPD registrado e separação estrita entre área pública e área clínica.",
  },
];

const ONBOARDING_STEPS = [
  {
    title: "Crie a sua conta profissional",
    description: "Cadastro simples com e-mail profissional e senha forte.",
  },
  {
    title: "Crie a sua clínica",
    description:
      "Nome, identidade e fuso horário — a clínica nasce isolada, com você como gestor.",
  },
  {
    title: "Convide a equipe",
    description:
      "Convites por e-mail com papel definido; cada membro ocupa um assento do plano.",
  },
  {
    title: `Experimente por ${CANONICAL_TRIAL_DAYS} dias`,
    description:
      "Período de avaliação com acesso completo. Assine somente se fizer sentido para a sua operação.",
  },
];

export default function ParaClinicasPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-6 h-6 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            NeuroPed para Clínicas
          </span>
        </div>
        <h1 className="text-2xl font-bold">
          A plataforma de neuropediatria da sua clínica
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Construído dentro de uma clínica real de neuropediatria — e pronto para
          organizar triagem, escalas, famílias e equipe na sua.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link href="/planos">
            <Button size="sm" className="gap-1.5">
              <Rocket className="w-4 h-4" /> Ver planos e assinar
            </Button>
          </Link>
          <Link href="/marcacao">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Calendar className="w-4 h-4" /> Falar com a equipe
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VALUE_BLOCKS.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="h-full">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold">{title}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" /> Como a sua clínica começa
          </h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ONBOARDING_STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-border p-4">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold mt-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> Compromissos que não mudam
          </h2>
          <ul className="space-y-2">
            {[
              "Ferramenta educacional e de apoio à observação — nunca substitui a avaliação do profissional.",
              "Dados clínicos protegidos por autenticação no servidor; a área pública não expõe conteúdo de pacientes.",
              "Conformidade LGPD substantiva: consentimento registrado, exportação e exclusão sob solicitação.",
              "Cada clínica enxerga apenas os próprios dados: isolamento por espaço (tenant) garantido no backend.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="rounded-3xl border border-border bg-gradient-to-br from-chart-2/10 via-primary/10 to-transparent p-6 text-center">
        <h2 className="text-lg font-bold">Pronto para conhecer na prática?</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl mx-auto">
          Veja o plano por assento, inicie o período de avaliação e convide a sua
          equipe — sem compromisso de longo prazo.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Link href="/planos">
            <Button className="gap-1.5">
              <Rocket className="w-4 h-4" /> Ver planos
            </Button>
          </Link>
          <Link href="/sobre-neuroped">
            <Button variant="outline">O que é o NeuroPed</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
