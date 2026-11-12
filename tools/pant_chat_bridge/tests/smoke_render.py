"""QA de integração real com o motor local: somente fixture fictício."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import bridge
fixture = Path(sys.argv[1])
if "FICTICIO" not in fixture.name.upper():
    raise SystemExit("Somente fixture ficticio permitido")
text = fixture.read_text(encoding="utf-8")
data, meta = bridge.render(text, fixture.name, "preview")
print("PDF_BYTES=" + str(len(data)))
print("PDF_SHA256=" + meta["pdf_sha256"])
print("PDF_NOME=" + meta["name"])
