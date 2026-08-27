import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "client/src/App.tsx"
NAV = ROOT / "client/src/data/navigation.ts"
POLICY = ROOT / "client/src/security/routeGuardPolicy.ts"
PUBLIC = ROOT / "client/src/lib/publicRoutes.ts"
PAGES = ROOT / "client/src/pages"

# Rotas filhas são abertas pelo hub correspondente, sem ocupar a sidebar uma a uma.
HUB_CHILD_ROUTES = {
    "/filtro": [
        "/mchat", "/cars", "/denver", "/asq3", "/snap", "/sdq", "/vanderbilt",
        "/scared", "/phqa", "/cssrs", "/conners", "/cbcl", "/brief2", "/abc",
        "/vineland", "/cdi2", "/gmfcs", "/cshq", "/ygtss", "/tea",
        "/tea-comportamentos", "/emdi", "/eaf", "/ecsm", "/ips", "/ecar-si",
        "/edi", "/eai", "/easi", "/ems", "/etare", "/eaah", "/tde2", "/crafft", "/pedsql",
        "/escrita-desenho", "/conhecimento-visual", "/testes-reconhecimento",
        "/motricidade-teste", "/conhecimentos-gerais", "/tde2", "/pant",
        "/psc17", "/gad7", "/aq10", "/aq50", "/eusm10", "/generic-scale/:id",
        "/bayley", "/griffiths", "/rcads", "/masc2", "/leiter3", "/nepsy2",
        "/raven", "/wisc5", "/wppsi", "/pedicat", "/tde", "/confias",
        "/portage", "/vineland-completo", "/cbcl-interativo",
    ],
    "/testes-diretos": [
        "/funcoes-executivas", "/atencao-concentracao", "/linguagem-fonologia",
        "/memoria-teste", "/processamento-visuoauditivo",
    ],
    "/cognitive-lab": ["/cognitive-lab/:taskId"],
    "/classificacoes": ["/classificacao/:id"],
    "/instrumentos-padronizados": ["/ballard"],
    "/pacientes": ["/paciente/:id"],
    "/portal-familia": ["/portal-familia/novidades", "/portal-familia/acesso"],
}

STATIC_EXTERNAL_HREFS = {"/nesplora"}
SYSTEM_ROUTE_PATHS = {"/login", "/sessao-expirada", "/consentimento-lgpd"}
KNOWN_INTERNAL_PAGE_FILES = {"filtro-engine"}
KNOWN_LEGACY_PAGE_FILES = {"bloco3-showcase", "diario-epilepsia"}
KNOWN_ALIAS_PAGE_FILES = {"efeitos-colaterais", "portal-novidades"}


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def normalize(path: str) -> str:
    path = path.split("?", 1)[0].split("#", 1)[0]
    if not path.startswith("/"):
        path = "/" + path
    if path != "/":
        path = path.rstrip("/")
    return path or "/"


def route_matches(route: str, href: str) -> bool:
    route = normalize(route)
    href = normalize(href)
    if route == href:
        return True
    if ":" in route:
        route_parts = [x for x in route.split("/") if x]
        href_parts = [x for x in href.split("/") if x]
        return len(route_parts) == len(href_parts) and all(
            a.startswith(":") or a == b for a, b in zip(route_parts, href_parts)
        )
    return False


def represented_by_navigation(route: str, nav_hrefs: set[str]) -> bool:
    normalized_route = normalize(route)
    if normalized_route in SYSTEM_ROUTE_PATHS:
        return True
    if normalized_route == "/generic-scale" and "/filtro" in nav_hrefs:
        return True
    if any(route_matches(route, href) for href in nav_hrefs):
        return True
    for hub, children in HUB_CHILD_ROUTES.items():
        if hub in nav_hrefs and any(route_matches(route, child) for child in children):
            return True
    return normalize(route) == "/paciente" and "/pacientes" in nav_hrefs


