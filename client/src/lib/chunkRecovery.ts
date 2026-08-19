const RELOAD_MARKER = "neuroped:chunk-recovery-at";
const RELOAD_COOLDOWN_MS = 60_000;
const HEALTHY_BOOT_MS = 30_000;

let installed = false;

function errorMessage(reason: unknown): string {
  if (reason instanceof Error) return `${reason.name}: ${reason.message}`;
  if (typeof reason === "string") return reason;
  if (reason && typeof reason === "object" && "message" in reason) {
    return String((reason as { message?: unknown }).message ?? "");
  }
  return "";
}

/** Reconhece os erros emitidos pelos navegadores quando um chunk antigo sumiu. */
export function isRecoverableChunkError(reason: unknown): boolean {
  return /(?:ChunkLoadError|Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module)/i.test(
    errorMessage(reason),
  );
}

/** Offline não é um deploy quebrado; recarregar só perderia estado local. */
export function shouldAutoRecoverChunkError(
  reason: unknown,
  online: boolean,
): boolean {
  return online && isRecoverableChunkError(reason);
}

function reloadOnce(): boolean {
  try {
    const previous = Number(window.sessionStorage.getItem(RELOAD_MARKER));
    if (
      Number.isFinite(previous) &&
      Date.now() - previous < RELOAD_COOLDOWN_MS
    ) {
      return false;
    }
    window.sessionStorage.setItem(RELOAD_MARKER, String(Date.now()));
    window.location.reload();
    return true;
  } catch {
    // Sem sessionStorage não há como impedir um ciclo de reload; deixa o
    // AppErrorBoundary oferecer uma recuperação manual segura.
    return false;
  }
}

/**
 * Tenta recuperar uma falha de chunk exatamente uma vez por janela de cooldown.
 *
 * O terceiro parâmetro cria uma pequena costura de teste; em produção ele usa
 * reloadOnce. Esta função também é chamada pelo AppErrorBoundary porque rejeições
 * de React.lazy podem ser tratadas pelo React antes de chegarem ao listener
 * global de unhandledrejection.
 */
export function attemptChunkRecovery(
  reason: unknown,
  online: boolean,
  reload: () => boolean = reloadOnce,
): boolean {
  return shouldAutoRecoverChunkError(reason, online) && reload();
}

/**
 * Recupera automaticamente uma única vez quando um deploy troca os arquivos
 * lazy-loaded enquanto o app está aberto. O cooldown impede reload infinito.
 */
export function installChunkRecovery(): void {
  if (installed) return;
  installed = true;

  window.addEventListener("vite:preloadError", (event) => {
    if (navigator.onLine !== false && reloadOnce()) event.preventDefault();
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (
      attemptChunkRecovery(event.reason, navigator.onLine !== false)
    ) {
      event.preventDefault();
    }
  });

  window.setTimeout(() => {
    try {
      window.sessionStorage.removeItem(RELOAD_MARKER);
    } catch {
      // Armazenamento bloqueado não afeta a inicialização normal.
    }
  }, HEALTHY_BOOT_MS);
}
