"""Entrada/saída local do aplicativo Windows. Sem rede, segredos ou emissão final."""
from __future__ import annotations

import copy
import hashlib
import json
import os
import shutil
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from neuroped_fluxo.core import (DOMAIN_LABELS, digest, draft_documents, empty_case,
                                import_labeled_text, import_notes, validate)
from run_gate import read_case

DESKTOP_VERSION = "1.1.0"
MAX_BYTES = 1_000_000


def checked_json(text: str) -> Any:
    if not isinstance(text, str) or len(text.encode("utf-8")) > MAX_BYTES:
        raise ValueError("Entrada inválida ou maior que 1 MB.")
    def pairs(items):
        out = {}
        for key, value in items:
            if key in out:
                raise ValueError("Chave JSON repetida.")
            out[key] = value
        return out
    def constant(_):
        raise ValueError("JSON não admite NaN ou infinito.")
    try:
        value = json.loads(text, object_pairs_hook=pairs, parse_constant=constant)
        json.dumps(value, allow_nan=False)
        stack = [(value, 0)]
        while stack:
            node, depth = stack.pop()
            if depth > 64:
                raise ValueError("JSON excede 64 níveis.")
            if isinstance(node, dict):
                stack.extend((v, depth + 1) for v in node.values())
            elif isinstance(node, list):
                stack.extend((v, depth + 1) for v in node)
        return value
    except (json.JSONDecodeError, RecursionError, OverflowError) as exc:
        raise ValueError("JSON inválido ou fora dos limites.") from exc


def load_json(path: Path) -> Any:
    path = Path(path)
    if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_BYTES:
        raise ValueError("Selecione arquivo JSON local, regular, até 1 MB.")
    return checked_json(path.read_text(encoding="utf-8-sig"))


def save_new(path: Path, text: str) -> None:
    """Criação exclusiva. Nunca apaga nem substitui um arquivo existente."""
    path = Path(path)
    with path.open("x", encoding="utf-8", newline="\n") as out:
        out.write(text)
        out.flush()
        os.fsync(out.fileno())
    if os.name != "nt":
        path.chmod(0o600)


