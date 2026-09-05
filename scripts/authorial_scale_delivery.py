#!/usr/bin/env python3
"""Blank authorial templates only. Default is an offline render, never a send."""
from __future__ import annotations
import argparse
import base64
import hashlib
import io
import json
import os
from pathlib import Path
import re
import smtplib
import ssl
import sys
from datetime import datetime, timezone
from email.message import EmailMessage
from email.utils import format_datetime
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
RECIPIENT = "jadsonfraga@hotmail.com"
STATE_BRANCH = "automation/scale-email-receipts"
WARNING = "Instrumento autoral não validado psicometricamente. Uso descritivo e longitudinal; não estabelece diagnóstico, gravidade clínica ou indicação de tratamento isoladamente."


def fingerprint(record: dict) -> str:
    canonical = json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(canonical.encode()).hexdigest()


def validate(record: dict) -> dict:
    if not isinstance(record, dict) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", str(record.get("id", ""))):
        raise ValueError("ID de instrumento inválido")
    if not isinstance(record.get("version"), str) or not record["version"].strip() or not isinstance(record.get("items"), list) or not 1 <= len(record["items"]) <= 200:
        raise ValueError("Versão ou número de itens inválido")
    if any(not isinstance(item, dict) for item in record["items"]):
        raise ValueError("Item deve ser objeto")
    ids = [item.get("id") for item in record["items"]]
    if any(not isinstance(x, str) or not x for x in ids) or len(set(ids)) != len(ids):
        raise ValueError("Itens sem identificador único")
    for item in record["items"]:
        if not isinstance(item.get("text"), str) or not 1 <= len(item["text"]) <= 2000:
            raise ValueError("Texto de item inválido")
    if record.get("validationStatus") == "not_validated_authorial":
        if record.get("timeframeDays", 0) < 1:
            raise ValueError("Janela de observação ausente")
        coverage = [x for d in record["domains"] for x in d["itemIds"]]
        if sorted(coverage) != sorted(ids):
            raise ValueError("Domínios não cobrem exatamente os itens")
    elif record.get("sourceType") == "autoral_diario":
        if record.get("validationStatus") != "nao_validado_psicometricamente" or record.get("scoring", {}).get("totalScoreEnabled") is not False:
            raise ValueError("Inventário diário não pode ganhar total ou validação por exportação")
        if not record.get("responseOptions") or not record.get("timeframe"):
            raise ValueError("Opções ou janela de observação ausentes")
    else:
        raise ValueError("Esquema não suportado: somente modelos autorais em branco")
    return record


def load_records(extra: Path | None = None) -> list[dict]:
    records = json.loads((ROOT / "client/src/data/authorialMonitoring.json").read_text())
    paths = sorted((ROOT / "client/src/data/daily-authorial").glob("*.json"))
    if extra and extra.exists():
        paths += sorted(extra.rglob("*.json"))
    if len(paths) > 3000:
        raise ValueError("Quantidade de arquivos excede limite operacional")
    for path in paths:
        if path.is_symlink() or path.stat().st_size > 1_000_000:
            raise ValueError("Entrada excede limites de segurança")
        record = json.loads(path.read_text())
        if not isinstance(record, dict) or record.get("sourceType") != "autoral_diario":
            continue
        if str(record.get("generatedOn", "")) >= "2026-09-05":
            records.append(record)
    unique: dict[str, dict] = {}
    by_id: dict[str, str] = {}
    for record in records:
        validate(record)
        key = fingerprint(record)
        identity = record["id"] + ":" + record["version"]
        if identity in by_id and by_id[identity] != key:
            raise ValueError("Mesmo ID/versão com conteúdo divergente; incrementar a versão")
        by_id[identity] = key
        unique[key] = record
    return list(unique.values())


