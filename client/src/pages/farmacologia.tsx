import { useState, useMemo } from "react";
import {
  Pill, Puzzle, Zap, Flame, Brain, Heart, Users, AlertTriangle, Sparkles,
  CloudRain, Moon, Activity, Accessibility, ShieldAlert, Search, X,
  GraduationCap, Syringe, AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { pharmCategories } from "@/data/farmacologia";
import type { Drug, PharmCategory } from "@/data/farmacologia";

const iconMap: Record<string, any> = {
  puzzle: Puzzle,
  zap: Zap,
  flame: Flame,
  brain: Brain,
  heart: Heart,
  users: Users,
  "alert-triangle": AlertTriangle,
  sparkles: Sparkles,
  "cloud-rain": CloudRain,
  moon: Moon,
  activity: Activity,
  accessibility: Accessibility,
  "shield-alert": ShieldAlert,
  pill: Pill,
};

function getIcon(name: string) {
  return iconMap[name] || Pill;
}

function DrugCard({ drug, category }: { drug: Drug; category: PharmCategory }) {
  const CatIcon = getIcon(category.iconName);

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-4 space-y-2.5">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5`}>
            <CatIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-foreground leading-tight">{drug.name}</h3>
          </div>
        </div>

        <div className="space-y-2 pl-11">
          <div className="flex items-start gap-2">
            <Syringe className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80 leading-relaxed font-medium">{drug.dose}</p>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">{drug.comment}</p>

          {drug.alerts && drug.alerts.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {drug.alerts.map((alert) => (
                <Badge
                  key={alert}
                  variant="outline"
                  className="text-xs px-1.5 py-0 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 gap-1"
                >
                  <AlertCircle className="w-2.5 h-2.5" />
                  {alert}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function FarmacologiaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const totalDrugs = pharmCategories.reduce((sum, c) => sum + c.drugs.length, 0);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const catFilter = activeCategory;

    return pharmCategories
      .filter(cat => !catFilter || cat.id === catFilter)
      .map(cat => ({
        ...cat,
        drugs: cat.drugs.filter(d => {
          if (!q) return true;
          const text = `${d.name} ${d.dose} ${d.comment} ${(d.alerts || []).join(" ")} ${cat.title}`
            .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return text.includes(q);
        }),
      }))
      .filter(cat => cat.drugs.length > 0);
  }, [searchQuery, activeCategory]);

  const filteredCount = filteredCategories.reduce((sum, c) => sum + c.drugs.length, 0);

  return (
    <div className="space-y-6" data-testid="farmacologia-page">
      {/* Header */}
      <div className="text-center space-y-3 py-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center shadow-lg">
            <Pill className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">
          Farmacologia em Neuropediatria
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Doses práticas e comentários clínicos de {totalDrugs} fármacos organizados por {pharmCategories.length} indicações clínicas.
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <Badge variant="secondary" className="gap-1.5">
            <GraduationCap className="w-3 h-3" />
            {pharmCategories.length} Categorias
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Pill className="w-3 h-3" />
            {totalDrugs} Fármacos
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative" data-testid="search-container">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar fármaco, indicação, dose..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 h-11 rounded-xl bg-muted/50 border-border"
          data-testid="input-search-farmacologia"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5" data-testid="category-filters">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !activeCategory
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Todos ({totalDrugs})
        </button>
        {pharmCategories.map(cat => {
          const CatIcon = getIcon(cat.iconName);
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <CatIcon className="w-3 h-3" />
              {cat.title.length > 20 ? cat.title.slice(0, 18) + "…" : cat.title} ({cat.drugs.length})
            </button>
          );
        })}
      </div>

      {/* Results count when filtering */}
      {(searchQuery || activeCategory) && (
        <p className="text-xs text-muted-foreground">
          {filteredCount === 0
            ? "Nenhum fármaco encontrado."
            : `${filteredCount} resultado${filteredCount > 1 ? "s" : ""}`}
        </p>
      )}

      {/* Category sections */}
      {filteredCategories.map(category => {
        const CatIcon = getIcon(category.iconName);
        return (
          <div key={category.id} className="space-y-3">
            <Accordion type="single" collapsible defaultValue={category.id}>
              <AccordionItem value={category.id} className="border-0">
                <AccordionTrigger className="hover:no-underline py-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-sm`}>
                      <CatIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h2 className={`text-sm font-bold uppercase tracking-wider ${category.iconColor.split(" ")[0]}`}>
                      {category.title}
                    </h2>
                    <Badge variant="outline" className="text-xs ml-auto mr-2">
                      {category.drugs.length} {category.drugs.length === 1 ? "fármaco" : "fármacos"}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-1">
                    {category.drugs.map(drug => (
                      <DrugCard key={drug.name} drug={drug} category={category} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        );
      })}

      {/* Disclaimer */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Aviso educacional:</strong> Este guia de farmacologia é uma ferramenta de estudo voltada para estudantes de Medicina, médicos e profissionais de saúde. As doses e comentários servem como referência rápida para consulta clínica. A prescrição real requer avaliação individualizada, verificação de bula vigente e nunca deve se basear exclusivamente nestes resumos.
        </p>
      </div>
    </div>
  );
}
