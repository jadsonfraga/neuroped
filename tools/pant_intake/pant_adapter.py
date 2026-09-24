"""Tombstone do adaptador legado PANT v5/Helena-Esther.

A autoridade clínica/documental vigente é PANT V12. Este módulo é mantido
apenas para que imports antigos falhem de modo explícito e previsível.
Ele não inspeciona runtimes, não renderiza PDFs e não oferece fallback.
"""
from __future__ import annotations

import os

ADAPTER_VERSION = "retired-v12-only"
LEGACY_RETIREMENT_CODE = "PANT_LEGACY_ADAPTER_RETIRED_USE_V12"


class LegacyAdapterRetired(RuntimeError):
    """Bloqueio permanente da via antiga de emissão PANT."""


def _blocked() -> None:
    raise LegacyAdapterRetired(
        f"{LEGACY_RETIREMENT_CODE}: o adaptador v5/Helena-Esther foi aposentado; "
        "use somente um executor V12 homologado com autoridade viva, aprovação "
        "médica vinculada aos bytes e QA zero-blocker. Não há fallback."
    )


def inspect_runtime(runtime_dir, *, expected_law_sha256=None) -> dict:
    """Compatibilidade de import: qualquer inspeção do runtime legado é bloqueada."""
    _blocked()


def emit_pant(contract, runtime_dir, output_path, *, expected_law_sha256=None) -> dict:
    """Compatibilidade de import: qualquer tentativa de emissão legada é bloqueada."""
    _blocked()


def main(argv=None) -> int:
    try:
        _blocked()
    except LegacyAdapterRetired as exc:
        print(f"BLOQUEADO: {exc}", file=os.sys.stderr)
        return 2
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
