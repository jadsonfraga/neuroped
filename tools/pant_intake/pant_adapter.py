"""Adaptador fail-closed entre o portão NeuroPed e o motor PANT v5 externo.

Não contém fontes, brasão ou motor. O runtime canônico fica fora do repositório público.
Só emite após handoff textual válido, runtime verificado e QA aprovado.
"""
from __future__ import annotations

import argparse
import contextlib
import hashlib
import io
import importlib.util
import json
import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import Any

from neuroped_fluxo.core import digest, handoff as validate_handoff
from run_gate import read_case

ADAPTER_VERSION = "1.0.0"
EXPECTED_SEAL = "900cb06d69bb6da7"
CURRENT_DRIVE_V5_SHA256 = "5c699519ed0e33dcead0ad20cd398c6c116de35f4f3d6336487fe45079b8672e"
REQUIRED = {
    "law": "00_LEI_PANT_VIGENTE_v5.md",
    "motor": "01_MOTOR_PANT_HELENA_ESTHER.py",
    "trap": "00_TRAVA_ANTIRREGRESSAO.py",
    "qa": "01_QA_PANT_HELENA_ESTHER.py",
    "brand_cover": "marca_capa.png",
    "brand_body": "marca_miolo.png",
}
SOURCE_LABELS = {
    "relato_pais": "Relato familiar",
    "observacao_medico": "Observação em consultório",
    "documento_escolar": "Narrativa escolar",
    "relatorio_terapeutico": "Relatório terapêutico",
    "documento_externo": "Documento externo",
    "paciente": "Relato do paciente",
}


