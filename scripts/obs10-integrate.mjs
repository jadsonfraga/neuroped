// Temporary, feature-branch-only integration refinement for issue #893.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
if (branch !== "feat/obs10-preconsulta-faixa-etaria") throw new Error("OBS-10 helper cannot run on another branch");
if (!readFileSync("client/src/App.tsx", "utf8").includes('path="/avaliacao-pre-consulta-faixa-etaria"')) throw new Error("Initial integration is missing");
const path = "client/src/pages/pre-consulta-obs10.tsx";
let source = readFileSync(path, "utf8");
if (!source.includes("const stopRecording = media.stop;")) {
  source = source.replace("  const media = useLocalRecorder();", "  const media = useLocalRecorder();\n  const stopRecording = media.stop;");
  source = source.replace("    media.stop();\n    setEndReason(reason);", "    stopRecording();\n    setEndReason(reason);");
  source = source.replace("  }, [media.stop, nowSecond]);", "  }, [stopRecording, nowSecond]);
}
source = source.replace("emptyObservation(String(++sequence.current), step, nowSecond())", "emptyObservation(String(++sequence.current), step, running ? nowSecond() : elapsed)");
// Guard normal in-app link navigation as well as document unload. Back/OS shutdown
// remain browser-controlled; permanent in-memory/export warning stays visible.
if (!source.includes("const guardNavigation =")) {
  source = source.replace('    window.addEventListener("beforeunload", warn);\n    return () => window.removeEventListener("beforeunload", warn);', `    const guardNavigation = (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, location.href);
      if (destination.origin !== location.origin || destination.href === location.href) return;
      if (!window.confirm("Sair desta tela elimina os registros e o vídeo que ainda não foram exportados. Deseja sair?")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guardNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guardNavigation, true);
    };`);
}
writeFileSync(path, source);
console.log("OBS-10 refinements applied without disabling any checks.");
