from pathlib import Path
import re

path = Path("tests/unit/flow-os-navigation-static.test.mjs")
text = path.read_text(encoding="utf-8")
pattern = r'for \(const surface of \["InstallPrompt", "PreferencesPanel", "FloatingHelp"\]\) \{[\s\S]*?\n\}'
replacement = r'''for (const surface of ["InstallPrompt", "PreferencesPanel"]) {
  assert.match(
    app,
    new RegExp(`auxiliarySurfacesVisible && \\([\\s\\S]*?<${surface} \\/>`),
    `${surface} não pode competir com o aviso legal nem com o onboarding`,
  );
}
assert.match(
  app,
  /auxiliarySurfacesVisible && \([\s\S]*?<FloatingHelp[\s\S]{0,180}onStartTour=/,
  "FloatingHelp deve permanecer protegido pelos gates e expor o callback do tour",
);'''
updated, count = re.subn(pattern, lambda _match: replacement, text, count=1)
if count != 1:
    raise SystemExit(f"expected one FloatingHelp ownership loop, found {count}")
path.write_text(updated, encoding="utf-8")
