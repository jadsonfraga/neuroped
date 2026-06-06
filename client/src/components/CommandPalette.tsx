import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandShortcut,
} from "@/components/ui/command";
import { useRecents } from "@/hooks/useFavorites";
import {
  Filter, ClipboardPlus, Users, MessageCircle, FileSignature,
  Home, Newspaper, HelpCircle, Stethoscope, Clock, Search,
} from "lucide-react";

/**
 * CommandPalette — Bloco D2.
 *
 * Abre com Ctrl/Cmd+K ou pelo evento "neuroped:open-command" (botão no
 * Layout). Busca escalas (nome/sigla), páginas e recentes. Navegação por
 * teclado é nativa do cmdk (setas, Enter, Esc). Realça o termo buscado.
 */

const OPEN_EVENT = "neuroped:open-command";

/** Dispara a abertura da paleta de qualquer lugar (ex.: botão do header). */
export function openCommandPalette() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

/** Forma mínima usada pela paleta (evita import estático do catálogo pesado). */
interface NavScale {
  id: string;
  name: string;
  fullName: string;
  appRoute?: string;
}

interface PageItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PAGES: PageItem[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/filtro", label: "Filtro Inteligente", icon: Filter },
  { href: "/prontuario", label: "Prontuário Clínico", icon: ClipboardPlus },
  { href: "/pacientes", label: "Meus Pacientes", icon: Users },
  { href: "/caa", label: "CAA · Vou Falar", icon: MessageCircle },
  { href: "/assinatura-digital", label: "Assinatura Digital", icon: FileSignature },
  { href: "/bateria-jadson", label: "Bateria Dr. Jadson", icon: Stethoscope },
  { href: "/portal-familia", label: "Portal da Família", icon: Users },
  { href: "/portal-familia/novidades", label: "Novidades & Artigos", icon: Newspaper },
  { href: "/ajuda", label: "Ajuda / FAQ", icon: HelpCircle },
];

/** Realça (negrito) as ocorrências do termo no texto. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-foreground rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function navigate(href: string) {
  // Roteamento por hash (wouter useHashLocation).
  window.location.hash = href;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [navigableScales, setNavigableScales] = useState<NavScale[]>([]);
  const { recents, pushRecent } = useRecents();

  // Carrega o catálogo (pesado) sob demanda na primeira abertura, mantendo-o
  // fora do bundle inicial (A3).
  useEffect(() => {
    if (!open || navigableScales.length > 0) return;
    let cancelled = false;
    import("@/data/scaleFilter").then((mod) => {
      if (cancelled) return;
      setNavigableScales(
        mod.allScales
          .filter((s) => typeof s.appRoute === "string" && s.appRoute.length > 0)
          .map((s) => ({ id: s.id, name: s.name, fullName: s.fullName, appRoute: s.appRoute })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [open, navigableScales.length]);

  const recentScales = useMemo(
    () => recents.map((id) => navigableScales.find((s) => s.id === id)).filter(Boolean) as NavScale[],
    [recents, navigableScales],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const goScale = useCallback(
    (id: string, href: string) => {
      pushRecent(id);
      navigate(href);
      setOpen(false);
    },
    [pushRecent],
  );

  const goPage = useCallback((href: string) => {
    navigate(href);
    setOpen(false);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar escalas, páginas, pacientes…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        {recentScales.length > 0 && (
          <CommandGroup heading="Recentes">
            {recentScales.map((s) => (
              <CommandItem
                key={`recent-${s.id}`}
                value={`recente ${s.name} ${s.fullName}`}
                onSelect={() => goScale(s.id, s.appRoute!)}
              >
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Highlight text={s.name} query={search} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Escalas">
          {navigableScales.map((s) => (
            <CommandItem
              key={`scale-${s.id}`}
              value={`${s.name} ${s.fullName}`}
              onSelect={() => goScale(s.id, s.appRoute!)}
            >
              <Search className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="flex flex-col">
                <span className="text-sm"><Highlight text={s.name} query={search} /></span>
                <span className="text-xs text-muted-foreground"><Highlight text={s.fullName} query={search} /></span>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Páginas">
          {PAGES.map((p) => (
            <CommandItem key={`page-${p.href}`} value={`pagina ${p.label}`} onSelect={() => goPage(p.href)}>
              <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <Highlight text={p.label} query={search} />
              {p.href === "/filtro" && <CommandShortcut>Filtro</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
