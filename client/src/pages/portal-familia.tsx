import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/VisualStates";
import { PremiumVisualPanel } from "@/components/PremiumVisualPanel";
import { AssetShowcase, brandAssets } from "@/components/BrandAssets";
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
  const { accessMode, isAuthenticated } = useAuth();
  const [patientId, setPatientId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ID de paciente nunca é credencial familiar. A consulta só existe como
  // demonstração local fictícia ou prévia de um profissional autenticado.
  const canPreviewDocuments =
    accessMode === "local" ||
    (accessMode === "remote" && isAuthenticated);

  const {
    data: documents = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<FamilyDocument[]>({
    queryKey: [`/api/documents?patient_id=${patientId}&family_only=true`],
    enabled: canPreviewDocuments && !!patientId,
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/documents?patient_id=${patientId}&family_only=true`,
      );
      if (!res.ok) throw new Error("Erro ao buscar documentos.");
      const data = await res.json();
      // A API retorna { data: [...] }; aceita 'documents' e array puro por robustez.
      const list = Array.isArray(data) ? data : (data.data ?? data.documents ?? []);
      return list.filter(
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
    <div className="proportion-safe-page mx-auto max-w-3xl space-y-6 py-4">
      <PremiumVisualPanel
        src={brandAssets.illustrations.childDevelopment}
        badge="Família e desenvolvimento"
        title="Orientação clara para a rotina, a escola e os próximos passos."
        subtitle="Conteúdos educativos ficam acessíveis aos pais; documentos individuais seguem somente por acesso autenticado ou canal seguro do médico."
        className="min-h-44"
      />

      <AssetShowcase
        variant="family"
        title="Figuras de apoio para famílias"
        subtitle="Imagens e mascotes oficiais usados com proporção estável, sem corte agressivo em celular."
        max={6}
        compact
      />

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300">Área dos pais — conteúdo não sensível</p>
          <p className="leading-relaxed text-amber-700 dark:text-amber-400">
            Esta aba reúne psicoeducação, orientação familiar, materiais escolares e documentos expressamente liberados. Prontuário, dados médicos individualizados e documentos sensíveis não ficam abertos aqui.
          </p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
            O ID do paciente nunca funciona como senha. Um acesso familiar a
            documentos exige link/token próprio e liberação profissional.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 shadow-sm">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Portal dos Pais / Psicoeducação</h1>
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
                    <h2 className="text-sm font-semibold text-foreground">{resource.title}</h2>
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
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Documentos individuais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          {!canPreviewDocuments ? (
            <div
              className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground"
              role="status"
            >
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Por segurança, esta instalação não abre documentos usando ID,
                data de nascimento ou sobrenome. Solicite o documento pelo
                canal seguro informado pelo consultório.
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {accessMode === "local"
                    ? "Demonstração com dados fictícios: use demo-001."
                    : "Prévia profissional autenticada: informe o ID interno do paciente."}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={accessMode === "local" ? "ID fictício (ex.: demo-001)" : "ID interno do paciente"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  className="h-10 flex-1"
                  aria-label="ID interno do paciente para prévia"
                  data-testid="input-family-access-code"
                />
                <Button
                  onClick={handleSearch}
                  disabled={!inputValue.trim()}
                  className="h-10 gap-2"
                  data-testid="button-search-documents"
                >
                  <Eye className="h-4 w-4" /> Visualizar
                </Button>
              </div>
            </>
          )}
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
                        <h2 className="text-base font-semibold text-foreground">{doc.title}</h2>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        {expandedId === doc.id ? "Ocultar" : "Ver"}
                      </Button>
                    </div>
                  </CardHeader>
                  {expandedId === doc.id && (
                    <CardContent className="p-4 pt-0">
                      <div className="whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm leading-relaxed text-foreground">
                        {doc.content || "Documento sem conteúdo textual disponível."}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
