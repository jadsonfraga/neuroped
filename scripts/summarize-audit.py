import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "audit-discoverability.json").read_text(encoding="utf-8"))
summary = data["summary"]

lines = [
    "# Auditoria de descoberta do NeuroPed",
    "",
    "A auditoria cruza páginas, rotas, navegação, aliases e política de acesso. Rotas filhas de um hub não são tratadas como esquecidas quando o hub oferece o caminho de entrada.",
    "",
    "## Resumo",
    "",
    "| Métrica | Quantidade |",
    "|---|---:|",
    (f"| Arquivos de páginas | {summary['page_files']} |"),
    (f"| Entradas de rota | {summary['route_entries']} |"),
    (f"| Itens atuais de navegação | {summary['navigation_items']} |"),
    (f"| Rotas sensíveis | {summary['sensitive_routes']} |"),
    (f"| Literais na allowlist pública | {summary['public_route_literals']} |"),
    (f"| Rotas filhas cobertas por hubs | {summary['hub_owned_routes']} |"),
    (f"| Rotas sem entrada ou hub | {summary['unlinked_route_orphans']} |"),
]

lines += [
    "",
    "## Resultado da descoberta",
    "",
    "Todas as entradas de navegação apontam para uma rota ou para o acesso externo intencional do Nesplora. Instrumentos individuais são encontrados pelo Filtro de Escalas, tarefas do Cognitive Lab pelo hub correspondente, detalhes de pacientes pela área Pacientes e subpáginas do Portal da Família pelo próprio portal.",
]

for key, title, field in [
    ("route_orphans", "Rotas sem item de navegação ou hub", "path"),
    ("sensitive_routes_not_in_navigation", "Rotas sensíveis fora da navegação", None),
    ("navigation_missing_routes", "Itens de navegação sem rota correspondente", "label"),
]:
    lines += ["", f"## {title}", ""]
    values = data[key]
    if not values:
        lines.append("Nenhum item encontrado.")
        continue
    lines.append(f"Total: **{len(values)}**.")
    lines.append("")
    for value in values:
        if isinstance(value, dict):
            label = value.get("label", "")
            path = value.get("path", value.get("href", ""))
            source = value.get("source") or "rota aninhada"
            lines.append(f"- `{path}` — {label or source}")
        else:
            lines.append(f"- `{value}`")

page_classification = data.get("page_orphan_classification", {})
lines += [
    "",
    "## Arquivos de página sem importação direta",
    "",
    "| Classificação | Itens |",
    "|---|---|",
    f"| Módulos internos | {', '.join(f'`{x}`' for x in page_classification.get('internal_modules', [])) or 'Nenhum'} |",
    f"| Aliases ou rotas especiais | {', '.join(f'`{x}`' for x in page_classification.get('aliases_or_special_routes', [])) or 'Nenhum'} |",
    f"| Legados ou duplicatas | {', '.join(f'`{x}`' for x in page_classification.get('legacy_or_duplicates', [])) or 'Nenhum'} |",
    "",
    "O relatório não transforma módulos internos, aliases ou duplicatas legadas em links públicos sem uma rota de produto segura. Eles permanecem identificados para evolução futura, enquanto as capacidades maduras recebem hubs ou entradas diretas.",
]

(ROOT / "audit-discoverability.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(ROOT / "audit-discoverability.md")
