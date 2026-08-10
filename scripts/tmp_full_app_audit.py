from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODE_ROOTS = [ROOT / "client" / "src", ROOT / "functions", ROOT / "server", ROOT / "shared", ROOT / "scripts"]
EXTS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts", ".css", ".html", ".sql"}
EXCLUDE_PARTS = {"node_modules", "dist", ".git", "coverage", "generated", "daily-authorial"}

PATTERNS = {
    "unfinished": re.compile(r"\b(TODO|FIXME|XXX|HACK|WIP)\b|n[aã]o implementad|not implemented|coming soon|em breve|placeholder|\bstub\b", re.I),
    "fake_demo": re.compile(r"\b(mock|fake|fixture|simulad[oa]|demo)\b", re.I),
    "empty_handler": re.compile(r"on(?:Click|Submit|Change|Press)\s*=\s*\{\s*\(.*?\)\s*=>\s*\{\s*\}\s*\}", re.S),
    "dead_href": re.compile(r"(?:href|to)\s*=\s*[\"'](?:#|javascript:)[^\"']*[\"']", re.I),
    "not_implemented_status": re.compile(r"\b501\b|NOT_IMPLEMENTED|NOT IMPLEMENTED", re.I),
    "console_debug": re.compile(r"\bconsole\.(?:log|debug)\s*\("),
    "local_storage": re.compile(r"\b(?:localStorage|sessionStorage)\b"),
}

SENSITIVE_PATH_HINTS = (
    "pacient", "prontuario", "document", "laudo", "receita", "agenda", "recepcao",
    "clinical", "medic", "diario", "portal", "conecta", "therapy", "terapia", "consent",
)


def iter_code_files():
    for base in CODE_ROOTS:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in EXTS:
                continue
            rel = path.relative_to(ROOT)
            if any(part in EXCLUDE_PARTS for part in rel.parts):
                continue
            yield path


def line_excerpt(text: str, pos: int) -> tuple[int, str]:
    line_no = text.count("\n", 0, pos) + 1
    start = text.rfind("\n", 0, pos) + 1
    end = text.find("\n", pos)
    if end == -1:
        end = len(text)
    line = re.sub(r"\s+", " ", text[start:end]).strip()
    return line_no, line[:220]


def scan_patterns(files):
    findings = defaultdict(list)
    for path in files:
        rel = str(path.relative_to(ROOT))
        try:
            text = path.read_text("utf-8", errors="replace")
        except Exception:
            continue
        for name, pattern in PATTERNS.items():
            for match in pattern.finditer(text):
                line_no, excerpt = line_excerpt(text, match.start())
                findings[name].append((rel, line_no, excerpt))
        if PATTERNS["local_storage"].search(text) and any(h in rel.lower() for h in SENSITIVE_PATH_HINTS):
            for match in PATTERNS["local_storage"].finditer(text):
                line_no, excerpt = line_excerpt(text, match.start())
                findings["sensitive_local_storage"].append((rel, line_no, excerpt))
    return findings


def parse_routes():
    app = ROOT / "client" / "src" / "App.tsx"
    text = app.read_text("utf-8", errors="replace")
    routes = re.findall(r"<Route\s+path=[\"']([^\"']+)[\"']", text)
    lazy_imports = re.findall(r'import\([\"\']@/pages/([^\"\']+)[\"\']\)', text)
    return text, routes, lazy_imports


def route_refs(files):
    refs = defaultdict(set)
    literal_re = re.compile(r"(?:href|to)\s*=\s*[\"'](/[^\"'#?]*)|(?:setLocation|navigate)\(\s*[\"'](/[^\"'#?]*)")
    for path in files:
        if not str(path).endswith((".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts")):
            continue
        rel = str(path.relative_to(ROOT))
        text = path.read_text("utf-8", errors="replace")
        for m in literal_re.finditer(text):
            route = next((g for g in m.groups() if g), None)
            if route:
                refs[route].add(rel)
    return refs


def normalize_route(route: str) -> str:
    route = route.rstrip("/") or "/"
    return route


def route_matches(ref: str, route: str) -> bool:
    ref = normalize_route(ref)
    route = normalize_route(route)
    if ref == route:
        return True
    if ":" not in route:
        return False
    pattern = re.sub(r":\w+", r"[^/]+", route)
    return bool(re.fullmatch(pattern, ref))


def api_inventory(files):
    result = []
    for path in files:
        rel = str(path.relative_to(ROOT))
        if rel.startswith("functions/api/") and path.suffix in {".ts", ".js"}:
            result.append(rel)
    return sorted(result)


def sql_plaintext_candidates(files):
    findings = []
    sensitive = re.compile(r"\b(name|nome|patient|paciente|guardian|responsavel|email|phone|telefone|notes|nota|content|conteudo|address|endereco|diagnosis|diagnostico|medication|medicacao)\w*\s+TEXT\b", re.I)
    for path in files:
        if path.suffix != ".sql":
            continue
        text = path.read_text("utf-8", errors="replace")
        for m in sensitive.finditer(text):
            line_no, excerpt = line_excerpt(text, m.start())
            if "encrypted" not in excerpt.lower() and "hash" not in excerpt.lower():
                findings.append((str(path.relative_to(ROOT)), line_no, excerpt))
    return findings


