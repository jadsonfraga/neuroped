import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  ClipboardCheck,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHero } from "@/components/PageHero";
import { GenericScale } from "@/components/GenericScale";
import { InteractiveScaleRunner } from "@/components/InteractiveScaleRunner";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { allScales, queixas, type ScaleEntry } from "@/data/scaleFilter";
import {
  getInteractiveScale as getInteractiveItemScale,
  makeInteractiveConfig,
} from "@/data/interactiveScaleItems";
import { getInteractiveScale as getInteractiveRunnerScale } from "@/data/interactiveScales";
import {
  getApplicationMode,
  getAssessmentUse,
  getImplementationLabel,
  getImplementationStatus,
  getLiteracyRequirement,
  getVerbalRequirement,
} from "@/data/advancedFilterLogic";
import {
  formatScaleAgeRange,
  scaleLicenseLabel,
  scalePriorityLabel,
  scaleRespondentsLabel,
  scaleRoute,
} from "@/lib/scalePresentation";

const APPLICATION_MODE_LABEL: Record<string, string> = {
  questionario_pais: "Questionário para pais ou cuidadores",
  questionario_professor: "Questionário para professor ou escola",
  autoquestionario_crianca_adolescente: "Autorrelato da criança ou adolescente",
  teste_direto_crianca: "Teste direto com a criança",
  observacional_clinico: "Observação clínica",
  entrevista_clinica: "Entrevista clínica",
  registro_clinico: "Registro e monitorização clínica",
  psicoeducacao: "Psicoeducação",
};

const ASSESSMENT_USE_LABEL: Record<string, string> = {
  triagem: "Triagem",
  diagnostico: "Apoio diagnóstico",
  monitorizacao: "Monitorização",
  seguimento: "Seguimento",
  psicoeducacao: "Psicoeducação",
};

const LITERACY_LABEL: Record<string, string> = {
  indiferente: "Independe de alfabetização",
  alfabetizado: "Requer alfabetização",
  pre_alfabetizado: "Compatível com pré-alfabetização",
};

const VERBAL_LABEL: Record<string, string> = {
  indiferente: "Independe de linguagem verbal",
  verbal: "Requer linguagem verbal",
  nao_verbal_compativel: "Compatível com perfil não verbal",
};

const QUEIXA_LABEL: Record<string, string> = {
  ...Object.fromEntries(queixas.map((queixa) => [queixa.id, queixa.label])),
  adesao: "Adesão ao tratamento",
  qualidade_vida: "Qualidade de vida",
  triagem: "Triagem ampla",
};

function queixaLabel(id: string): string {
  return (
    QUEIXA_LABEL[id] ??
    id.charAt(0).toUpperCase() + id.slice(1).replaceAll("_", " ")
  );
}

function pubmedRef(
  pubmedId?: string | null,
): { pmid: string; href: string } | null {
  const digits = pubmedId?.match(/\d{4,}/)?.[0];
  return digits
    ? { pmid: digits, href: `https://pubmed.ncbi.nlm.nih.gov/${digits}/` }
    : null;
}

