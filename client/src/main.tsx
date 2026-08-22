import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";

// O App inclui o shell clínico e suas rotas; iniciá-lo após o bootstrap do host
// mantém o primeiro pacote concentrado na proteção de domínio e no feedback visual.
const App = lazy(() => import("./App"));

const UnauthorizedCopyScreen = lazy(() =>
  import("./components/UnauthorizedCopyScreen").then(({ UnauthorizedCopyScreen: Component }) => ({
    default: Component,
  })),
);
import { installChunkRecovery } from "./lib/chunkRecovery";
import { purgeLegacyCertificateCache } from "./lib/certificateSession";
import { isAuthorizedHost, printProprietaryNotice } from "./lib/domainGuard";
import "./index.css";
import "./styles/proportion-guards.css";
import "./styles/visual-reset.css";
import "./styles/premium-polish-10.css";
import "./styles/flow-os.css";
import "./styles/premium-app-shell-v12.css";
// Último por design: vence o shell compacto (≤1023 px) e o perfil touch até 1366 px.
import "./styles/tablet-coarse-perf.css";

installChunkRecovery();
void purgeLegacyCertificateCache();
// Falha fechado no startup: versões antigas persistiam narrativa clínica do
// filtro. A única preferência não sensível passa a usar uma chave separada.
try {
  window.localStorage.removeItem("np_filtro_state_v1");
} catch {
  /* storage indisponível */
}

try {
  const savedTheme = window.localStorage.getItem("neuroped:theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark =
    savedTheme === "dark" || (savedTheme !== "light" && prefersDark);
  document.documentElement.classList.toggle("dark", useDark);
} catch {
  document.documentElement.classList.toggle(
    "dark",
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
}

if (!window.location.hash) {
  window.location.hash = "#/";
}

printProprietaryNotice();

const hostname = window.location.hostname;
const root = createRoot(document.getElementById("root")!);
const isDevelopmentBuild =
  (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true;

if (isAuthorizedHost(hostname, { allowPrivateNetwork: isDevelopmentBuild })) {
    root.render(
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-background p-6 text-sm font-semibold text-muted-foreground" role="status">
            Preparando o NeuroPed…
          </div>
        }
      >
        <App />
      </Suspense>,
    );
} else {
  // Trava de domínio: cópia re-hospedada em endereço não autorizado.
    root.render(
      <Suspense fallback={null}>
        <UnauthorizedCopyScreen host={hostname} />
      </Suspense>,
    );
}
