import { useState, useMemo } from "react";
import { denverMilestones, denverAreaLabels, type DenverMilestone } from "@/data/scales";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { BookOpen, CheckCircle2, XCircle, HelpCircle, Info, Filter } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ScaleReference } from "@/components/ScaleReference";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

type Status = "pass" | "fail" | "no-opportunity" | null;

export default function DenverPage() {
  const [ageMonths, setAgeMonths] = useState(12);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [filterArea, setFilterArea] = useState<string | null>(null);

  const filteredMilestones = useMemo(() => {
    let ms = denverMilestones.filter(
      (m) => ageMonths >= m.ageMonths[0] && ageMonths <= m.ageMonths[1] + 6
    );
    if (filterArea) {
      ms = ms.filter((m) => m.area === filterArea);
    }
    return ms;
  }, [ageMonths, filterArea]);

  const grouped = useMemo(() => {
    const groups: Record<string, DenverMilestone[]> = {};
    for (const m of filteredMilestones) {
      if (!groups[m.area]) groups[m.area] = [];
      groups[m.area].push(m);
    }
    return groups;
  }, [filteredMilestones]);

  function setStatus(id: string, status: Status) {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  }

  function getAgeLabel(months: number): string {
    if (months < 12) return `${months} meses`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (rem === 0) return `${years} ano${years > 1 ? "s" : ""}`;
    return `${years} ano${years > 1 ? "s" : ""} e ${rem} mes${rem > 1 ? "es" : ""}`;
  }

  function isDelayed(m: DenverMilestone): boolean {
    return ageMonths > m.ageMonths[1] && statuses[m.id] === "fail";
  }

  const delays = filteredMilestones.filter(isDelayed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHero
        icon={BookOpen}
        eyebrow="triagem do desenvolvimento"
        title="Denver II"
        subtitle="Triagem do Desenvolvimento — 0 a 6 anos."
        gradient="from-amber-500 to-orange-500"
      />

      {/* Instruction */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Instruções:</strong> Selecione a idade da criança e avalie cada marco do desenvolvimento como “Passou”, “Falhou” ou “Sem oportunidade”. Marcos são exibidos conforme a faixa etária selecionada.
        </p>
      </div>

      {/* Age Selector */}
      <Card className="border-card-border">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Idade da Criança</h3>
            <Badge variant="secondary" className="text-sm font-bold">
              {getAgeLabel(ageMonths)}
            </Badge>
          </div>
          <Slider
            value={[ageMonths]}
            onValueChange={([v]) => setAgeMonths(v)}
            min={0}
            max={72}
            step={1}
            className="w-full"
            data-testid="slider-age"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 meses</span>
            <span>6 anos</span>
          </div>
        </CardContent>
      </Card>

      {/* Area filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Button
          size="sm"
          variant={filterArea === null ? "default" : "outline"}
          onClick={() => setFilterArea(null)}
          className="text-xs"
        >
          Todas
        </Button>
        {Object.entries(denverAreaLabels).map(([key, val]) => (
          <Button
            key={key}
            size="sm"
            variant={filterArea === key ? "default" : "outline"}
            onClick={() => setFilterArea(key)}
            className="text-xs"
          >
            {val.name}
          </Button>
        ))}
      </div>

      {/* Delays warning */}
      {delays.length > 0 && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4">
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-800 dark:text-red-300 space-y-1">
              <p><strong>Atenção — {delays.length} atraso(s) identificado(s):</strong></p>
              {delays.map((d) => (
                <p key={d.id}>• {d.description} (esperado: {d.ageRange})</p>
              ))}
              <p className="pt-1">
                {delays.length >= 2
                  ? "Resultado suspeito — Encaminhar para avaliação diagnóstica especializada."
                  : "Resultado questionável — Reavaliar em 1-2 semanas."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Milestones by area */}
      {Object.entries(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <HelpCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum marco encontrado para essa idade e filtro.</p>
          <p className="text-xs mt-1">Tente ajustar a idade ou remover o filtro de área.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([area, milestones]) => {
          const areaInfo = denverAreaLabels[area];
          return (
            <div key={area} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${areaInfo.bg}`} />
                <h2 className={`text-sm font-semibold ${areaInfo.color}`}>{areaInfo.name}</h2>
                <Badge variant="outline" className="text-xs">{milestones.length}</Badge>
              </div>

              <div className="space-y-2">
                {milestones.map((m) => {
                  const status = statuses[m.id];
                  const delayed = isDelayed(m);
                  const pastExpected = ageMonths > m.ageMonths[1];

                  return (
                    <Card
                      key={m.id}
                      data-testid={`card-milestone-${m.id}`}
                      className={`border-card-border transition-all ${
                        delayed ? "ring-1 ring-red-300 dark:ring-red-700" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-foreground font-medium">{m.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{m.ageRange}</span>
                              {pastExpected && !status && (
                                <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
                                  Já deveria atingir
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <Button
                              size="sm"
                              variant={status === "pass" ? "default" : "outline"}
                              onClick={() => setStatus(m.id, status === "pass" ? null : "pass")}
                              className={`h-8 w-8 p-0 ${status === "pass" ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600" : ""}`}
                              title="Passou"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={status === "fail" ? "default" : "outline"}
                              onClick={() => setStatus(m.id, status === "fail" ? null : "fail")}
                              className={`h-8 w-8 p-0 ${status === "fail" ? "bg-red-600 hover:bg-red-700 border-red-600" : ""}`}
                              title="Falhou"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={status === "no-opportunity" ? "default" : "outline"}
                              onClick={() => setStatus(m.id, status === "no-opportunity" ? null : "no-opportunity")}
                              className={`h-8 w-8 p-0 ${status === "no-opportunity" ? "bg-muted-foreground hover:bg-muted-foreground/80 border-muted-foreground" : ""}`}
                              title="Sem oportunidade"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Info */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <p><strong>Interpretação do Denver II:</strong></p>
            <p><strong>Normal:</strong> Nenhum atraso e no máximo 1 cautela</p>
            <p><strong>Suspeito:</strong> 2+ cautelas e/ou 1+ atraso(s)</p>
            <p><strong>Atraso:</strong> Falha em item que 90% das crianças já atingiram na faixa etária</p>
            <p><strong>Cautela:</strong> Falha em item que 75-90% das crianças já atingiram</p>
          </div>
        </div>
      </div>
      <ScaleReference scaleId="denver" />

      {/* ClinicalReport — shown when at least some milestones have been evaluated */}
      {Object.keys(statuses).length > 0 && (() => {
        const evaluated = filteredMilestones.filter((m) => statuses[m.id] !== undefined && statuses[m.id] !== null);
        const passCount = evaluated.filter((m) => statuses[m.id] === "pass").length;
        const failCount = evaluated.filter((m) => statuses[m.id] === "fail").length;
        const delayCount = delays.length;
        const classification = delayCount === 0
          ? (failCount === 0 ? "Normal" : "Questionável — reavaliar em 1-2 semanas")
          : delayCount >= 2
          ? "Suspeito — encaminhar para avaliação especializada"
          : "Questionável — reavaliar em 1-2 semanas";
        const description = `Denver II aplicado em criança de ${getAgeLabel(ageMonths)}. ${evaluated.length} marcos avaliados: ${passCount} passaram, ${failCount} falharam. ${delayCount > 0 ? `${delayCount} atraso(s) identificado(s).` : "Sem atrasos identificados."}` ;

        const domainResults = Object.entries(denverAreaLabels).map(([key, areaInfo]) => {
          const areaMs = filteredMilestones.filter((m) => m.area === key);
          const areaEval = areaMs.filter((m) => statuses[m.id] !== undefined && statuses[m.id] !== null);
          const areaPass = areaEval.filter((m) => statuses[m.id] === "pass").length;
          const areaFail = areaEval.filter((m) => statuses[m.id] === "fail").length;
          const areaDelay = areaMs.filter((m) => isDelayed(m)).length;
          const areaCls = areaDelay > 0 ? "Atraso identificado" : areaFail > 0 ? "Cautela" : "Normal";
          return { domain: areaInfo.name, score: areaPass, classification: areaCls };
        }).filter((d) => filteredMilestones.some((m) => denverAreaLabels[m.area]?.name === d.domain));

        const items = evaluated.map((m) => ({
          question: `${m.description} (${m.ageRange})`,
          answer: statuses[m.id] === "pass" ? "Passou" : statuses[m.id] === "fail" ? "Falhou" : "Sem oportunidade",
          value: statuses[m.id] === "pass" ? 1 : 0,
        }));

        return (
          <>
            <SaveToPatient
              scaleName="Denver II"
              totalScore={passCount}
              classification={classification}
              answers={statuses}
            />
            <ClinicalReport
              scaleName="Denver II"
              scaleFullName="Teste de Triagem do Desenvolvimento Denver II"
              totalScore={passCount}
              maxScore={evaluated.length}
              classification={classification}
              description={description}
              domainResults={domainResults}
              items={items}
              patientAge={getAgeLabel(ageMonths)}
            />
          </>
        );
      })()}
    </div>
  );
}
