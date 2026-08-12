import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MessageCircle,
  Search,
  Star,
  Volume2,
  Repeat,
  Eraser,
  Trash2,
  Plus,
  Save,
  Download,
  Upload,
  History,
  Sparkles,
  ArrowRight,
  Undo2,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { type CaaSymbol, type CaaCategory } from "@/data/caaBoard";
import {
  CAA_FULL_CATEGORIES,
  CAA_FULL_QUICK,
  CAA_SYMBOL_COUNT,
} from "@/data/caaExpandedBoard";
import { useSpeech } from "@/hooks/useSpeech";
import { useToast } from "@/hooks/use-toast";
import { secureGet, secureSet } from "@/lib/secureStorage";
import { mergeCaaBoardWithCurrentDefaults } from "@/lib/caaWorkspaceMerge";

const LS_BOARD = "neuroped:caa:board:v1";
const LS_FAVS = "neuroped:caa:favs:v1";
const LS_HIST = "neuroped:caa:hist:v1";
const SECURE_CAA_KEY = "caa:workspace:v3";
const MAX_CAA_CATEGORIES = 40;
const MAX_CAA_ITEMS_PER_CATEGORY = 100;
const MAX_MESSAGES = 12;

type Board = Record<string, CaaCategory>;
type Token = { icon: string; label: string; text: string };
type UsageMode = "crianca" | "familia" | "terapeuta";
type Density = "grande" | "compacta";
type FirstThen = { first: Token | null; then: Token | null };

interface StoredWorkspace {
  board?: unknown;
  favs?: unknown;
  hist?: unknown;
  messages?: unknown;
}

const usageModes: Record<
  UsageMode,
  { label: string; badge: string; description: string; hint: string }
> = {
  crianca: {
    label: "Criança",
    badge: "uso direto",
    description:
      "Cartões grandes, posições estáveis e fala imediata para favorecer autonomia comunicativa.",
    hint: "Toque nos cartões para montar uma mensagem e ouvir a voz.",
  },
  familia: {
    label: "Família",
    badge: "rotina de casa",
    description:
      "Prioriza necessidades, rotina, mensagens rápidas e cartões próprios da família.",
    hint: "Personalize palavras da rotina sem perder a prancha-base.",
  },
  terapeuta: {
    label: "Terapeuta",
    badge: "apoio clínico",
    description:
      "Expõe busca, histórico, favoritos, primeiro-depois e densidade da grade para ajuste funcional.",
    hint: "Observe acesso, intenção, combinação de palavras e generalização entre contextos.",
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function clean(value: string, max = 90): string {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, max);
}

function symKey(item: CaaSymbol): string {
  return `${item[1]}|${item[2]}`;
}

function sanitizeBoardOnly(value: unknown): Board {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const normalized: Board = {};

  for (const [rawName, rawCategory] of Object.entries(value).slice(0, MAX_CAA_CATEGORIES)) {
    if (!rawCategory || typeof rawCategory !== "object" || Array.isArray(rawCategory)) continue;
    const category = rawCategory as Partial<CaaCategory>;
    const name = clean(rawName, 60);
    if (!name || !Array.isArray(category.items)) continue;

    const items = category.items.slice(0, MAX_CAA_ITEMS_PER_CATEGORY).flatMap((rawItem) => {
      if (!Array.isArray(rawItem) || rawItem.length < 3) return [];
      const icon = clean(String(rawItem[0] ?? ""), 20) || "🔹";
      const label = clean(String(rawItem[1] ?? ""));
      const speech = clean(String(rawItem[2] ?? ""), 140);
      return label && speech ? [[icon, label, speech] as CaaSymbol] : [];
    });

    normalized[name] = {
      icon: clean(String(category.icon ?? "🔹"), 20) || "🔹",
      hint: clean(String(category.hint ?? ""), 120),
      items,
    };
  }

  return normalized;
}

function mergeWithCurrentDefaults(value: unknown): Board {
  return mergeCaaBoardWithCurrentDefaults(
    CAA_FULL_CATEGORIES,
    sanitizeBoardOnly(value),
    MAX_CAA_ITEMS_PER_CATEGORY,
  );
}

function sanitizeKeys(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.flatMap((item) => (typeof item === "string" ? [item.slice(0, 240)] : [])))].slice(
    0,
    limit,
  );
}

