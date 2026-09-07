#!/usr/bin/env python3
"""Reconcile authorial scale sources for the delivery pipeline without mutating canonical records."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRIMARY = ROOT / "client/src/data/authorialMonitoring.json"
CHANNEL = ROOT / "client/src/data/authorialMonitoringChannel2026.json"


def fingerprint(record: dict) -> str:
    canonical = json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(canonical.encode()).hexdigest()


def load_array(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list) or any(not isinstance(row, dict) for row in data):
        raise ValueError(f"Fonte autoral inválida: {path.name}")
    return data


def reconcile(primary: list[dict], channel: list[dict]) -> list[dict]:
    merged: list[dict] = []
    seen_identity: dict[str, str] = {}
    seen_ids: dict[str, str] = {}
    for record in [*primary, *channel]:
        instrument_id = record.get("id")
        version = record.get("version")
        if not isinstance(instrument_id, str) or not instrument_id or not isinstance(version, str) or not version:
            raise ValueError("Registro autoral sem ID/versão")
        key = f"{instrument_id}:{version}"
        digest = fingerprint(record)
        previous = seen_identity.get(key)
        if previous and previous != digest:
            raise ValueError(f"Conflito de rastreabilidade: {key} com conteúdo divergente")
        previous_version = seen_ids.get(instrument_id)
        if previous_version and previous_version != version:
            raise ValueError(f"ID autoral duplicado entre fontes com versões distintas: {instrument_id}")
        if not previous:
            merged.append(record)
        seen_identity[key] = digest
        seen_ids[instrument_id] = version
    return merged


def main() -> None:
    primary = load_array(PRIMARY)
    channel = load_array(CHANNEL) if CHANNEL.exists() else []
    merged = reconcile(primary, channel)
    PRIMARY.write_text(json.dumps(merged, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Fontes autorais reconciliadas: primária={len(primary)} canal={len(channel)} entrega={len(merged)}")


if __name__ == "__main__":
    main()
