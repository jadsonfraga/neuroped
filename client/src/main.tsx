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

createRoot(document.getElementById("root")!).render(
  <PasswordGate>
    <App />
  </PasswordGate>,
);
