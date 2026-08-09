import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MessageCircle, Search, Star, Volume2, Repeat, Eraser, Trash2,
  Plus, Save, Download, Upload, History, Sparkles,
} from "lucide-react";
import { CAA_CATEGORIES, CAA_QUICK, type CaaSymbol, type CaaCategory } from "@/data/caaBoard";
import { useSpeech } from "@/hooks/useSpeech";
import { useToast } from "@/hooks/use-toast";
import { secureGet, secureSet } from "@/lib/secureStorage";

const LS_BOARD = "neuroped:caa:board:v1";
const LS_FAVS = "neuroped:caa:favs:v1";
const LS_HIST = "neuroped:caa:hist:v1";
const SECURE_CAA_KEY = "caa:workspace:v2";
const MAX_CAA_CATEGORIES = 30;
const MAX_CAA_ITEMS_PER_CATEGORY = 100;

type Board = Record<string, CaaCategory>;
type Token = { icon: string; label: string; text: string };
type UsageMode = "crianca" | "familia" | "terapeuta";

const usageModes: Record<UsageMode, { label: string; badge: string; description: string; hint: string }> = {
  crianca: {
    label: "Criança",
    badge: "uso direto",
    description: "Cartões maiores, frase visível e fala imediata para favorecer participação da criança.",
    hint: "Toque nas figurinhas para montar a frase e ouvir a voz.",
  },
  familia: {
    label: "Família",
    badge: "rotina de casa",
    description: "Ajuda responsáveis a registrar palavras úteis da rotina e salvar cartões próprios da família.",
    hint: "Use o campo “Cartão da família” para adaptar a prancha à rotina da criança.",
  },
  terapeuta: {
    label: "Terapeuta",
    badge: "apoio clínico",
    description: "Organiza busca, favoritos e histórico para observar preferências comunicativas durante a sessão.",
    hint: "Favoritos e histórico ajudam a revisar quais cartões foram mais funcionais.",
  },
};

function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T;
}
function clean(s: string): string {
  return String(s || "").replace(/[<>]/g, "").trim().slice(0, 90);
}
function sanitizeBoard(value: unknown): Board {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return clone(CAA_CATEGORIES);
  }
  const normalized: Board = {};
  for (const [rawName, rawCategory] of Object.entries(value).slice(0, MAX_CAA_CATEGORIES)) {
    if (!rawCategory || typeof rawCategory !== "object" || Array.isArray(rawCategory)) continue;
    const category = rawCategory as Partial<CaaCategory>;
    const name = clean(rawName).slice(0, 60);
    if (!name || !Array.isArray(category.items)) continue;
    const items = category.items.slice(0, MAX_CAA_ITEMS_PER_CATEGORY).flatMap((rawItem) => {
      if (!Array.isArray(rawItem) || rawItem.length < 3) return [];
      const icon = clean(String(rawItem[0] ?? "")).slice(0, 20);
      const label = clean(String(rawItem[1] ?? ""));
      const speech = clean(String(rawItem[2] ?? ""));
      return label && speech ? [[icon || "🔹", label, speech] as CaaSymbol] : [];
    });
    normalized[name] = {
      icon: clean(String(category.icon ?? "🔹")).slice(0, 20) || "🔹",
      hint: clean(String(category.hint ?? "")).slice(0, 120),
      items,
    };
  }
  return Object.keys(normalized).length > 0 ? normalized : clone(CAA_CATEGORIES);
}
function sanitizeKeys(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.flatMap((item) => typeof item === "string" ? [item.slice(0, 240)] : []))]
    .slice(0, limit);
}
function symKey(item: CaaSymbol): string {
  return item[1] + "|" + item[2];
}

