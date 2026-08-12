import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accessibility, Check, AlertTriangle, Phone, MapPin, ClipboardCheck,
} from "lucide-react";

/**
 * Declaração de Acessibilidade — portada de acessibilidade.html (app legado).
 * Conformidade WCAG 2.2 AA · eMAG 3.1 · LBI 13.146/2015.
 */

type Status = "ok" | "partial";
const CONFORMIDADE: { label: string; detail: string; status: Status }[] = [
  { label: "Idioma da página declarado", detail: 'Atributo lang="pt-BR" presente na tag html.', status: "ok" },
  { label: "Estrutura semântica HTML5", detail: "Uso de main, section, header, nav, footer em todas as páginas.", status: "ok" },
  { label: "Hierarquia de cabeçalhos", detail: "Hierarquia h1 → h2 → h3 respeitada, sem saltos de nível.", status: "ok" },
  { label: "Contraste de cores", detail: "Paleta atende ratio mínimo 4,5:1 para texto normal e 3:1 para texto grande, em ambos os temas.", status: "ok" },
  { label: "Foco visível", detail: "Indicador de foco (outline) visível em todos os elementos interativos, com contraste mínimo 3:1.", status: "ok" },
  { label: "Navegação por teclado", detail: "Todos os elementos interativos acessíveis via Tab/Shift+Tab. Sem armadilhas de teclado.", status: "ok" },
  { label: "Imagens descritivas", detail: 'Imagens significativas com alt apropriado; imagens decorativas com alt="".', status: "ok" },
  { label: "Movimento e animações", detail: "Suporte a prefers-reduced-motion em implementação. Conformidade total prevista na próxima iteração.", status: "partial" },
  { label: "Leitor de tela", detail: "Compatibilidade testada com NVDA e VoiceOver para fluxos principais. Algumas escalas complexas podem ter limitações.", status: "partial" },
  { label: "Modo de alto contraste", detail: "Tema escuro disponível. Modo de alto contraste dedicado planejado para próxima versão.", status: "partial" },
];

const RECURSOS = [
  "Tema claro e escuro com troca instantânea",
  "Tamanho de texto responsivo (zoom até 200% sem perda de funcionalidade)",
  "Atalhos de teclado nas navegações principais",
  "Áreas de toque ampliadas em dispositivos móveis (mínimo 44×44 px)",
  "Tipografia legível com hierarquia clara",
];

const LIMITACOES = [
  "Algumas escalas com gráficos complexos (radar, curvas de crescimento) ainda dependem de descrições alternativas detalhadas; tabelas equivalentes em desenvolvimento.",
  "Reconhecimento de voz para anamnese: limitado a navegadores Chromium e Safari recentes.",
  "Geração de PDF ainda não suporta estrutura de tags PDF/UA completa.",
];

export default function AcessibilidadePage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Accessibility className="w-6 h-6 text-primary" />
          <Badge variant="secondary">WCAG 2.2 nível AA</Badge>
        </div>
        <h1 className="text-2xl font-bold">Declaração de Acessibilidade</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          NeuroPed — Aplicativo Clínico de Neuropediatria. Compromisso de tornar o app acessível
          a profissionais, pacientes e familiares com deficiência ou limitação funcional.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-2">
          <h2 className="text-sm font-bold">Padrões aplicáveis</h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>WCAG 2.2 nível AA</strong> — Web Content Accessibility Guidelines</li>
            <li>• <strong>eMAG 3.1</strong> — Modelo de Acessibilidade em Governo Eletrônico</li>
            <li>• <strong>Lei Brasileira de Inclusão</strong> — Lei 13.146/2015, art. 63</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold mb-3">Status de conformidade</h2>
          <div className="space-y-2">
            {CONFORMIDADE.map((c) => (
              <div key={c.label} className="flex items-start gap-2.5">
                {c.status === "ok" ? (
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </span>
                ) : (
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  </span>
                )}
                <div>
                  <strong className="text-sm">{c.label}</strong>
                  <p className="text-xs text-muted-foreground">{c.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold mb-2">Recursos disponíveis</h2>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              {RECURSOS.map((r, i) => <li key={i}>• {r}</li>)}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold mb-2">Limitações conhecidas</h2>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              {LIMITACOES.map((r, i) => <li key={i}>• {r}</li>)}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold mb-2">Reportar barreiras de acessibilidade</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Se você encontrou alguma barreira no uso do aplicativo, entre em contato. Nos
            comprometemos a responder em até 7 dias úteis e implementar correção crítica em até 30 dias.
          </p>
          <div className="space-y-1.5 text-sm">
            <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> WhatsApp: (87) 9 9109-7371</p>
            <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-primary mt-0.5" /> Rua Raimundo Lacerda, 001 — Bairro São José — Petrolina/PE — CEP 56302-470</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-4 h-4 text-primary" /> Avaliação e auditoria
          </h2>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Autoavaliação técnica com axe-core sobre as principais rotas.</li>
            <li>• Análise manual de hierarquia semântica, contraste e navegação por teclado.</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-3">
            Última revisão: 07/05/2026 · Próxima revisão: a cada nova release significativa.
          </p>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground border-t border-border pt-3 text-center">
        NeuroPed © 2026 — Dr. Jadson Fraga Araújo Júnior — Todos os direitos reservados
      </p>
    </div>
  );
}
