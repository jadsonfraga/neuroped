import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { ArrowLeft, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { allScales } from "@/data/scaleFilter";
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

export default function GenericScalePage() {
  const params = useParams<{ id: string }>();
  const [_location, navigate] = useLocation();
  const scaleId = params?.id;

  const scale = allScales.find(s => s.id === scaleId);
  const [copied, setCopied] = useState(false);
  const implStatus = scale ? getImplementationStatus(scale) : null;

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

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(scale.description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                    {Math.floor(scale.ageMin / 12)}-{Math.floor(scale.ageMax / 12)}a
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
                      {q}
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
              <li>
                <span className="font-semibold">Verificar faixa etária:</span> Confirme se a escala é adequada para a idade da criança
              </li>
              <li>
                <span className="font-semibold">Preparar o ambiente:</span> Use um ambiente calmo e seguro para aplicação
              </li>
              <li>
                <span className="font-semibold">Ler instruções:</span> Revise as instruções de aplicação antes de iniciar
              </li>
              <li>
                <span className="font-semibold">Registrar respostas:</span> Anote as respostas conforme fornecidas
              </li>
              <li>
                <span className="font-semibold">Calcular escore:</span> Use a tabela de escore para interpretar resultados
              </li>
              <li>
                <span className="font-semibold">Documentar:</span> Registre data, escore e observações no prontuário
              </li>
            </ol>
          </CardContent>
        </Card>

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
