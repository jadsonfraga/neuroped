#!/usr/bin/env python3
"""Reconcile every canonical authorial scale source for delivery without mutating source records."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "client/src/data"
PRIMARY = DATA_DIR / "authorialMonitoring.json"
SOURCE_GLOB = "authorialMonitoring*.json"


def fingerprint(record: dict) -> str:
    canonical = json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(canonical.encode()).hexdigest()


def load_array(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list) or any(not isinstance(row, dict) for row in data):
        raise ValueError(f"Fonte autoral inválida: {path.name}")
    return data


def discover_sources() -> list[Path]:
    sources = sorted(DATA_DIR.glob(SOURCE_GLOB))
    if PRIMARY not in sources:
        raise ValueError("Fonte autoral primária ausente")
    if not sources:
        raise ValueError("Nenhuma fonte autoral encontrada")
    return sources


def reconcile(source_records: list[tuple[Path, list[dict]]]) -> list[dict]:
    merged: list[dict] = []
    seen_identity: dict[str, tuple[str, str]] = {}
    seen_ids: dict[str, tuple[str, str]] = {}

    for path, records in source_records:
        for record in records:
            instrument_id = record.get("id")
            version = record.get("version")
            if not isinstance(instrument_id, str) or not instrument_id or not isinstance(version, str) or not version:
                raise ValueError(f"Registro autoral sem ID/versão em {path.name}")

            key = f"{instrument_id}:{version}"
            digest = fingerprint(record)

            previous_identity = seen_identity.get(key)
            if previous_identity and previous_identity[0] != digest:
                raise ValueError(
                    f"Conflito de rastreabilidade: {key} com conteúdo divergente em "
                    f"{previous_identity[1]} e {path.name}"
                )

            previous_id = seen_ids.get(instrument_id)
            if previous_id and previous_id[0] != version:
                raise ValueError(
                    f"ID autoral duplicado entre fontes com versões distintas: {instrument_id} "
                    f"({previous_id[0]} em {previous_id[1]} vs {version} em {path.name})"
                )

            if not previous_identity:
                merged.append(record)

            seen_identity[key] = (digest, path.name)
            seen_ids[instrument_id] = (version, path.name)

    return merged


def main() -> None:
    sources = discover_sources()
    source_records = [(path, load_array(path)) for path in sources]
    merged = reconcile(source_records)

    # The delivery script already consumes PRIMARY. Replacing only the workspace copy
    # keeps canonical source files untouched in git while giving delivery one complete,
    # deterministic view of every authorial source.
    PRIMARY.write_text(
        json.dumps(merged, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )

    counts = ", ".join(f"{path.name}={len(records)}" for path, records in source_records)
    discovered_ids = {
        f"{record['id']}:{record['version']}"
        for _, records in source_records
        for record in records
    }
    merged_ids = {f"{record['id']}:{record['version']}" for record in merged}
    if discovered_ids != merged_ids:
        missing = sorted(discovered_ids - merged_ids)
        extra = sorted(merged_ids - discovered_ids)
        raise ValueError(f"Cobertura autoral incompleta após reconciliação; ausentes={missing}; extras={extra}")

    print(f"Fontes autorais reconciliadas: {counts}; entrega={len(merged)}")


if __name__ == "__main__":
    main()
