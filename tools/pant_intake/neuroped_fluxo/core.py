"""Portão documental NeuroPed SDG. Não diagnostica nem escolhe tratamentos.

Somente biblioteca padrão. A pontuação mede preenchimento, não qualidade clínica.
Fontes e autoria são preservadas. Ausência, negação e não avaliação são distintas.
"""
from __future__ import annotations

import copy
import hashlib
import json
import math
import re
from datetime import date, datetime, timezone
from typing import Any

VERSION = "1.0.0"
SCHEMA = "neuroped.intake.v1"
PURPOSES = {"pant", "evolucao", "escola", "encaminhamento", "receita"}
SOURCE_TYPES = {"relato_pais", "observacao_medico", "documento_escolar", "relatorio_terapeutico", "documento_externo", "paciente", "inferencia_ia", "nao_identificada"}
PLACEHOLDERS = {"", "dado ausente", "não informado", "nao informado", "a preencher", "pendente", "null", "none", "n/a", "...", "-"}
DOMAIN_LABELS = {
    "queixa": "Queixa principal", "historia_atual": "História atual",
    "gestacao": "História gestacional e perinatal", "desenvolvimento": "Desenvolvimento",
    "historia_familiar": "História familiar", "escola": "Narrativa escolar",
    "funcionamento": "Perfil funcional", "exame": "Exame observado",
    "conduta": "Conduta informada pelo médico", "orientacoes": "Orientações",
}
NOTES_MAP = {
    "queixa_principal": "queixa", "hda": "historia_atual", "gestacao": "gestacao",
    "parto": "gestacao", "neonatal": "gestacao", "desenvolvimento_motor": "desenvolvimento",
    "desenvolvimento_linguagem": "desenvolvimento", "historia_familiar": "historia_familiar",
    "escola": "escola", "informacoes_escolares": "escola", "aprendizagem": "escola",
    "exame_fisico": "exame", "exame_neurologico": "exame", "observacoes_medico": "exame",
    "condutas": "conduta", "orientacoes": "orientacoes", "interacao_social": "funcionamento",
    "sono": "funcionamento", "alimentacao": "funcionamento", "perfil_sensorial": "funcionamento",
    "brincadeiras": "funcionamento", "comportamento": "funcionamento",
}


