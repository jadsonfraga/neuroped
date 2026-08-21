import { useLocation } from "wouter";
import { FileText, ClipboardList, Stethoscope, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/PageHero";

/* ────────────────────────────────────────────────────────────
   Central de Documentos — NeuroPed
   Acesso rápido para Laudo Neuropediátrico e Receita C1
──────────────────────────────────────────────────────────── */

const docCards = [
  {
    path: "/laudo-neuroped",
    icon: Stethoscope,
    title: "Laudo Neuropediátrico",
    desc: "Laudo estruturado em 10 seções (padrão PANT). Preencha os campos, visualize e imprima em PDF.",
    badge: "Laudo",
    badgeVariant: "default" as const,
    status: "Disponível",
    ok: true,
  },
  {
    path: "/laudo-super",
    icon: ShieldCheck,
    title: "Laudo SuperNeuroPed",
    desc: "Perfil premium do modelo PANT: 14 seções, mapa funcional, hipóteses com prós/contras, 3 cenários de prognóstico e assinatura Soli Deo Gloria.",
    badge: "SuperNeuroPed",
    badgeVariant: "default" as const,
    status: "Disponível",
    ok: true,
  },
  {
    path: "/receita-c1",
    icon: ClipboardList,
    title: "Receita Especial C1",
    desc: "Notificação de receita para medicamentos Lista C1. 2 vias, válida por 30 dias.",
    badge: "Receita",
    badgeVariant: "secondary" as const,
    status: "Disponível",
    ok: true,
  },
  {
    path: "/assinatura-digital",
    icon: FileText,
    title: "Assinatura Digital",
    desc: "Assine documentos com certificado P12 (ICP-Brasil / eCFM).",
    badge: "Assinatura",
    badgeVariant: "outline" as const,
    status: "Disponível",
    ok: true,
  },
];

export default function DocumentosPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHero
        icon={FileText}
        eyebrow="documentos"
        title="Central de Documentos NeuroPed"
        subtitle="Gere laudos neuropediátricos e receitas especiais C1 com templates clínicos oficiais. Dr. Jadson Fraga Araújo Júnior · CRM-PE 25.227 · RQE 17.756"
        mascotContext="celebracao"
      />

      {/* Cards de acesso */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {docCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.path}
              className="border-border/70 bg-card/80 cursor-pointer hover:border-primary/50 hover:bg-card transition-colors"
              onClick={() => setLocation(card.path)}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={card.badgeVariant} className="text-xs">{card.badge}</Badge>
                  </div>
                  {card.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-1" />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-foreground">{card.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.desc}</p>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={(e) => { e.stopPropagation(); setLocation(card.path); }}
                >
                  Abrir
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info box */}
      <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
        <p>
          <strong className="text-foreground">Laudo Neuropediátrico:</strong>{" "}
          Estrutura PANT em 10 seções — anamnese, exame clínico, escalas, hipótese diagnóstica e conduta.
          Impressão/PDF direta pelo navegador.
        </p>
        <p>
          <strong className="text-foreground">Receita C1:</strong>{" "}
          Notificação de receita especial (Lista C1 — Portaria SVS/MS 344/98).
          Emitir em 2 vias obrigatoriamente.
        </p>
        <p>
          <strong className="text-foreground">Assinatura Digital:</strong>{" "}
          Assine com certificado P12 (ICP-Brasil). Compatível com eCFM.
        </p>
      </div>
    </div>
  );
}
