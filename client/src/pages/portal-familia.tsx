/**
 * portal-familia.tsx
 * Portal da Família — NeuroPed EDJ
 *
 * Acesso restrito a documentos liberados pelo profissional (is_family_visible = 1).
 * NÃO exige PIN médico: acesso direto por link compartilhado pelo médico.
 *
 * Segurança:
 *  - Exibe apenas documentos marcados como visíveis para a família
 *  - Sem acesso a prontuários, escalas ou dados de outros pacientes
 *  - Aviso explícito de área restrita e finalidade do portal
 *
 * LGPD:
 *  - Modo demo: dados são exclusivamente fictícios (is_demo = 1)
 *  - Em produção, requer token de acesso familiar (link único + prazo)
 */

import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/VisualStates";
import {
  Users, FileText, AlertTriangle, Eye, Calendar, ShieldCheck, Lock, Info,
  Newspaper, KeyRound,
} from "lucide-react";
import { format } from "date-fns";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface FamilyDocument {
  id: string;
  patient_id: string;
  type: string;
  title: string;
  content: string | null;
  is_family_visible: 1;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(d: string | undefined): string {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

const DOC_TYPE_LABELS: Record<string, string> = {
  laudo: "Laudo",
  relatorio: "Relatório",
  encaminhamento: "Encaminhamento",
  prescricao: "Prescrição",
  atestado: "Atestado",
  orientacao: "Orientação",
};

const DOC_TYPE_COLORS: Record<string, string> = {
  laudo: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  relatorio: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  encaminhamento: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  prescricao: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  atestado: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  orientacao: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function PortalFamiliaPage() {
  const [patientId, setPatientId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Busca documentos visíveis para a família via API
  const {
    data: documents = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<FamilyDocument[]>({
    queryKey: [`/api/documents?patient_id=${patientId}&family_only=true`],
    enabled: !!patientId,
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/documents?patient_id=${patientId}&family_only=true`,
      );
      if (!res.ok) throw new Error("Erro ao buscar documentos.");
      const data = await res.json();
      // Filtra apenas documentos com is_family_visible = 1 (redundância defensiva)
      return (data.documents ?? []).filter(
        (d: any) => d.is_family_visible === 1 || d.is_family_visible === true,
      );
    },
  });

  function handleSearch() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setPatientId(trimmed);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* ── Aviso de área restrita ── */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300">Área Restrita — Portal da Família</p>
          <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
            Este espaço disponibiliza apenas documentos liberados pelo profissional de saúde responsável.
            Nenhum dado de prontuário, avaliação ou informação clínica não autorizada está acessível aqui.
          </p>
          <p className="text-amber-600 dark:text-amber-500 text-xs mt-1">
            <strong>Modo demonstração:</strong> Os dados exibidos são exclusivamente fictícios.
            Nenhum dado real de paciente é processado nesta tela.
          </p>
        </div>
      </div>

      {/* ── Cabeçalho ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-sm">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Portal da Família</h1>
          <p className="text-xs text-muted-foreground">Documentos liberados pelo médico responsável</p>
        </div>
      </div>

      {/* ── Atalhos do Portal ── */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/portal-familia/novidades">
          <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2.5">
            <Newspaper className="w-4 h-4 text-primary" />
            <span className="text-left text-xs">
              <span className="block font-semibold">Novidades &amp; Artigos</span>
              <span className="block text-muted-foreground">conteúdo para famílias</span>
            </span>
          </Button>
        </Link>
        <Link href="/portal-familia/acesso">
          <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2.5">
            <KeyRound className="w-4 h-4 text-primary" />
            <span className="text-left text-xs">
              <span className="block font-semibold">Política de Acesso</span>
              <span className="block text-muted-foreground">o que é livre e protegido</span>
            </span>
          </Button>
        </Link>
      </div>

      {/* ── Busca por ID do paciente ── */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Insira o código de acesso fornecido pelo médico para visualizar os documentos disponíveis.
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Código de acesso do paciente..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              className="flex-1 h-10"
              aria-label="Código de acesso"
              data-testid="input-family-access-code"
            />
            <Button
              onClick={handleSearch}
              disabled={!inputValue.trim()}
              className="h-10 gap-2"
              data-testid="button-search-documents"
            >
              <Eye className="w-4 h-4" /> Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Resultados ── */}
      {patientId && (
        <>
          {isLoading && <LoadingState rows={3} label="Buscando documentos..." />}
          {isError && (
            <ErrorState
              message="Não foi possível carregar os documentos. Verifique o código e tente novamente."
              onRetry={refetch}
            />
          )}
          {!isLoading && !isError && documents.length === 0 && (
            <EmptyState
              icon={<Lock className="w-7 h-7 text-muted-foreground" />}
              title="Nenhum documento disponível"
              description="O médico responsável não liberou documentos para visualização neste momento, ou o código de acesso é inválido."
            />
          )}
          {!isLoading && !isError && documents.length > 0 && (
            <div className="space-y-4">
              {/* Confirmação de segurança */}
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {documents.length} documento{documents.length !== 1 ? "s" : ""} autorizado{documents.length !== 1 ? "s" : ""} pelo médico
                </span>
              </div>

              {/* Lista de documentos */}
              {documents.map((doc) => (
                <Card key={doc.id} className="border-border hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={`text-xs font-medium ${DOC_TYPE_COLORS[doc.type] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            {fmtDate(doc.created_at)}
                          </span>
                        </div>
                        <CardTitle className="text-sm font-semibold text-foreground">{doc.title}</CardTitle>
                      </div>
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-1" aria-hidden="true" />
                    </div>
                  </CardHeader>

                  {doc.content && (
                    <CardContent className="p-4 pt-0">
                      <button
                        className="text-xs text-primary hover:underline mb-2"
                        onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                        aria-expanded={expandedId === doc.id}
                        aria-controls={`doc-content-${doc.id}`}
                      >
                        {expandedId === doc.id ? "Ocultar conteúdo" : "Ver conteúdo"}
                      </button>
                      {expandedId === doc.id && (
                        <div
                          id={`doc-content-${doc.id}`}
                          className="mt-2 p-3 bg-muted/30 rounded-lg border border-border text-sm text-foreground whitespace-pre-wrap leading-relaxed"
                          role="region"
                          aria-label={`Conteúdo do documento: ${doc.title}`}
                        >
                          {doc.content}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}

              {/* Nota de rodapé */}
              <p className="text-xs text-muted-foreground text-center pb-2">
                Em caso de dúvidas, entre em contato com o consultório do Dr. Jadson Fraga.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
