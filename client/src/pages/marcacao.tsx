import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, CircleHelp, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PublicProvider = {
  slug: string;
  displayName: string;
  specialty: string;
  locationLabel: string | null;
};

type LoadState = "loading" | "ready" | "unavailable";

/** Porta administrativa: a página não coleta dados clínicos nem texto livre. */
export default function MarcacaoPage() {
  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let active = true;
    async function loadProviders() {
      try {
        const response = await apiRequest("GET", "/api/public-booking?action=providers");
        if (!response.ok) throw new Error("PUBLIC_BOOKING_UNAVAILABLE");
        const data = (await response.json()) as { providers?: PublicProvider[] };
        if (!active) return;
        setProviders(Array.isArray(data.providers) ? data.providers : []);
        setState("ready");
      } catch {
        if (active) setState("unavailable");
      }
    }
    void loadProviders();
    return () => { active = false; };
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:py-12">
      <section className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-9">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/85 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm">
            <CalendarDays className="h-3.5 w-3.5" /> Secretaria IA · agendamento
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Encontre o caminho certo para agendar.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Esta é uma porta administrativa do NeuroPed. Escolha o profissional disponível e consulte horários pela agenda segura, sem precisar relatar informações clínicas aqui.</p>
        </div>
      </section>

      <Card className="border-primary/20 bg-primary/[0.035]">
        <CardContent className="flex gap-3 p-5 text-sm leading-6 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p><strong className="text-foreground">Privacidade por padrão:</strong> esta página não solicita diagnóstico, sintomas, medicamentos, documentos ou histórico da criança. Dados mínimos só são solicitados na etapa final de reserva, pela agenda pública autorizada.</p>
        </CardContent>
      </Card>

      <section aria-labelledby="secretaria-profissionais" className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Próximo passo</p>
          <h2 id="secretaria-profissionais" className="mt-1 text-2xl font-black tracking-tight">Escolha um profissional</h2>
        </div>

        {state === "loading" && <Card><CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin text-primary" />Verificando agendas públicas disponíveis…</CardContent></Card>}

        {state === "ready" && providers.length === 0 && <Card><CardContent className="space-y-3 p-6"><h3 className="font-bold">Não há agendas online abertas neste momento.</h3><p className="text-sm leading-6 text-muted-foreground">A clínica pode disponibilizar novos horários em breve. Use os canais institucionais para orientações administrativas.</p></CardContent></Card>}

        {state === "ready" && providers.length > 0 && <div className="grid gap-4 sm:grid-cols-2">{providers.map((provider) => <Card key={provider.slug} className="flex flex-col border-border/80 transition-colors hover:border-primary/45"><CardHeader className="pb-3"><div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div><CardTitle className="text-lg">{provider.displayName}</CardTitle><CardDescription>{provider.specialty}{provider.locationLabel ? ` · ${provider.locationLabel}` : ""}</CardDescription></CardHeader><CardContent className="mt-auto pt-1"><Button asChild className="w-full gap-2"><a href={`#/agendar?provider=${encodeURIComponent(provider.slug)}`}>Ver horários <ArrowRight className="h-4 w-4" /></a></Button></CardContent></Card>)}</div>}

        {state === "unavailable" && <Card><CardContent className="space-y-3 p-6"><div className="flex items-center gap-2 font-bold"><CircleHelp className="h-5 w-5 text-primary" />Agenda online indisponível</div><p className="text-sm leading-6 text-muted-foreground">Não foi possível consultar a agenda agora. Tente novamente mais tarde ou entre em contato pelos canais institucionais da clínica.</p><Button variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button></CardContent></Card>}
      </section>
    </main>
  );
}
