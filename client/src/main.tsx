import { createRoot } from "react-dom/client";
import App from "./App";
import { PasswordGate } from "@/components/PasswordGate";
import "./index.css";

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

function GateCompat({ children }: { children: React.ReactNode }) {
  try {
    if (sessionStorage.getItem("neuroped:pin-ok") === "1") {
      sessionStorage.setItem("neuroped:local-unlocked", "1");
    }
  } catch {
    // storage indisponível: o PasswordGate segue controlando o acesso principal
  }
  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <PasswordGate>
    <GateCompat>
      <App />
    </GateCompat>
  </PasswordGate>,
);
