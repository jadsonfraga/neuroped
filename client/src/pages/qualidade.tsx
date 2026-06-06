import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Lock, Server, Smartphone, KeyRound, Database, Eye, GitBranch,
} from "lucide-react";

/**
 * Qualidade NeuroPed — princípios de qualidade e segurança.
 *
 * O qualidade-neuroped.html original era um painel de autoteste em tempo real do
 * app estático antigo (fetch de sw.js, rotas, PIN…) — não portável para esta SPA.
 * Aqui preservamos a INTENÇÃO: declarar os compromissos de qualidade verificados.
 */

const PRINCIPIOS = [
  { icon: Lock, titulo: "Dados sensíveis protegidos", texto: "Prontuário, documentos e dados identificáveis nunca são expostos em páginas públicas. Áreas clínicas exigem autenticação profissional." },
  { icon: Database, titulo: "Armazenamento local por padrão", texto: "Diários, CAA e registros ficam apenas no dispositivo (localStorage). Nada é enviado a servidores sem ação explícita do profissional." },
  { icon: KeyRound, titulo: "Acesso por papel", texto: "Rotas sensíveis (farmacologia, pacientes, prontuário, planos) são protegidas por papel (admin/profissional) via guarda de rota." },
  { icon: Smartphone, titulo: "PWA e responsividade", texto: "Funciona offline para conteúdos locais, instala como app e adapta-se a celular, tablet e desktop, com áreas de toque ampliadas." },
  { icon: Eye, titulo: "Acessibilidade", texto: "Compromisso WCAG 2.2 AA: contraste, foco visível, navegação por teclado e semântica HTML5. Ver a Declaração de Acessibilidade." },
  { icon: Server, titulo: "Transparência clínica", texto: "Instrumentos de terceiros remetem à fonte oficial e não reproduzem itens protegidos. Triagens autorais são identificadas como não normatizadas." },
  { icon: GitBranch, titulo: "Evolução versionada", texto: "Cada release significativa passa por revisão de qualidade e acessibilidade antes de ir ao ar." },
];

export default function QualidadePage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <Badge variant="secondary">Painel de princípios</Badge>
        </div>
        <h1 className="text-2xl font-black">Qualidade NeuroPed</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Compromissos de qualidade, segurança e privacidade que orientam o desenvolvimento do app.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {PRINCIPIOS.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.titulo}>
              <CardContent className="p-4">
                <h2 className="text-sm font-bold flex items-center gap-2 mb-1">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </span>
                  {p.titulo}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.texto}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground border-t border-border pt-3 text-center">
        Dr. Jadson Fraga Araújo Júnior · Neuropediatria · CRM-PE 25227 · RQE 17756
      </p>
    </div>
  );
}
