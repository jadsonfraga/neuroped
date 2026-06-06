import { useState } from "react";
import {
  autismScales,
  quickRefSummary,
  bestOfEach,
  type AutismScale,
  type ChecklistDomain,
  type DimensionalDomain,
} from "@/data/autismScales";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  ClipboardCheck,
  RotateCcw,
  Eye,
  MessageSquare,
  Ruler,
  LayoutGrid,
  HeartPulse,
  Info,
  ChevronRight,
} from "lucide-react";

// ── Color maps ──────────────────────────────────────────────
const colorMap: Record<string, {
  bg: string;
  bgLight: string;
  border: string;
  text: string;
  textDark: string;
  gradient: string;
  badge: string;
  tab: string;
  check: string;
  severityBg: string[];
  severityText: string[];
  severityBorder: string[];
}> = {
  blue: {
    bg: "bg-blue-500",
    bgLight: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800/40",
    text: "text-blue-700 dark:text-blue-300",
    textDark: "text-blue-800 dark:text-blue-300",
    gradient: "from-blue-500 to-indigo-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    tab: "data-[state=active]:text-blue-700 data-[state=active]:border-blue-500",
    check: "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600",
    severityBg: [
      "bg-emerald-50 dark:bg-emerald-950/30",
      "bg-yellow-50 dark:bg-yellow-950/30",
      "bg-orange-50 dark:bg-orange-950/30",
      "bg-red-50 dark:bg-red-950/30",
    ],
    severityText: [
      "text-emerald-700 dark:text-emerald-300",
      "text-yellow-700 dark:text-yellow-300",
      "text-orange-700 dark:text-orange-300",
      "text-red-700 dark:text-red-300",
    ],
    severityBorder: [
      "border-emerald-300 dark:border-emerald-700",
      "border-yellow-300 dark:border-yellow-700",
      "border-orange-300 dark:border-orange-700",
      "border-red-300 dark:border-red-700",
    ],
  },
  emerald: {
    bg: "bg-emerald-500",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800/40",
    text: "text-emerald-700 dark:text-emerald-300",
    textDark: "text-emerald-800 dark:text-emerald-300",
    gradient: "from-emerald-500 to-teal-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    tab: "data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-500",
    check: "data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600",
    severityBg: [],
    severityText: [],
    severityBorder: [],
  },
  amber: {
    bg: "bg-amber-500",
    bgLight: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800/40",
    text: "text-amber-700 dark:text-amber-300",
    textDark: "text-amber-800 dark:text-amber-300",
    gradient: "from-amber-500 to-orange-500",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    tab: "data-[state=active]:text-amber-700 data-[state=active]:border-amber-500",
    check: "data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600",
    severityBg: [
      "bg-emerald-50 dark:bg-emerald-950/30",
      "bg-yellow-50 dark:bg-yellow-950/30",
      "bg-orange-50 dark:bg-orange-950/30",
      "bg-red-50 dark:bg-red-950/30",
    ],
    severityText: [
      "text-emerald-700 dark:text-emerald-300",
      "text-yellow-700 dark:text-yellow-300",
      "text-orange-700 dark:text-orange-300",
      "text-red-700 dark:text-red-300",
    ],
    severityBorder: [
      "border-emerald-300 dark:border-emerald-700",
      "border-yellow-300 dark:border-yellow-700",
      "border-orange-300 dark:border-orange-700",
      "border-red-300 dark:border-red-700",
    ],
  },
  violet: {
    bg: "bg-violet-500",
    bgLight: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800/40",
    text: "text-violet-700 dark:text-violet-300",
    textDark: "text-violet-800 dark:text-violet-300",
    gradient: "from-violet-500 to-purple-500",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    tab: "data-[state=active]:text-violet-700 data-[state=active]:border-violet-500",
    check: "data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600",
    severityBg: [],
    severityText: [],
    severityBorder: [],
  },
  rose: {
    bg: "bg-rose-500",
    bgLight: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-800/40",
    text: "text-rose-700 dark:text-rose-300",
    textDark: "text-rose-800 dark:text-rose-300",
    gradient: "from-rose-500 to-pink-500",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    tab: "data-[state=active]:text-rose-700 data-[state=active]:border-rose-500",
    check: "data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600",
    severityBg: [],
    severityText: [],
    severityBorder: [],
  },
};

const scaleIcons: Record<string, typeof Eye> = {
  ados2: Eye,
  adir: MessageSquare,
  cars2: Ruler,
  gars3: LayoutGrid,
  srs2: HeartPulse,
};