def pretty(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n"


def safe_report(case: Any) -> dict:
    """Falha fechada inclusive para campos adversariais fora do contrato básico."""
    try:
        report = validate(case)
        json.dumps(report, allow_nan=False)
    except (ValueError, TypeError, KeyError, AttributeError, OverflowError, RecursionError):
        return {"status": "BLOQUEADO", "completeness": 0, "can_handoff": False,
                "can_draft": False, "final_pdf_emitted": False,
                "issues": [{"code": "DESKTOP_FORMAT", "path": "$", "severity": "bloqueio",
                            "message": "Estrutura ou aritmética inválida. Corrigir o JSON antes de compilar."}]}
    # Um domínio desconhecido não pode desaparecer silenciosamente na compilação.
    if isinstance(case, dict) and isinstance(case.get("domains"), dict):
        for key, facts in case["domains"].items():
            if key not in DOMAIN_LABELS:
                report["issues"].append({"code": "DESKTOP_DOMAIN", "path": "domains",
                    "severity": "bloqueio", "message": "Domínio não reconhecido; realocar os trechos no contrato."})
            if isinstance(facts, list):
                for fact in facts:
                    if isinstance(fact, dict) and fact.get("status") == "nao_avaliado" and fact.get("text"):
                        report["issues"].append({"code": "DESKTOP_UNASSESSED", "path": "domains",
                            "severity": "bloqueio", "message": "Domínio não avaliado contém achado textual: reconciliar antes de compilar."})
    if any(x["severity"] == "bloqueio" for x in report["issues"]):
        report["status"] = "BLOQUEADO"
        report["can_handoff"] = False
    return report


def prepare(case: Any) -> dict:
    report = safe_report(case)
    if not isinstance(case, dict) or not isinstance(case.get("sources"), list) or not isinstance(case.get("domains"), dict) or not isinstance(case.get("medications"), list):
        raise ValueError("Estrutura inválida. O relatório de pendências permanece disponível.")
    if any(x["code"].startswith("DESKTOP_") for x in report["issues"]):
        raise ValueError("Entrada estruturalmente inconsistente. Consulte as pendências.")
    # Nenhum texto é preenchido, aprovado ou convertido em exame automaticamente.
    return draft_documents(case, report)


def export_case_bundle(case: dict, directory: Path) -> Path:
    """Exporta nova pasta completa ou nenhuma; reexecução idempotente por conteúdo."""
    directory = Path(directory)
    if not directory.is_dir() or directory.is_symlink():
        raise ValueError("Selecione uma pasta local existente para a saída.")
    original_hash = digest(case)
    # Versão do aplicativo integra o identificador: mudança de código não reutiliza saída antiga.
    key = digest({"case": original_hash, "desktop_version": DESKTOP_VERSION})[:24]
    target = directory / ("rascunho-" + key)
    report = safe_report(case)
    try:
        draft = prepare(case)
    except (ValueError, TypeError, AttributeError, KeyError, RecursionError, OverflowError):
        draft = None
    files = {"caso.json": pretty(case), "qa_entrada.json": pretty(report)}
    if draft is not None:
        files["rascunho.json"] = pretty(draft)
        for name, text in draft["documents"].items():
            if name not in ("anamnese", "evolucao", "escola", "encaminhamento", "receita_conferencia"):
                raise ValueError("Nome de documento fora do contrato.")
            files["RASCUNHO_" + name + ".md"] = text
    sums = {name: hashlib.sha256(text.encode("utf-8")).hexdigest() for name, text in files.items()}
    manifest = {"desktop_version": DESKTOP_VERSION, "input_sha256": original_hash,
                "status": report["status"], "files_sha256": sums,
                "drafts_compiled": draft is not None, "final_pdfs_emitted": 0,
                "notice": "Dados locais não criptografados. Sem assinatura e sem emissão PANT final."}
    if target.exists():
        if target.is_symlink() or not target.is_dir():
            raise ValueError("Destino existente não é uma pasta regular.")
        old = load_json(target / "manifesto.json")
        if old != manifest:
            raise ValueError("Saída existente diverge do manifesto; nada foi sobrescrito.")
        for name, expected in sums.items():
            file = target / name
            if file.is_symlink() or not file.is_file() or hashlib.sha256(file.read_bytes()).hexdigest() != expected:
                raise ValueError("Saída existente foi alterada; nada foi sobrescrito.")
        return target
    stage = Path(tempfile.mkdtemp(prefix=".neuroped-pendente-", dir=directory))
    try:
        for name, text in files.items():
            save_new(stage / name, text)
        save_new(stage / "manifesto.json", pretty(manifest))
        # Não substitui pasta existente não vazia. Destino concorrente gera erro.
        if target.exists():
            raise ValueError("Destino criado simultaneamente; repita para conferir integridade.")
        stage.rename(target)
    finally:
        if stage.exists():
            shutil.rmtree(stage)
    return target


def process_folder(source: Path, destination: Path) -> dict:
    source, destination = Path(source), Path(destination)
    if not source.is_dir() or not destination.is_dir() or source.is_symlink() or destination.is_symlink():
        raise ValueError("Selecione pastas locais existentes, sem links simbólicos.")
    if source.resolve() == destination.resolve() or destination.resolve().is_relative_to(source.resolve()):
        raise ValueError("Pasta de saída deve ficar fora da pasta de entrada.")
    candidates = sorted(source.glob("*.json"))
    if len(candidates) > 500:
        raise ValueError("Lote excede 500 arquivos.")
    rows = []
    for file in candidates:
        if file.is_symlink():
            rows.append({"status": "ERRO", "reason": "LINK_IGNORADO"})
            continue
        try:
            case = load_json(file)
            if not isinstance(case, dict):
                raise ValueError("Caso precisa ser objeto.")
            target = export_case_bundle(case, destination)
            report = load_json(target / "manifesto.json")
            rows.append({"input_sha256": digest(case), "folder": target.name,
                         "status": report["status"], "drafts_compiled": report["drafts_compiled"]})
        except (OSError, ValueError, TypeError, KeyError, AttributeError, OverflowError, RecursionError):
            # Não inclui conteúdo nem nomes de arquivos possivelmente identificáveis em logs.
            rows.append({"status": "ERRO", "reason": "ENTRADA_OU_DESTINO_INVALIDO"})
    failed = any(r["status"] in ("ERRO", "BLOQUEADO") for r in rows)
    return {"status": "COM_PENDENCIAS" if failed else "PROCESSADO", "processed": len(rows),
            "results": rows, "final_pdfs_emitted": 0}


@dataclass
class Session:
    case: dict
    report: dict | None = None
    draft: dict | None = None

    def set_case(self, value: Any) -> None:
        if not isinstance(value, dict):
            raise ValueError("Caso precisa ser objeto JSON.")
        checked_json(pretty(value))
        self.case = copy.deepcopy(value)
        self.report = None
        self.draft = None

    def validate(self) -> dict:
        self.report = safe_report(self.case)
        return self.report

    def compile(self) -> dict:
        self.draft = prepare(self.case)
        return self.draft

    def text(self, text: str, source_type: str) -> None:
        self.set_case(import_labeled_text(text, self.case, source_type))

    def notes(self, value: Any) -> None:
        self.set_case(import_notes(value, self.case))
