import { Link } from "wouter";
import { HelpCircle, Search, ClipboardCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function FloatingHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="fixed bottom-[5.25rem] right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 print:hidden"
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
          <Button asChild variant="outline" className="w-full">
            <Link href="/ajuda">Abrir central de ajuda</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