export default function CaaPage() {
  const { speak, supported } = useSpeech();
  const { toast } = useToast();

  const [board, setBoard] = useState<Board>(() => clone(CAA_CATEGORIES));
  const [favs, setFavs] = useState<string[]>([]);
  const [hist, setHist] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState<"saving" | "saved" | "error">("saving");
  const storageQueue = useRef<Promise<unknown>>(Promise.resolve());
  const storageRevision = useRef(0);
  const [cat, setCat] = useState<string>(() => Object.keys(CAA_CATEGORIES)[0]);
  const [mode, setMode] = useState<"cat" | "fav" | "hist">("cat");
  const [usageMode, setUsageMode] = useState<UsageMode>("crianca");
  const [search, setSearch] = useState("");
  const [phrase, setPhrase] = useState<Token[]>([]);
  const [rate, setRate] = useState(0.84);
  const [custom, setCustom] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  // Persistência temporária cifrada + migração das três chaves legadas.
  useEffect(() => {
    let active = true;
    void (async () => {
      const protectedWorkspace = await secureGet<{ board: unknown; favs: unknown; hist: unknown }>(SECURE_CAA_KEY);
      let restoredBoard = clone(CAA_CATEGORIES);
      let restoredFavs: string[] = [];
      let restoredHist: string[] = [];

      if (protectedWorkspace !== null) {
        restoredBoard = sanitizeBoard(protectedWorkspace.board);
        restoredFavs = sanitizeKeys(protectedWorkspace.favs, 500);
        restoredHist = sanitizeKeys(protectedWorkspace.hist, 30);
        for (const key of [LS_BOARD, LS_FAVS, LS_HIST]) {
          try { localStorage.removeItem(key); } catch { /* legado indisponível */ }
        }
      } else {
        try {
          const rawBoard = localStorage.getItem(LS_BOARD);
          const rawFavs = localStorage.getItem(LS_FAVS);
          const rawHist = localStorage.getItem(LS_HIST);
          restoredBoard = sanitizeBoard(rawBoard ? JSON.parse(rawBoard) : CAA_CATEGORIES);
          restoredFavs = sanitizeKeys(rawFavs ? JSON.parse(rawFavs) : [], 500);
          restoredHist = sanitizeKeys(rawHist ? JSON.parse(rawHist) : [], 30);
          const migrated = await secureSet(SECURE_CAA_KEY, {
            board: restoredBoard,
            favs: restoredFavs,
            hist: restoredHist,
          });
          if (migrated) {
            if (localStorage.getItem(LS_BOARD) === rawBoard) localStorage.removeItem(LS_BOARD);
            if (localStorage.getItem(LS_FAVS) === rawFavs) localStorage.removeItem(LS_FAVS);
            if (localStorage.getItem(LS_HIST) === rawHist) localStorage.removeItem(LS_HIST);
          }
        } catch {
          // A prancha padrão continua utilizável em memória.
        }
      }

      if (!active) return;
      setBoard(restoredBoard);
      setFavs(restoredFavs);
      setHist(restoredHist);
      setCat(Object.keys(restoredBoard)[0] || Object.keys(CAA_CATEGORIES)[0]);
      setStorageReady(true);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const snapshot = {
      board: sanitizeBoard(board),
      favs: sanitizeKeys(favs, 500),
      hist: sanitizeKeys(hist, 30),
    };
    const revision = ++storageRevision.current;
    setStorageStatus("saving");
    const operation = storageQueue.current
      .catch(() => undefined)
      .then(() => secureSet(SECURE_CAA_KEY, snapshot));
    storageQueue.current = operation;
    void operation.then((stored) => {
      if (revision === storageRevision.current) {
        setStorageStatus(stored === true ? "saved" : "error");
      }
    });
  }, [board, favs, hist, storageReady]);

  const activeUsage = usageModes[usageMode];

  const allItems = useMemo(
    () =>
      Object.entries(board).flatMap(([c, v]) =>
        v.items.map((item) => ({ cat: c, item })),
      ),
    [board],
  );

  const visibleItems = useMemo(() => {
    const q = clean(search).toLowerCase();
    if (q) {
      return allItems.filter((x) =>
        (x.item[1] + " " + x.item[2] + " " + x.cat).toLowerCase().includes(q),
      );
    }
    if (mode === "fav") return allItems.filter((x) => favs.includes(symKey(x.item)));
    if (mode === "hist")
      return hist
        .map((k) => allItems.find((x) => symKey(x.item) === k))
        .filter((x): x is { cat: string; item: CaaSymbol } => Boolean(x));
    return (board[cat]?.items || []).map((item) => ({ cat, item }));
  }, [search, mode, favs, hist, board, cat, allItems]);

  function tap(item: CaaSymbol) {
    setPhrase((p) => [...p, { icon: item[0], label: clean(item[1]), text: clean(item[2]) }]);
    setHist((h) => [symKey(item), ...h.filter((x) => x !== symKey(item))].slice(0, 30));
    speak(item[2], rate);
  }

  function toggleFav(item: CaaSymbol) {
    const k = symKey(item);
    setFavs((f) => (f.includes(k) ? f.filter((x) => x !== k) : [k, ...f]));
    toast({ title: favs.includes(k) ? "Favorito removido" : "Favorito salvo" });
  }

  function speakAll() {
    speak(phrase.map((x) => x.text).join(" "), rate);
  }

  function addCustom() {
    const v = clean(custom);
    if (!v) return;
    setBoard((b) => {
      const next = clone(b);
      next[cat].items = [...next[cat].items, ["🔹", v, v] as CaaSymbol];
      return next;
    });
    setCustom("");
    speak(v, rate);
    toast({ title: "Cartão adicionado" });
  }

  function exportBoard() {
    const blob = new Blob([JSON.stringify({ board, favs, hist }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "caa_neuroped_prancha.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importBoard(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2_000_000) {
      toast({ title: "Arquivo muito grande", description: "Use uma prancha JSON de até 2 MB.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const j = JSON.parse(String(ev.target?.result || "{}")) as Record<string, unknown>;
        const nextBoard = sanitizeBoard(j.board);
        setBoard(nextBoard);
        setFavs(sanitizeKeys(j.favs, 500));
        setHist(sanitizeKeys(j.hist, 30));
        setCat(Object.keys(nextBoard)[0] || Object.keys(CAA_CATEGORIES)[0]);
        toast({ title: "Prancha importada", description: "Salvando temporariamente nesta sessão…" });
      } catch {
        toast({ title: "Arquivo inválido", variant: "destructive" });
      }
    };
    r.readAsText(f);
    e.target.value = "";
  }

  const title =
    mode === "fav" && !search
      ? "⭐ Favoritos"
      : mode === "hist" && !search
        ? "🕘 Mais usados"
        : search
          ? "🔍 Resultados"
          : (board[cat]?.icon || "") + " " + cat;

  if (!storageReady) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground" role="status">
        Carregando prancha protegida…
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {storageStatus === "error" && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive" role="alert">
          A prancha continua visível, mas não pôde ser salva neste dispositivo. Exporte o JSON antes de sair desta tela.
        </div>
      )}
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent border border-border p-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            🆓 CAA Gratuita
          </Badge>
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" />
            {supported ? "Voz PT-BR" : "Voz indisponível"}
          </span>
        </div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <MessageCircle className="w-7 h-7 text-primary" /> Vou Falar!
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Comunicação Alternativa e Aumentativa: figurinhas grandes, voz em português,
          busca, favoritos e montagem de frases por combinação de cartões. Recurso
          educacional local — não substitui avaliação fonoaudiológica.
        </p>

        <div className="mt-4 rounded-2xl border border-border/70 bg-background/65 p-3 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Modo de uso
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {activeUsage.label} · <span className="text-muted-foreground">{activeUsage.badge}</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {activeUsage.description}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Selecionar modo de uso da CAA">
              {(Object.keys(usageModes) as UsageMode[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={usageMode === key}
                  onClick={() => setUsageMode(key)}
                  className={`rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors ${
                    usageMode === key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/60 text-foreground hover:bg-muted"
                  }`}
                >
                  {usageModes[key].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" variant="secondary" onClick={() => speak("Olá. Eu posso falar com figurinhas.", rate)}>
            <Volume2 className="w-4 h-4 mr-1" /> Testar voz
          </Button>
        </div>
      </div>

      {/* Frase montada */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-1 mb-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-bold">Minha frase</h2>
            <span className="text-[11px] text-muted-foreground">{activeUsage.hint}</span>
          </div>
          <div className="min-h-[72px] flex flex-wrap gap-2 items-center rounded-2xl border-2 border-dashed border-amber-400/60 bg-muted/40 p-3">
            {phrase.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                Toque nas figurinhas para montar a frase
              </span>
            ) : (
              phrase.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setPhrase((p) => p.filter((_, idx) => idx !== i))}
                  title="Toque para remover"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-bold text-primary"
                >
                  <span aria-hidden>{t.icon}</span> {t.label}
                </button>
              ))
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="sm" onClick={speakAll} disabled={!phrase.length}>
              <Volume2 className="w-4 h-4 mr-1" /> Falar frase
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPhrase((p) => p.slice(0, -1))} disabled={!phrase.length}>
              <Eraser className="w-4 h-4 mr-1" /> Apagar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => speak(phrase.at(-1)?.text || phrase.map((x) => x.text).join(" "), rate)}
              disabled={!phrase.length}
            >
              <Repeat className="w-4 h-4 mr-1" /> Repetir
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setPhrase([])} disabled={!phrase.length}>
              <Trash2 className="w-4 h-4 mr-1" /> Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        {/* Sidebar: busca + categorias + controles */}
        <Card className="h-fit">
          <CardContent className="p-4 space-y-3">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
              <strong className="block text-foreground">Orientação rápida</strong>
              {activeUsage.hint}
            </div>

            <div className="space-y-1">
              <Label htmlFor="caa-search" className="text-xs">Buscar figurinha</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="caa-search"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setMode("cat"); }}
                  placeholder="água, dor, banheiro, mamãe…"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={mode === "fav" ? "default" : "outline"} className="flex-1" onClick={() => { setMode("fav"); setSearch(""); }}>
                <Star className="w-3.5 h-3.5 mr-1" /> Favoritos
              </Button>
              <Button size="sm" variant={mode === "hist" ? "default" : "outline"} className="flex-1" onClick={() => { setMode("hist"); setSearch(""); }}>
                <History className="w-3.5 h-3.5 mr-1" /> Usados
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
              {Object.keys(board).map((name) => {
                const c = board[name];
                const active = name === cat && mode === "cat" && !search;
                return (
                  <button
                    key={name}
                    onClick={() => { setCat(name); setMode("cat"); setSearch(""); }}
                    className={`text-left rounded-xl border px-2.5 py-2 transition-all ${
                      active ? "border-primary bg-primary/10" : "border-border bg-muted/40 hover:bg-muted"
                    }`}
                  >
                    <span className="text-lg" aria-hidden>{c.icon}</span>
                    <strong className="block text-xs leading-tight">{name}</strong>
                    <span className="block text-[10px] text-muted-foreground">{c.hint}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1">
              <Label htmlFor="caa-rate" className="text-xs">Velocidade da voz</Label>
              <select
                id="caa-rate"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value={0.72}>Bem lenta</option>
                <option value={0.84}>Lenta e clara</option>
                <option value={1}>Natural</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="caa-custom" className="text-xs">Cartão da família</Label>
              <Input
                id="caa-custom"
                value={custom}
                maxLength={48}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
                placeholder="Ex.: quero meu carrinho"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={addCustom}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
              </Button>
              <Button
                size="sm"
                variant="outline"
                aria-label="Ver status de salvamento da prancha"
                onClick={() => toast({
                  title: storageStatus === "saved" ? "Prancha salva na sessão" : storageStatus === "saving" ? "Salvamento em andamento" : "Prancha não salva",
                  description: storageStatus === "error" ? "Exporte o JSON antes de sair desta tela." : undefined,
                  variant: storageStatus === "error" ? "destructive" : "default",
                })}
              >
                <Save className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={exportBoard}>
                <Download className="w-3.5 h-3.5 mr-1" /> Exportar
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => importRef.current?.click()}>
                <Upload className="w-3.5 h-3.5 mr-1" /> Importar
              </Button>
              <input ref={importRef} type="file" accept=".json,application/json" aria-label="Importar prancha de um arquivo JSON" className="hidden" onChange={importBoard} />
            </div>
          </CardContent>
        </Card>

        {/* Board */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">{title}</h2>
            <span className="text-xs text-muted-foreground">{visibleItems.length} figurinhas</span>
          </div>
          {visibleItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma figurinha aqui ainda.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visibleItems.map(({ item }, i) => {
                const isFav = favs.includes(symKey(item));
                return (
                  <div
                    key={item[1] + i}
                    className="relative min-h-[132px] rounded-2xl border-2 border-amber-400/30 bg-gradient-to-b from-card to-muted/40 shadow-sm transition-transform hover:border-primary/50 sm:min-h-[150px]"
                  >
                    <button
                      type="button"
                      onClick={() => tap(item)}
                      aria-label={"Falar " + item[1]}
                      className="flex min-h-[128px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center active:scale-95 sm:min-h-[146px]"
                    >
                      <span className="text-5xl leading-none" aria-hidden>{item[0]}</span>
                      <strong className="text-sm leading-tight text-foreground">{item[1]}</strong>
                      {/* Dica de affordance repetida em todos os cartões: fica fora da
                          árvore de acessibilidade. Sem isso o texto visível do botão é
                          "<palavra> toque para ouvir" enquanto o nome acessível é
                          "Falar <palavra>", e o nome deixa de conter o rótulo visível
                          (WCAG 2.5.3 Label in Name) — quebra comando por voz. Ocultá-la
                          também evita repetir a mesma dica a cada cartão no leitor. */}
                      <small className="text-[10px] text-muted-foreground" aria-hidden>toque para ouvir</small>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFav(item)}
                      aria-label={`${isFav ? "Remover" : "Adicionar"} ${item[1]} ${isFav ? "dos" : "aos"} favoritos`}
                      aria-pressed={isFav}
                      className={`absolute right-1.5 top-1.5 min-h-8 min-w-8 rounded-full px-1.5 py-0.5 text-sm ${isFav ? "text-amber-600" : "text-muted-foreground"}`}
                    >
                      <span aria-hidden="true">{isFav ? "★" : "☆"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Frases rápidas */}
          <div className="flex items-center gap-2 mt-6">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-bold">Frases rápidas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CAA_QUICK.map(([emoji, phraseText], i) => (
              <button
                key={i}
                onClick={() => {
                  speak(phraseText, rate);
                  setPhrase([{ icon: emoji, label: phraseText, text: phraseText }]);
                }}
                className="text-left rounded-2xl border border-primary/15 bg-muted/40 px-4 py-3 hover:bg-muted transition-colors"
              >
                <strong className="block text-sm text-foreground">
                  {emoji} {phraseText}
                </strong>
                <span className="text-[11px] text-muted-foreground">fala rápida</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
        <strong>CAA Gratuita NeuroPed</strong> · recurso educacional local. Não substitui
        avaliação fonoaudiológica nem prescrição individualizada de CAA. As figurinhas usam
        emojis nativos do sistema, sem banco proprietário. Os ajustes da prancha ficam neste
        dispositivo. · Dr. Jadson Fraga Araújo Júnior · Neuropediatria · CRM-PE 25227 · RQE 17756
      </p>
    </div>
  );
}