// ── Main Component ──────────────────────────────────────────
export default function TeaChecklistsPage() {
  const [activeTab, setActiveTab] = useState("ados2");
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<string>>>({});
  const [dimensionalAnswers, setDimensionalAnswers] = useState<Record<string, Record<string, number>>>({});
  const [synthChecked, setSynthChecked] = useState<Record<string, Set<string>>>({});

  // ── Checklist helpers ───────────────────────────────────
  function toggleCheck(scaleId: string, itemId: string) {
    setCheckedItems((prev) => {
      const scaleSet = new Set(prev[scaleId] || []);
      if (scaleSet.has(itemId)) {
        scaleSet.delete(itemId);
      } else {
        scaleSet.add(itemId);
      }
      return { ...prev, [scaleId]: scaleSet };
    });
  }

  function toggleSynth(scaleId: string, itemId: string) {
    setSynthChecked((prev) => {
      const scaleSet = new Set(prev[scaleId] || []);
      if (scaleSet.has(itemId)) {
        scaleSet.delete(itemId);
      } else {
        scaleSet.add(itemId);
      }
      return { ...prev, [scaleId]: scaleSet };
    });
  }

  function setDimensionalAnswer(scaleId: string, itemId: string, value: number) {
    setDimensionalAnswers((prev) => ({
      ...prev,
      [scaleId]: { ...(prev[scaleId] || {}), [itemId]: value },
    }));
  }

  function getCheckedCount(scaleId: string): number {
    return (checkedItems[scaleId] || new Set()).size;
  }

  function getTotalChecklistItems(scale: AutismScale): number {
    if (!scale.domains) return 0;
    return scale.domains.reduce((sum, d) => sum + d.items.length, 0);
  }

  function getDimensionalAnsweredCount(scaleId: string): number {
    return Object.keys(dimensionalAnswers[scaleId] || {}).length;
  }

  function getTotalDimensionalItems(scale: AutismScale): number {
    if (!scale.dimensionalDomains) return 0;
    return scale.dimensionalDomains.reduce((sum, d) => sum + d.items.length, 0);
  }

  function getDimensionalSum(scaleId: string): number {
    const answers = dimensionalAnswers[scaleId] || {};
    return Object.values(answers).reduce((sum, v) => sum + v, 0);
  }

  function resetScale(scaleId: string) {
    setCheckedItems((prev) => {
      const next = { ...prev };
      delete next[scaleId];
      return next;
    });
    setDimensionalAnswers((prev) => {
      const next = { ...prev };
      delete next[scaleId];
      return next;
    });
    setSynthChecked((prev) => {
      const next = { ...prev };
      delete next[scaleId];
      return next;
    });
  }

  // ── Render helpers ──────────────────────────────────────
  function renderChecklistDomain(scale: AutismScale, domain: ChecklistDomain, colors: typeof colorMap.blue) {
    const scaleChecks = checkedItems[scale.id] || new Set();
    const domainCheckedCount = domain.items.filter((i) => scaleChecks.has(i.id)).length;

    return (
      <AccordionItem key={domain.id} value={domain.id}>
        <AccordionTrigger className="text-sm hover:no-underline">
          <div className="flex items-center gap-2 flex-1">
            <span className="font-semibold text-foreground">{domain.title}</span>
            <Badge variant="outline" className={`text-xs ml-auto mr-2 ${domainCheckedCount > 0 ? colors.badge : ""}`}>
              {domainCheckedCount}/{domain.items.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {domain.items.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                data-testid={`check-${item.id}`}
              >
                <Checkbox
                  checked={scaleChecks.has(item.id)}
                  onCheckedChange={() => toggleCheck(scale.id, item.id)}
                  className={`mt-0.5 ${colors.check}`}
                />
                <span className="text-sm text-foreground leading-relaxed">{item.text}</span>
              </label>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  }

  function renderDimensionalDomain(scale: AutismScale, domain: DimensionalDomain, colors: typeof colorMap.blue) {
    const scaleAnswers = dimensionalAnswers[scale.id] || {};

    return (
      <AccordionItem key={domain.id} value={domain.id}>
        <AccordionTrigger className="text-sm hover:no-underline">
          <div className="flex items-center gap-2 flex-1">
            <span className="font-semibold text-foreground">{domain.title}</span>
            <Badge variant="outline" className={`text-xs ml-auto mr-2 ${Object.keys(scaleAnswers).length > 0 ? colors.badge : ""}`}>
              {domain.items.filter((i) => scaleAnswers[i.id] !== undefined).length}/{domain.items.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            {domain.items.map((item) => {
              const selected = scaleAnswers[item.id];
              return (
                <div key={item.id} className="space-y-2" data-testid={`dim-${item.id}`}>
                  <p className="text-sm font-medium text-foreground">{item.text}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {item.severityOptions.map((opt) => {
                      const isSelected = selected === opt.value;
                      const bgClass = isSelected
                        ? colors.severityBg[opt.value] || ""
                        : "bg-card";
                      const textClass = isSelected
                        ? colors.severityText[opt.value] || ""
                        : "text-muted-foreground";
                      const borderClass = isSelected
                        ? colors.severityBorder[opt.value] || "border-primary"
                        : "border-border";

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDimensionalAnswer(scale.id, item.id, opt.value)}
                          className={`text-xs px-3 py-2 rounded-lg border transition-colors text-left ${bgClass} ${textClass} ${borderClass} hover:bg-muted/50`}
                          data-testid={`dim-${item.id}-opt-${opt.value}`}
                        >
                          <span className="font-semibold">{opt.value}</span>
                          <span className="ml-1">— {opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  }

  function renderSynthesisDomain(scale: AutismScale, colors: typeof colorMap.blue) {
    if (!scale.synthesisDomain) return null;
    const domain = scale.synthesisDomain;
    const scaleSet = synthChecked[scale.id] || new Set();

    return (
      <Card className="border-card-border">
        <CardContent className="p-4 space-y-3">
          <h3 className={`text-sm font-semibold ${colors.text}`}>{domain.title}</h3>
          <div className="space-y-2">
            {domain.items.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                data-testid={`synth-${item.id}`}
              >
                <Checkbox
                  checked={scaleSet.has(item.id)}
                  onCheckedChange={() => toggleSynth(scale.id, item.id)}
                  className={`mt-0.5 ${colors.check}`}
                />
                <span className="text-sm text-foreground leading-relaxed">{item.text}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderScaleTab(scale: AutismScale) {
    const colors = colorMap[scale.color] || colorMap.blue;
    const Icon = scaleIcons[scale.id] || ClipboardCheck;

    const isChecklist = scale.type === "checklist";
    const answered = isChecklist
      ? getCheckedCount(scale.id)
      : getDimensionalAnsweredCount(scale.id);
    const totalItems = isChecklist
      ? getTotalChecklistItems(scale)
      : getTotalDimensionalItems(scale);
    const progress = totalItems > 0 ? Math.round((answered / totalItems) * 100) : 0;

    return (
      <div className="space-y-5">
        {/* Scale header */}
        <Card className={`${colors.bgLight} ${colors.border} border`}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-foreground">{scale.shortName}</h2>
                <p className="text-xs text-muted-foreground">{scale.fullNamePt}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{scale.focus}</p>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={colors.badge}>
                {isChecklist ? "Checklist" : "Dimensional"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {answered}/{totalItems} {isChecklist ? "itens marcados" : "itens respondidos"}
              </Badge>
              {!isChecklist && answered > 0 && (
                <Badge variant="outline" className={`text-xs ${colors.text}`}>
                  Soma: {getDimensionalSum(scale.id)}/{totalItems * 3}
                </Badge>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full bg-gradient-to-r ${colors.gradient} transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Best-for info */}
        <div className={`rounded-xl ${colors.bgLight} ${colors.border} border p-4`}>
          <div className="flex items-start gap-2">
            <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.text}`} />
            <div className="text-xs space-y-1">
              <p className={`font-semibold ${colors.textDark}`}>Melhor uso clínico:</p>
              <p className={colors.textDark}>{scale.bestFor}</p>
            </div>
          </div>
        </div>

        {/* Domains */}
        {isChecklist && scale.domains && (
          <Accordion type="multiple" className="space-y-0" data-testid={`accordion-${scale.id}`}>
            {scale.domains.map((domain) => renderChecklistDomain(scale, domain, colors))}
          </Accordion>
        )}

        {!isChecklist && scale.dimensionalDomains && (
          <Accordion type="multiple" defaultValue={[scale.dimensionalDomains[0]?.id]} data-testid={`accordion-${scale.id}`}>
            {scale.dimensionalDomains.map((domain) => renderDimensionalDomain(scale, domain, colors))}
          </Accordion>
        )}

        {/* Synthesis domain */}
        {scale.synthesisDomain && renderSynthesisDomain(scale, colors)}

        {/* Psychometric info */}
        <Card className="border-card-border">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Dados Psicométricos</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Sensibilidade</p>
                <p className={`text-sm font-bold ${colors.text}`}>{scale.psychometrics.sensitivity}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Especificidade</p>
                <p className={`text-sm font-bold ${colors.text}`}>{scale.psychometrics.specificity}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{scale.psychometrics.note}</p>
          </CardContent>
        </Card>

        {/* Reset button */}
        <Button
          variant="outline"
          onClick={() => resetScale(scale.id)}
          className="w-full gap-2"
          data-testid={`button-reset-${scale.id}`}
        >
          <RotateCcw className="w-4 h-4" />
          Limpar {scale.shortName}
        </Button>
      </div>
    );
  }

  // ── Page render ─────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-sm">
          <ClipboardCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Checklists TEA</h1>
          <p className="text-xs text-muted-foreground">Avaliação clínica adaptada — 5 instrumentos</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-tea">
        <TabsList className="w-full grid grid-cols-5 h-auto p-1">
          {autismScales.map((scale) => {
            const colors = colorMap[scale.color] || colorMap.blue;
            return (
              <TabsTrigger
                key={scale.id}
                value={scale.id}
                className={`text-xs py-2 px-1 ${colors.tab}`}
                data-testid={`tab-${scale.id}`}
              >
                {scale.shortName}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {autismScales.map((scale) => (
          <TabsContent key={scale.id} value={scale.id}>
            {renderScaleTab(scale)}
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Reference Section */}
      <Card className="border-card-border">
        <CardContent className="p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            Referência Rápida — Domínios por Instrumento
          </h3>
          <div className="space-y-3">
            {quickRefSummary.map((ref) => {
              const scale = autismScales.find((s) => s.shortName === ref.shortName);
              const colors = scale ? colorMap[scale.color] || colorMap.blue : colorMap.blue;
              return (
                <div key={ref.shortName} className="flex items-start gap-3">
                  <Badge className={`text-xs flex-shrink-0 mt-0.5 ${colors.badge}`}>
                    {ref.shortName}
                  </Badge>
                  <div className="flex flex-wrap gap-1.5">
                    {ref.domains.map((d) => (
                      <Badge key={d} variant="outline" className="text-xs font-normal">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Psychometric Comparison Table */}
      <Card className="border-card-border">
        <CardContent className="p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            Comparação Psicométrica
          </h3>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs" data-testid="table-psychometrics">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-2 font-semibold text-foreground">Escala</th>
                  <th className="text-left py-2 px-2 font-semibold text-foreground">Sensib.</th>
                  <th className="text-left py-2 px-2 font-semibold text-foreground">Especif.</th>
                  <th className="text-left py-2 pl-2 font-semibold text-foreground">Melhor para</th>
                </tr>
              </thead>
              <tbody>
                {autismScales.map((scale) => {
                  const colors = colorMap[scale.color] || colorMap.blue;
                  return (
                    <tr key={scale.id} className="border-b last:border-0">
                      <td className={`py-2 pr-2 font-semibold ${colors.text}`}>{scale.shortName}</td>
                      <td className="py-2 px-2 text-muted-foreground">{scale.psychometrics.sensitivity}</td>
                      <td className="py-2 px-2 text-muted-foreground">{scale.psychometrics.specificity}</td>
                      <td className="py-2 pl-2 text-muted-foreground">{scale.bestFor}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Best-of-each summary */}
      <Card className="border-card-border">
        <CardContent className="p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            Melhor de Cada Instrumento
          </h3>
          <div className="space-y-4">
            {bestOfEach.map((entry) => {
              const scale = autismScales.find((s) => s.shortName === entry.scale);
              const colors = scale ? colorMap[scale.color] || colorMap.blue : colorMap.blue;
              return (
                <div key={entry.scale} className={`rounded-xl ${colors.bgLight} ${colors.border} border p-3 space-y-2`}>
                  <div className="flex items-center gap-2">
                    <Badge className={colors.badge}>{entry.scale}</Badge>
                    <span className="text-xs font-semibold text-foreground">{entry.strength}</span>
                  </div>
                  <ul className="space-y-1 ml-1">
                    {entry.picks.map((pick) => (
                      <li key={pick} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.bg}`} />
                        {pick}
                      </li>
                    ))}
                  </ul>
                  <p className={`text-xs italic ${colors.text}`}>&quot;{entry.motto}&quot;</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-xl bg-muted/50 border border-border p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Nota clínica:</strong> Estes checklists são adaptações inspiradas nos instrumentos originais para apoio à
            avaliação clínica. Não substituem a aplicação padronizada dos testes. Devem ser interpretados em conjunto com
            anamnese completa, observação clínica e correlação desenvolvimental. O diagnóstico de TEA é sempre clínico e
            multidimensional.
          </p>
        </div>
      </div>
    </div>
  );
}
