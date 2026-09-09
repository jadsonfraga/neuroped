#!/usr/bin/env python3
"""Reconcile canonical authorial scale sources and approved review overlays for delivery."""
from __future__ import annotations
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "client/src/data"
PRIMARY = DATA_DIR / "authorialMonitoring.json"
CANONICAL_GLOB = "authorialMonitoring*.json"
OVERLAY_KEY = "overrides"


def fingerprint(record: dict) -> str:
    canonical = json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(canonical.encode()).hexdigest()


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def classify_sources() -> tuple[list[tuple[Path, list[dict]]], list[tuple[Path, dict]]]:
    canonical: list[tuple[Path, list[dict]]] = []
    overlays: list[tuple[Path, dict]] = []
    for path in sorted(DATA_DIR.glob(CANONICAL_GLOB)):
        data = load_json(path)
        if isinstance(data, list):
            if any(not isinstance(row, dict) for row in data):
                raise ValueError(f"Fonte autoral inválida: {path.name}")
            canonical.append((path, data))
        elif isinstance(data, dict) and isinstance(data.get(OVERLAY_KEY), dict):
            overlays.append((path, data))
        else:
            raise ValueError(f"Arquivo authorialMonitoring sem contrato reconhecido: {path.name}")
    if not any(path == PRIMARY for path, _ in canonical):
        raise ValueError("Fonte autoral primária ausente")
    return canonical, overlays


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
                merged.append(copy.deepcopy(record))
            seen_identity[key] = (digest, path.name)
            seen_ids[instrument_id] = (version, path.name)
    return merged


def apply_overlays(records: list[dict], overlays: list[tuple[Path, dict]]) -> list[dict]:
    by_id = {record["id"]: record for record in records}
    for path, overlay in overlays:
        approved_at = overlay.get("approvedAt")
        approved_by = overlay.get("approvedBy")
        if not isinstance(approved_at, str) or not approved_at or not isinstance(approved_by, str) or not approved_by:
            raise ValueError(f"Overlay de revisão sem aprovação rastreável: {path.name}")
        for instrument_id, patch in overlay[OVERLAY_KEY].items():
            if instrument_id not in by_id:
                raise ValueError(f"Overlay referencia instrumento inexistente: {instrument_id} em {path.name}")
            if not isinstance(patch, dict):
                raise ValueError(f"Override inválido para {instrument_id} em {path.name}")
            current = by_id[instrument_id]
            predecessor = fingerprint(current)
            updated = copy.deepcopy(current)
            updated.update(copy.deepcopy(patch))
            if updated.get("id") != instrument_id:
                raise ValueError(f"Overlay não pode alterar ID: {instrument_id}")
            if not isinstance(updated.get("version"), str) or not updated["version"]:
                raise ValueError(f"Overlay removeu versão: {instrument_id}")
            updated["deliveryReview"] = {
                "source": path.name,
                "approvedAt": approved_at,
                "approvedBy": approved_by,
                "predecessorFingerprint": predecessor,
            }
            by_id[instrument_id].clear()
            by_id[instrument_id].update(updated)
    return records


def main() -> None:
    canonical, overlays = classify_sources()
    merged = reconcile(canonical)
    discovered_ids = {
        f"{record['id']}:{record['version']}"
        for _, records in canonical
        for record in records
    }
    merged_ids = {f"{record['id']}:{record['version']}" for record in merged}
    if discovered_ids != merged_ids:
        missing = sorted(discovered_ids - merged_ids)
        extra = sorted(merged_ids - discovered_ids)
        raise ValueError(f"Cobertura autoral incompleta após reconciliação; ausentes={missing}; extras={extra}")

    merged = apply_overlays(merged, overlays)
    effective_ids = [f"{record['id']}:{record['version']}" for record in merged]
    if len(effective_ids) != len(set(effective_ids)):
        raise ValueError("Overlay gerou identidade efetiva duplicada")

    PRIMARY.write_text(
        json.dumps(merged, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    canonical_counts = ", ".join(f"{path.name}={len(records)}" for path, records in canonical)
    overlay_counts = ", ".join(f"{path.name}={len(data[OVERLAY_KEY])}" for path, data in overlays) or "nenhum"
    print(
        f"Fontes autorais reconciliadas: {canonical_counts}; overlays={overlay_counts}; "
        f"entrega efetiva={len(merged)}"
    )


if __name__ == "__main__":
    main()
