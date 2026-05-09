import { useState, useMemo } from "react";
import {
  Brain, Puzzle, Zap, BookOpen, MessageCircle, Mic, Activity, Move,
  Repeat, Droplets, AlertCircle, Coffee, RotateCcw, Scale, RefreshCw,
  Utensils, Frown, Flame, AlertTriangle, CloudRain, TrendingUp,
  HeartCrack, ZapOff, CloudLightning, RotateCw, Moon, Pill,
  ClipboardList, AlertOctagon, Search, X, Stethoscope, BookMarked,
  ChevronDown, Lightbulb, GitBranch, Syringe, GraduationCap, Clock
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
import { psychiatryCategories } from "@/data/psychiatryGuide";
import type { PsychiatryTopic, PsychiatryCategory } from "@/data/psychiatryGuide";

const iconMap: Record<string, any> = {
  puzzle: Puzzle,
  zap: Zap,
  brain: Brain,
  "message-circle": MessageCircle,
  mic: Mic,
  "book-open": BookOpen,
  activity: Activity,
  move: Move,
  repeat: Repeat,
  droplets: Droplets,
  "alert-circle": AlertCircle,
  coffee: Coffee,
  "rotate-ccw": RotateCcw,
  scale: Scale,
  "refresh-cw": RefreshCw,
  utensils: Utensils,
  frown: Frown,
  flame: Flame,
  "alert-triangle": AlertTriangle,
  "cloud-rain": CloudRain,
  "trending-up": TrendingUp,
  "heart-crack": HeartCrack,
  "zap-off": ZapOff,
  "cloud-lightning": CloudLightning,
  "rotate-cw": RotateCw,
  moon: Moon,
  pill: Pill,
  "clipboard-list": ClipboardList,
  "alert-octagon": AlertOctagon,
};

function getIcon(suggestion: string) {
  return iconMap[suggestion] || Brain;
}

function ContentBlock({ title, icon: Icon, content, color }: { title: string; icon: any; content: string; color: string }) {
  if (!content || content === "N/A — tópico de farmacologia clínica" || content === "N/A — tópico metodológico") return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <div className="pl-6 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
        {content}
      </div>
    </div>
  );
}

function TopicCard({ topic, category }: { topic: PsychiatryTopic; category: PsychiatryCategory }) {
  const Icon = getIcon(topic.iconSuggestion);

  return (
    <Card className="border-border/60 overflow-hidden" data-testid={`topic-${topic.id}`}>
      <Accordion type="single" collapsible>
        <AccordionItem value={topic.id} className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3 text-left">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground leading-tight">{topic.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    <Clock className="w-3 h-3 mr-1" />
                    {topic.ageRelevance.length > 60 ? topic.ageRelevance.slice(0, 57) + "..." : topic.ageRelevance}
                  </Badge>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4 pt-2">
              <ContentBlock
                title="Critérios Diagnósticos"
                icon={ClipboardList}
                content={topic.criteria}
                color="text-blue-500"
              />
              <ContentBlock
                title="Diagnóstico"
                icon={Stethoscope}
                content={topic.diagnosis}
                color="text-emerald-500"
              />
              <ContentBlock
                title="Diagnóstico Diferencial"
                icon={GitBranch}
                content={topic.differential}
                color="text-amber-500"
              />
              <ContentBlock
                title="Tratamento"
                icon={Syringe}
                content={topic.treatment}
                color="text-violet-500"
              />
              <ContentBlock
                title="Pérolas Clínicas"
                icon={Lightbulb}
                content={topic.clinicalPearls}
                color="text-yellow-500"
              />

            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

export default function PsiquiatriaGuiaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const totalTopics = psychiatryCategories.reduce((sum, c) => sum + c.topics.length, 0);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const catFilter = activeCategory;

    return psychiatryCategories
      .filter(cat => !catFilter || cat.id === catFilter)
      .map(cat => ({
        ...cat,
        topics: cat.topics.filter(t => {
          if (!q) return true;
          const text = `${t.title} ${t.criteria} ${t.diagnosis} ${t.differential} ${t.treatment} ${t.clinicalPearls} ${t.ageRelevance} ${t.id}`
            .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return text.includes(q);
        }),
      }))
      .filter(cat => cat.topics.length > 0);
  }, [searchQuery, activeCategory]);

  const filteredCount = filteredCategories.reduce((sum, c) => sum + c.topics.length, 0);

  return (
    <div className="space-y-6" data-testid="psiquiatria-guia-page">
      {/* Header */}
      <div className="text-center space-y-3 py-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Brain className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">
          Guia de Psiquiatria Infantil
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Resumos clínicos de {totalTopics} transtornos psiquiátricos pediátricos: critérios DSM-5, diagnóstico diferencial, tratamento e pérolas clínicas.
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <Badge variant="secondary" className="gap-1.5">
            <GraduationCap className="w-3 h-3" />
            {totalTopics} Transtornos
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <BookMarked className="w-3 h-3" />
            DSM-5
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative" data-testid="search-container">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar transtorno, critério, medicamento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 h-11 rounded-xl bg-muted/50 border-border"
          data-testid="input-search-psiquiatria"
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
          Todos ({totalTopics})
        </button>
        {psychiatryCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat.label} ({cat.topics.length})
          </button>
        ))}
      </div>

      {/* Results count when filtering */}
      {(searchQuery || activeCategory) && (
        <p className="text-xs text-muted-foreground">
          {filteredCount === 0
            ? "Nenhum transtorno encontrado."
            : `${filteredCount} resultado${filteredCount > 1 ? "s" : ""}`}
        </p>
      )}

      {/* Category sections */}
      {filteredCategories.map(category => (
        <div key={category.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-6 rounded-full bg-gradient-to-b ${category.gradient}`} />
            <h2 className={`text-sm font-bold uppercase tracking-wider ${category.color}`}>
              {category.label}
            </h2>
            <Badge variant="outline" className="text-xs ml-auto">
              {category.topics.length} {category.topics.length === 1 ? "transtorno" : "transtornos"}
            </Badge>
          </div>
          <div className="space-y-2">
            {category.topics.map(topic => (
              <TopicCard key={topic.id} topic={topic} category={category} />
            ))}
          </div>
        </div>
      ))}

      {/* Disclaimer */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Aviso educacional:</strong> Este guia é uma ferramenta de estudo voltada para estudantes de Medicina, médicos, pediatras e profissionais terapeutas. Os resumos servem como referência rápida para consulta clínica. O diagnóstico real requer avaliação multidisciplinar completa e nunca deve se basear apenas nestes resumos.
        </p>
      </div>
    </div>
  );
}
// v2
