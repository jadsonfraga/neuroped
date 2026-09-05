import { useState } from "react";
import { Link } from "wouter";
import {
  Accessibility,
  Compass,
  FileText,
  HelpCircle,
  Keyboard,
  Search,
  Settings,
  Stethoscope,
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

const OPEN_TOUR_EVENT = "neuroped:open-tour";
const OPEN_PREFERENCES_EVENT = "neuroped:open-preferences";
const ASSISTANCE_HANDOFF_DELAY_MS = 220;

export function FloatingHelp() {
  const [open, setOpen] = useState(false);

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
          aria-label="Abrir assistência do NeuroPed"
          data-testid="button-floating-help"
        >
          <HelpCircle className="h-5 w-5" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl" data-testid="help-dialog">
        <DialogHeader>
          <DialogTitle>Assistência do NeuroPed</DialogTitle>
          <DialogDescription>
            Tour, ajuda, preferências, acessibilidade e atalhos — tudo por aqui.
            Você nunca precisa escolher entre três lugares diferentes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {/* O conteúdo ensina o CAMINHO do atendimento, na mesma ordem do tour. */}
          <ol className="space-y-2">
            <li className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
              <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p>
                <strong className="font-semibold">Paciente primeiro.</strong> Escolha
                quem está em atendimento na home. Prontuário, laudo e receita
                passam a abrir já no contexto dessa pessoa.
              </p>
            </li>
            <li className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
              <Search className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p>
                <strong className="font-semibold">Instrumento por queixa.</strong> O
                Filtro Clínico parte de idade, queixa e contexto. A busca global
                (<kbd className="rounded border border-border px-1 text-[11px]">Ctrl</kbd>
                {" + "}
                <kbd className="rounded border border-border px-1 text-[11px]">K</kbd>)
                encontra escala, página ou ferramenta pelo nome.
              </p>
            </li>
            <li className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p>
                <strong className="font-semibold">Do resultado ao documento.</strong>{" "}
                Responda os itens, revise as pendências destacadas e confira o
                registro completo antes de gerar laudo ou receita. O NeuroPed
                organiza a evidência; a decisão clínica continua sendo sua.
              </p>
            </li>
          </ol>
          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            <Button
              type="button"
              onClick={() => openAuxiliarySurface(OPEN_TOUR_EVENT)}
              className="min-h-11 w-full gap-2"
              data-testid="button-start-tour"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              Tour do fluxo
            </Button>
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
            <Button asChild variant="outline" className="min-h-11 w-full gap-2">
              <Link href="/ajuda" onClick={() => setOpen(false)}>
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                Central de ajuda
              </Link>
            </Button>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-dashed border-border/70 p-3 text-[12.5px] text-muted-foreground">
            <Keyboard className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              Atalhos:{" "}
              <kbd className="rounded border border-border px-1 text-[11px]">Ctrl</kbd>
              {" + "}
              <kbd className="rounded border border-border px-1 text-[11px]">K</kbd>{" "}
              abre a busca global;{" "}
              <kbd className="rounded border border-border px-1 text-[11px]">Esc</kbd>{" "}
              fecha qualquer painel;{" "}
              <kbd className="rounded border border-border px-1 text-[11px]">Tab</kbd>{" "}
              percorre a página na ordem de leitura.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
