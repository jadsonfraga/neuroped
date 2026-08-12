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

installChunkRecovery();
void purgeLegacyCertificateCache();

try {
  const savedTheme = window.localStorage.getItem("neuroped:theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark = savedTheme === "dark" || (savedTheme !== "light" && prefersDark);
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