def render_pdf(records: list[dict], destination: Path) -> None:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, Image, PageBreak
    style = ParagraphStyle("body", fontName="Helvetica", fontSize=9, leading=12, spaceAfter=5)
    title = ParagraphStyle("title", parent=style, fontName="Helvetica-Bold", fontSize=15, leading=18, spaceAfter=8)
    small = ParagraphStyle("small", parent=style, fontSize=8, leading=10)
    p = lambda text, chosen=style: Paragraph(escape(str(text)).replace("\n", "<br/>"), chosen)
    story = []
    logo = base64.b64decode((ROOT / "config/authorial-scale-logo.b64").read_text(), validate=False)
    for index, r in enumerate(records):
        validate(r)
        if index:
            story.append(PageBreak())
        story += [Image(io.BytesIO(logo), width=165, height=55), Spacer(1, 8)]
        story += [p(r.get("fullName", r.get("title")), title)]
        status = r.get("clinicalReviewStatus", r.get("status", "pending"))
        status = {"pending": "pendente", "reviewed": "revisado", "rascunho_revisao": "rascunho para revisão", "revisado_clinicamente": "revisado clinicamente", "arquivado": "arquivado"}.get(status, status)
        story += [p(f"{r.get('name', r.get('shortTitle', r['id']))} | versão {r['version']} | revisão: {status}", small)]
        story += [p(WARNING, small), p("Identificação por código: __________________  Data: ____/____/______\nRespondente: __________________  Contexto: __________________")]
        scored = r.get("validationStatus") == "not_validated_authorial"
        window = f"Últimos {r['timeframeDays']} dias" if scored else r["timeframe"]
        age = f"{r['ageMinMonths']} a {r['ageMaxMonths']} meses"
        story += [p(f"Faixa sugerida: {age}. Janela: {window}."), p(r.get("purpose", ""))]
        if scored:
            instruction = "0 = não ocorreu/sem dificuldade; 1 = leve ou ocasional; 2 = frequente ou com impacto; 3 = muito frequente/intenso ou difícil de contornar."
        else:
            instruction = "; ".join(f"{o['code']} = {o['label']}" for o in r["responseOptions"])
        story += [p(instruction, small), p("Marque uma opção por item. Não observado não é zero. Mantenha o mesmo respondente e contexto no seguimento.", small)]
        if not scored:
            instructions = r.get("instructions", [])
            story += [p(x, small) for x in (instructions if isinstance(instructions, list) else [instructions])]
        rows = [[p("Item observado", small), p("Resposta", small)]]
        for n, item in enumerate(r["items"], 1):
            choices = "0 ( )  1 ( )  2 ( )  3 ( )" if scored else "________________"
            rows.append([p(f"{n}. {item['text']}"), p(choices, small)])
        table = Table(rows, colWidths=[367, 140], repeatRows=1, hAlign="LEFT")
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e3f3f1")),
            ("GRID", (0, 0), (-1, -1), .35, colors.HexColor("#b8c6cc")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story += [table, Spacer(1, 9)]
        if scored:
            domains = "; ".join(f"{d['name']}: ____/{len(d['itemIds']) * 3}" for d in r["domains"])
            story += [p(domains, small), p(f"Total descritivo: ____/{len(r['items']) * 3}. Sem pontos de corte. Não somar se faltar resposta.", small)]
        else:
            story += [p("Perfil qualitativo por item/domínio. Não calcular soma, percentil ou faixa diagnóstica.", small)]
        alerts = r.get("redFlags", [])
        if alerts:
            story += [p("Alertas independentes de qualquer soma: " + "; ".join(a if isinstance(a, str) else a.get("action", "") for a in alerts), small)]
        story += [p("Seguimento: ( ) Basal  ( ) S4  ( ) S8  ( ) S12. Observações: __________________________", small)]
        story += [p("Dr. Jadson Fraga · Neuropediatra · CRM-PE 25227 · RQE 17756\nNeuroPed SDG · Soli Deo Gloria", small)]
        story += [p(f"Exportação do catálogo; não substitui o PDF original. Integridade do registro: {fingerprint(r)}", small)]
    destination.parent.mkdir(parents=True, exist_ok=True)
    def footer(canvas, doc):
        canvas.setFont("Helvetica", 7)
        canvas.drawString(44, 25, "NeuroPed SDG | Formulário em branco | Não enviar respostas de pacientes por este fluxo")
        canvas.drawRightString(A4[0] - 44, 25, str(doc.page))
    SimpleDocTemplate(str(destination), pagesize=A4, leftMargin=44, rightMargin=44, topMargin=28, bottomMargin=40,
                      title="Escalas autorais NeuroPed SDG", author="Dr. Jadson Fraga", invariant=1).build(story, onFirstPage=footer, onLaterPages=footer)


class ReceiptStore:
    """Optimistic writes on a dedicated branch; never touches main or clinical data."""
    def __init__(self):
        self.repo = os.environ["GITHUB_REPOSITORY"]
        self.token = os.environ["GH_TOKEN"]
        if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", self.repo):
            raise ValueError("Repositório inválido")
        self.sha = None
        endpoint = f"contents/scale-mail-receipts.json?ref={quote(STATE_BRANCH, safe='')}"
        result = self.api("GET", endpoint, allow404=True)
        if result:
            self.sha = result["sha"]
            self.data = json.loads(base64.b64decode(result["content"]))
        else:
            branch = self.api("GET", f"git/ref/heads/{STATE_BRANCH}", allow404=True)
            if not branch:
                main = self.api("GET", "git/ref/heads/main")
                self.api("POST", "git/refs", {"ref": "refs/heads/" + STATE_BRANCH, "sha": main["object"]["sha"]})
            self.data = json.loads((ROOT / "config/authorial-mail-bootstrap.json").read_text())
        if self.data.get("recipient") != RECIPIENT or not isinstance(self.data.get("receipts"), dict):
            raise ValueError("Recibos inconsistentes; não enviar")

    def api(self, method, endpoint, data=None, allow404=False):
        request = Request(f"https://api.github.com/repos/{self.repo}/{endpoint}",
                          data=json.dumps(data).encode() if data is not None else None,
                          headers={"Authorization": "Bearer " + self.token, "Accept": "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "NeuroPed-SDG-scale-mail"}, method=method)
        try:
            with urlopen(request, timeout=30) as response:
                return json.load(response)
        except HTTPError as exc:
            if allow404 and exc.code == 404:
                return None
            raise RuntimeError(f"GitHub recusou persistência de recibo (HTTP {exc.code})") from None

    def save(self):
        payload = {"message": "chore: recibos de modelos autorais sem dados clínicos", "branch": STATE_BRANCH,
                   "content": base64.b64encode(json.dumps(self.data, ensure_ascii=False, indent=2).encode()).decode()}
        if self.sha:
            payload["sha"] = self.sha
        result = self.api("PUT", "contents/scale-mail-receipts.json", payload)
        self.sha = result["content"]["sha"]


def select_pending(records: list[dict], receipts: dict) -> list[dict]:
    selected = []
    for r in records:
        receipt = receipts.get(fingerprint(r))
        if receipt and receipt.get("status") == "pending":
            raise RuntimeError("Envio anterior com resultado incerto; reconciliar recibo antes de reenviar")
        if receipt and receipt.get("status") not in {"smtp_accepted", "sent_via_gmail", "pending"}:
            raise ValueError("Estado de recibo desconhecido")
        if receipt is None:
            selected.append(r)
    return selected


def smtp_settings() -> dict:
    names = ["SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM"]
    missing = [n for n in names if not os.environ.get(n)]
    if missing:
        raise RuntimeError("BLOCKED_EXTERNAL_SCALE_MAIL: configurar secrets " + ", ".join(missing))
    cfg = {n: os.environ[n] for n in names}
    if int(cfg["SMTP_PORT"]) not in {465, 587} or not re.fullmatch(r"[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+", cfg["SMTP_FROM"]):
        raise ValueError("Exigir remetente válido e SMTP com TLS (465 ou 587)")
    return cfg


def send_records(records: list[dict], store: ReceiptStore, output: Path, cfg: dict) -> int:
    todo = select_pending(records, store.data["receipts"])
    for start in range(0, len(todo), 5):
        batch = todo[start:start + 5]
        keys = [fingerprint(r) for r in batch]
        batch_id = hashlib.sha256("|".join(sorted(keys)).encode()).hexdigest()
        msg = EmailMessage()
        msg["From"], msg["To"] = cfg["SMTP_FROM"], RECIPIENT
        msg["Date"] = format_datetime(datetime.now(timezone.utc))
        msg["Message-ID"] = f"<neuroped-{batch_id}@{cfg['SMTP_FROM'].split('@')[1]}>"
        msg["Subject"] = f"NeuroPed SDG | {len(batch)} modelo(s) autoral(is) em PDF | armazenamento"
        msg.set_content("Dr. Jadson,\n\nSeguem os novos modelos autorais em branco, em PDFs individuais e em um pacote consolidado. Não contêm respostas de pacientes. Versões pendentes de revisão permanecem rascunhos; o envio não significa aprovação clínica.\n\n" + WARNING + "\n\nDr. Jadson Fraga · Neuropediatra · CRM-PE 25227 · RQE 17756")
        attachments = []
        for r in batch:
            path = output / f"{r['id']}-{fingerprint(r)[7:19]}.pdf"
            render_pdf([r], path)
            attachments.append(path)
        package = output / f"pacote-{batch_id[:12]}.pdf"
        render_pdf(batch, package)
        attachments.append(package)
        for path in attachments:
            msg.add_attachment(path.read_bytes(), maintype="application", subtype="pdf", filename=path.name)
        if len(msg.as_bytes()) > 20_000_000:
            raise ValueError("Lote excede limite de e-mail; dividir antes do envio")
        context = ssl.create_default_context()
        port = int(cfg["SMTP_PORT"])
        server = smtplib.SMTP_SSL(cfg["SMTP_HOST"], port, timeout=45, context=context) if port == 465 else smtplib.SMTP(cfg["SMTP_HOST"], port, timeout=45)
        try:
            server.ehlo()
            if port == 587:
                server.starttls(context=context)
                server.ehlo()
            server.login(cfg["SMTP_USERNAME"], cfg["SMTP_PASSWORD"])
            # Durable intent precedes SMTP DATA; unknown outcomes never auto-retry.
            for key in keys:
                store.data["receipts"][key] = {"status": "pending", "messageId": str(msg["Message-ID"]), "run": os.getenv("GITHUB_RUN_ID", "")}
            store.save()
            rejected = server.send_message(msg)
            if rejected:
                raise RuntimeError("Servidor não aceitou o destinatário; reconciliar recibo")
            for key in keys:
                store.data["receipts"][key]["status"] = "smtp_accepted"
            store.save()
        finally:
            server.close()
    return len(todo)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--send", action="store_true")
    parser.add_argument("--extra", type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "out/authorial-scales")
    args = parser.parse_args()
    records = load_records(args.extra)
    if args.send:
        cfg = smtp_settings()
        total = send_records(records, ReceiptStore(), args.output, cfg)
        print(f"{total} modelo(s) aceito(s) pelo SMTP. Aceite não comprova leitura/entrega final.")
    else:
        for record in records:
            render_pdf([record], args.output / f"{record['id']}.pdf")
        render_pdf(records, args.output / "pacote-modelos-autorais.pdf")
        print(f"Modo offline: {len(records)} modelo(s) renderizado(s); nenhum e-mail enviado.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        # Never emit credentials, SMTP response bodies or tracebacks into Actions.
        print(str(exc) if isinstance(exc, (ValueError, RuntimeError)) else f"Falha operacional: {type(exc).__name__}; conferir transporte e recibos.", file=sys.stderr)
        sys.exit(1)
