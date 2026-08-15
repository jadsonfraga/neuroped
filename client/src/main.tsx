import { createRoot } from "react-dom/client";
import App from "./App";
import { MobilePrimaryDock } from "./components/MobilePrimaryDock";
import { UnauthorizedCopyScreen } from "./components/UnauthorizedCopyScreen";
import { installChunkRecovery } from "./lib/chunkRecovery";
import { purgeLegacyCertificateCache } from "./lib/certificateSession";
import { isAuthorizedHost, printProprietaryNotice } from "./lib/domainGuard";
import "./index.css";
import "./styles/proportion-guards.css";
import "./styles/visual-reset.css";
import "./styles/premium-polish-10.css";
import "./styles/flow-os.css";
import "./styles/premium-app-shell-v12.css";
// Último por design: vence a cascata do shell compacto e do perfil touch até 1366 px.
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

if (isAuthorizedHost(hostname)) {
  root.render(
    <>
      <App />
      <MobilePrimaryDock />
    </>,
  );
} else {
  // Trava de domínio: cópia re-hospedada em endereço não autorizado.
  root.render(<UnauthorizedCopyScreen host={hostname} />);
}
