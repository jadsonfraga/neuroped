import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Accessibility,
  Command,
  Compass,
  HelpCircle,
  Keyboard,
  LifeBuoy,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Central de assistência — superfície única.
 *
 * Antes existiam três camadas auxiliares boas e desconexas (ajuda rápida, tour
 * guiado, preferências): antes de resolver a dúvida a pessoa precisava decidir
 * *em qual delas entrar*. Agora há um só ponto de entrada e um só diálogo, com
 * seções nomeadas na ordem em que a dúvida costuma aparecer:
 *
 *   1. o que fazer aqui (ajuda contextual da rota atual);
 *   2. como o app funciona (tour de fluxo de trabalho);
 *   3. atalhos;
 *   4. preferências e acessibilidade;
 *   5. central de ajuda completa.
 *
 * Preferências e tour continuam sendo componentes próprios — o handoff por
 * evento preserva foco e Escape —, mas do ponto de vista de quem usa é um
 * sistema só.
 */

const OPEN_TOUR_EVENT = "neuroped:open-tour";
const OPEN_PREFERENCES_EVENT = "neuroped:open-preferences";
const ASSISTANCE_HANDOFF_DELAY_MS = 220;

interface ContextualHelp {
  title: string;
  body: string;
}

/** Ajuda da rota atual: o que esta tela faz e qual é o próximo passo. */
function contextualHelpFor(path: string): ContextualHelp {
  const route = (path || "/").split(/[?#]/, 1)[0];
  if (route === "/") {
    return {
      title: "Nesta tela",
      body: "O cockpit mostra o paciente em foco e as próximas ações. Troque de paciente pela lista ao lado e abra prontuário, histórico, instrumento ou documento em um toque.",
    };
  }
  if (route.startsWith("/pacientes") || route.startsWith("/paciente/")) {
    return {
      title: "Nesta tela",
      body: "Cadastro e histórico do paciente. A ficha reúne avaliações salvas, linha clínica e os atalhos para prontuário, laudo e receita já vinculados a este paciente.",
    };
  }
  if (route.startsWith("/prontuario")) {
    return {
      title: "Nesta tela",
      body: "Prontuário longitudinal. Preencha por abas — identificação, anamnese, marcos, medicações, terapias e exames — e salve para registrar a consulta no histórico.",
    };
  }
  if (route.startsWith("/filtro")) {
    return {
      title: "Nesta tela",
      body: "Escolha idade e queixa: o filtro devolve Ouro, Prata, Bronze, Teste Direto e Questionário Escolar, com o status de validação de cada instrumento — sem inventar pontuação.",
    };
  }
  if (route.startsWith("/agenda")) {
    return {
      title: "Nesta tela",
      body: "Agenda, check-in, lista de espera e financeiro do atendimento. Cada consulta abre direto o prontuário do paciente vinculado.",
    };
  }
  if (route.startsWith("/laudo") || route.startsWith("/receita") || route.startsWith("/documentos")) {
    return {
      title: "Nesta tela",
      body: "Documentos clínicos. O emissor (nome, registro e especialidade) vem das Configurações; abra o documento a partir da ficha do paciente para já vir preenchido.",
    };
  }
  return {
    title: "Nesta tela",
    body: "Use a busca global (Ctrl K) para chegar a qualquer escala, teste ou módulo. O Filtro Clínico ajuda quando você sabe a queixa mas não o instrumento.",
  };
}

const SHORTCUTS: Array<{ keys: string; action: string }> = [
  { keys: "Ctrl K", action: "Busca global de escalas, testes e módulos" },
  { keys: "Esc", action: "Fecha diálogos, menu lateral e o tour" },
  { keys: "← →", action: "Navega entre os passos do tour guiado" },
];

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof HelpCircle;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        {title}
      </h3>
      {children}
    </section>
  );
}

export function FloatingHelp() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const contextual = contextualHelpFor(location);

  function openAuxiliarySurface(eventName: string) {
    setOpen(false);
    // O Dialog do Radix restaura o foco ao gatilho ao concluir a saída.
    // Só então abrimos a próxima superfície, evitando que essa restauração
    // roube o foco do tour ou das preferências recém-montados.
    window.setTimeout(() => {
      window.dispatchEvent(new Event(eventName));
    }, ASSISTANCE_HANDOFF_DELAY_MS);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="fixed bottom-6 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/95 text-foreground shadow-[0_12px_30px_-16px_hsl(var(--foreground)/0.5)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:right-5 print:hidden"
          aria-label="Abrir a central de assistência do NeuroPed"
          data-testid="button-floating-help"
        >
          <HelpCircle className="h-5 w-5" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[85vh] max-w-md overflow-y-auto rounded-2xl"
        data-testid="help-dialog"
      >
        <DialogHeader>
          <DialogTitle>Central de assistência</DialogTitle>
          <DialogDescription>
            Ajuda desta tela, guia do fluxo de trabalho, atalhos e preferências — em um lugar só.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <Section icon={LifeBuoy} title={contextual.title}>
            <p className="rounded-xl bg-muted/40 p-3 leading-relaxed">{contextual.body}</p>
          </Section>

          <Section icon={Compass} title="Como o NeuroPed funciona">
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              O tour guiado percorre a consulta inteira em seis passos: encontrar o paciente,
              escolher a tarefa, aplicar o instrumento, registrar, documentar e acompanhar.
            </p>
            <Button
              type="button"
              onClick={() => openAuxiliarySurface(OPEN_TOUR_EVENT)}
              className="min-h-11 w-full gap-2"
              data-testid="button-start-tour"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              Abrir tour guiado
            </Button>
          </Section>

          <Section icon={Keyboard} title="Atalhos">
            <ul className="space-y-1.5">
              {SHORTCUTS.map((shortcut) => (
                <li key={shortcut.keys} className="flex items-center gap-3">
                  <kbd className="shrink-0 rounded-md border border-border bg-muted/60 px-2 py-1 font-mono text-[11px] text-foreground">
                    {shortcut.keys}
                  </kbd>
                  <span className="text-[12.5px] leading-snug text-muted-foreground">
                    {shortcut.action}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Settings} title="Preferências e acessibilidade">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => openAuxiliarySurface(OPEN_PREFERENCES_EVENT)}
                className="min-h-11 w-full gap-2"
                data-testid="button-open-preferences"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Preferências
              </Button>
              <Button asChild variant="outline" className="min-h-11 w-full gap-2">
                <Link href="/acessibilidade" onClick={() => setOpen(false)}>
                  <Accessibility className="h-4 w-4" aria-hidden="true" />
                  Acessibilidade
                </Link>
              </Button>
            </div>
          </Section>

          <Section icon={ShieldAlert} title="Limite de uso">
            <p className="rounded-xl bg-muted/40 p-3 leading-relaxed">
              O NeuroPed organiza triagens, escalas, rotas clínicas e relatórios. Ele não substitui
              julgamento clínico, anamnese, exame neurológico ou decisão médica.
            </p>
          </Section>

          <Button asChild variant="outline" className="min-h-11 w-full gap-2">
            <Link href="/ajuda" onClick={() => setOpen(false)}>
              <Command className="h-4 w-4" aria-hidden="true" />
              Abrir a central de ajuda completa
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
