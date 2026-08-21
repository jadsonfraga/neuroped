import { useParams, useLocation, Link } from "wouter";
import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowLeft, Copy, Download, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { allScales, queixas, type ScaleEntry } from "@/data/scaleFilter";
import type { ScaleConfig } from "@/components/GenericScale";
import type { InteractiveScaleDef as RunnerScaleDef } from "@/data/interactiveScales";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import {
  getImplementationStatus,
  getImplementationLabel,
  getApplicationMode,
  getAssessmentUse,
  getLiteracyRequirement,
  getVerbalRequirement,
} from "@/data/advancedFilterLogic";
import {
  getMasterPinLockSeconds,
  isMasterPinUnlocked,
  verifyMasterPin,
} from "@/lib/masterPin";

const LazyGenericScale = lazy(() =>
  import("@/components/GenericScale").then(({ GenericScale: Component }) => ({
    default: Component,
  })),
);
const LazyInteractiveScaleRunner = lazy(() =>
  import("@/components/InteractiveScaleRunner").then(
    ({ InteractiveScaleRunner: Component }) => ({ default: Component }),
  ),
);

const APPLICATION_MODE_LABEL: Record<string, string> = {
  questionario_pais: "Questionário — pais/cuidador",
  questionario_professor: "Questionário — professor/escola",
  autoquestionario_crianca_adolescente: "Autorrelato — criança/adolescente",
  teste_direto_crianca: "Teste direto com a criança",
  observacional_clinico: "Observação clínica",
  entrevista_clinica: "Entrevista clínica",
  registro_clinico: "Registro/monitorização clínica",
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
  indiferente: "Indiferente",
  alfabetizado: "Requer alfabetização",
  pre_alfabetizado: "Pré-alfabetizada",
};
const VERBAL_LABEL: Record<string, string> = {
  indiferente: "Indiferente",
  verbal: "Requer linguagem verbal",
  nao_verbal_compativel: "Compatível com não-verbal",
};

// Rótulos legíveis de queixa (id -> label). Cobre as categorias do filtro e os
// usos pós-consulta mais comuns; o resto cai num prettify simples.
const QUEIXA_LABEL: Record<string, string> = {
  ...Object.fromEntries(queixas.map((q) => [q.id, q.label])),
  evolucao: "Evolução / Seguimento",
  efeitos: "Efeitos de medicação",
  adesao: "Adesão ao tratamento",
  qualidade_vida: "Qualidade de vida",
  triagem: "Triagem ampla",
};
function queixaLabel(id: string): string {
  return (
    QUEIXA_LABEL[id] ??
    id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ")
  );
}

// Idade legível: meses até 24m, anos acima. Evita o "0-0a" das escalas neonatais.
function ageLabel(min: number, max: number): string {
  const fmt = (m: number) => (m < 24 ? `${m} m` : `${Math.round(m / 12)} a`);
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
}