def render_findings(title, items, limit=80):
    out = [f"## {title}", ""]
    out.append(f"Total: **{len(items)}**")
    out.append("")
    if not items:
        out.append("Nenhum achado.")
        out.append("")
        return out
    for rel, line, excerpt in items[:limit]:
        out.append(f"- `{rel}:{line}` — `{excerpt.replace('`', "'")}`")
    if len(items) > limit:
        out.append(f"- … +{len(items)-limit} achados não exibidos.")
    out.append("")
    return out


def main():
    files = list(iter_code_files())
    findings = scan_patterns(files)
    app_text, routes, lazy_imports = parse_routes()
    refs = route_refs(files)
    normalized_routes = sorted(set(normalize_route(x) for x in routes))
    duplicates = [r for r, n in Counter(map(normalize_route, routes)).items() if n > 1]

    missing_lazy = []
    for imp in lazy_imports:
        candidates = [
            ROOT / "client" / "src" / "pages" / f"{imp}.tsx",
            ROOT / "client" / "src" / "pages" / f"{imp}.ts",
            ROOT / "client" / "src" / "pages" / imp / "index.tsx",
            ROOT / "client" / "src" / "pages" / imp / "index.ts",
        ]
        if not any(p.exists() for p in candidates):
            missing_lazy.append(("client/src/App.tsx", 1, f"lazy import sem arquivo: @/pages/{imp}"))

    unresolved_refs = []
    for ref, sources in sorted(refs.items()):
        if ref.startswith("/api/"):
            continue
        if not any(route_matches(ref, route) for route in normalized_routes):
            unresolved_refs.append((sorted(sources)[0], 1, f"referência {ref} sem Route literal correspondente"))

    unreferenced_routes = []
    for route in normalized_routes:
        if route in {"/", "*"} or ":" in route:
            continue
        referenced = any(route_matches(ref, route) for ref in refs)
        if not referenced:
            unreferenced_routes.append(("client/src/App.tsx", 1, f"rota sem referência literal de navegação: {route}"))

    sql_candidates = sql_plaintext_candidates(files)
    apis = api_inventory(files)

    lines = [
        "# Auditoria automática de pontas soltas — NeuroPed",
        "",
        "Este arquivo é gerado por scanner estático. Achados são **candidatos para revisão**, não equivalem automaticamente a bug.",
        "",
        "## Inventário",
        "",
        f"- Arquivos de código analisados: **{len(files)}**",
        f"- Rotas React literais: **{len(normalized_routes)}**",
        f"- Imports lazy de páginas: **{len(lazy_imports)}**",
        f"- Endpoints/handlers Cloudflare em `functions/api`: **{len(apis)}**",
        "",
    ]

    lines += render_findings("Marcadores de implementação incompleta", findings["unfinished"])
    lines += render_findings("Referências a mock/demo/fixture/simulação", findings["fake_demo"])
    lines += render_findings("Handlers vazios", findings["empty_handler"])
    lines += render_findings("Links mortos/#/javascript", findings["dead_href"])
    lines += render_findings("Status 501 / NOT_IMPLEMENTED", findings["not_implemented_status"])
    lines += render_findings("Console log/debug em código de produção", findings["console_debug"])
    lines += render_findings("localStorage/sessionStorage em superfícies potencialmente sensíveis", findings["sensitive_local_storage"])
    lines += render_findings("Imports lazy sem arquivo correspondente", missing_lazy)
    lines += render_findings("Referências internas sem rota registrada", unresolved_refs)
    lines += render_findings("Rotas registradas sem referência literal de navegação", unreferenced_routes)
    lines += render_findings("Rotas duplicadas", [("client/src/App.tsx", 1, r) for r in duplicates])
    lines += render_findings("Campos TEXT potencialmente sensíveis em migrações SQL sem sufixo encrypted/hash", sql_candidates)

    lines += ["## API Cloudflare — inventário", ""]
    for api in apis:
        lines.append(f"- `{api}`")
    lines.append("")

    portal_tokens = ["portal-familia", "portal-acesso", "familia"]
    lines += ["## Sinais de dívida de produto conhecidos", ""]
    for token in portal_tokens:
        if token in app_text:
            lines.append(f"- `{token}` ainda aparece no roteador principal; revisar se é rota intencional ou legado órfão.")
    lines.append("")

    out = ROOT / "docs" / "AUDITORIA_TOTAL_2026-08-10_AUTO.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), "utf-8")
    print(f"Relatório gravado em {out.relative_to(ROOT)}")
    print(json.dumps({
        "files": len(files),
        "routes": len(normalized_routes),
        "unfinished": len(findings["unfinished"]),
        "fake_demo": len(findings["fake_demo"]),
        "dead_href": len(findings["dead_href"]),
        "sensitive_local_storage": len(findings["sensitive_local_storage"]),
        "missing_lazy": len(missing_lazy),
        "unresolved_refs": len(unresolved_refs),
        "unreferenced_routes": len(unreferenced_routes),
        "sql_plaintext_candidates": len(sql_candidates),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