def present(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return value.strip().casefold() not in PLACEHOLDERS
    if isinstance(value, (list, dict)):
        return bool(value)
    return True


def number(value: Any, *, positive: bool = False) -> bool:
    return (type(value) in (int, float) and math.isfinite(value)
            and (value > 0 if positive else value >= 0))


def iso_date(value: Any) -> date | None:
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def digest(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def empty_case() -> dict:
    return {
        "schema_version": SCHEMA, "case_id": "", "encounter_id": "", "encounter_date": "",
        "purpose": "pant", "patient": {"age_months": None, "dob": None, "school_enrolled": None},
        "sources": [], "domains": {}, "hypotheses": [], "medications": [], "therapies": [],
        "allergies": {"status": "desconhecido", "source_id": None},
        "weight": {"kg": None, "measured_at": None, "source_id": None},
        "focus": {"epilepsy": None}, "seizures": {},
        "risk": {"signal": "nao_avaliado", "assessment": None, "plan": None},
        "contradictions": [], "evidence_review": {},
    }


def validate(case: Any, *, today: date | None = None) -> dict:
    """Nunca lança erro por um JSON malformado semanticamente; falha de modo fechado."""
    today = today or date.today()
    checks: list[dict] = []
    doses: list[dict] = []

    def check(code, path, ok, message, severity="bloqueio"):
        checks.append({"code": code, "path": path, "passed": bool(ok), "severity": severity,
                       "message": message, "kind": "verificacao" if ok else "pendencia"})

    def result():
        issues = [x for x in checks if not x["passed"]]
        blocked = any(x["severity"] == "bloqueio" for x in issues)
        return {"version": VERSION, "status": "BLOQUEADO" if blocked else ("GERAVEL_COM_RESSALVAS" if issues else "PRONTO"),
                "can_draft": True, "can_handoff": not blocked,
                "completeness": round(100 * sum(x["passed"] for x in checks) / len(checks), 1) if checks else 0,
                "score_description": "Índice operacional de preenchimento; não validado como medida de qualidade clínica.",
                "checked": len(checks), "issues": issues, "checks": checks, "dose_arithmetic": doses,
                "clinical_approval": False, "final_pdf_emitted": False}

    check("E00", "$", isinstance(case, dict), "A entrada precisa ser um objeto JSON.")
    if not isinstance(case, dict):
        return result()
    try:
        serialized = json.dumps(case, allow_nan=False)
        valid_size = len(serialized.encode()) <= 1_000_000
    except (ValueError, TypeError, OverflowError, RecursionError):
        check("E00B", "$", False, "Valores não JSON ou não finitos; corrija a entrada.")
        return result()
    check("E00C", "$", valid_size, "Entrada excede 1 MB.")
    if not valid_size:
        return result()
    shape = {"patient": dict, "sources": list, "domains": dict, "hypotheses": list,
             "medications": list, "therapies": list, "allergies": dict, "weight": dict,
             "focus": dict, "seizures": dict, "risk": dict, "contradictions": list, "evidence_review": dict}
    for key, kind in shape.items():
        check("E01", key, isinstance(case.get(key), kind), f"{key}: estrutura obrigatória {kind.__name__}.")
    if any(not isinstance(case.get(key), kind) for key, kind in shape.items()):
        return result()
    for key in ("sources", "hypotheses", "medications", "therapies", "contradictions"):
        check("E02", key, len(case[key]) <= 500 and all(isinstance(v, dict) for v in case[key]),
              f"{key}: use uma lista de objetos, no máximo 500.")
    if any(len(case[k]) > 500 or not all(isinstance(v, dict) for v in case[k]) for k in ("sources", "hypotheses", "medications", "therapies", "contradictions")):
        return result()
    check("G01", "schema_version", case.get("schema_version") == SCHEMA, "Versão do contrato inválida.")
    for path in ("case_id", "encounter_id"):
        check("G02", path, isinstance(case.get(path), str) and bool(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{2,63}", case[path])),
              f"{path}: use identificador pseudônimo de 3–64 caracteres, sem nome ou CPF.")
    visit = iso_date(case.get("encounter_date"))
    check("G03", "encounter_date", visit is not None and visit <= today, "Data do atendimento ausente, inválida ou futura.")
    purpose = case.get("purpose")
    check("G04", "purpose", isinstance(purpose, str) and purpose in PURPOSES, "Finalidade documental inválida.")
    patient = case["patient"]
    age, dob = patient.get("age_months"), iso_date(patient.get("dob"))
    age_valid = type(age) is int and 0 <= age <= 240
    check("G05", "patient", age_valid or (dob is not None and visit is not None and dob <= visit), "Informe idade em meses ou nascimento coerente.")
    if patient.get("dob") is not None:
        check("G06", "patient.dob", dob is not None and visit is not None and dob <= visit, "Nascimento inválido ou posterior ao atendimento.")
    if dob and visit and age is not None:
        computed_age = (visit.year - dob.year) * 12 + visit.month - dob.month - (visit.day < dob.day)
        check("G07", "patient.age_months", age_valid and age == computed_age, "Idade e nascimento divergem.")
    sources = case["sources"]
    source_ids = [s.get("id") for s in sources]
    source_structure = bool(sources) and all(isinstance(i, str) and present(i) for i in source_ids)
    check("F01", "sources", source_structure and len(set(str(i) for i in source_ids)) == len(sources), "Fontes precisam de identificadores únicos.")
    source_map = {s["id"]: s for s in sources if isinstance(s.get("id"), str)}
    for i, source in enumerate(sources):
        check("F02", f"sources.{i}.type", isinstance(source.get("type"), str) and source["type"] in SOURCE_TYPES,
              "Tipo da fonte inválido; não transforme inferência em observação.")
        check("F03", f"sources.{i}.date", iso_date(source.get("date")) is not None and visit is not None and iso_date(source.get("date")) <= visit,
              "Fonte precisa de data válida, não posterior ao atendimento.")

    def sourced_fact(fact: Any, path: str, *, observational=False) -> bool:
        if not isinstance(fact, dict):
            check("F04", path, False, "Achado precisa ser objeto com text, source_id e review_status.")
            return False
        sid = fact.get("source_id")
        source = source_map.get(sid) if isinstance(sid, str) else None
        content_ok = isinstance(fact.get("text"), str) and present(fact["text"])
        check("F05", path + ".text", content_ok, "DADO AUSENTE: conteúdo do achado.")
        check("F06", path + ".source_id", source is not None, "Fonte inexistente ou ausente.")
        accepted = fact.get("review_status") == "confirmado" and source is not None and source.get("type") not in ("inferencia_ia", "nao_identificada")
        check("F07", path + ".review_status", accepted, "Achado pendente de conferência ou derivado somente de inferência.")
        if observational:
            check("F08", path + ".source_id", source is not None and source.get("type") == "observacao_medico", "Exame exige observação médica, não relato convertido em exame.")
        return content_ok and accepted

    domains = case["domains"]
    required = ["queixa", "historia_atual", "conduta"]
    if purpose == "pant":
        required += ["gestacao", "desenvolvimento", "historia_familiar", "funcionamento", "exame", "orientacoes"]
    if purpose == "escola":
        required += ["funcionamento", "escola", "orientacoes"]
    enrolled = patient.get("school_enrolled")
    check("D00", "patient.school_enrolled", type(enrolled) is bool, "Informe se há vínculo escolar.", "pendencia")
    if enrolled is True and purpose == "pant":
        required.append("escola")
    for domain in sorted(set(required) | set(domains)):
        facts = domains.get(domain)
        shape_ok = isinstance(facts, list) and 0 < len(facts) <= 500
        if domain in required:
            check("D01", f"domains.{domain}", shape_ok, f"DADO AUSENTE: {DOMAIN_LABELS.get(domain, domain)}.")
        if facts is not None:
            check("D02", f"domains.{domain}", isinstance(facts, list) and len(facts) <= 500, "Domínio precisa de lista com até 500 achados.")
        if isinstance(facts, list) and len(facts) <= 500:
            for j, fact in enumerate(facts):
                if isinstance(fact, dict) and fact.get("status") == "nao_avaliado":
                    check("D03", f"domains.{domain}.{j}", False, "Não avaliado nesta consulta: não substituir por normalidade.", "pendencia")
                    check("D04", f"domains.{domain}.{j}.reason", present(fact.get("reason")), "Registre por que o domínio não foi avaliado.")
                else:
                    sourced_fact(fact, f"domains.{domain}.{j}", observational=(domain == "exame"))
    unassigned = case.get("unassigned_segments", [])
    check("F09", "unassigned_segments", isinstance(unassigned, list) and all(
        isinstance(f, dict) and f.get("disposition") == "descartado" and present(f.get("reason"))
        for f in unassigned), "Há trechos sem classificação: alocar no domínio correto ou descartar com razão explícita.")
    for i, hyp in enumerate(case["hypotheses"]):
        p = f"hypotheses.{i}"
        for field in ("label", "icd10", "icd11", "for", "against", "criteria"):
            check("H01", p + "." + field, present(hyp.get(field)), f"Hipótese: falta {field}; códigos não são completados automaticamente.")
        status = hyp.get("status")
        check("H02", p + ".status", status in ("em_investigacao", "confirmado") if isinstance(status, str) else False, "Status diagnóstico inválido.")
        if status == "confirmado":
            authorization = hyp.get("medical_authorization")
            check("H03", p + ".medical_authorization", isinstance(authorization, dict) and authorization.get("explicit") is True and present(authorization.get("physician")) and iso_date(authorization.get("date")) == visit,
                  "Diagnóstico confirmado exige ordem médica expressa vinculada a esta consulta.")
    if purpose == "pant":
        check("H00", "hypotheses", bool(case["hypotheses"]), "Registrar hipótese ou investigação clínica, sem diagnóstico automático.")
    meds = case["medications"]
    weight = case["weight"]
    kg = weight.get("kg")
    weight_ok = number(kg, positive=True) and kg <= 350
    weight_date = iso_date(weight.get("measured_at"))
    allergy = case["allergies"]
    changing_meds = any(m.get("action") in ("iniciar", "ajustar", "desmamar", "suspender") for m in meds)
    if meds:
        check("M01", "weight.kg", weight_ok, "Peso em kg ausente ou inválido: cálculo ponderal não liberado.")
        check("M02", "weight.measured_at", weight_date is not None and visit is not None and weight_date <= visit, "Peso sem data válida.")
        if weight_date and visit:
            check("M03", "weight.measured_at", (visit - weight_date).days <= 90, "Peso medido há mais de 90 dias: conferir atualidade; limiar operacional configurado, não guideline.", "pendencia")
        check("M04", "weight.source_id", isinstance(weight.get("source_id"), str) and weight["source_id"] in source_map, "Peso precisa de fonte.")
        check("M05", "allergies.status", allergy.get("status") in ("negadas", "presentes") if isinstance(allergy.get("status"), str) else False, "Alergias não esclarecidas.", "bloqueio" if changing_meds else "pendencia")
        check("M06", "allergies.source_id", isinstance(allergy.get("source_id"), str) and allergy["source_id"] in source_map, "História de alergias precisa de fonte.")
        if allergy.get("status") == "presentes":
            check("M07", "allergies.details", present(allergy.get("details")), "Descreva alergia e reação.")
    for i, med in enumerate(meds):
        p = f"medications.{i}"
        for field in ("name", "formulation", "route", "indication", "schedule"):
            check("M08", p + "." + field, isinstance(med.get(field), str) and present(med[field]), f"Medicamento: falta {field}.")
        check("M09", p + ".action", med.get("action") in ("manter", "iniciar", "ajustar", "desmamar", "suspender") if isinstance(med.get("action"), str) else False, "Ação farmacológica inválida.")
        check("M10", p + ".source_id", isinstance(med.get("source_id"), str) and med["source_id"] in source_map, "Medicamento sem fonte.")
        med_source = source_map.get(med.get("source_id"), {}) if isinstance(med.get("source_id"), str) else {}
        check("M10B", p + ".source_id", med_source.get("type") not in ("inferencia_ia", "nao_identificada", None), "Posologia não pode ser sustentada apenas por inferência ou fonte desconhecida.")
        check("M11", p + ".review_status", med.get("review_status") == "confirmado", "Posologia precisa de conferência explícita.")
        dose, freq = med.get("dose_mg"), med.get("doses_per_day")
        valid_dose = number(dose, positive=True) and number(freq, positive=True) and freq <= 24
        check("M12", p, valid_dose, "Dose em mg e número de doses por dia devem ser numéricos positivos; esquema variável exige discriminação separada.")
        if valid_dose:
            daily = dose * freq
            finite_daily = math.isfinite(daily)
            check("M13A", p, finite_daily, "Produto de dose/frequência fora do intervalo numérico.")
            if finite_daily:
                supplied = med.get("daily_mg")
                if supplied is not None:
                    check("M13", p + ".daily_mg", number(supplied, positive=True) and math.isclose(supplied, daily, rel_tol=1e-6, abs_tol=1e-6), "Total diário informado diverge de dose × frequência.")
                if weight_ok:
                    doses.append({"index": i, "name": med.get("name"), "mg_per_day": round(daily, 6), "mg_per_kg_per_day": round(daily / kg, 6), "meaning": "Aritmética; não confirma dose adequada, eficácia ou segurança."})
        if med.get("action") == "desmamar":
            check("M14", p + ".baseline_mg_day", number(med.get("baseline_mg_day"), positive=True), "Desmame sem dose de partida confirmada.")
            check("M15", p + ".taper_plan", present(med.get("taper_plan")), "Desmame sem etapas e intervalos documentados.")
        if med.get("off_label") is True:
            check("M16", p + ".off_label", present(med.get("rationale")) and med.get("family_informed") is True, "Off-label: documentar justificativa e informação à família; não assumir consentimento.")
    for i, therapy in enumerate(case["therapies"]):
        for field in ("specialty", "method", "goal", "rationale"):
            check("T01", f"therapies.{i}.{field}", present(therapy.get(field)), f"Terapia precisa de {field} individualizado.")
        check("T02", f"therapies.{i}.sessions_per_week", number(therapy.get("sessions_per_week"), positive=True), "Frequência semanal deve ser explícita e positiva.")
        check("T03", f"therapies.{i}.review_status", therapy.get("review_status") == "confirmado", "Terapia precisa de conferência médica.")
    if case["focus"].get("epilepsy") is True:
        for field in ("semiology", "duration", "frequency", "last_event", "treatment", "rescue_plan"):
            check("S01", "seizures." + field, present(case["seizures"].get(field)), "Epilepsia: falta " + field + ". Não gerar plano de resgate por inferência.")
    risk = case["risk"]
    signal = risk.get("signal")
    check("R01", "risk.signal", signal in ("presente", "ausente", "nao_avaliado") if isinstance(signal, str) else False, "Estado de risco inválido.")
    if signal == "nao_avaliado":
        check("R02", "risk.signal", False, "Risco não avaliado; não equivale a risco ausente.", "pendencia")
    if signal == "presente":
        check("R03", "risk.assessment", present(risk.get("assessment")), "Sinal de risco sem avaliação registrada: requer atenção médica.")
        check("R04", "risk.plan", present(risk.get("plan")), "Sinal de risco sem plano de segurança documentado: prioridade clínica.")
    for i, conflict in enumerate(case["contradictions"]):
        check("C01", f"contradictions.{i}", conflict.get("resolved") is True and present(conflict.get("resolution")), "Fontes contraditórias: resolução documentada necessária; nenhuma versão é escolhida automaticamente.")
    if changing_meds or case["therapies"] or any(h.get("status") == "confirmado" for h in case["hypotheses"]):
        evidence = case["evidence_review"]
        check("V01", "evidence_review", evidence.get("status") == "reviewed" and present(evidence.get("reviewed_by")) and present(evidence.get("applicability")) and isinstance(evidence.get("references"), list) and bool(evidence["references"]),
              "Decisão material: falta registro da revisão de evidência e sua aplicabilidade. Este módulo não consulta nem autentica referências.")
    return result()


def import_notes(payload: Any, base: dict) -> dict:
    """Adapta TranscriptSegment do shared/notes/types.ts sem elevar hipótese a fato."""
    if not isinstance(base, dict):
        raise ValueError("Caso-base inválido.")
    segments = payload.get("segments") if isinstance(payload, dict) else payload
    if not isinstance(segments, list) or len(segments) > 500:
        raise ValueError("Informe lista de até 500 segmentos ou objeto com segments.")
    result = copy.deepcopy(base)
    result.setdefault("sources", [])
    result.setdefault("domains", {})
    result.setdefault("unassigned_segments", [])
    known = {s.get("external_segment_id") for s in result["sources"] if isinstance(s, dict)}
    encounter = base.get("encounter_id")
    for index, segment in enumerate(segments):
        if not isinstance(segment, dict) or not isinstance(segment.get("text"), str):
            raise ValueError(f"Segmento {index}: text obrigatório.")
        if not isinstance(segment.get("id"), str) or not present(segment["id"]):
            raise ValueError(f"Segmento {index}: id obrigatório.")
        if segment.get("consultationId") != encounter:
            raise ValueError(f"Segmento {index}: consultationId difere do atendimento; mistura de casos bloqueada.")
        if segment["id"] in known:
            continue
        if not number(segment.get("startMs")) or not number(segment.get("endMs")) or segment["endMs"] < segment["startMs"]:
            raise ValueError(f"Segmento {index}: intervalo temporal inválido.")
        topics = segment.get("topics", [])
        if not isinstance(topics, list) or not all(isinstance(t, str) for t in topics):
            raise ValueError(f"Segmento {index}: topics inválido.")
        source_type = segment.get("source")
        if not isinstance(source_type, str) or source_type not in SOURCE_TYPES:
            source_type = "nao_identificada"
        sid = "note-" + hashlib.sha256(segment["id"].encode()).hexdigest()[:24]
        if any(s.get("id") == sid for s in result["sources"]):
            raise ValueError("Colisão de identificador de fonte.")
        result["sources"].append({"id": sid, "type": source_type, "date": str(segment.get("createdAt", ""))[:10],
                                  "external_segment_id": segment["id"], "speaker": segment.get("speaker"),
                                  "start_ms": segment["startMs"], "end_ms": segment["endMs"]})
        targets = set(NOTES_MAP[t] for t in topics if t in NOTES_MAP)
        fact = {"text": segment["text"], "source_id": sid, "review_status": "pendente", "status": "relatado"}
        for target in sorted(targets):
            result["domains"].setdefault(target, []).append(copy.deepcopy(fact))
        if not targets:
            result["unassigned_segments"].append({**fact, "topics": topics})
        known.add(segment["id"])
    return result


def import_labeled_text(text: str, base: dict, source_type="relato_pais") -> dict:
    """Entrada determinística DOMÍNIO: texto. Texto livre não é interpretado como exame/dose."""
    if not isinstance(text, str) or len(text.encode()) > 500_000:
        raise ValueError("Texto inválido ou maior que 500 KB.")
    if source_type not in SOURCE_TYPES or source_type == "inferencia_ia":
        raise ValueError("Escolha uma fonte identificada; inferência não equivale a relato.")
    result = copy.deepcopy(base)
    source_id = "texto-" + hashlib.sha256(text.encode()).hexdigest()[:24]
    if any(s.get("id") == source_id for s in result.get("sources", [])):
        return result
    result.setdefault("sources", []).append({"id": source_id, "type": source_type, "date": base.get("encounter_date"), "label": "Texto importado para conferência"})
    result.setdefault("domains", {})
    result.setdefault("unassigned_segments", [])
    for line in text.splitlines():
        if not line.strip():
            continue
        domain, sep, content = line.partition(":")
        domain = domain.strip().lower()
        fact = {"text": content.strip() if sep and domain in DOMAIN_LABELS else line.strip(), "source_id": source_id, "review_status": "pendente"}
        if sep and domain in DOMAIN_LABELS:
            result["domains"].setdefault(domain, []).append(fact)
        else:
            result["unassigned_segments"].append(fact)
    return result


def draft_documents(case: dict, report: dict | None = None) -> dict:
    """Fase 1: reproduz achados com fonte; não cria prosa clínica que não foi fornecida."""
    report = report or validate(case)
    if not isinstance(case, dict):
        raise ValueError("Caso inválido.")
    sources = {s.get("id"): s for s in case.get("sources", []) if isinstance(s, dict) and isinstance(s.get("id"), str)}
    sections = []
    domains = case.get("domains", {})
    if not isinstance(domains, dict):
        domains = {}
    for domain, label in DOMAIN_LABELS.items():
        paragraphs = []
        facts = domains.get(domain, [])
        if not isinstance(facts, list):
            continue
        for fact in facts:
            if not isinstance(fact, dict) or not isinstance(fact.get("text"), str) or not present(fact["text"]):
                continue
            sid = fact.get("source_id")
            source = sources.get(sid, {}) if isinstance(sid, str) else {}
            reviewed = fact.get("review_status") == "confirmado"
            paragraphs.append(f"Fonte: {source.get('type', 'não identificada')} ({sid}). "
                              + ("" if reviewed else "[CONFERIR TRANSCRIÇÃO] ") + fact["text"].strip())
        if paragraphs:
            sections.append({"key": domain, "title": label, "paragraphs": paragraphs})
    title = "RASCUNHO — compilação de dados para revisão"
    base = f"# {title}\n\nCaso: {case.get('case_id', '')} · Atendimento: {case.get('encounter_id', '')}\n\n"
    def build(keys):
        selected = [s for s in sections if s["key"] in keys]
        return base + "\n\n".join("## " + s["title"] + "\n\n" + "\n\n".join(s["paragraphs"]) for s in selected)
    docs = {"anamnese": build(set(DOMAIN_LABELS)),
            "evolucao": build({"historia_atual", "exame", "conduta", "orientacoes"}),
            "escola": build({"escola", "funcionamento", "orientacoes"}),
            "encaminhamento": build({"queixa", "funcionamento", "conduta"})}
    docs["receita_conferencia"] = base + "## Reconciliação de medicação — não é receita\n\n" + "\n\n".join(
        f"{m.get('name', 'DADO AUSENTE')}: {m.get('dose_mg', 'DADO AUSENTE')} mg por tomada; "
        f"{m.get('doses_per_day', 'DADO AUSENTE')} tomadas/dia; apresentação {m.get('formulation', 'DADO AUSENTE')}; "
        f"via {m.get('route', 'DADO AUSENTE')}; horários {m.get('schedule', 'DADO AUSENTE')}."
        for m in case.get("medications", []) if isinstance(m, dict))
    return {"stage": "FASE_1", "sections": sections, "documents": docs,
            "pending": report["issues"], "status": report["status"],
            "case_sha256": digest(case), "draft_sha256": digest(docs),
            "not_final_pant": True, "not_signed": True}


def approve_text(case: dict, draft: dict, physician: str, confirmation: str) -> dict:
    if confirmation != "APROVAR TEXTO" or not isinstance(physician, str) or not present(physician):
        raise ValueError("Aprovação exige identificação do médico e a expressão APROVAR TEXTO.")
    if draft.get("case_sha256") != digest(case) or draft.get("draft_sha256") != digest(draft.get("documents")):
        raise ValueError("Texto/caso mudou; gere novamente a fase 1.")
    return {"scope": "texto", "physician": physician, "case_sha256": digest(case),
            "draft_sha256": digest(draft["documents"]), "approved_at": datetime.now(timezone.utc).isoformat(),
            "declaration_only": True, "digital_signature": False}


def handoff(case: dict, draft: dict, approval: dict) -> dict:
    report = validate(case)
    if not report["can_handoff"]:
        raise ValueError("Portão bloqueado. O rascunho pode ser lido; não liberar para emissão.")
    if not isinstance(approval, dict) or approval.get("scope") != "texto" or not present(approval.get("physician")):
        raise ValueError("Aprovação do texto ausente.")
    if (approval.get("case_sha256") != digest(case) or approval.get("draft_sha256") != digest(draft.get("documents"))
            or draft.get("case_sha256") != digest(case) or draft.get("draft_sha256") != digest(draft.get("documents"))):
        raise ValueError("Aprovação invalidada por alteração do texto ou dos dados.")
    return {"schema_version": "neuroped.pant_handoff.v1", "case": copy.deepcopy(case), "draft": copy.deepcopy(draft),
            "approval": copy.deepcopy(approval), "input_gate": report,
            "renderer_status": "PENDENTE_ADAPTADOR_CANONICO", "final_pdf_emitted": False,
            "note": "Contrato intermediário; não é chamada render(CAPA,CORPO), laudo ou assinatura. Motor, fontes, brasão e QA canônicos ainda precisam ser conectados."}
