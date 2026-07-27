import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Download,
  HardDrive,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";

const SECOES = [
  {
    n: "1",
    titulo: "Acesso protegido",
    texto:
      "Conteúdos educativos são públicos. Áreas clínicas exigem sessão profissional válida ou PIN previamente provisionado em uma instalação local.",
    tone: "ok" as const,
    icon: LockKeyhole,
  },
  {
    n: "2",
    titulo: "Instalação local",
    texto:
      "Quando o modo local é explicitamente configurado, pacientes e resultados permanecem neste navegador e o backend clínico remoto não é liberado anonimamente.",
    tone: "ok" as const,
    icon: HardDrive,
  },
  {
    n: "3",
    titulo: "Backup sob responsabilidade do usuário",
    texto:
      "Como os dados são locais, use a função de exportação de backup antes de trocar de aparelho, limpar o navegador ou reinstalar o aplicativo.",
    tone: "warn" as const,
    icon: Download,
  },
  {
    n: "4",
    titulo: "Dispositivos compartilhados",
    texto:
      "Evite cadastrar dados identificáveis em computadores compartilhados. Encerre a sessão, bloqueie a área clínica e remova os dados locais ao terminar.",
    tone: "danger" as const,
    icon: AlertTriangle,
  },
];

const REGRAS = [
  "Rotas clínicas falham fechadas: sem sessão ou PIN válido, o conteúdo não é exibido.",
  "Não use CPF, data de nascimento ou sobrenome como mecanismo improvisado de autenticação.",
  "Faça backups periódicos e guarde-os em local institucional protegido.",
  "Ao usar aparelho compartilhado, encerre a sessão e use “Apagar dados locais” no menu ao terminar.",
];

const TONE: Record<string, string> = {
  ok: "border-l-emerald-500",
  warn: "border-l-amber-500",
  danger: "border-l-rose-500",
};

export default function PortalAcessoPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent p-6">
        <div className="mb-2 flex items-center gap-2">
          <LockKeyhole className="h-6 w-6 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            NeuroPed
          </span>
        </div>
        <h1 className="text-2xl font-black">Política de Acesso</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Conteúdo educativo público e dados clínicos protegidos por autenticação
          remota ou PIN local previamente provisionado.
        </p>
        <Link href="/portal-familia">
          <Button variant="outline" size="sm" className="mt-3 gap-1">
            <Users className="h-4 w-4" /> Voltar ao Portal da Família
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {SECOES.map((secao) => {
          const Icon = secao.icon;
          return (
            <Card key={secao.n} className={`border-l-4 ${TONE[secao.tone]}`}>
              <CardContent className="p-4">
                <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
                  <Icon className="h-4 w-4" /> {secao.n}. {secao.titulo}
                </h2>
                <p className="text-sm text-muted-foreground">{secao.texto}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="h-4 w-4" /> Regras de uso
          </h2>
          <ul className="space-y-1.5">
            {REGRAS.map((regra) => (
              <li key={regra} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 text-primary">•</span> {regra}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="border-t border-border pt-3 text-[11px] text-muted-foreground">
        Dr. Jadson Fraga · Neuropediatra · CRM-PE 25227 · RQE 17756
      </p>
    </div>
  );
}