def _sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def _load(path: Path, stem: str):
    spec = importlib.util.spec_from_file_location(f"neuroped_{stem}_{hash(path)}", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Não foi possível carregar {path.name}.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def inspect_runtime(runtime_dir: Path, *, expected_law_sha256: str | None = CURRENT_DRIVE_V5_SHA256) -> dict:
    root = Path(runtime_dir).resolve()
    if not root.is_dir() or root.is_symlink():
        raise ValueError("Runtime PANT precisa ser diretório local regular.")
    paths = {key: root / name for key, name in REQUIRED.items()}
    for key, path in paths.items():
        if not path.is_file() or path.is_symlink() or path.stat().st_size <= 0:
            raise ValueError(f"Runtime PANT incompleto: {key} ({path.name}).")
    law = paths["law"].read_text(encoding="utf-8-sig")
    if "LEI PANT VIGENTE" not in law or "v5" not in law or "Substitui a v1" not in law:
        raise ValueError("Lei PANT não é reconhecida como v5 vigente.")
    law_sha = _sha(paths["law"])
    if expected_law_sha256 and law_sha != expected_law_sha256:
        raise ValueError("Hash da Lei PANT diverge da versão v5 previamente verificada; revisar antes de emitir.")
    trap = _load(paths["trap"], "trap")
    if getattr(trap, "SELO", None) != EXPECTED_SEAL:
        raise ValueError("Selo da trava PANT diverge do selo autorizado.")
    motor = _load(paths["motor"], "motor")
    qa = _load(paths["qa"], "qa")
    if getattr(getattr(motor, "trava", None), "SELO", None) != EXPECTED_SEAL:
        raise ValueError("Motor não está vinculado à trava selada.")
    if getattr(getattr(qa, "trava", None), "SELO", None) != EXPECTED_SEAL:
        raise ValueError("QA não está vinculado à trava selada.")
    for name in ("render", "secao", "p", "fonte", "destaque", "fecho"):
        if not callable(getattr(motor, name, None)):
            raise ValueError(f"Motor canônico sem função obrigatória: {name}.")
    if not callable(getattr(qa, "medir", None)):
        raise ValueError("QA canônico sem função medir().")
    faces = getattr(motor, "FACES", [])
    fonts_dir = root / "fonts"
    missing_fonts = [entry[-1] for entry in faces if not (fonts_dir / entry[-1]).is_file()]
    if missing_fonts:
        raise ValueError("Runtime PANT sem todas as fontes declaradas pelo motor.")
    if callable(getattr(motor, "_checar_fontes", None)):
        motor._checar_fontes()
    return {
        "adapter_version": ADAPTER_VERSION,
        "runtime": str(root),
        "law_sha256": law_sha,
        "seal": EXPECTED_SEAL,
        "motor_sha256": _sha(paths["motor"]),
        "trap_sha256": _sha(paths["trap"]),
        "qa_sha256": _sha(paths["qa"]),
        "brand_cover_sha256": _sha(paths["brand_cover"]),
        "brand_body_sha256": _sha(paths["brand_body"]),
        "fonts_declared": len(faces),
        "ready": True,
        "_motor": motor,
        "_qa": qa,
        "_trap": trap,
    }


def _validated_handoff(contract: Any) -> dict:
    if not isinstance(contract, dict) or contract.get("schema_version") != "neuroped.pant_handoff.v1":
        raise ValueError("Contrato de handoff ausente ou inválido.")
    case, draft, approval = contract.get("case"), contract.get("draft"), contract.get("approval")
    canonical = validate_handoff(case, draft, approval)
    if canonical["input_gate"]["status"] == "BLOQUEADO" or not canonical["input_gate"]["can_handoff"]:
        raise ValueError("Portão de entrada bloqueado.")
    if canonical["approval"].get("draft_sha256") != digest(canonical["draft"].get("documents")):
        raise ValueError("Aprovação textual não corresponde ao rascunho atual.")
    return canonical


def _sentence(text: str) -> str:
    clean = re.sub(r"\s+", " ", text).strip()
    match = re.match(r"(.+?[.!?])(?:\s|$)", clean)
    return (match.group(1) if match else clean)[:420]


def _split_source(paragraph: str) -> tuple[str | None, str]:
    m = re.match(r"^Fonte:\s+([^ ]+)\s+\(([^)]+)\)\.\s+(.*)$", paragraph, flags=re.S)
    if not m:
        return None, paragraph
    return SOURCE_LABELS.get(m.group(1), "Fonte documentada"), m.group(3)


def _signature(trap) -> dict:
    identity = trap.IDENTIDADE
    return {
        "nome": identity["nome"],
        "titulacao": identity["titulacao"],
        "titulacao_capa": f'{identity["titulacao"]} · {identity["crm"]} · {identity["rqe"]}',
        "registro": f'{identity["crm"]} · {identity["rqe"]}',
        "pj": f'{identity["razao"]} · CNPJ {identity["cnpj"]}',
        "endereco": identity["endereco_capa"],
    }


def _patient_label(case: dict) -> str:
    local = case.get("document_identity")
    if isinstance(local, dict) and isinstance(local.get("patient_name"), str) and local["patient_name"].strip():
        return local["patient_name"].strip()
    return str(case.get("case_id") or "Caso pseudonimizado")


def _cid_pair(case: dict) -> str:
    hypotheses = case.get("hypotheses", [])
    if not hypotheses:
        raise ValueError("PANT final exige hipótese registrada com CID-10 e CID-11; não inventar códigos.")
    pairs = []
    for h in hypotheses:
        if not isinstance(h, dict) or not h.get("icd10") or not h.get("icd11"):
            raise ValueError("Hipótese sem par CID-10/CID-11.")
        pairs.append(f'CID-10 {h["icd10"]} | CID-11 {h["icd11"]}')
    return " · ".join(pairs)


def build_motor_payload(contract: dict, motor, trap) -> tuple[dict, list[str]]:
    """Converte somente conteúdo previamente aprovado em blocos de apresentação PANT."""
    canonical = _validated_handoff(contract)
    case, draft = canonical["case"], canonical["draft"]
    if case.get("purpose") != "pant":
        raise ValueError("Emissão PANT exige purpose='pant'.")
    sections = draft.get("sections")
    if not isinstance(sections, list) or not sections:
        raise ValueError("Fase 1 aprovada não contém seções para emissão.")
    body: list[str] = []
    first_clinical = None
    for idx, section in enumerate(sections, 1):
        if not isinstance(section, dict) or not isinstance(section.get("paragraphs"), list):
            raise ValueError("Seção aprovada fora do contrato.")
        body.append(motor.secao(idx, str(section.get("title") or f"Seção {idx}")))
        highlighted = False
        for p_index, paragraph in enumerate(section["paragraphs"]):
            if not isinstance(paragraph, str) or not paragraph.strip():
                continue
            label, clinical = _split_source(paragraph)
            if first_clinical is None:
                first_clinical = clinical
            if label:
                body.append(motor.fonte(label, clinical, capitular=(idx == 1 and p_index == 0)))
            else:
                body.append(motor.p(clinical, capitular=(idx == 1 and p_index == 0)))
            if not highlighted:
                point = _sentence(clinical)
                if point:
                    body.append(motor.destaque(point))
                    highlighted = True
    hypotheses = case.get("hypotheses", [])
    if hypotheses:
        idx = len(sections) + 1
        body.append(motor.secao(idx, "Análise e hipóteses"))
        for h in hypotheses:
            favor = [str(x) for x in h.get("for", [])] if isinstance(h.get("for"), list) else [str(h.get("for"))]
            against = [str(x) for x in h.get("against", [])] if isinstance(h.get("against"), list) else [str(h.get("against"))]
            body.append(motor.analise(favor, against))
            criteria = h.get("criteria", [])
            criteria_text = "; ".join(map(str, criteria)) if isinstance(criteria, list) else str(criteria)
            body.append(motor.tabela([
                ("Hipótese", str(h.get("label"))),
                ("CID-10", str(h.get("icd10"))),
                ("CID-11", str(h.get("icd11"))),
                ("Estado", str(h.get("status"))),
                ("Critérios documentados", criteria_text),
            ], cab=("Campo", "Registro aprovado")))
            body.append(motor.destaque(_sentence(str(h.get("label")) + ". " + criteria_text)))
    body.append(motor.fecho(_signature(trap)))
    age = case.get("patient", {}).get("age_months")
    age_text = f"{age} meses" if isinstance(age, int) else "idade registrada no caso"
    cover = {
        "wordmark": "NeuroPed SDG",
        "subtitulo": "RELATÓRIO NEUROPEDIÁTRICO",
        "identificacao": f"Caso {case.get('case_id', '')}",
        "protocolo": str(case.get("encounter_id") or ""),
        "titulo_linhas": ["Relatório", "Neuropediátrico"],
        "paciente": _patient_label(case),
        "meta": f"{age_text} · atendimento {case.get('encounter_date', '')}",
        "resumo": _sentence(first_clinical or "Conteúdo aprovado para emissão."),
        "cid": _cid_pair(case),
        "assinatura": _signature(trap),
    }
    return cover, body


def emit_pant(contract: dict, runtime_dir: Path, output_path: Path, *,
              expected_law_sha256: str | None = CURRENT_DRIVE_V5_SHA256) -> dict:
    """Emite somente se entrada, aprovação, runtime e QA passarem. Nunca sobrescreve."""
    output = Path(output_path)
    if output.exists() or output.is_symlink():
        raise FileExistsError("Arquivo de saída já existe; nenhum arquivo será substituído.")
    if not output.parent.is_dir() or output.parent.is_symlink():
        raise ValueError("Diretório de saída inválido.")
    info = inspect_runtime(runtime_dir, expected_law_sha256=expected_law_sha256)
    canonical = _validated_handoff(contract)
    cover, body = build_motor_payload(canonical, info["_motor"], info["_trap"])
    confirmed = any(isinstance(h, dict) and h.get("status") == "confirmado"
                    for h in canonical["case"].get("hypotheses", []))
    with tempfile.TemporaryDirectory(prefix="neuroped-pant-") as tmp:
        scratch = Path(tmp)
        old = Path.cwd()

        def render_and_measure(name: str, *, balancear: bool):
            provisional = scratch / name
            capture = io.StringIO()
            try:
                os.chdir(scratch)
                with contextlib.redirect_stdout(capture):
                    _, engine = info["_motor"].render(cover, body, str(provisional), balancear=balancear)
            finally:
                os.chdir(old)
            qa = info["_qa"].medir(str(provisional), ordem_expressa_fechar=confirmed)
            return provisional, engine, qa

        provisional, engine_report, qa_report = render_and_measure("base.pdf", balancear=False)
        engine_mode = "base_qa_approved"
        if not qa_report.get("passa") or qa_report.get("bloqueios"):
            trap = info["_trap"]
            layout_recoverable = (
                float(engine_report.get("vao_mm", 0) or 0) > float(trap.TETO_VAO_MM)
                or float(engine_report.get("branco_max_pct", 0) or 0) > float(trap.TETO_BRANCO_PCT)
                or bool(engine_report.get("folhas_sem_marcacao"))
            )
            if layout_recoverable:
                provisional, engine_report, qa_report = render_and_measure("balanced.pdf", balancear=True)
                engine_mode = "balanced_fallback"
            if not qa_report.get("passa") or qa_report.get("bloqueios"):
                raise ValueError("QA PANT reprovou a emissão; nenhum PDF final foi gravado: "
                                 + "; ".join(map(str, qa_report.get("bloqueios", []))))
        with output.open("xb") as dst, provisional.open("rb") as src:
            shutil.copyfileobj(src, dst, length=1024 * 1024)
            dst.flush()
            os.fsync(dst.fileno())
    return {
        "adapter_version": ADAPTER_VERSION,
        "schema_version": "neuroped.pant.emission.v1",
        "case_sha256": canonical["approval"]["case_sha256"],
        "draft_sha256": canonical["approval"]["draft_sha256"],
        "law_sha256": info["law_sha256"],
        "seal": info["seal"],
        "output_sha256": _sha(output),
        "output_bytes": output.stat().st_size,
        "engine_mode": engine_mode,
        "engine_report": engine_report,
        "qa": qa_report,
        "final_pdf_emitted": True,
        "digital_signature_applied": False,
        "notice": "Emissão documental após aprovação textual; assinatura digital permanece etapa separada.",
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Adaptador local do portão NeuroPed para o motor PANT v5.")
    sub = parser.add_subparsers(dest="cmd", required=True)
    check = sub.add_parser("inspect")
    check.add_argument("--runtime", required=True)
    check.add_argument("--law-sha256", default=CURRENT_DRIVE_V5_SHA256)
    emit = sub.add_parser("emit")
    emit.add_argument("--runtime", required=True)
    emit.add_argument("--handoff", required=True)
    emit.add_argument("--output", required=True)
    emit.add_argument("--qa-output")
    emit.add_argument("--law-sha256", default=CURRENT_DRIVE_V5_SHA256)
    args = parser.parse_args(argv)
    try:
        if args.cmd == "inspect":
            result = inspect_runtime(Path(args.runtime), expected_law_sha256=args.law_sha256)
            result = {k: v for k, v in result.items() if not k.startswith("_")}
        else:
            result = emit_pant(read_case(args.handoff), Path(args.runtime), Path(args.output),
                               expected_law_sha256=args.law_sha256)
            if args.qa_output:
                qa_path = Path(args.qa_output)
                if qa_path.exists():
                    raise FileExistsError("Arquivo QA já existe.")
                qa_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
        return 0
    except Exception as exc:
        print(f"BLOQUEADO: {exc}", file=os.sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
