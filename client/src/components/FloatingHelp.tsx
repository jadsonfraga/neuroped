import { useState } from "react";
import { Link } from "wouter";
import { Compass, HelpCircle, Search, ClipboardCheck, ShieldAlert } from "lucide-react";
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

export function FloatingHelp() {
  const [open, setOpen] = useState(false);

  function startTour() {
    setOpen(false);
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event(OPEN_TOUR_EVENT));
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="fixed bottom-6 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/95 text-foreground shadow-[0_12px_30px_-16px_hsl(var(--foreground)/0.5)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:right-5 print:hidden"
          aria-label="Abrir ajuda do NeuroPed"
          data-testid="button-floating-help"
        >
          <HelpCircle className="h-5 w-5" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Ajuda rápida do NeuroPed</DialogTitle>
          <DialogDescription>
            Apoio para navegar, aplicar escalas e manter o uso clínico seguro.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
            <ShieldAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p>
              O NeuroPed organiza triagens, escalas, rotas clínicas e
              relatórios. Ele não substitui julgamento clínico, anamnese, exame
              neurológico ou decisão médica.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
            <Search
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p>
              Use a busca global ou a busca da Home para encontrar escala,
              página ou ferramenta. O Filtro Clínico ajuda por idade e queixa.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
            <ClipboardCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p>
              Para aplicar uma escala, responda todos os itens visíveis, revise
              pendências destacadas e confira o registro completo de perguntas e
              respostas antes de salvar.
            </p>
          </div>
          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            <Button type="button" onClick={startTour} className="w-full gap-2" data-testid="button-start-tour">
              <Compass className="h-4 w-4" aria-hidden="true" />
              Tour guiado
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/ajuda" onClick={() => setOpen(false)}>Central de ajuda</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
