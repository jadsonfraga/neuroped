import { useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { directDomains, domainsForQueixas } from "@/data/directTasks";
import { faixasEtarias, queixas } from "@/data/scaleFilter";

function ageRangeCenter(ageId: string | null): number | null {
  if (!ageId) return null;
  const range = faixasEtarias.find((item) => item.id === ageId);
  return range ? Math.round((range.min + range.max) / 2) : null;
}

export default function TestesDiretosPage() {
  const [search, setSearch] = useState("");
  const [selectedQueixas, setSelectedQueixas] = useState<string[]>([]);
  const [selectedAge, setSelectedAge] = useState<string | null>(null);

  const visibleDomains = useMemo(() => {
    const ageMonths = ageRangeCenter(selectedAge);
    const base = domainsForQueixas(selectedQueixas, ageMonths);
    const term = search.trim().toLowerCase();
    if (!term) return base;
    return base.filter((domain) =>
      `${domain.label} ${domain.tasks.map((task) => `${task.title} ${task.instruction} ${task.observe}`).join(" ")}`
        .toLowerCase()
        .includes(term),
    );
  }, [search, selectedAge, selectedQueixas]);

  const preConsultaQueixas = queixas.filter((queixa) => !["efeitos", "evolucao"].includes(queixa.id));

  return (
    <div className="page-enter space-y-5 pb-8">
      <header className="rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10">pre-consulta</Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Testes Diretos</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Sondagens breves com a crianca para complementar questionarios de pais e escola.
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-3 rounded-[1.5rem] border border-border/70 bg-card/80 p-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por dominio, tarefa ou observacao..."
          className="h-11 rounded-2xl"
        />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {faixasEtarias.map((age) => (
            <button
              key={age.id}
              type="button"
              aria-pressed={selectedAge === age.id}
              onClick={() => setSelectedAge((value) => (value === age.id ? null : age.id))}
              className={`flex min-h-[44px] shrink-0 items-center rounded-2xl border px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selectedAge === age.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted/60"
              }`}
            >
              {age.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {preConsultaQueixas.slice(0, 24).map((queixa) => (
            <button
              key={queixa.id}
              type="button"
              aria-pressed={selectedQueixas.includes(queixa.id)}
              onClick={() =>
                setSelectedQueixas((current) =>
                  current.includes(queixa.id) ? current.filter((id) => id !== queixa.id) : [...current, queixa.id],
                )
              }
              className={`min-h-[44px] rounded-2xl border px-3 py-2 text-left text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selectedQueixas.includes(queixa.id) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted/60"
              }`}
            >
              {queixa.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {(visibleDomains.length ? visibleDomains : directDomains).map((domain) => (
          <Card key={domain.id} className="border-border/70 bg-card/90">
            <CardContent className="space-y-4 p-4">
              <div>
                <Badge variant="outline" className="mb-2 rounded-full">
                  {Math.round(domain.minAge / 12)}-{Math.round(domain.maxAge / 12)} anos
                </Badge>
                <h2 className="text-base font-black text-foreground">{domain.label}</h2>
              </div>

              <div className="space-y-3">
                {domain.tasks.map((task) => (
                  <div key={task.title} className="rounded-2xl border border-border/60 bg-background/70 p-3">
                    <p className="text-sm font-bold text-foreground">{task.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{task.instruction}</p>
                    <p className="mt-2 text-xs leading-relaxed text-foreground">
                      <strong>Observar:</strong> {task.observe}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
