import { createRoot } from "react-dom/client";
import App from "./App";
import { PrivateGate } from "./components/PrivateGate";
import "./index.css";
import "./styles/proportion-guards.css";

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

createRoot(document.getElementById("root")!).render(
  <PrivateGate>
    <App />
  </PrivateGate>,
);