const USAGE_BY_MODE: Record<string, string[]> = {
  questionario_pais: [
    "Confirme se a idade está dentro da faixa documentada.",
    "Escolha o cuidador que melhor conhece a rotina habitual.",
    "Oriente respostas baseadas em exemplos recentes, sem tentar adivinhar o diagnóstico.",
    "Use a referência original para normas, corte e interpretação.",
    "Registre data, versão e identidade do respondente no prontuário.",
  ],
  questionario_professor: [
    "Confirme a faixa etária e o tempo de convivência do professor com o estudante.",
    "Oriente respostas sobre situações escolares concretas.",
    "Compare com casa e consulta quando houver versões para outros informantes.",
    "Interprete divergências entre contextos como dado clínico relevante.",
    "Registre data, versão e identidade do respondente no prontuário.",
  ],
  autoquestionario_crianca_adolescente: [
    "Confirme idade, compreensão e condições de leitura.",
    "Garanta privacidade e explique que não existem respostas certas.",
    "Em temas de risco, mantenha supervisão clínica e plano de segurança.",
    "Use a referência original para normas, corte e interpretação.",
    "Registre data, versão e condições de aplicação.",
  ],
  teste_direto_crianca: [
    "Confirme a faixa etária e prepare o material padronizado.",
    "Aplique em ambiente calmo, com instruções consistentes.",
    "Registre desempenho e observações qualitativas sem alterar a tarefa.",
    "Interprete com normas apropriadas à idade e escolaridade.",
    "Documente versão, data e condições de aplicação.",
  ],
  observacional_clinico: [
    "Defina previamente os comportamentos e contextos que serão observados.",
    "Registre exemplos objetivos e o nível de ajuda necessário.",
    "Cruze observação, história clínica e relatos de outros ambientes.",
    "Use a referência original quando o instrumento possuir critérios normativos.",
    "Documente data, contexto e limitações da observação.",
  ],
  entrevista_clinica: [
    "Explique ao informante o objetivo da entrevista.",
    "Peça exemplos concretos, frequência, intensidade e impacto funcional.",
    "Diferencie comportamento atual, história do desenvolvimento e situações isoladas.",
    "Registre inconsistências e necessidade de informação complementar.",
    "Finalize com síntese clínica, sem transformar a entrevista em diagnóstico isolado.",
  ],
  registro_clinico: [
    "Defina período, frequência e evento que deve ser registrado.",
    "Use a mesma regra de anotação em todos os dias ou contextos.",
    "Compare tendências ao longo do tempo, não apenas um registro isolado.",
    "Relacione mudanças a intervenções, sono, medicação ou contexto.",
    "Arquive o registro com datas e fonte da informação.",
  ],
};

const USAGE_DEFAULT = [
  "Confirme adequação da idade, respondente e finalidade.",
  "Consulte o manual ou a publicação original antes da aplicação.",
  "Registre respostas e observações sem reinterpretá-las durante a coleta.",
  "Use apenas normas e pontos de corte documentados para a versão aplicada.",
  "Integre o resultado à entrevista, exame e funcionamento real.",
];

function buildObservationPrompts(scale: ScaleEntry): string[] {
  const domains = new Set(scale.queixas);
  const prompts: string[] = [];

  if (domains.has("tea") || domains.has("social")) {
    prompts.push(
      "Compartilha interesse mostrando, apontando ou chamando alguém para ver junto",
      "Mantém troca social de ida e volta e ajusta a comunicação ao interlocutor",
      "Tolera mudanças e transições com apoio compatível com a idade",
    );
  }
  if (domains.has("tdah")) {
    prompts.push(
      "Sustenta atenção em tarefa compatível com a idade e o contexto",
      "Controla impulsos de interromper, levantar ou responder antes da hora",
      "Organiza começo, meio e fim de atividades com ajuda compatível",
    );
  }
  if (domains.has("linguagem")) {
    prompts.push(
      "Compreende comandos e explicações do cotidiano",
      "Expressa necessidades, ideias e acontecimentos com clareza funcional",
      "Usa linguagem de forma social e adequada ao contexto",
    );
  }
  if (domains.has("aprendizagem")) {
    prompts.push(
      "Lê, escreve ou calcula dentro do esperado para oportunidade de ensino",
      "Aprende conteúdo novo e o recupera posteriormente",
      "O desempenho observado é coerente com esforço, frequência e suporte recebido",
    );
  }
  if (domains.has("ansiedade") || domains.has("depressao")) {
    prompts.push(
      "Medo, preocupação ou tristeza interferem em escola, sono ou convivência",
      "Evita situações relevantes por sofrimento emocional",
      "Consegue recuperar-se com estratégias usuais de apoio",
    );
  }
  if (domains.has("comportamento")) {
    prompts.push(
      "Aceita limites sem agressão ou desregulação desproporcional",
      "Consegue retomar a atividade depois de conflito ou frustração",
      "O comportamento varia conforme demanda, ambiente ou presença de apoio",
    );
  }
  if (domains.has("sensorial") || domains.has("alimentacao")) {
    prompts.push(
      "Reage a som, toque, cheiro, luz ou textura de forma proporcional ao contexto",
      "Busca estímulos sensoriais sem comprometer segurança ou participação",
      "A resposta sensorial interfere em alimentação, autocuidado ou aprendizagem",
    );
  }
  if (
    domains.has("funcionalidade") ||
    domains.has("autonomia") ||
    domains.has("atraso")
  ) {
    prompts.push(
      "Realiza autocuidado esperado para a idade com ajuda compatível",
      "Participa das rotinas familiar, escolar e terapêutica",
      "Generaliza habilidades aprendidas para diferentes ambientes",
    );
  }
  if (domains.has("sono")) {
    prompts.push(
      "Inicia e mantém o sono em horário adequado para a idade",
      "O sono permite disposição suficiente para a rotina diurna",
    );
  }

  prompts.push(
    "O achado aparece em mais de um contexto ou informante",
    "Há exemplo concreto e recente que sustenta a observação",
    "O achado produz impacto funcional ou muda o plano de cuidado",
  );

  return Array.from(new Set(prompts)).slice(0, 12);
}

