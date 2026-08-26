import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import { useRecents } from "@/hooks/useFavorites";
import { navigablePages } from "@/data/navigation";
import {
  CalendarDays,
  Clock,
  Filter,
  Loader2,
  Search,
  UsersRound,
} from "lucide-react";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/lib/commandPaletteBus";
import { currentHashPath, isPublicRoute } from "@/lib/publicRoutes";
import { IS_PUBLIC_ZONE } from "@/lib/zone";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { canRenderNavigationItem } from "@/security/routeGuardPolicy";
import { hasConfiguredMasterPin, isMasterPinUnlocked } from "@/lib/masterPin";

/**
 * CommandPalette — busca global orientada a tarefa.
 *
 * Abre com Ctrl/Cmd+K ou pelo evento "neuroped:open-command". Busca páginas,
 * escalas e, apenas dentro de uma rota privada, pacientes reais. Pacientes são
 * consultados depois de ao menos 2 caracteres e seus nomes nunca entram no
 * histórico local de "recentes" da paleta.
 */

interface NavScale {
  id: string;
  name: string;
  fullName: string;
  appRoute?: string;
}

interface NavPatient {
  id: string;
  name: string;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary/20 px-0.5 text-foreground">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function navigate(href: string) {
  window.location.hash = href;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [path, setPath] = useState(() => currentHashPath());
  const [navigableScales, setNavigableScales] = useState<NavScale[]>([]);
  const { recents, pushRecent } = useRecents();
  const { accessMode, isAuthenticated, isLoading, user } = useAuth();
  const { activeClinicId } = useClinic();
  const isRemoteClinical = accessMode === "remote" && isAuthenticated;
  const normalizedSearch = normalize(search);
  const onPublicRoute = isPublicRoute(path);
  const privateToolsAllowed = !IS_PUBLIC_ZONE && !onPublicRoute;
  const canRenderClinicalItem = useCallback(
    (href: string) =>
      canRenderNavigationItem({
        path: href,
        accessMode,
        isAuthenticated,
        isLoading,
        userRole: user?.role,
        localPinConfigured: accessMode === "local" && hasConfiguredMasterPin(),
        localPinUnlocked: accessMode === "local" && isMasterPinUnlocked(),
      }),
    [accessMode, isAuthenticated, isLoading, user?.role],
  );
  const canOpenPatients = canRenderClinicalItem("/pacientes");
  const canOpenAgenda = canRenderClinicalItem("/agenda");
  const canOpenFilter = canRenderClinicalItem("/filtro");
  const patientSearchReady =
    privateToolsAllowed &&
    canOpenPatients &&
    open &&
    normalizedSearch.length >= 2 &&
    (!isRemoteClinical || Boolean(activeClinicId));
  const patientQueryKey = isRemoteClinical
    ? `/api/live/patients?clinicId=${encodeURIComponent(activeClinicId ?? "")}`
    : `/api/patients?q=${encodeURIComponent(normalizedSearch)}&page=1&limit=20`;

  const patientQuery = useQuery<any>({
    queryKey: [patientQueryKey],
    enabled: patientSearchReady,
    staleTime: 30_000,
  });

  useEffect(() => {
    const syncPath = () => setPath(currentHashPath());
    window.addEventListener("hashchange", syncPath);
    return () => window.removeEventListener("hashchange", syncPath);
  }, []);

  useEffect(() => {
    if (!privateToolsAllowed || !open || navigableScales.length > 0) return;
    let cancelled = false;
    import("@/data/scaleFilter").then((mod) => {
      if (cancelled) return;
      const seen = new Set<string>();
      const list: NavScale[] = [];
      for (const s of mod.allScales) {
        if (seen.has(s.id)) continue;
        seen.add(s.id);
        list.push({
          id: s.id,
          name: s.name,
          fullName: s.fullName,
          appRoute:
            s.appRoute && s.appRoute.length > 0
              ? s.appRoute
              : `/generic-scale/${s.id}`,
        });
      }
      setNavigableScales(list);
    });
    return () => {
      cancelled = true;
    };
  }, [open, navigableScales.length, privateToolsAllowed]);

  const recentScales = useMemo(
    () =>
      recents
        .map((id) => navigableScales.find((s) => s.id === id))
        .filter(Boolean) as NavScale[],
    [recents, navigableScales],
  );

  const visiblePages = useMemo(
    () =>
      IS_PUBLIC_ZONE || onPublicRoute
        ? navigablePages.filter((page) => isPublicRoute(page.href))
        : navigablePages.filter((page) => canRenderClinicalItem(page.href)),
    [canRenderClinicalItem, onPublicRoute],
  );