def main() -> None:
    app = read(APP)
    nav = read(NAV)
    policy = read(POLICY)
    public = read(PUBLIC)

    imports: dict[str, str] = {}
    for match in re.finditer(
        r'import\s+([A-Za-z0-9_]+)\s+from\s+["\']@/pages/([^"\']+)["\']', app
    ):
        imports[match.group(1)] = match.group(2)
    for match in re.finditer(
        r'const\s+([A-Za-z0-9_]+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(\s*["\']@/pages/([^"\']+)["\']', app
    ):
        imports[match.group(1)] = match.group(2)

    routes = []
    for match in re.finditer(
        r'<Route\s+path=(?:"([^"]+)"|\{\s*["\']([^"\']+)["\']\s*\})[^>]*?(?:component=\{?([A-Za-z0-9_]+)\}?|>)',
        app,
        re.S,
    ):
        path = match.group(1) or match.group(2)
        component = match.group(3) or "nested-or-unknown"
        routes.append({
            "path": normalize(path),
            "component": component,
            "source": imports.get(component),
        })

    nav_items = []
    for match in re.finditer(
        r'\{\s*href:\s*["\']([^"\']+)["\']\s*,\s*label:\s*["\']([^"\']+)["\']', nav
    ):
        nav_items.append({"href": normalize(match.group(1)), "label": match.group(2)})

    # Captura objetos multilinha sem duplicar os objetos já encontrados.
    seen = {(item["href"], item["label"]) for item in nav_items}
    for match in re.finditer(
        r'\{(?:(?!\n\s*\}).){0,260}?href:\s*["\']([^"\']+)["\'](?:(?!\n\s*\}).){0,260}?label:\s*["\']([^"\']+)["\']',
        nav,
        re.S,
    ):
        item = {"href": normalize(match.group(1)), "label": match.group(2)}
        if (item["href"], item["label"]) not in seen:
            nav_items.append(item)
            seen.add((item["href"], item["label"]))

    sensitive = []
    sensitive_match = re.search(r'SENSITIVE_ROUTES\s*=\s*\[(.*?)\]\s*as const', policy, re.S)
    if sensitive_match:
        sensitive = [normalize(x) for x in re.findall(r'["\']([^"\']+)["\']', sensitive_match.group(1))]

    public_routes = []
    public_match = re.search(r'PUBLIC_ROUTE_PREFIXES\s*=\s*\[(.*?)\]', public, re.S)
    if public_match:
        public_routes = [normalize(x) for x in re.findall(r'["\']([^"\']+)["\']', public_match.group(1))]
    if not public_routes:
        public_routes = [normalize(x) for x in re.findall(r'["\']([^"\']+)["\']', public)]

    page_files = sorted(p.stem for p in PAGES.glob("*.tsx"))
    nav_hrefs = {item["href"] for item in nav_items}
    raw_route_orphans = [
        route for route in routes
        if not represented_by_navigation(route["path"], nav_hrefs)
    ]
    hub_owned_routes = [
        route for route in routes
        if route not in raw_route_orphans
        and not any(route_matches(route["path"], href) for href in nav_hrefs)
    ]
    imported_pages = {source.rsplit("/", 1)[-1] for source in imports.values()}
    page_orphans = [page for page in page_files if page not in imported_pages]
    nav_missing_routes = [
        item for item in nav_items
        if item["href"] not in STATIC_EXTERNAL_HREFS
        and not any(route_matches(route["path"], item["href"]) for route in routes)
    ]
    sensitive_hidden = [
        route for route in sensitive
        if not represented_by_navigation(route, nav_hrefs)
    ]

    result = {
        "summary": {
            "page_files": len(page_files),
            "route_entries": len(routes),
            "navigation_items": len(nav_items),
            "sensitive_routes": len(sensitive),
            "public_route_literals": len(public_routes),
            "hub_owned_routes": len(hub_owned_routes),
            "unlinked_route_orphans": len(raw_route_orphans),
        },
        "routes": routes,
        "navigation_items": nav_items,
        "page_files": page_files,
        "route_orphans": raw_route_orphans,
        "hub_owned_routes": hub_owned_routes,
        "page_orphans": page_orphans,
        "page_orphan_classification": {
            "internal_modules": sorted(KNOWN_INTERNAL_PAGE_FILES & set(page_orphans)),
            "legacy_or_duplicates": sorted(KNOWN_LEGACY_PAGE_FILES & set(page_orphans)),
            "aliases_or_special_routes": sorted(KNOWN_ALIAS_PAGE_FILES & set(page_orphans)),
        },
        "navigation_missing_routes": nav_missing_routes,
        "sensitive_routes_not_in_navigation": sensitive_hidden,
        "sensitive_routes": sensitive,
        "public_route_literals": public_routes,
    }
    output = ROOT / "audit-discoverability.json"
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result["summary"], ensure_ascii=False))
    print(f"route_orphans={len(raw_route_orphans)}")
    print(f"hub_owned_routes={len(hub_owned_routes)}")
    print(f"page_orphans={len(page_orphans)}")
    print(f"navigation_missing_routes={len(nav_missing_routes)}")
    print(f"sensitive_routes_not_in_navigation={len(sensitive_hidden)}")
    print(output)


if __name__ == "__main__":
    main()
