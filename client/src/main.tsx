import { createRoot } from "react-dom/client";
import App from "./App";
import { UnauthorizedCopyScreen } from "./components/UnauthorizedCopyScreen";
import { installChunkRecovery } from "./lib/chunkRecovery";
import { purgeLegacyCertificateCache } from "./lib/certificateSession";
import { isAuthorizedHost, printProprietaryNotice } from "./lib/domainGuard";
import "./index.css";
import "./styles/proportion-guards.css";

installChunkRecovery();
void purgeLegacyCertificateCache();

try {
  const savedTheme = window.localStorage.getItem("neuroped:theme");
  if (savedTheme !== "light") {
    document.documentElement.classList.add("dark");
  }
} catch {
  document.documentElement.classList.add("dark");
}

if (!window.location.hash) {
  window.location.hash = "#/";
}

printProprietaryNotice();

const hostname = window.location.hostname;
const root = createRoot(document.getElementById("root")!);

if (isAuthorizedHost(hostname)) {
  root.render(<App />);
} else {
  // Trava de domínio: cópia re-hospedada em endereço não autorizado.
  root.render(<UnauthorizedCopyScreen host={hostname} />);
}
