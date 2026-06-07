/**
 * portal-familia.tsx
 * Portal da Família — NeuroPed EDJ
 *
 * A aba dos pais concentra conteúdo não sensível: psicoeducação geral,
 * orientação parental, novidades, questionários escolares e política de acesso.
 * Dados médicos individualizados só aparecem quando explicitamente liberados pelo
 * profissional como documento visível para família.
 */

import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/VisualStates";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Eye,
  FileText,
  HeartHandshake,
  Info,
  KeyRound,
  Lock,
  MessageCircle,
  Newspaper,
  School,
  ShieldCheck,
  Users,
} from "lucide-react";

interface FamilyDocument {
  id: string;
  patient_id: string;
  type: string;
  title: string;
  content: string | null;
  is_family_visible: 1;
  created_at: string;
}

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

const parentResources = [
  {
    href: "/orientacao-parental",
    title: "Orientação parental",
    description: "Rotina, escola, sono, linguagem, comportamento e sinais de alerta por tema.",
    icon: HeartHandshake,
  },
  {
    href: "/portal-familia/novidades",
    title: "Novidades e artigos",
    description: "Conteúdo educativo geral para famílias, sem dados de prontuário.",
    icon: Newspaper,
  },
  {
    href: "/inventarios-escola",
    title: "Questionário escolar",
    description: "Ponte com professores e escola quando o profissional solicitar observação pedagógica.",
    icon: School,
  },
  {
    href: "/caa",
    title: "CAA · Vou Falar",
    description: "Comunicação alternativa e aumentativa para apoio familiar e terapêutico.",
    icon: MessageCircle,
  },
  {
    href: "/marcos-desenvolvimento",
    title: "Marcos do desenvolvimento",
    description: "Informação educativa sobre marcos e sinais de alerta por idade.",
    icon: BookOpen,
  },
  {
    href: "/portal-familia/acesso",
    title: "Política de acesso",
    description: "Entenda o que é livre, o que é protegido e o que exige liberação médica.",
    icon: KeyRound,
  },
];

export default function PortalFamiliaPage() {
  const [patientId, setPatientId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300">Área dos pais — conteúdo não sensível</p>
          <p className="leading-relaxed text-amber-700 dark:text-amber-400">
            Esta aba reúne psicoeducação, orientação familiar, materiais escolares e documentos expressamente liberados. Prontuário, dados médicos individualizados e documentos sensíveis não ficam abertos aqui.
          </p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
            Em produção, documentos exigem código/link de acesso familiar com liberação profissional.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 shadow-sm">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground">Portal dos Pais / Psicoeducação</h1>
          <p className="text-xs text-muted-foreground">Informações gerais, escola, rotina e documentos liberados</p>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Conteúdos não sensíveis para pais">
        {parentResources.map((resource) => {
          const Icon = resource.icon;
          return (
            <Link key={resource.href} href={resource.href}>
              <Card className="h-full cursor-pointer border-border transition hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-black text-foreground">{resource.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{resource.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Documentos liberados pelo médico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Insira o código de acesso fornecido pelo médico para visualizar apenas documentos autorizados.</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Código de acesso do paciente..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              className="h-10 flex-1"
              aria-label="Código de acesso"
              data-testid="input-family-access-code"
            />
            <Button
              onClick={handleSearch}
              disabled={!inputValue.trim()}
              className="h-10 gap-2"
              data-testid="button-search-documents"
            >
              <Eye className="h-4 w-4" /> Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

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
              icon={<Lock className="h-7 w-7 text-muted-foreground" />}
              title="Nenhum documento disponível"
              description="O médico responsável não liberou documentos para visualização neste momento, ou o código de acesso é inválido."
            />
          )}
          {!isLoading && !isError && documents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {documents.length} documento{documents.length !== 1 ? "s" : ""} autorizado{documents.length !== 1 ? "s" : ""} pelo médico
                </span>
              </div>

              {documents.map((doc) => (
                <Card key={doc.id} className="border-border transition-shadow hover:shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`text-xs font-medium ${DOC_TYPE_COLORS[doc.type] ?? "bg-gray-100 text-gray-700"}`}>
                            {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" aria-hidden="true" />
                            {fmtDate(doc.created_at)}
                          </span>
                        </div>
                        <CardTitle className="text-sm font-semibold text-foreground">{doc.title}</CardTitle>
                      </div>
                      <FileText className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </CardHeader>

                  {doc.content && (
                    <CardContent className="p-4 pt-0">
                      <button
                        className="mb-2 text-xs text-primary hover:underline"
                        onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                        aria-expanded={expandedId === doc.id}
                        aria-controls={`doc-content-${doc.id}`}
                      >
                        {expandedId === doc.id ? "Ocultar conteúdo" : "Ver conteúdo"}
                      </button>
                      {expandedId === doc.id && (
                        <div
                          id={`doc-content-${doc.id}`}
                          className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground"
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

              <p className="pb-2 text-center text-xs text-muted-foreground">
                Em caso de dúvidas, entre em contato com o consultório do Dr. Jadson Fraga.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