function sanitizeMessages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((item) => (typeof item === "string" ? [clean(item, 280)] : []))
    .filter(Boolean)
    .slice(0, MAX_MESSAGES);
}

function tokenFromSymbol(item: CaaSymbol): Token {
  return { icon: item[0], label: clean(item[1]), text: clean(item[2], 140) };
}

export default function CaaPage() {
  const { speak, supported } = useSpeech();
  const { toast } = useToast();

  const [board, setBoard] = useState<Board>(() => clone(CAA_FULL_CATEGORIES));
  const [favs, setFavs] = useState<string[]>([]);
  const [hist, setHist] = useState<string[]>([]);
  const [messageHist, setMessageHist] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState<"saving" | "saved" | "error">("saving");
  const storageQueue = useRef<Promise<unknown>>(Promise.resolve());
  const storageRevision = useRef(0);

  const [cat, setCat] = useState<string>(() => Object.keys(CAA_FULL_CATEGORIES)[0]);
  const [mode, setMode] = useState<"cat" | "fav" | "hist">("cat");
  const [usageMode, setUsageMode] = useState<UsageMode>("crianca");
  const [density, setDensity] = useState<Density>("grande");
  const [search, setSearch] = useState("");
  const [phrase, setPhrase] = useState<Token[]>([]);
  const [lastRemoved, setLastRemoved] = useState<Token | null>(null);
  const [plannerMode, setPlannerMode] = useState(false);
  const [firstThen, setFirstThen] = useState<FirstThen>({ first: null, then: null });
  const [rate, setRate] = useState(0.84);
  const [custom, setCustom] = useState("");
  const [customIcon, setCustomIcon] = useState("🔹");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const protectedWorkspace = await secureGet<StoredWorkspace>(SECURE_CAA_KEY);
      let restoredBoard = clone(CAA_FULL_CATEGORIES);
      let restoredFavs: string[] = [];
      let restoredHist: string[] = [];
      let restoredMessages: string[] = [];

      if (protectedWorkspace !== null) {
        restoredBoard = mergeWithCurrentDefaults(protectedWorkspace.board);
        restoredFavs = sanitizeKeys(protectedWorkspace.favs, 700);
        restoredHist = sanitizeKeys(protectedWorkspace.hist, 50);
        restoredMessages = sanitizeMessages(protectedWorkspace.messages);
        for (const key of [LS_BOARD, LS_FAVS, LS_HIST]) {
          try {
            localStorage.removeItem(key);
          } catch {
            // legado indisponível: nada sai do dispositivo.
          }
        }
      } else {
        try {
          const rawBoard = localStorage.getItem(LS_BOARD);
          const rawFavs = localStorage.getItem(LS_FAVS);
          const rawHist = localStorage.getItem(LS_HIST);
          restoredBoard = mergeWithCurrentDefaults(rawBoard ? JSON.parse(rawBoard) : CAA_FULL_CATEGORIES);
          restoredFavs = sanitizeKeys(rawFavs ? JSON.parse(rawFavs) : [], 700);
          restoredHist = sanitizeKeys(rawHist ? JSON.parse(rawHist) : [], 50);

          const migrated = await secureSet(SECURE_CAA_KEY, {
            board: restoredBoard,
            favs: restoredFavs,
            hist: restoredHist,
            messages: [],
          });
          if (migrated) {
            if (localStorage.getItem(LS_BOARD) === rawBoard) localStorage.removeItem(LS_BOARD);
            if (localStorage.getItem(LS_FAVS) === rawFavs) localStorage.removeItem(LS_FAVS);
            if (localStorage.getItem(LS_HIST) === rawHist) localStorage.removeItem(LS_HIST);
          }
        } catch {
          // Prancha padrão permanece utilizável em memória.
        }
      }

      if (!active) return;
      setBoard(restoredBoard);
      setFavs(restoredFavs);
      setHist(restoredHist);
      setMessageHist(restoredMessages);
      setCat(Object.keys(restoredBoard)[0] || Object.keys(CAA_FULL_CATEGORIES)[0]);
      setStorageReady(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const snapshot = {
      board: sanitizeBoardOnly(board),
      favs: sanitizeKeys(favs, 700),
      hist: sanitizeKeys(hist, 50),
      messages: sanitizeMessages(messageHist),
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
  }, [board, favs, hist, messageHist, storageReady]);

  const activeUsage = usageModes[usageMode];

  const allItems = useMemo(
    () =>
      Object.entries(board).flatMap(([categoryName, category]) =>
        category.items.map((item) => ({ cat: categoryName, item })),
      ),
    [board],
  );

  const visibleItems = useMemo(() => {
    const query = clean(search).toLowerCase();
    if (query) {
      return allItems.filter(({ cat: itemCategory, item }) =>
        `${item[1]} ${item[2]} ${itemCategory}`.toLowerCase().includes(query),
      );
    }
    if (mode === "fav") return allItems.filter(({ item }) => favs.includes(symKey(item)));
    if (mode === "hist") {
      return hist
        .map((key) => allItems.find(({ item }) => symKey(item) === key))
        .filter((item): item is { cat: string; item: CaaSymbol } => Boolean(item));
    }
    return (board[cat]?.items || []).map((item) => ({ cat, item }));
  }, [allItems, board, cat, favs, hist, mode, search]);

  const coreItems = useMemo(() => board.Essencial?.items.slice(0, 10) || [], [board]);

  function rememberMessage(value: string) {
    const message = clean(value, 280);
    if (!message) return;
    setMessageHist((current) => [message, ...current.filter((item) => item !== message)].slice(0, MAX_MESSAGES));
  }

  function tap(item: CaaSymbol) {
    const token = tokenFromSymbol(item);
    setHist((current) => [symKey(item), ...current.filter((key) => key !== symKey(item))].slice(0, 50));

    if (plannerMode) {
      setFirstThen((current) => {
        if (!current.first) return { first: token, then: null };
        if (!current.then) return { ...current, then: token };
        return { first: token, then: null };
      });
    } else {
      setPhrase((current) => [...current, token].slice(-24));
    }

    speak(item[2], rate);
  }

  function toggleFav(item: CaaSymbol) {
    const key = symKey(item);
    const removing = favs.includes(key);
    setFavs((current) =>
      current.includes(key) ? current.filter((itemKey) => itemKey !== key) : [key, ...current],
    );
    toast({ title: removing ? "Favorito removido" : "Favorito salvo" });
  }

  function speakAll() {
    const message = phrase.map((token) => token.text).join(" ").trim();
    if (!message) return;
    rememberMessage(message);
    speak(message, rate);
  }

  function speakFirstThen() {
    if (!firstThen.first && !firstThen.then) return;
    const first = firstThen.first?.text ? `Primeiro ${firstThen.first.text}.` : "";
    const then = firstThen.then?.text ? ` Depois ${firstThen.then.text}.` : "";
    const message = `${first}${then}`.trim();
    rememberMessage(message);
    speak(message, rate);
  }

  function removePhraseToken(index: number) {
    setPhrase((current) => {
      const removed = current[index];
      if (removed) setLastRemoved(removed);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function removeLast() {
    setPhrase((current) => {
      const removed = current.at(-1) ?? null;
      if (removed) setLastRemoved(removed);
      return current.slice(0, -1);
    });
  }

  function undoRemove() {
    if (!lastRemoved) return;
    setPhrase((current) => [...current, lastRemoved].slice(-24));
    setLastRemoved(null);
  }

  function playQuick(emoji: string, phraseText: string) {
    const message = clean(phraseText, 280);
    const token = { icon: emoji, label: message, text: message };
    setPhrase([token]);
    rememberMessage(message);
    speak(message, rate);
  }

  function addCustom() {
    const label = clean(custom, 70);
    const icon = clean(customIcon, 20) || "🔹";
    if (!label || !board[cat]) return;
    if (board[cat].items.length >= MAX_CAA_ITEMS_PER_CATEGORY) {
      toast({
        title: "Categoria cheia",
        description: `O limite seguro é ${MAX_CAA_ITEMS_PER_CATEGORY} cartões por categoria.`,
        variant: "destructive",
      });
      return;
    }

    setBoard((current) => ({
      ...current,
      [cat]: {
        ...current[cat],
        items: [...current[cat].items, [icon, label, label] as CaaSymbol],
      },
    }));
    setCustom("");
    speak(label, rate);
    toast({ title: "Cartão personalizado adicionado" });
  }

  function exportBoard() {
    const blob = new Blob(
      [JSON.stringify({ board, favs, hist, messages: messageHist }, null, 2)],
      { type: "application/json" },
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "caa_neuroped_premium.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function importBoard(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      toast({
        title: "Arquivo muito grande",
        description: "Use uma prancha JSON de até 2 MB.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const parsed = JSON.parse(String(loadEvent.target?.result || "{}")) as StoredWorkspace;
        const nextBoard = mergeWithCurrentDefaults(parsed.board);
        setBoard(nextBoard);
        setFavs(sanitizeKeys(parsed.favs, 700));
        setHist(sanitizeKeys(parsed.hist, 50));
        setMessageHist(sanitizeMessages(parsed.messages));
        setCat(Object.keys(nextBoard)[0] || Object.keys(CAA_FULL_CATEGORIES)[0]);
        toast({
          title: "Prancha importada",
          description: "Novas categorias e cartões-base NeuroPed foram preservados.",
        });
      } catch {
        toast({ title: "Arquivo inválido", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  const title =
    mode === "fav" && !search
      ? "⭐ Favoritos"
      : mode === "hist" && !search
        ? "🕘 Usados recentemente"
        : search
          ? "🔍 Resultados"
          : `${board[cat]?.icon || ""} ${cat}`;

  const gridClass =
    density === "grande"
      ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      : "grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6";
  const cardMinHeight = density === "grande" ? "min-h-[144px] sm:min-h-[156px]" : "min-h-[112px]";
  const emojiSize = density === "grande" ? "text-5xl" : "text-3xl";

  if (!storageReady) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground" role="status">
        Carregando prancha protegida…
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-14">
      {storageStatus === "error" && (
        <div
          className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
          role="alert"
        >
          A prancha continua visível, mas não pôde ser salva neste dispositivo. Exporte o JSON antes de sair.
        </div>
      )}

      <section className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-slate-950 via-primary to-rose-950 p-5 text-white shadow-xl sm:p-7">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="relative grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="border-amber-300/40 bg-amber-300/15 text-amber-100">
                CAA NeuroPed Premium
              </Badge>
              <Badge className="border-white/20 bg-white/10 text-white">
                {allItems.length} cartões com voz
              </Badge>
              <Badge className="border-white/20 bg-white/10 text-white">
                {CAA_FULL_QUICK.length} mensagens rápidas
              </Badge>
            </div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-300/40 bg-white/10">
                <MessageCircle className="h-7 w-7 text-amber-200" aria-hidden="true" />
              </span>
              Vou Falar!
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80 sm:text-base">
              Comunicação por símbolos com palavras essenciais em posição estável, vocabulário por contexto,
              mensagens rápidas, busca, favoritos, histórico e suporte visual “Primeiro → Depois”.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => speak("Olá. Eu posso me comunicar com esta prancha.", rate)}
              >
                <Volume2 className="mr-1 h-4 w-4" aria-hidden="true" /> Testar voz
              </Button>
              <Button
                type="button"
                size="sm"
                variant={plannerMode ? "default" : "secondary"}
                onClick={() => setPlannerMode((current) => !current)}
              >
                <ArrowRight className="mr-1 h-4 w-4" aria-hidden="true" /> Primeiro → Depois
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 self-end">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
              <p className="text-2xl font-bold text-amber-200">{Object.keys(board).length}</p>
              <p className="text-xs text-white/70">categorias</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
              <p className="text-2xl font-bold text-amber-200">2×</p>
              <p className="text-xs text-white/70">vocabulário-base</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
              <p className="flex items-center gap-2 text-xs font-semibold text-white/90">
                <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                Voz e personalizações locais
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/60">
                Sem biblioteca proprietária de pictogramas; emojis nativos e armazenamento protegido no dispositivo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Palavras essenciais" className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Núcleo rápido</p>
            <h2 className="text-lg font-bold">Palavras essenciais sempre à mão</h2>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:inline">posição estável · acesso rápido</span>
        </div>
        <div className="grid grid-cols-5 gap-2 lg:grid-cols-10">
          {coreItems.map((item) => (
            <button
              key={symKey(item)}
              type="button"
              onClick={() => tap(item)}
              className="min-h-20 rounded-2xl border border-primary/20 bg-card p-2 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md active:translate-y-0"
            >
              <span className="block text-2xl" aria-hidden="true">{item[0]}</span>
              <strong className="mt-1 block text-[11px] leading-tight">{item[1]}</strong>
            </button>
          ))}
        </div>
      </section>

      {plannerMode && (
        <Card className="overflow-hidden rounded-3xl border-amber-400/35 shadow-md">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-amber-500/15 via-primary/5 to-teal-500/10 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-700 dark:text-amber-300">
                    Suporte visual
                  </p>
                  <h2 className="text-lg font-bold">Primeiro → Depois</h2>
                  <p className="text-xs text-muted-foreground">
                    Toque em um cartão para preencher a primeira etapa e depois em outro para a segunda.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={speakFirstThen} disabled={!firstThen.first && !firstThen.then}>
                    <Volume2 className="mr-1 h-4 w-4" aria-hidden="true" /> Falar sequência
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setFirstThen({ first: null, then: null })}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr]">
                <div className="rounded-2xl border border-amber-400/30 bg-background/90 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">1 · Primeiro</span>
                  <div className="mt-3 min-h-14 text-center">
                    {firstThen.first ? (
                      <><span className="text-4xl" aria-hidden="true">{firstThen.first.icon}</span><strong className="mt-1 block">{firstThen.first.label}</strong></>
                    ) : (
                      <span className="text-sm text-muted-foreground">Escolha um cartão</span>
                    )}
                  </div>
                </div>
                <div className="grid place-items-center px-1 text-primary" aria-hidden="true">
                  <ArrowRight className="h-6 w-6 rotate-90 sm:rotate-0" />
                </div>
                <div className="rounded-2xl border border-primary/25 bg-background/90 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">2 · Depois</span>
                  <div className="mt-3 min-h-14 text-center">
                    {firstThen.then ? (
                      <><span className="text-4xl" aria-hidden="true">{firstThen.then.icon}</span><strong className="mt-1 block">{firstThen.then.label}</strong></>
                    ) : (
                      <span className="text-sm text-muted-foreground">Escolha o próximo cartão</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-3xl border-primary/20 shadow-lg">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Barra de mensagem</p>
              <h2 className="text-lg font-bold">Minha frase</h2>
            </div>
            <span className="text-xs text-muted-foreground">{activeUsage.hint}</span>
          </div>

          <div className="mt-3 min-h-[86px] rounded-2xl border-2 border-dashed border-amber-400/55 bg-muted/30 p-3">
            {phrase.length === 0 ? (
              <div className="grid min-h-14 place-items-center text-center text-xs text-muted-foreground">
                Toque nos cartões para combinar palavras e construir uma mensagem.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {phrase.map((token, index) => (
                  <button
                    key={`${token.label}-${index}`}
                    type="button"
                    onClick={() => removePhraseToken(index)}
                    title="Toque para remover"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-bold text-primary"
                  >
                    <span aria-hidden="true">{token.icon}</span> {token.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={speakAll} disabled={!phrase.length}>
              <Volume2 className="mr-1 h-4 w-4" aria-hidden="true" /> Falar frase
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={removeLast} disabled={!phrase.length}>
              <Eraser className="mr-1 h-4 w-4" aria-hidden="true" /> Apagar último
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={undoRemove} disabled={!lastRemoved}>
              <Undo2 className="mr-1 h-4 w-4" aria-hidden="true" /> Desfazer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => speak(phrase.at(-1)?.text || "", rate)}
              disabled={!phrase.length}
            >
              <Repeat className="mr-1 h-4 w-4" aria-hidden="true" /> Repetir último
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => setPhrase([])}
              disabled={!phrase.length}
            >
              <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" /> Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Card className="h-fit rounded-3xl border-border/70 shadow-sm lg:sticky lg:top-4">
          <CardContent className="space-y-4 p-4">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Modo de uso</p>
              <p className="mt-1 text-sm font-semibold">{activeUsage.label} · {activeUsage.badge}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{activeUsage.description}</p>
              <div className="mt-3 grid grid-cols-3 gap-1.5" role="group" aria-label="Selecionar modo de uso da CAA">
                {(Object.keys(usageModes) as UsageMode[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={usageMode === key}
                    onClick={() => setUsageMode(key)}
                    className={`rounded-xl border px-2 py-2 text-[11px] font-bold transition-colors ${
                      usageMode === key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    {usageModes[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="caa-search" className="text-xs">Buscar palavra ou situação</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="caa-search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setMode("cat");
                  }}
                  placeholder="água, dor, escola, agora…"
                  className="pl-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "fav" ? "default" : "outline"}
                onClick={() => { setMode("fav"); setSearch(""); }}
              >
                <Star className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Favoritos
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "hist" ? "default" : "outline"}
                onClick={() => { setMode("hist"); setSearch(""); }}
              >
                <History className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Usados
              </Button>
            </div>

            <div className="max-h-[430px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-1.5">
                {Object.keys(board).map((name) => {
                  const category = board[name];
                  const active = name === cat && mode === "cat" && !search;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => { setCat(name); setMode("cat"); setSearch(""); }}
                      className={`rounded-xl border p-2 text-left transition-all ${
                        active
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-muted/30 hover:bg-muted"
                      }`}
                    >
                      <span className="text-lg" aria-hidden="true">{category.icon}</span>
                      <strong className="block text-[11px] leading-tight">{name}</strong>
                      <span className="mt-0.5 block text-[9px] text-muted-foreground">{category.items.length} cartões</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/25 p-3">
              <div className="mb-2 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-xs font-bold">Ajustes de acesso</span>
              </div>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="caa-rate" className="text-[11px]">Velocidade da voz</Label>
                  <select
                    id="caa-rate"
                    value={rate}
                    onChange={(event) => setRate(Number(event.target.value))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value={0.72}>Bem lenta</option>
                    <option value={0.84}>Lenta e clara</option>
                    <option value={1}>Natural</option>
                  </select>
                </div>
                <div>
                  <span className="text-[11px] font-medium">Tamanho da grade</span>
                  <div className="mt-1 grid grid-cols-2 gap-1.5">
                    {(["grande", "compacta"] as Density[]).map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={density === value}
                        onClick={() => setDensity(value)}
                        className={`rounded-lg border px-2 py-2 text-[11px] font-semibold ${
                          density === value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"
                        }`}
                      >
                        {value === "grande" ? "Grande" : "Compacta"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <Label htmlFor="caa-custom" className="text-xs">Cartão personalizado</Label>
              <div className="grid grid-cols-[64px_1fr] gap-2">
                <Input
                  aria-label="Emoji do cartão personalizado"
                  value={customIcon}
                  maxLength={8}
                  onChange={(event) => setCustomIcon(event.target.value)}
                  className="text-center text-lg"
                />
                <Input
                  id="caa-custom"
                  value={custom}
                  maxLength={70}
                  onChange={(event) => setCustom(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") addCustom(); }}
                  placeholder="Ex.: quero meu carrinho"
                />
              </div>
              <Button type="button" size="sm" className="w-full" onClick={addCustom}>
                <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Adicionar à categoria
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label="Ver status de salvamento da prancha"
                onClick={() =>
                  toast({
                    title:
                      storageStatus === "saved"
                        ? "Prancha protegida e salva"
                        : storageStatus === "saving"
                          ? "Salvamento em andamento"
                          : "Prancha não salva",
                    variant: storageStatus === "error" ? "destructive" : "default",
                  })
                }
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button type="button" size="sm" variant="outline" aria-label="Exportar prancha" onClick={exportBoard}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label="Importar prancha"
                onClick={() => importRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <input
                ref={importRef}
                type="file"
                accept=".json,application/json"
                aria-label="Importar prancha de um arquivo JSON"
                className="hidden"
                onChange={importBoard}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Prancha ativa</p>
              <h2 className="text-xl font-bold">{title}</h2>
            </div>
            <span className="text-xs text-muted-foreground">{visibleItems.length} cartões · toque para ouvir</span>
          </div>

          {visibleItems.length === 0 ? (
            <Card className="rounded-3xl">
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                Nenhum cartão encontrado neste filtro.
              </CardContent>
            </Card>
          ) : (
            <div className={gridClass}>
              {visibleItems.map(({ item }, index) => {
                const isFav = favs.includes(symKey(item));
                return (
                  <div
                    key={`${symKey(item)}-${index}`}
                    className={`group relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg ${cardMinHeight}`}
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-primary to-teal-500 opacity-60" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => tap(item)}
                      className={`flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center active:scale-[0.98] ${cardMinHeight}`}
                    >
                      <span className={`${emojiSize} leading-none transition-transform group-hover:scale-105`} aria-hidden="true">{item[0]}</span>
                      <strong className="text-sm leading-tight text-foreground">{item[1]}</strong>
                      <small className="text-[10px] text-muted-foreground">toque para ouvir</small>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFav(item)}
                      aria-label={`${isFav ? "Remover" : "Adicionar"} ${item[1]} ${isFav ? "dos" : "aos"} favoritos`}
                      aria-pressed={isFav}
                      className={`absolute right-2 top-2 grid min-h-8 min-w-8 place-items-center rounded-full border bg-background/90 text-sm shadow-sm ${
                        isFav ? "border-amber-400 text-amber-600" : "border-border text-muted-foreground"
                      }`}
                    >
                      <span aria-hidden="true">{isFav ? "★" : "☆"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <section className="space-y-3 pt-2" aria-labelledby="caa-quick-title">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <div>
                <h2 id="caa-quick-title" className="text-lg font-bold">Mensagens rápidas</h2>
                <p className="text-xs text-muted-foreground">40 frases previsíveis para situações frequentes.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {CAA_FULL_QUICK.map(([emoji, phraseText], index) => (
                <button
                  key={`${phraseText}-${index}`}
                  type="button"
                  onClick={() => playQuick(emoji, phraseText)}
                  className="rounded-2xl border border-primary/15 bg-gradient-to-br from-card to-muted/35 px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <strong className="block text-sm text-foreground">{emoji} {phraseText}</strong>
                  <span className="mt-1 block text-[10px] uppercase tracking-wider text-muted-foreground">falar agora</span>
                </button>
              ))}
            </div>
          </section>

          {messageHist.length > 0 && (
            <section className="space-y-3 pt-2" aria-labelledby="caa-message-history">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 id="caa-message-history" className="text-lg font-bold">Mensagens recentes</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {messageHist.map((message) => (
                  <button
                    key={message}
                    type="button"
                    onClick={() => speak(message, rate)}
                    className="rounded-full border border-border bg-muted/40 px-3 py-2 text-xs font-semibold hover:border-primary/40 hover:bg-primary/5"
                  >
                    <Volume2 className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> {message}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-muted/25 p-4 text-[11px] leading-relaxed text-muted-foreground">
        <strong className="text-foreground">CAA NeuroPed</strong> · {CAA_SYMBOL_COUNT} cartões de vocabulário-base,
        40 mensagens rápidas e vocalização local por síntese de voz do dispositivo. Recurso de apoio à comunicação;
        não substitui avaliação fonoaudiológica, seleção individualizada do sistema de CAA nem treinamento dos parceiros
        de comunicação. Não utiliza banco proprietário de pictogramas de terceiros. · Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
        {!supported && " · Síntese de voz não disponível neste navegador."}
      </div>
    </div>
  );
}