  const patients = useMemo<NavPatient[]>(() => {
    const raw = patientQuery.data;
    const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
    if (!Array.isArray(list)) return [];
    return list
      .map((patient: any) => ({
        id: patient?.id,
        name: isRemoteClinical ? patient?.profile?.name : patient?.name,
      }))
      .filter(
        (patient: any) =>
          patient?.id != null && typeof patient?.name === "string",
      )
      .map((patient: any) => ({ id: String(patient.id), name: patient.name }));
  }, [isRemoteClinical, patientQuery.data]);

  const patientMatches = useMemo(() => {
    if (normalizedSearch.length < 2) return [];
    return [...patients]
      .filter((patient) => normalize(patient.name).includes(normalizedSearch))
      .sort((a, b) => {
        const aStarts = normalize(a.name).startsWith(normalizedSearch) ? 1 : 0;
        const bStarts = normalize(b.name).startsWith(normalizedSearch) ? 1 : 0;
        return bStarts - aStarts || a.name.localeCompare(b.name, "pt-BR");
      })
      .slice(0, 8);
  }, [normalizedSearch, patients]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpen);
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

  const goPatient = useCallback((id: string) => {
    navigate(`/paciente/${encodeURIComponent(id)}`);
    setOpen(false);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={
          privateToolsAllowed
            ? "Buscar paciente, escala ou página…"
            : "Buscar conteúdo público…"
        }
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        {privateToolsAllowed && (canOpenPatients || canOpenAgenda || canOpenFilter) && (
          <CommandGroup heading="Ações rápidas">
            {canOpenPatients && <CommandItem
              value="meus pacientes prontuario paciente"
              onSelect={() => goPage("/pacientes")}
            >
              <UsersRound
                className="mr-2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              Meus pacientes
            </CommandItem>}
            {canOpenAgenda && <CommandItem
              value="agenda gestao consultas"
              onSelect={() => goPage("/agenda")}
            >
              <CalendarDays
                className="mr-2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              Agenda & Gestão
            </CommandItem>}
            {canOpenFilter && <CommandItem
              value="filtro clinico escala ideal"
              onSelect={() => goPage("/filtro")}
            >
              <Filter
                className="mr-2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              Filtro Clínico Inteligente
              <CommandShortcut>Clínica</CommandShortcut>
            </CommandItem>}
          </CommandGroup>
        )}

        {patientSearchReady &&
          patientQuery.isFetching &&
          patientMatches.length === 0 && (
            <CommandGroup heading="Pacientes">
              <CommandItem disabled value="consultando pacientes">
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin text-muted-foreground motion-reduce:animate-none"
                  aria-hidden="true"
                />
                Consultando pacientes…
              </CommandItem>
            </CommandGroup>
          )}

        {privateToolsAllowed && patientMatches.length > 0 && (
          <CommandGroup heading="Pacientes">
            {patientMatches.map((patient) => (
              <CommandItem
                key={`patient-${patient.id}`}
                value={`paciente ${patient.name} ${normalize(patient.name)}`}
                onSelect={() => goPatient(patient.id)}
              >
                <UsersRound
                  className="mr-2 h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    <Highlight text={patient.name} query={search} />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Abrir prontuário longitudinal
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {privateToolsAllowed && recentScales.length > 0 && (
          <CommandGroup heading="Escalas recentes">
            {recentScales.map((scale) => (
              <CommandItem
                key={`recent-${scale.id}`}
                value={`recente ${scale.name} ${scale.fullName}`}
                onSelect={() => goScale(scale.id, scale.appRoute!)}
              >
                <Clock
                  className="mr-2 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Highlight text={scale.name} query={search} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {privateToolsAllowed && (
          <CommandGroup heading="Escalas">
            {navigableScales.map((scale) => (
              <CommandItem
                key={`scale-${scale.id}`}
                value={`${scale.name} ${scale.fullName}`}
                onSelect={() => goScale(scale.id, scale.appRoute!)}
              >
                <Search
                  className="mr-2 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="flex flex-col">
                  <span className="text-sm">
                    <Highlight text={scale.name} query={search} />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <Highlight text={scale.fullName} query={search} />
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Páginas">
          {visiblePages.map((page) => (
            <CommandItem
              key={`page-${page.href}`}
              value={`pagina ${page.label}`}
              onSelect={() => goPage(page.href)}
            >
              <page.icon
                className="mr-2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Highlight text={page.label} query={search} />
              {page.href === "/filtro" && (
                <CommandShortcut>Filtro</CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