function ClinicalObservationWorkspace({ scale }: { scale: ScaleEntry }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [showResponses, setShowResponses] = useState(false);
  const prompts = buildObservationPrompts(scale);
  const allAnswered = prompts.every((prompt) => Boolean(answers[prompt]));
  const restricted =
    scale.licencaUso === "comercial" ||
    scale.licencaUso === "restrita" ||
    scale.licencaUso === "contato_autor";
  const reportItems = [
    ...prompts.map((prompt) => ({
      question: prompt,
      answer: answers[prompt] || "Não respondida",
    })),
    {
      question: "Observações registradas pelo profissional",
      answer: notes.trim() || "Não informadas",
    },
  ];
  const reportName = `${scale.name} — registro observacional complementar`;

  if (showResponses) {
    return (
      <section className="space-y-4" aria-label="Registro observacional concluído">
        <ClinicalReport
          scaleName={reportName}
          scaleFullName="Roteiro autoral complementar; não reproduz itens oficiais"
          items={reportItems}
          patientAge={formatScaleAgeRange(scale.ageMin, scale.ageMax)}
        />
        <SaveToPatient
          scaleName={reportName}
          responses={reportItems}
          patientAge={formatScaleAgeRange(scale.ageMin, scale.ageMax)}
        />
        <Button
          type="button"
          onClick={() => setShowResponses(false)}
          variant="outline"
          className="w-full"
        >
          Editar registro
        </Button>
      </section>
    );
  }

  return (
    <Card
      className="overflow-hidden rounded-3xl border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-chart-2/[0.05] shadow-sm"
      data-testid="clinical-observation-workspace"
    >
      <div className="h-1 bg-gradient-to-r from-primary via-chart-2 to-chart-3" />
      <CardHeader className="border-b border-border/60 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              espaço de trabalho clínico
            </p>
            <CardTitle className="mt-1 text-lg text-foreground">
              Registro observacional complementar
            </CardTitle>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Roteiro autoral para organizar exemplos e impacto funcional. Não é
              a aplicação oficial, não calcula escore e não substitui o manual.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        {restricted && (
          <div
            className="rounded-2xl border border-amber-300/60 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-100"
            role="note"
          >
            <strong>Licença protegida:</strong> esta área contém apenas perguntas
            observacionais autorais e não reproduz itens, normas ou escore do
            instrumento comercial/restrito.
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          {prompts.map((prompt, index) => {
            const selectId = `observation-${scale.id}-${index}`;
            return (
              <label
                key={prompt}
                htmlFor={selectId}
                className="rounded-2xl border border-border/70 bg-background/80 p-4 transition-shadow focus-within:border-primary/40 focus-within:shadow-md"
              >
                <span className="flex items-start gap-2 text-sm font-semibold leading-relaxed text-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {index + 1}
                  </span>
                  {prompt}
                </span>
                <select
                  id={selectId}
                  value={answers[prompt] || ""}
                  onChange={(event) =>
                    setAnswers((previous) => ({
                      ...previous,
                      [prompt]: event.target.value,
                    }))
                  }
                  className="mt-3 min-h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecionar observação</option>
                  <option value="Não observado / não aplicável">
                    Não observado / não aplicável
                  </option>
                  <option value="Adequado ou sem impacto relevante">
                    Adequado ou sem impacto relevante
                  </option>
                  <option value="Discreto / impacto leve">
                    Discreto / impacto leve
                  </option>
                  <option value="Claro / impacto moderado">
                    Claro / impacto moderado
                  </option>
                  <option value="Intenso / impacto importante">
                    Intenso / impacto importante
                  </option>
                </select>
              </label>
            );
          })}
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-foreground">
            Observações e exemplos concretos
          </span>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Contexto, frequência, ajuda necessária, divergência entre informantes e impacto funcional…"
            className="min-h-32 rounded-2xl bg-background"
          />
        </label>

        <Button
          type="button"
          onClick={() => setShowResponses(true)}
          disabled={!allAnswered}
          className="h-12 w-full gap-2 bg-gradient-to-r from-primary to-chart-2 text-white shadow-md"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          {allAnswered
            ? "Revisar registro completo"
            : `Complete as ${prompts.length} observações`}
        </Button>
      </CardContent>
    </Card>
  );
}

interface InfoCard {
  icon: LucideIcon;
  label: string;
  value: string;
}

export default function GenericScalePage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const scaleId = params?.id;
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const scale = allScales.find((s) => s.id === scaleId);

  const runnerDef = getInteractiveRunnerScale(scaleId);
  if (runnerDef) {
    return (
      <div className="mx-auto max-w-3xl p-3 sm:p-5">
        <InteractiveScaleRunner def={runnerDef} />
      </div>
    );
  }

  if (!scale) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center p-4">
        <Card className="w-full overflow-hidden rounded-3xl border-destructive/30">
          <div className="h-1 bg-destructive" />
          <CardContent className="space-y-4 p-6 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Instrumento não encontrado
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                O identificador informado não existe no catálogo atual.
              </p>
            </div>
            <Button onClick={() => navigate("/filtro")} className="gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Voltar ao Filtro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const itemDef = getInteractiveItemScale(scaleId);
  if (itemDef) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 p-3 sm:p-5">
        <Button
          variant="ghost"
          onClick={() => navigate("/filtro")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar ao Filtro
        </Button>
        <GenericScale config={makeInteractiveConfig(scale, itemDef)} />
      </div>
    );
  }

  const implementationStatus = getImplementationStatus(scale);
  const officialRoute = scaleRoute(scale);
  const genericRoute = `/generic-scale/${scale.id}`;
  const hasSeparateOfficialApplication =
    implementationStatus === "complete" && officialRoute !== genericRoute;
  const applicationMode = getApplicationMode(scale);
  const assessmentUse = getAssessmentUse(scale);
  const pm = pubmedRef(scale.pubmedId);
  const infoCards: InfoCard[] = [
    { icon: Clock, label: "Tempo", value: scale.tempo || "Não informado" },
    {
      icon: Layers3,
      label: "Faixa etária",
      value: formatScaleAgeRange(scale.ageMin, scale.ageMax),
    },
    {
      icon: Users,
      label: "Respondente",
      value: scaleRespondentsLabel(scale.respondente),
    },
    {
      icon: Target,
      label: "Finalidade",
      value: ASSESSMENT_USE_LABEL[assessmentUse] ?? scalePriorityLabel(scale.prioridade),
    },
  ];

  const related = allScales
    .filter((candidate) => candidate.id !== scale.id)
    .map((candidate) => {
      const sharedComplaints = candidate.queixas.filter((complaint) =>
        scale.queixas.includes(complaint),
      ).length;
      const sharedRespondents = candidate.respondente.filter((respondent) =>
        scale.respondente.includes(respondent),
      ).length;
      const ageOverlap =
        candidate.ageMax >= scale.ageMin && candidate.ageMin <= scale.ageMax;
      const score =
        sharedComplaints * 10 +
        sharedRespondents * 3 +
        (ageOverlap ? 4 : 0) +
        (getImplementationStatus(candidate) === "complete" ? 2 : 0);
      return { candidate, score };
    })
    .filter(({ score }) => score >= 10)
    .sort(
      (a, b) =>
        b.score - a.score || a.candidate.name.localeCompare(b.candidate.name, "pt-BR"),
    )
    .slice(0, 6)
    .map(({ candidate }) => candidate);

  async function copyDescription() {
    if (!scale) return;
    setCopyStatus("idle");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(scale.description);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
    window.setTimeout(() => setCopyStatus("idle"), 2200);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-3 pb-10 sm:p-5">
      <Link
        href="/filtro"
        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar ao Filtro
      </Link>

      <PageHero
        icon={BookOpen}
        eyebrow="biblioteca de escalas · referência clínica"
        title={scale.name}
        subtitle={scale.fullName}
        gradient="from-violet-600 via-indigo-600 to-blue-600"
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{scalePriorityLabel(scale.prioridade)}</Badge>
          <Badge variant="outline">
            {formatScaleAgeRange(scale.ageMin, scale.ageMax)}
          </Badge>
          <Badge variant="outline">{scaleLicenseLabel(scale.licencaUso)}</Badge>
        </div>
      </PageHero>

      <div
        className={`rounded-2xl border p-4 text-sm leading-relaxed ${
          hasSeparateOfficialApplication
            ? "border-emerald-300/60 bg-emerald-50/70 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-100"
            : "border-amber-300/60 bg-amber-50/70 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-100"
        }`}
        role="note"
        data-testid="scale-implementation-status"
      >
        <strong>Ficha de referência: </strong>
        {hasSeparateOfficialApplication
          ? "A aplicação completa existe em uma rota própria. Esta página organiza metadados e um registro observacional complementar."
          : getImplementationLabel(implementationStatus)}
        {" Esta tela não reproduz itens oficiais nem calcula escore."}
        {hasSeparateOfficialApplication && (
          <Link
            href={officialRoute}
            className="mt-3 flex min-h-10 w-fit items-center gap-1.5 rounded-xl border border-current/20 bg-background/70 px-3 py-2 text-xs font-bold text-current transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Abrir aplicação oficial
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      <section
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Metadados do instrumento"
      >
        {infoCards.map((info) => (
          <Card
            key={info.label}
            className="h-full rounded-2xl border-border/70 bg-card/80 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <info.icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
                  {info.label}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-bold leading-snug text-foreground">
                {info.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden rounded-3xl border-border/70 bg-card/90">
          <div className="h-1 bg-gradient-to-r from-primary via-chart-2 to-chart-3" />
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-black text-foreground">O que avalia</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void copyDescription()}
                  className="h-9 gap-1.5 text-xs"
                  aria-live="polite"
                >
                  {copyStatus === "success" ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : copyStatus === "error" ? (
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {copyStatus === "success"
                    ? "Copiado"
                    : copyStatus === "error"
                      ? "Falha ao copiar"
                      : "Copiar descrição"}
                </Button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {scale.description}
              </p>
            </div>

            {scale.exemploPais && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                  exemplo em linguagem cotidiana
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                  {scale.exemploPais}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-foreground">Domínios relacionados</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {scale.queixas.map((complaint) => (
                  <Badge key={complaint} variant="secondary">
                    {queixaLabel(complaint)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-gradient-to-br from-card to-muted/30">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-black text-foreground">Aplicação em contexto</h2>
            </div>
            {[
              ["Modo", APPLICATION_MODE_LABEL[applicationMode] ?? applicationMode],
              ["Comunicação", VERBAL_LABEL[getVerbalRequirement(scale)]],
              ["Alfabetização", LITERACY_LABEL[getLiteracyRequirement(scale)]],
              ["Licença", scaleLicenseLabel(scale.licencaUso)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border/70 bg-background/70 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
                  {value}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {(scale.scoringCutoff || scale.validacaoBrasil || scale.fonte || pm) && (
        <Card className="rounded-3xl border-border/70">
          <CardHeader className="border-b border-border/60 p-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
              Evidência, interpretação e proveniência
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 lg:grid-cols-2">
            {scale.scoringCutoff && (
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">
                  interpretação documentada
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                  {scale.scoringCutoff}
                </p>
              </div>
            )}
            <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
              {scale.validacaoBrasil && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Validação Brasil:</strong>{" "}
                  {scale.validacaoBrasil}
                </p>
              )}
              {scale.fonte && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Fonte:</strong> {scale.fonte}
                </p>
              )}
              {pm && (
                <a
                  href={pm.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-sm font-bold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  PubMed {pm.pmid}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(!scale.scoringCutoff || !scale.validacaoBrasil || !scale.fonte) && (
        <div
          className="rounded-2xl border border-amber-300/60 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-100"
          role="note"
        >
          <strong>Metadados ainda não documentados nesta base:</strong>{" "}
          {[
            !scale.scoringCutoff && "ponto de corte/interpretação",
            !scale.validacaoBrasil && "validação brasileira",
            !scale.fonte && "fonte/referência",
          ]
            .filter(Boolean)
            .join(" · ")}
          . Confirme na versão e publicação originais antes do uso clínico.
        </div>
      )}

      {applicationMode !== "psicoeducacao" && (
        <ClinicalObservationWorkspace scale={scale} />
      )}

      <Card className="rounded-3xl border-border/70">
        <CardHeader className="border-b border-border/60 p-5">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Como usar com segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <ol className="grid gap-3 lg:grid-cols-2">
            {(USAGE_BY_MODE[applicationMode] ?? USAGE_DEFAULT).map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm leading-relaxed text-foreground"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {related.length > 0 && (
        <Card className="rounded-3xl border-border/70">
          <CardHeader className="border-b border-border/60 p-5">
            <CardTitle className="text-base">Instrumentos relacionados</CardTitle>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Priorizados por domínio, idade, respondente e disponibilidade real.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((candidate) => {
              const candidateStatus = getImplementationStatus(candidate);
              return (
                <Link
                  key={candidate.id}
                  href={scaleRoute(candidate)}
                  className="group rounded-2xl border border-border/70 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-foreground group-hover:text-primary">
                      {candidate.name}
                    </p>
                    <Badge variant={candidateStatus === "complete" ? "secondary" : "outline"}>
                      {candidateStatus === "complete" ? "Aplicável" : "Ficha"}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {candidate.fullName}
                  </p>
                  <p className="mt-3 text-[11px] font-semibold text-muted-foreground">
                    {formatScaleAgeRange(candidate.ageMin, candidate.ageMax)} ·{" "}
                    {scaleRespondentsLabel(candidate.respondente)}
                  </p>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => navigate("/filtro")} className="flex-1 gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar ao Filtro
        </Button>
        <Button
          type="button"
          onClick={() => window.print()}
          variant="outline"
          className="gap-2"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Imprimir ficha
        </Button>
      </div>
    </div>
  );
}