// "Como usar" adaptado ao modo de aplicação (honesto: orienta o uso real do
// instrumento, sem inventar itens/escore que a ficha não tem).
const USAGE_BY_MODE: Record<string, string[]> = {
  questionario_pais: [
    "Confirme se a idade da criança está na faixa do instrumento.",
    "Entregue ao responsável que melhor conhece a rotina da criança.",
    "Oriente a responder sobre o comportamento habitual, sem pressa.",
    "Use a referência original para os pontos de corte e a interpretação.",
    "Registre data, respondente e escore no prontuário.",
  ],
  questionario_professor: [
    "Confirme a faixa etária e o tempo de convívio do professor com a criança.",
    "Envie o questionário ao professor/escola com instruções claras.",
    "Considere o comportamento no contexto escolar (sala, recreio).",
    "Cruze com a versão de pais quando houver, para múltiplos contextos.",
    "Registre data, respondente e escore no prontuário.",
  ],
  autoquestionario_crianca_adolescente: [
    "Confirme idade e capacidade de leitura/compreensão (autorrelato).",
    "Garanta privacidade e ambiente seguro para o adolescente responder.",
    "Em temas sensíveis (humor, risco), acompanhe de perto e tenha plano de manejo.",
    "Use a referência original para corte e conduta.",
    "Registre data e escore; reavalie conforme indicado.",
  ],
  teste_direto_crianca: [
    "Confirme a faixa etária e prepare o material do teste.",
    "Aplique diretamente com a criança em ambiente calmo e sem distrações.",
    "Siga o protocolo padronizado de administração e pontuação.",
    "Anote desempenho e observações qualitativas.",
    "Interprete com normas/idade de referência e registre no prontuário.",
  ],
  observacional_clinico: [
    "Observe a criança nas situações relevantes ao domínio avaliado.",
    "Registre os comportamentos conforme os critérios do instrumento.",
    "Complemente com história clínica e relato dos cuidadores.",
    "Use a referência original para classificação.",
    "Documente data e achados no prontuário.",
  ],
  registro_clinico: [
    "Defina o período e a frequência do registro (diário/semanal).",
    "Oriente a família/equipe a anotar de forma consistente.",
    "Reúna os registros para análise de evolução ao longo do tempo.",
    "Compare entre consultas para apoiar decisões de manejo.",
    "Arquive no prontuário com as datas.",
  ],
};
const USAGE_DEFAULT = [
  "Confirme se a escala é adequada para a idade da criança.",
  "Prepare um ambiente calmo e seguro para a aplicação.",
  "Revise as instruções de aplicação na referência original.",
  "Registre as respostas conforme fornecidas.",
  "Interprete com a tabela de escore/corte oficial do instrumento.",
  "Documente data, escore e observações no prontuário.",
];

// Resolve a rota real de uma escala (mesma regra do filtro) para os links de
// instrumentos relacionados.
const ALL_IDS = new Set(allScales.map((s) => s.id));
function routeFor(s: { id: string; appRoute?: string }): string {
  if (s.appRoute) return s.appRoute;
  if (ALL_IDS.has(s.id)) return `/generic-scale/${s.id}`;
  if (s.id.startsWith("world-")) return "/escalas-neuropsiquiatria";
  return "/filtro";
}

function buildAdaptedItems(scale: ScaleEntry): string[] {
  const q = new Set(scale.queixas);
  const items: string[] = [];

  if (q.has("tea") || q.has("social")) {
    items.push(
      "Compartilha interesse mostrando, apontando ou chamando alguém para ver junto",
      "Mantém troca social de ida e volta, sem ficar só no assunto preferido",
      "Entende regras sociais do dia a dia: esperar a vez, perceber brincadeira e respeitar espaço",
      "Tolera mudança de rotina sem crise importante quando o combinado muda de repente",
    );
  }
  if (q.has("tdah")) {
    items.push(
      "Sustenta atenção em tarefa compatível com a idade, sem se perder o tempo todo",
      "Controla impulso de levantar, interromper ou responder antes da hora",
      "Organiza material, rotina e começo-meio-fim da atividade com pouca ajuda",
    );
  }
  if (q.has("linguagem")) {
    items.push(
      "Compreende comandos e explicações do cotidiano sem precisar repetir muitas vezes",
      "Expressa necessidades, ideias e acontecimentos com clareza para quem não convive todo dia",
      "Usa linguagem de forma social, adaptando fala ao contexto, pessoa e intenção",
    );
  }
  if (q.has("aprendizagem")) {
    items.push(
      "Lê, escreve ou calcula dentro do esperado para escolaridade e oportunidade de ensino",
      "Aprende conteúdo novo e consegue aplicar depois sem depender sempre de alguém do lado",
      "Mostra rendimento escolar compatível com esforço, presença e potencial observado",
    );
  }
  if (q.has("ansiedade") || q.has("depressao")) {
    items.push(
      "Preocupação, medo ou tristeza atrapalham escola, sono, alimentação ou convivência",
      "Consegue se acalmar com apoio comum da família ou escola, sem escalada frequente",
      "Evita situações importantes por sofrimento emocional ou medo de passar vergonha",
    );
  }
  if (q.has("comportamento")) {
    items.push(
      "Aceita limites e combinados sem agressão, ameaça ou birra desproporcional",
      "Assume responsabilidade pelo que fez, sem culpar sempre os outros",
      "Consegue reparar dano ou retomar a atividade depois de conflito",
    );
  }
  if (q.has("sensorial") || q.has("alimentacao")) {
    items.push(
      "Reage a som, toque, cheiro, roupa ou textura de forma proporcional ao contexto",
      "Busca movimento, pressão ou estímulo sensorial sem se colocar em risco",
      "Aceita variedade alimentar suficiente para rotina e saúde, considerando textura, cheiro e marca",
    );
  }
  if (q.has("funcionalidade") || q.has("autonomia") || q.has("atraso")) {
    items.push(
      "Realiza autocuidado esperado para idade, como higiene, vestir, comer e organizar pertences",
      "Participa da rotina familiar, escolar ou terapêutica com necessidade de ajuda compatível",
      "Generaliza habilidades aprendidas para casa, escola e outros ambientes",
    );
  }
  if (q.has("sono")) {
    items.push(
      "Inicia e mantém sono em horário adequado para idade, sem sofrimento importante",
      "Acorda com disposição suficiente para escola, terapias e rotina diária",
    );
  }

  items.push(
    "O prejuízo aparece em mais de um contexto, como casa, escola, terapia ou consulta",
    "A família reconhece exemplos concretos do comportamento na semana ou no último mês",
    "O achado muda conduta clínica, orientação, encaminhamento ou plano terapêutico",
  );

  return Array.from(new Set(items)).slice(0, 12);
}

