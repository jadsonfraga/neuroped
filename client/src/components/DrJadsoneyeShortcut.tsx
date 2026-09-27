import { ArrowUpRight, Eye } from "lucide-react";

/** Public application URL only: never append patient, tenant or session data. */
export const DRJADSONEYE_URL = "https://drjadsoneye.lovable.app";

interface DrJadsoneyeShortcutProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

/** Native navigation keeps the current consultation mounted in NeuroPed. */
export function DrJadsoneyeShortcut({
  collapsed,
  onNavigate,
}: DrJadsoneyeShortcutProps) {
  return (
    <div className="px-2 pt-3 print:hidden">
      <a
        href={DRJADSONEYE_URL}
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        onClick={onNavigate}
        data-testid="nav-DrJadsoneye"
        data-tone="connection"
        aria-label="DrJadsoneye (abre em nova aba)"
        title="DrJadsoneye — aplicativo externo de pesquisa (abre em nova aba)"
        className={`np-nav-item relative flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${collapsed ? "lg:justify-center" : ""}`}
      >
        <Eye
          className="np-nav-item__icon h-4 w-4 shrink-0"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <span className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
          <span className="np-nav-item__label block truncate text-xs">
            DrJadsoneye
          </span>
          <span className="block text-[10px] text-muted-foreground">
            Aplicativo externo · pesquisa
          </span>
        </span>
        <ArrowUpRight
          className={`np-nav-item__link-mark ml-auto h-3.5 w-3.5 shrink-0 ${collapsed ? "lg:hidden" : ""}`}
          aria-hidden="true"
        />
      </a>
    </div>
  );
}
