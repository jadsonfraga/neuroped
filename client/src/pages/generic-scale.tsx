import { useParams, useLocation, Link } from "wouter";
import { useState } from "react";
import { ArrowLeft, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { allScales, queixas } from "@/data/scaleFilter";
import { GenericScale } from "@/components/GenericScale";
import { getInteractiveScale as getInteractiveItemScale, makeInteractiveConfig } from "@/data/interactiveScaleItems";
import { getInteractiveScale as getInteractiveRunnerScale } from "@/data/interactiveScales";
import { InteractiveScaleRunner } from "@/components/InteractiveScaleRunner";
import {
  getImplementationStatus,
  getImplementationLabel,
  getApplicationMode,
  getAssessmentUse,
  getLiteracyRequirement,
  getVerbalRequirement,
} from "@/data/advancedFilterLogic";

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
  return QUEIXA_LABEL[id] ?? id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
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

export default function GenericScalePage() {
  const params = useParams<{ id: string }>();
  const [_location, navigate] = useLocation();
  const scaleId = params?.id;

  const scale = allScales.find(s => s.id === scaleId);
  const [copied, setCopied] = useState(false);
  const implStatus = scale ? getImplementationStatus(scale) : null;

  // GATE DE COPYRIGHT: escala proprietária/restrita (comercial/restrita/contato_autor)
  // NÃO reproduz itens nem escore — cai na ficha técnica (metadado + onde obter).
  // Só domínio público e autorais do Dr. abrem o runner com itens.
  const isProprietaria =
    !!scale && ["comercial", "restrita", "contato_autor"].includes(scale.licencaUso ?? "");

  // Escalas interativas "runner" (acervo novo: dor/FPS-R, Q-CHAT, Viking, MACS…)
  // — renderizadas pelo InteractiveScaleRunner. Conjunto à parte do acervo de
  // itens (interactiveScaleItems), por isso é checado primeiro e independe de allScales.
  const runnerDef = isProprietaria ? null : getInteractiveRunnerScale(scaleId);
  if (runnerDef) {
    return (
      <div className="p-1">
        <InteractiveScaleRunner def={runnerDef} />
      </div>
    );
  }

  if (!scale) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md bg-red-950/50 border-red-700">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold text-red-100 mb-4">Escala não encontrada</h2>
            <p className="text-red-200 mb-6">ID: {scaleId}</p>
            <Button onClick={() => navigate("/filtro")} className="bg-red-600 hover:bg-red-700">
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
  const itemDef = isProprietaria ? null : getInteractiveItemScale(scaleId);
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
        <GenericScale config={makeInteractiveConfig(scale, itemDef)} />
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
        o.ageMin <= scale.ageMax
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
              ⚠️ {getImplementationLabel(implStatus)} Esta página é uma <strong>ficha técnica/referência clínica</strong> —
              não é a aplicação completa do instrumento (sem itens nem cálculo de escore embutidos).
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
                  <p className="text-sm font-semibold text-slate-200">{scale.tempo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Prioridade</p>
                  <p className="text-sm font-semibold text-slate-200 capitalize">{scale.prioridade}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Faixa Etária</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {ageLabel(scale.ageMin, scale.ageMax)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase">Respondente</p>
                  <p className="text-sm font-semibold text-slate-200">{scale.respondente.join(", ")}</p>
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

            {/* Queixas */}
            {scale.queixas && scale.queixas.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Queixas Abordadas</h3>
                <div className="flex flex-wrap gap-2">
                  {scale.queixas.map(q => (
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
                <h3 className="text-lg font-semibold text-white mb-3">Escore / Interpretação</h3>
                <div className="bg-slate-700/30 p-4 rounded text-slate-300">
                  {scale.scoringCutoff}
                </div>
              </div>
            )}

            {scale.validacaoBrasil && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Validação Brasil</h3>
                <div className="bg-green-900/20 p-4 rounded text-green-200 border border-green-700">
                  {scale.validacaoBrasil}
                </div>
              </div>
            )}

            {scale.licencaUso && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Licença de Uso</h3>
                <div className={`p-4 rounded capitalize font-semibold ${
                  scale.licencaUso === "livre" ? "bg-emerald-900/20 text-emerald-200 border border-emerald-700" :
                  scale.licencaUso === "comercial" ? "bg-yellow-900/20 text-yellow-200 border border-yellow-700" :
                  scale.licencaUso === "autoral" ? "bg-blue-900/20 text-blue-200 border border-blue-700" :
                  "bg-red-900/20 text-red-200 border border-red-700"
                }`}>
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
            {(!scale.scoringCutoff || !scale.validacaoBrasil || !scale.fonte) && (
              <div className="border-t border-slate-700 pt-6">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-300">Não documentado nesta base:</span>{" "}
                  {[
                    !scale.scoringCutoff && "pontos de corte/interpretação",
                    !scale.validacaoBrasil && "validação brasileira",
                    !scale.fonte && "fonte/referência",
                  ].filter(Boolean).join(" · ")}
                  . Consulte a referência original do instrumento antes do uso clínico.
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
                <p className="text-sm font-semibold text-slate-200">{APPLICATION_MODE_LABEL[getApplicationMode(scale)] ?? getApplicationMode(scale)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Finalidade</p>
                <p className="text-sm font-semibold text-slate-200">{ASSESSMENT_USE_LABEL[getAssessmentUse(scale)] ?? getAssessmentUse(scale)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Comunicação</p>
                <p className="text-sm font-semibold text-slate-200">{VERBAL_LABEL[getVerbalRequirement(scale)]}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Alfabetização</p>
                <p className="text-sm font-semibold text-slate-200">{LITERACY_LABEL[getLiteracyRequirement(scale)]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instruções de Uso */}
        <Card className="bg-slate-800/80 border-slate-700 mb-6">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white">Como Usar Esta Escala</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 text-slate-300">
            <ol className="space-y-3 list-decimal list-inside">
              {(USAGE_BY_MODE[getApplicationMode(scale)] ?? USAGE_DEFAULT).map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Instrumentos relacionados — hub de navegação por queixa/idade afim */}
        {related.length > 0 && (
          <Card className="bg-slate-800/80 border-slate-700 mb-6">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white">Instrumentos relacionados</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {related.map((o) => (
                  <Link
                    key={o.id}
                    href={routeFor(o)}
                    className="block rounded-lg border border-slate-700 bg-slate-700/30 p-3 transition hover:border-blue-500 hover:bg-slate-700/60"
                  >
                    <p className="text-sm font-semibold text-slate-100">{o.name}</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{o.fullName}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {o.respondente.join(" · ")} · {ageLabel(o.ageMin, o.ageMax)}
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
              ⚠️ Esta escala é fornecida para fins educacionais e clínicos. Consulte a licença de uso e as normativas vigentes antes de implementar em prática clínica.
              {scale.licencaUso === "comercial" || scale.licencaUso === "restrita" ? " Esta escala possui restrições de uso." : ""}
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