function InternalScaleApplication({ scale }: { scale: ScaleEntry }) {
  const [unlocked, setUnlocked] = useState(() => isMasterPinUnlocked());
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [showResponses, setShowResponses] = useState(false);
  const sensitiveLicense =
    scale.licencaUso === "comercial" ||
    scale.licencaUso === "restrita" ||
    scale.licencaUso === "contato_autor";
  const adaptedItems = buildAdaptedItems(scale);
  const allAnswered = adaptedItems.every((item) => Boolean(answers[item]));
  const reportItems = [
    ...adaptedItems.map((item) => ({
      question: item,
      answer: answers[item] || "Não respondida",
    })),
    {
      question: "Observações registradas pelo aplicador",
      answer: notes.trim() || "Não informadas",
    },
  ];

  async function unlockInternal(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;
    const lockSeconds = getMasterPinLockSeconds();
    if (lockSeconds > 0) {
      setPinError(`Muitas tentativas. Aguarde ${lockSeconds}s.`);
      return;
    }
    setBusy(true);
    setPinError("");
    try {
      const ok = await verifyMasterPin(pin);
      if (!ok) {
        setPinError("PIN master incorreto.");
        setPin("");
        return;
      }
      setUnlocked(true);
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <Card className="bg-slate-800/80 border-violet-700 mb-6">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-violet-300" />
            Uso interno da escala
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-300 mb-4">
            Esta escala pode ser registrada internamente após PIN master. O PIN
            não fica visível nem salvo em texto.
          </p>
          <form
            onSubmit={unlockInternal}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN master"
              className="bg-slate-900/70 border-slate-600 text-white"
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={busy || !pin.trim()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {busy ? "Verificando..." : "Desbloquear"}
            </Button>
          </form>
          {pinError && (
            <p className="mt-2 text-sm font-semibold text-red-300">
              {pinError}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (showResponses) {
    return (
      <div className="mb-6 space-y-4">
        <ClinicalReport
          scaleName={scale.name}
          scaleFullName={scale.fullName}
          items={reportItems}
          patientAge={ageLabel(scale.ageMin, scale.ageMax)}
        />
        <SaveToPatient
          scaleName={scale.name}
          responses={reportItems}
          patientAge={ageLabel(scale.ageMin, scale.ageMax)}
        />
        <Button
          onClick={() => setShowResponses(false)}
          variant="outline"
          className="w-full"
        >
          Editar Respostas
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-slate-800/80 border-emerald-700 mb-6">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-300" />
          Uso interno desbloqueado
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">
        {sensitiveLicense && (
          <div className="rounded-lg border border-amber-700 bg-amber-900/20 p-4 text-sm text-amber-100">
            Instrumento com licença restrita/comercial. Esta tela usa itens
            autorais de registro e não reproduz o instrumento oficial.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          {adaptedItems.map((item) => (
            <label key={item} className="space-y-1">
              <span className="text-xs font-semibold text-slate-300">
                {item}
              </span>
              <select
                aria-label={item}
                value={answers[item] || ""}
                onChange={(e) =>
                  setAnswers((previous) => ({
                    ...previous,
                    [item]: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-white"
              >
                <option value="">Selecionar resposta</option>
                <option value="Não observado / não aplicável">
                  Não observado / não aplicável
                </option>
                <option value="Leve / pouco impacto">
                  Leve / pouco impacto
                </option>
                <option value="Moderado / impacto claro">
                  Moderado / impacto claro
                </option>
                <option value="Importante / impacto acentuado">
                  Importante / impacto acentuado
                </option>
              </select>
            </label>
          ))}
        </div>

        <label className="space-y-1 block">
          <span className="text-xs font-semibold text-slate-300">
            Observações do aplicador (opcional)
          </span>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-slate-900/70 border-slate-600 text-white min-h-28"
          />
        </label>

        <Button
          onClick={() => setShowResponses(true)}
          disabled={!allAnswered}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          Ver todas as perguntas e respostas
        </Button>
      </CardContent>
    </Card>
  );
}

function InteractiveLoading() {
  return (
    <div className="min-h-[45vh] flex items-center justify-center p-6">
      <div
        role="status"
        className="rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-4 text-sm font-semibold text-slate-200"
      >
        Carregando aplicação da escala…
      </div>
    </div>
  );
}

export default function GenericScalePage() {
  const params = useParams<{ id: string }>();
  const [_location, navigate] = useLocation();
  const scaleId = params?.id;

  const scale = allScales.find((s) => s.id === scaleId);
  const [copied, setCopied] = useState(false);
  const [runnerDef, setRunnerDef] = useState<
    RunnerScaleDef | null | undefined
  >(undefined);
  const [itemConfig, setItemConfig] = useState<ScaleConfig | null | undefined>(
    undefined,
  );
  const implStatus = scale ? getImplementationStatus(scale) : null;

  // Os dois acervos interativos são grandes e mutuamente exclusivos na rota.
  // Carregá-los estaticamente fazia /generic-scale materializar >1 MB mesmo
  // quando a escala usava apenas um motor. Resolve runner primeiro; só se não
  // houver definição carrega o acervo de itens. Itens, escores e contratos não
  // mudam — apenas a fronteira de carregamento.
  useEffect(() => {
    let cancelled = false;
    setRunnerDef(undefined);
    setItemConfig(undefined);

    void (async () => {
      try {
        const runnerModule = await import("@/data/interactiveScales");
        if (cancelled) return;
        const nextRunner = runnerModule.getInteractiveScale(scaleId);
        if (nextRunner) {
          setRunnerDef(nextRunner);
          setItemConfig(null);
          return;
        }

        setRunnerDef(null);
        if (!scale) {
          setItemConfig(null);
          return;
        }

        const itemModule = await import("@/data/interactiveScaleItems");
        if (cancelled) return;
        const itemDef = itemModule.getInteractiveScale(scaleId);
        setItemConfig(
          itemDef ? itemModule.makeInteractiveConfig(scale, itemDef) : null,
        );
      } catch (error) {
        console.error("[generic-scale] falha ao carregar motor interativo", error);
        if (!cancelled) {
          setRunnerDef(null);
          setItemConfig(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scaleId, scale]);

  if (runnerDef === undefined || itemConfig === undefined) {
    return <InteractiveLoading />;
  }

  if (runnerDef) {
    return (
      <Suspense fallback={<InteractiveLoading />}>
        <div className="p-1">
          <LazyInteractiveScaleRunner def={runnerDef} />
        </div>
      </Suspense>
    );
  }

  if (!scale) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md bg-red-950/50 border-red-700">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold text-red-100 mb-4">
              Escala não encontrada
            </h2>
            <p className="text-red-200 mb-6">ID: {scaleId}</p>
            <Button
              onClick={() => navigate("/filtro")}
              className="bg-red-600 hover:bg-red-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Filtro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (itemConfig) {
    return (
      <Suspense fallback={<InteractiveLoading />}>
        <div className="max-w-2xl mx-auto p-3 sm:p-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/filtro")}
            className="mb-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Filtro
          </Button>
          <LazyGenericScale config={itemConfig} />
        </div>
      </Suspense>
    );
  }

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(scale.description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Instrumentos relacionados: mesma queixa e faixa etária sobreposta. Torna a
  // ficha um hub de navegação entre escalas afins (sem inventar conteúdo).
  const related = allScales
    .filter(
      (o) =>
        o.id !== scale.id &&
        o.queixas.some((q) => scale.queixas.includes(q)) &&
        o.ageMax >= scale.ageMin &&
        o.ageMin <= scale.ageMax,
    )
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/filtro")}
            className="text-slate-300 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Filtro
          </Button>
        </div>

        {/* Banner honesto de status de implementação (req. clínico de honestidade) */}
        {implStatus && implStatus !== "complete" && (
          <Card className="bg-amber-900/20 border-amber-700 mb-6">
            <CardContent className="pt-6 text-amber-100 text-sm font-semibold">
              ⚠️ {getImplementationLabel(implStatus)} Esta página é uma{" "}
              <strong>ficha técnica/referência clínica</strong> — não é a
              aplicação completa do instrumento (sem itens nem cálculo de escore
              embutidos).
            </CardContent>
          </Card>
        )}

        {/* Escala Principal */}
        <Card className="bg-slate-800/80 border-slate-700 mb-6">
          <CardHeader className="border-b border-slate-700">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">ID: {scale.id}</p>
                <CardTitle className="text-3xl font-bold text-white mb-2">
                  {scale.name}
                </CardTitle>
                <p className="text-lg text-slate-300">{scale.fullName}</p>
              </div>

              {/* Meta informações */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                <div>
                  <p className="text-xs text-slate-400 uppercase">Tempo</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {scale.tempo}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Prioridade</p>
                  <p className="text-sm font-semibold text-slate-200 capitalize">
                    {scale.prioridade}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">
                    Faixa Etária
                  </p>
                  <p className="text-sm font-semibold text-slate-200">
                    {ageLabel(scale.ageMin, scale.ageMax)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">
                    Respondente
                  </p>
                  <p className="text-sm font-semibold text-slate-200">
                    {scale.respondente.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Descrição */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Descrição</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyDescription}
                  className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <p className="text-slate-300 leading-relaxed bg-slate-700/30 p-4 rounded">
                {scale.description}
              </p>
            </div>

            {/* Exemplo prático em linguagem de pais */}
            {scale.exemploPais && (
              <div className="rounded-xl border border-emerald-700/60 bg-emerald-900/20 p-4">
                <p className="mb-1 text-sm font-semibold text-emerald-300">
                  👨‍👩‍👧 Para quem vai responder
                </p>
                <p className="text-sm leading-relaxed text-emerald-100/90">
                  {scale.exemploPais}
                </p>
              </div>
            )}

            {/* Queixas */}
            {scale.queixas && scale.queixas.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Queixas Abordadas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {scale.queixas.map((q) => (
                    <span
                      key={q}
                      className="px-3 py-1 rounded-full bg-blue-900/50 text-blue-200 text-sm border border-blue-700"
                    >
                      {queixaLabel(q)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Informações Clínicas */}
            {scale.scoringCutoff && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Escore / Interpretação
                </h3>
                <div className="bg-slate-700/30 p-4 rounded text-slate-300">
                  {scale.scoringCutoff}
                </div>
              </div>
            )}

            {scale.validacaoBrasil && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Validação Brasil
                </h3>
                <div className="bg-green-900/20 p-4 rounded text-green-200 border border-green-700">
                  {scale.validacaoBrasil}
                </div>
              </div>
            )}

            {scale.licencaUso && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Licença de Uso
                </h3>
                <div
                  className={`p-4 rounded capitalize font-semibold ${
                    scale.licencaUso === "livre"
                      ? "bg-emerald-900/20 text-emerald-200 border border-emerald-700"
                      : scale.licencaUso === "comercial"
                        ? "bg-yellow-900/20 text-yellow-200 border border-yellow-700"
                        : scale.licencaUso === "autoral"
                          ? "bg-blue-900/20 text-blue-200 border border-blue-700"
                          : "bg-red-900/20 text-red-200 border border-red-700"
                  }`}
                >
                  {scale.licencaUso}
                </div>
              </div>
            )}

            {/* Fonte */}
            {scale.fonte && (
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Fonte</h3>
                <p className="text-slate-400 italic">{scale.fonte}</p>
              </div>
            )}

            {/* Transparência honesta: o que esta base NÃO documenta para este
                instrumento. Em vez de omitir silenciosamente, deixa explícito. */}
            {(!scale.scoringCutoff ||
              !scale.validacaoBrasil ||
              !scale.fonte) && (
              <div className="border-t border-slate-700 pt-6">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-300">
                    Não documentado nesta base:
                  </span>{" "}
                  {[
                    !scale.scoringCutoff && "pontos de corte/interpretação",
                    !scale.validacaoBrasil && "validação brasileira",
                    !scale.fonte && "fonte/referência",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  . Consulte a referência original do instrumento antes do uso
                  clínico.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aplicação — metadados clínicos (derivados quando não declarados) */}
        <Card className="bg-slate-800/80 border-slate-700 mb-6">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white">Aplicação</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase">Modo</p>
                <p className="text-sm font-semibold text-slate-200">
                  {APPLICATION_MODE_LABEL[getApplicationMode(scale)] ??
                    getApplicationMode(scale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Finalidade</p>
                <p className="text-sm font-semibold text-slate-200">
                  {ASSESSMENT_USE_LABEL[getAssessmentUse(scale)] ??
                    getAssessmentUse(scale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Comunicação</p>
                <p className="text-sm font-semibold text-slate-200">
                  {VERBAL_LABEL[getVerbalRequirement(scale)]}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">
                  Alfabetização
                </p>
                <p className="text-sm font-semibold text-slate-200">
                  {LITERACY_LABEL[getLiteracyRequirement(scale)]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <InternalScaleApplication scale={scale} />

        {/* Instruções de Uso */}
        <Card className="bg-slate-800/80 border-slate-700 mb-6">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white">Como Usar Esta Escala</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-slate-300">
            <ol className="space-y-3 list-decimal list-inside">
              {(USAGE_BY_MODE[getApplicationMode(scale)] ?? USAGE_DEFAULT).map(
                (step, i) => (
                  <li key={i}>{step}</li>
                ),
              )}
            </ol>
          </CardContent>
        </Card>

        {/* Instrumentos relacionados — hub de navegação por queixa/idade afim */}
        {related.length > 0 && (
          <Card className="bg-slate-800/80 border-slate-700 mb-6">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white">
                Instrumentos relacionados
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {related.map((o) => (
                  <Link
                    key={o.id}
                    href={routeFor(o)}
                    className="block rounded-lg border border-slate-700 bg-slate-700/30 p-3 transition hover:border-blue-500 hover:bg-slate-700/60"
                  >
                    <p className="text-sm font-semibold text-slate-100">
                      {o.name}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {o.fullName}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {o.respondente.join(" · ")} ·{" "}
                      {ageLabel(o.ageMin, o.ageMax)}
                    </p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aviso Legal */}
        <Card className="bg-amber-900/20 border-amber-700 mb-6">
          <CardContent className="pt-6 text-amber-100">
            <p className="text-sm">
              ⚠️ Esta escala é fornecida para fins educacionais e clínicos.
              Consulte a licença de uso e as normativas vigentes antes de
              implementar em prática clínica.
              {scale.licencaUso === "comercial" ||
              scale.licencaUso === "restrita"
                ? " Esta escala possui restrições de uso."
                : ""}
            </p>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-4">
          <Button
            onClick={() => navigate("/filtro")}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Filtro
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="bg-slate-700 border-slate-600 hover:bg-slate-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>
    </div>
  );
}
