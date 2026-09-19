import { useParams, useLocation, Link } from "wouter";
import { useState } from "react";
import { ArrowLeft, Copy, Download, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  allScales,
  allScalesComFichas,
  queixas,
  type ScaleEntry,
} from "@/data/scaleFilter";
import { GenericScale } from "@/components/GenericScale";
import {
  getInteractiveScale as getInteractiveItemScale,
} from "@/data/interactiveScaleItems";
import { makeAuthorialAwareInteractiveConfig } from "@/data/authorialScaleCalculators";
import { getInteractiveScale as getInteractiveRunnerScale } from "@/data/interactiveScales";
import { InteractiveScaleRunner } from "@/components/InteractiveScaleRunner";
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
import { formatScaleAgeRange } from "@/lib/scaleAgeRange";

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
      <Card className="border-violet-500/40 mb-6">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Lock className="w-5 h-5 text-violet-600 dark:text-violet-300" />
            Uso interno da escala
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-4">
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
              className=""
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
          patientAge={formatScaleAgeRange(scale.ageMin, scale.ageMax)}
        />
        <SaveToPatient
          scaleName={scale.name}
          responses={reportItems}
          patientAge={formatScaleAgeRange(scale.ageMin, scale.ageMax)}
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
    <Card className="border-emerald-500/40 mb-6">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
          Uso interno desbloqueado
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">
        {sensitiveLicense && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
            Instrumento com licença restrita/comercial. Esta tela usa itens
            autorais de registro e não reproduz o instrumento oficial.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          {adaptedItems.map((item) => (
            <label key={item} className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
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
                className="w-full rounded-md border border-border px-3 py-2 text-sm text-foreground"
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
          <span className="text-xs font-semibold text-muted-foreground">
            Observações do aplicador (opcional)
          </span>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className=" min-h-28"
          />
        </label>

        <Button
          onClick={() => setShowResponses(true)}
          disabled={!allAnswered}
          className="w-full bg-emerald-700 hover:bg-emerald-800"
        >
          Ver todas as perguntas e respostas
        </Button>
      </CardContent>
    </Card>
  );
}

export default function GenericScalePage() {
  const params = useParams<{ id: string }>();
  const [_location, navigate] = useLocation();
  const scaleId = params?.id;

  // Resolve o catálogo COMPLETO (inclui fichas técnicas de instrumentos
  // licenciados). Antes resolvia só `allScales` (aplicáveis de fato), e o
  // próprio appRoute do catálogo (/generic-scale/wisc5, bayley, leiter3…)
  // caía em "Escala não encontrada". A aplicação continua decidida SOMENTE
  // pelos acervos interativos (runner/itens) — entrar no catálogo de fichas
  // jamais torna um instrumento aplicável.
  const scale = allScalesComFichas.find((s) => s.id === scaleId);
  const [copied, setCopied] = useState(false);
  const implStatus = scale ? getImplementationStatus(scale) : null;

  // Escalas interativas "runner" (acervo novo: dor/FPS-R, Q-CHAT, Viking, MACS…)
  // — renderizadas pelo InteractiveScaleRunner. Conjunto à parte do acervo de
  // itens (interactiveScaleItems), por isso é checado primeiro e independe de allScales.
  const runnerDef = getInteractiveRunnerScale(scaleId);
  if (runnerDef) {
    return (
      <div className="p-1">
        <InteractiveScaleRunner def={runnerDef} />
      </div>
    );
  }

  if (!scale) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Card className="w-full max-w-md border-destructive/40 bg-destructive/10">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Escala não encontrada
            </h2>
            <p className="text-destructive/90 mb-6">ID: {scaleId}</p>
            <Button
              onClick={() => navigate("/filtro")}
              
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Filtro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quando a escala já tem itens interativos cadastrados (acervo de 257), renderiza
  // a APLICAÇÃO REAL (itens respondíveis + cálculo de escore) no lugar da ficha.
  const itemDef = getInteractiveItemScale(scaleId);
  if (itemDef) {
    return (
      <div className="max-w-2xl mx-auto p-3 sm:p-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/filtro")}
          className="mb-3 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Filtro
        </Button>
        <GenericScale config={makeAuthorialAwareInteractiveConfig(scale, itemDef)} />
      </div>
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
    <div className="p-4 sm:p-6" data-testid="scale-ficha-surface">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/filtro")}
            className="text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Filtro
          </Button>
        </div>

        {/* Banner honesto de status de implementação (req. clínico de honestidade) */}
        {implStatus && implStatus !== "complete" && (
          <Card className="border-amber-500/40 bg-amber-500/10 mb-6">
            <CardContent className="pt-6 text-amber-900 dark:text-amber-100 text-sm font-semibold">
              ⚠️ {getImplementationLabel(implStatus)} Esta página é uma{" "}
              <strong>ficha técnica/referência clínica</strong> — não é a
              aplicação completa do instrumento (sem itens nem cálculo de escore
              embutidos).
            </CardContent>
          </Card>
        )}

        {/* Escala Principal */}
        <Card className="border-card-border mb-6">
          <CardHeader className="border-b border-border">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">ID: {scale.id}</p>
                {/* h2 real (CardTitle renderiza <div>): o shell tem o h1 e as
                    seções abaixo usam h3 — sem este nível o axe/Lighthouse
                    acusa heading-order (h1→h3) e o leitor de tela perde a
                    âncora da página. */}
                <h2 className="text-3xl font-bold leading-tight tracking-[-0.02em] text-foreground mb-2">
                  {scale.name}
                </h2>
                <p className="text-lg text-muted-foreground">{scale.fullName}</p>
              </div>

              {/* Meta informações */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Tempo</p>
                  <p className="text-sm font-semibold text-foreground/90">
                    {scale.tempo}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Prioridade</p>
                  <p className="text-sm font-semibold text-foreground/90 capitalize">
                    {scale.prioridade}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Faixa Etária
                  </p>
                  <p className="text-sm font-semibold text-foreground/90">
                    {formatScaleAgeRange(scale.ageMin, scale.ageMax)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Respondente
                  </p>
                  <p className="text-sm font-semibold text-foreground/90">
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
                <h3 className="text-lg font-semibold text-foreground">Descrição</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyDescription}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <p className="text-muted-foreground leading-relaxed bg-muted/40 p-4 rounded">
                {scale.description}
              </p>
            </div>

            {/* Exemplo prático em linguagem de pais */}
            {scale.exemploPais && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                <p className="mb-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  👨‍👩‍👧 Para quem vai responder
                </p>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {scale.exemploPais}
                </p>
              </div>
            )}

            {/* Queixas */}
            {scale.queixas && scale.queixas.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Queixas Abordadas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {scale.queixas.map((q) => (
                    <span
                      key={q}
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm border border-primary/30"
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
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Escore / Interpretação
                </h3>
                <div className="bg-muted/40 p-4 rounded text-muted-foreground">
                  {scale.scoringCutoff}
                </div>
              </div>
            )}

            {scale.validacaoBrasil && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Validação Brasil
                </h3>
                <div className="bg-emerald-500/10 p-4 rounded text-emerald-800 dark:text-emerald-200 border border-emerald-500/40">
                  {scale.validacaoBrasil}
                </div>
              </div>
            )}

            {scale.licencaUso && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Licença de Uso
                </h3>
                <div
                  className={`p-4 rounded capitalize font-semibold ${
                    scale.licencaUso === "livre"
                      ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40"
                      : scale.licencaUso === "comercial"
                        ? "bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/40"
                        : scale.licencaUso === "autoral"
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-destructive/10 text-destructive/90 border border-destructive/40"
                  }`}
                >
                  {scale.licencaUso}
                </div>
              </div>
            )}

            {/* Fonte */}
            {scale.fonte && (
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Fonte</h3>
                <p className="text-muted-foreground italic">{scale.fonte}</p>
              </div>
            )}

            {/* Transparência honesta: o que esta base NÃO documenta para este
                instrumento. Em vez de omitir silenciosamente, deixa explícito. */}
            {(!scale.scoringCutoff ||
              !scale.validacaoBrasil ||
              !scale.fonte) && (
              <div className="border-t border-border pt-6">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-muted-foreground">
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
        <Card className="border-card-border mb-6">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-foreground">Aplicação</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Modo</p>
                <p className="text-sm font-semibold text-foreground/90">
                  {APPLICATION_MODE_LABEL[getApplicationMode(scale)] ??
                    getApplicationMode(scale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Finalidade</p>
                <p className="text-sm font-semibold text-foreground/90">
                  {ASSESSMENT_USE_LABEL[getAssessmentUse(scale)] ??
                    getAssessmentUse(scale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Comunicação</p>
                <p className="text-sm font-semibold text-foreground/90">
                  {VERBAL_LABEL[getVerbalRequirement(scale)]}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">
                  Alfabetização
                </p>
                <p className="text-sm font-semibold text-foreground/90">
                  {LITERACY_LABEL[getLiteracyRequirement(scale)]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registro autoral interno (PIN master). Suprimido quando o catálogo
            declara external_only: instrumento licenciado cuja aplicação
            acontece FORA do app — oferecer um registro pontuável sob o nome
            do instrumento contradiria o banner acima e a política de nunca
            simular instrumento proprietário (AGENTS.md). */}
        {implStatus !== "external_only" && (
          <InternalScaleApplication scale={scale} />
        )}

        {/* Instruções de Uso */}
        <Card className="border-card-border mb-6">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-foreground">Como Usar Esta Escala</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-muted-foreground">
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
          <Card className="border-card-border mb-6">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-foreground">
                Instrumentos relacionados
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {related.map((o) => (
                  <Link
                    key={o.id}
                    href={routeFor(o)}
                    className="block rounded-lg border border-border bg-muted/40 p-3 transition hover:border-blue-500 hover:bg-muted/70"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {o.name}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {o.fullName}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {o.respondente.join(" · ")} ·{" "}
                      {formatScaleAgeRange(o.ageMin, o.ageMax)}
                    </p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aviso Legal */}
        <Card className="border-amber-500/40 bg-amber-500/10 mb-6">
          <CardContent className="pt-6 text-amber-900 dark:text-amber-100">
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
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Filtro
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>
    </div>
  );
}
