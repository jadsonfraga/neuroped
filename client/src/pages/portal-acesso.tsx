import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, Lock, AlertTriangle, KeyRound } from "lucide-react";

/**
 * Política de Acesso Familiar — portada de politica-acesso-familiar.html (app legado).
 * Explica o modelo de acesso: o que é livre para famílias e o que permanece protegido.
 */

const SECOES = [
  {
    n: "1",
    titulo: "Médico",
    texto:
      "O acesso ao app é protegido pelo PIN master. Nenhum email, CPF ou senha adicional é exigido em nenhuma tela.",
    tone: "ok" as const,
  },
  {
    n: "2",
    titulo: "Família — parte pública",
    texto:
      "Conteúdos educativos, CAA gratuita, diário local, mapa de instrumentos e orientações ficam livres, sem CPF e sem senha.",
    tone: "ok" as const,
  },
  {
    n: "3",
    titulo: "Família — área leve do filho",
    texto:
      "A identificação por data de nascimento e último sobrenome pode ser usada apenas para personalização local e ferramentas familiares sem dado clínico sensível.",
    tone: "warn" as const,
  },
  {
    n: "4",
    titulo: "Dados sensíveis",
    texto:
      "Documentos, mensagens clínicas, laudos, prescrições, prontuário e histórico identificável não devem ser liberados apenas por data de nascimento e sobrenome.",
    tone: "danger" as const,
  },
];

const REGRAS = [
  "Não usar CPF como senha.",
  "Não usar data de nascimento sozinha como senha.",
  "Não expor prontuário real em página estática.",
  "Para dados sensíveis, usar liberação do consultório ou backend seguro por paciente.",
];

const TONE: Record<string, { border: string; icon: typeof ShieldCheck }> = {
  ok: { border: "border-l-emerald-500", icon: ShieldCheck },
  warn: { border: "border-l-amber-500", icon: AlertTriangle },
  danger: { border: "border-l-rose-500", icon: Lock },
};

export default function PortalAcessoPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="w-6 h-6 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Portal da Família
          </span>
        </div>
        <h1 className="text-2xl font-black">Política de Acesso Familiar</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Modelo adotado para equilibrar facilidade de uso, proteção de dados e segurança clínica.
        </p>
        <Link href="/portal-familia">
          <Button variant="outline" size="sm" className="mt-3 gap-1">
            <Users className="w-4 h-4" /> Voltar ao Portal da Família
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {SECOES.map((s) => {
          const t = TONE[s.tone];
          const Icon = t.icon;
          return (
            <Card key={s.n} className={`border-l-4 ${t.border}`}>
              <CardContent className="p-4">
                <h2 className="text-sm font-bold flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" /> {s.n}. {s.titulo}
                </h2>
                <p className="text-sm text-muted-foreground">{s.texto}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold mb-2">5. Regra final</h2>
          <ul className="space-y-1.5">
            {REGRAS.map((r, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span> {r}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
        Dr. Jadson Fraga Araújo Júnior · Neuropediatria · CRM-PE 25227 · RQE 17756
      </p>
    </div>
  );
}
