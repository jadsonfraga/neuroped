import { useParams, Link } from "wouter";
import { AlertTriangle } from "lucide-react";
import { ClassificationScale } from "@/components/ClassificationScale";
import { getClassificationScale } from "@/data/classificationScales";

export default function ClassificacaoPage() {
  const params = useParams<{ id: string }>();
  const config = params?.id ? getClassificationScale(params.id) : null;

  if (!config) {
    return (
      <div className="space-y-4 py-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
        <p className="text-sm text-muted-foreground">
          Sistema de classificação não encontrado.
        </p>
        <Link href="/filtro" className="text-sm font-semibold text-primary underline">
          Voltar ao filtro
        </Link>
      </div>
    );
  }

  return <ClassificationScale config={config} />;
}
