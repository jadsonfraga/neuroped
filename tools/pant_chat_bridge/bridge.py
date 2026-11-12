# -*- coding: utf-8 -*-
"""Ponte local privada NeuroPed: Markdown PANT -> motor editorial existente -> PDF.
Nenhum dado clinico e enviado ao GitHub, Vercel ou Cloudflare por esta ponte.
"""
from __future__ import annotations

import hashlib
import hmac
import importlib.util
import json
import os
import re
import secrets
import sys
import tempfile
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

HOST = "127.0.0.1"
PORT = int(os.getenv("NEUROPED_RENDER_PORT", "8768"))
HOME = Path(os.getenv("NEUROPED_RENDER_HOME", str(Path(__file__).resolve().parent)))
ENGINE = Path(os.getenv("NEUROPED_RENDER_ENGINE", r"C:\NeuroPed\RenderHTML\render_md.py"))
MAX_MD_BYTES = 1_000_000
ORIGINS = {
    "https://neuroped.pages.dev",
    "https://superneuroped.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}
SESSION = secrets.token_urlsafe(48)
LOCK = threading.Lock()

def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def sha256(data: bytes):
    return hashlib.sha256(data).hexdigest()

def stem(name: str):
    candidate = Path(name.replace("\\", "/").split("/")[-1]).stem
    result = re.sub(r"[^a-zA-Z0-9_-]+", "_", candidate).strip("_")[:75]
    return result or "LAUDO"

def source_bytes(markdown: str) -> bytes:
    if not isinstance(markdown, str):
        raise ValueError("Markdown deve ser texto")
    data = markdown.encode("utf-8")
    if not data.strip() or len(data) > MAX_MD_BYTES:
        raise ValueError("Markdown vazio ou superior a 1 MB")
    # O motor de impressao atual injeta o texto em um script de pagina local.
    # Bloquear delimitadores ativos e URLs executaveis para impedir injecao.
    if re.search(r"(?is)<\s*/?\s*(?:script|iframe|object|embed|svg|meta|base|link)\b|javascript\s*:|<\s*/\s*script", markdown):
        raise ValueError("HTML ativo nao e permitido no Markdown clinico")
    return data

def load_engine():
    if not ENGINE.is_file():
        raise RuntimeError("Motor local PANT indisponivel")
    if str(ENGINE.parent) not in sys.path:
        sys.path.insert(0, str(ENGINE.parent))
    spec = importlib.util.spec_from_file_location("neuroped_render_md_local", ENGINE)
    if spec is None or spec.loader is None:
        raise RuntimeError("Falha ao carregar o motor PANT")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def dirs():
    for name in ("saida", "aceites", "entrada", "recibos"):
        (HOME / name).mkdir(parents=True, exist_ok=True)

def is_approved(source_hash: str):
    p = HOME / "aceites" / (source_hash + ".json")
    if not p.is_file():
        return False
    try:
        return json.loads(p.read_text(encoding="utf-8")).get("sha256") == source_hash
    except (ValueError, OSError):
        return False

def approve(markdown: str, confirmation: str):
    data = source_bytes(markdown)
    if confirmation != "REVISEI E APROVO O TEXTO INTEGRAL":
        raise PermissionError("Aceite medico explicito ausente")
    digest = sha256(data)
    p = HOME / "aceites" / (digest + ".json")
    record = {
        "sha256": digest,
        "aceite_declarado": True,
        "timestamp_utc": utc_now(),
        "observacao": "Declaracao de revisao no dispositivo; nao constitui assinatura digital.",
    }
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(tmp, p)
    return record

def add_preview_watermark(pdf_path: Path):
    try:
        import fitz
    except ImportError as exc:
        raise RuntimeError("PyMuPDF necessario para sinalizar previa") from exc
    doc = fitz.open(str(pdf_path))
    if doc.page_count < 2:
        doc.close()
        raise RuntimeError("PDF sem paginas clinicas suficientes")
    for page in doc:
        box = page.rect
        page.insert_text(
            (box.width / 2 - 104, box.height / 2),
            "RASCUNHO - SEM VALIDADE CLINICA",
            fontsize=11, fontname="helv", color=(0.58, 0.16, 0.16),
            rotate=0, overlay=True, fill_opacity=0.5,
        )
        page.insert_text(
            (52, box.height - 22),
            "Revisao medica pendente - nao utilizar como laudo definitivo",
            fontsize=8, fontname="helv", color=(0.58, 0.16, 0.16),
            overlay=True,
        )
    tmp = pdf_path.with_suffix(".watermark.tmp")
    doc.save(str(tmp), garbage=3, deflate=True)
    doc.close()
    os.replace(tmp, pdf_path)
    test = fitz.open(str(pdf_path))
    try:
        if not all("RASCUNHO" in page.get_text() for page in test):
            raise RuntimeError("Carimbo de previa ausente em alguma pagina")
    finally:
        test.close()

def render(markdown: str, filename: str, mode: str):
    raw = source_bytes(markdown)
    if mode not in ("preview", "final"):
        raise ValueError("Modo deve ser preview ou final")
    digest = sha256(raw)
    if mode == "final" and not is_approved(digest):
        raise PermissionError("PDF definitivo exige aceite medico do SHA-256 exato")
    dirs()
    filename_out = f"{stem(filename)}_{digest[:16]}_{'APROVADO' if mode == 'final' else 'REVISAO'}.pdf"
    out = HOME / "saida" / filename_out
    # Todos os trabalhos, incluindo o QA do renderer, sao serializados.
    with LOCK:
        if not out.exists():
            engine = load_engine()
            candidate = out.with_suffix(".rendering.pdf")
            try:
                evidence = engine.render_texto(markdown, candidate)
                if mode == "preview":
                    add_preview_watermark(candidate)
                data = candidate.read_bytes()
                if len(data) < 5000 or not data.startswith(b"%PDF-"):
                    raise RuntimeError("Saida PDF invalida")
                os.replace(candidate, out)
                receipt = {
                    "source_sha256": digest,
                    "pdf_sha256": sha256(data),
                    "status": "aprovado_sem_assinatura" if mode == "final" else "revisao_medica_pendente",
                    "paginas": evidence.get("paginas"),
                    "gerado_em_utc": utc_now(),
                    "nome_pdf": filename_out,
                    "qa": "motor_original_aprovado_e_integridade_pdf_verificada",
                }
                (HOME / "recibos" / (out.stem + ".json")).write_text(
                    json.dumps(receipt, ensure_ascii=False, indent=2), encoding="utf-8"
                )
            finally:
                candidate.unlink(missing_ok=True)
        # Nao confiar em PDF cacheado sem recibo autentico de integridade.
        data = out.read_bytes()
        receipt_path = HOME / "recibos" / (out.stem + ".json")
        if not receipt_path.is_file():
            raise RuntimeError("PDF sem comprovante de integridade")
        receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
        if (
            receipt.get("source_sha256") != digest
            or receipt.get("pdf_sha256") != sha256(data)
            or receipt.get("status") != (
                "aprovado_sem_assinatura" if mode == "final" else "revisao_medica_pendente"
            )
        ):
            raise RuntimeError("Integridade ou estado clinico do PDF nao conferem")
        if mode == "preview":
            import fitz
            doc = fitz.open(stream=data, filetype="pdf")
            try:
                if not all("RASCUNHO" in page.get_text() for page in doc):
                    raise RuntimeError("PDF sem carimbo de revisao em todas as paginas")
            finally:
                doc.close()
    return data, {"source_sha256": digest, "pdf_sha256": sha256(data), "name": filename_out}

def inbox_loop():
    dirs()
    while True:
        try:
            for p in (HOME / "entrada").glob("*.md"):
                if not p.is_file() or time.time() - p.stat().st_mtime < 1.5:
                    continue
                raw = p.read_bytes()
                digest = sha256(raw)
                receipt = HOME / "recibos" / (stem(p.name) + "_" + digest[:16] + ".inbox.json")
                if receipt.exists():
                    continue
                try:
                    _, result = render(raw.decode("utf-8-sig"), p.name, "preview")
                    info = {"status": "renderizado_em_revisao", "pdf": result["name"], "sha256": digest}
                except Exception as exc:
                    info = {"status": "erro", "classe": type(exc).__name__, "detalhe": str(exc)[:200]}
                receipt.write_text(json.dumps(info, ensure_ascii=False), encoding="utf-8")
        except Exception:
            # Monitor nao pode encerrar o servico; nao registrar dados clinicos.
            pass
        time.sleep(2)

class Handler(BaseHTTPRequestHandler):
    server_version = "NeuroPedLocalRender/1"
    def log_message(self, fmt, *args):
        # Nao registrar URLs, payload, nomes ou texto de pacientes.
        pass

    def allowed(self):
        return (self.headers.get("Host", "").split(":")[0] in ("127.0.0.1", "localhost")
                and self.headers.get("Origin") in ORIGINS)

    def headers_secure(self, status: int, content_type: str, size: int):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(size))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", ""))
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-NeuroPed-Session")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Expose-Headers", "X-NeuroPed-Source-SHA256, X-NeuroPed-Pdf-SHA256, Content-Disposition")
        self.send_header("Vary", "Origin")
        self.end_headers()

    def json_response(self, status: int, result):
        b = json.dumps(result, ensure_ascii=False).encode("utf-8")
        self.headers_secure(status, "application/json; charset=utf-8", len(b))
        self.wfile.write(b)

    def do_OPTIONS(self):
        if not self.allowed():
            self.send_error(403)
            return
        self.headers_secure(204, "text/plain", 0)

    def do_GET(self):
        if not self.allowed():
            self.send_error(403)
            return
        if self.path == "/health":
            return self.json_response(200, {"status": "online", "engine_available": ENGINE.is_file()})
        if self.path == "/session":
            return self.json_response(200, {"session": SESSION})
        if self.path.startswith("/jobs"):
            if not self.valid_session():
                return self.json_response(403, {"error": "Sessao invalida"})
            entries = []
            for f in sorted((HOME / "recibos").glob("*.inbox.json"), key=lambda p: p.stat().st_mtime, reverse=True)[:30]:
                try:
                    entries.append(json.loads(f.read_text(encoding="utf-8")))
                except (ValueError, OSError):
                    continue
            return self.json_response(200, {"items": entries})
        self.json_response(404, {"error": "Rota inexistente"})

    def valid_session(self):
        return hmac.compare_digest(self.headers.get("X-NeuroPed-Session", ""), SESSION)

    def do_POST(self):
        if not self.allowed() or not self.valid_session():
            return self.json_response(403, {"error": "Acesso negado"})
        if self.path not in ("/render", "/approve"):
            return self.json_response(404, {"error": "Rota inexistente"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_MD_BYTES * 3:
                return self.json_response(413, {"error": "Payload excede limite"})
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError("Payload deve ser objeto")
            markdown = payload.get("markdown", "")
            if self.path == "/approve":
                result = approve(markdown, payload.get("confirmation", ""))
                return self.json_response(200, result)
            data, meta = render(markdown, str(payload.get("filename", "laudo.md")), payload.get("mode", "preview"))
            self.send_response(200)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Content-Disposition", f'attachment; filename="{meta["name"]}"')
            self.send_header("X-NeuroPed-Source-SHA256", meta["source_sha256"])
            self.send_header("X-NeuroPed-Pdf-SHA256", meta["pdf_sha256"])
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", ""))
            self.send_header("Access-Control-Expose-Headers", "X-NeuroPed-Source-SHA256, X-NeuroPed-Pdf-SHA256, Content-Disposition")
            self.send_header("Vary", "Origin")
            self.end_headers()
            self.wfile.write(data)
        except PermissionError as exc:
            self.json_response(409, {"error": str(exc)})
        except (ValueError, UnicodeError) as exc:
            self.json_response(422, {"error": str(exc)})
        except Exception as exc:
            self.json_response(500, {"error": "Falha no motor PANT ou QA", "detail": str(exc)[:220]})

def main():
    dirs()
    monitor = threading.Thread(target=inbox_loop, daemon=True, name="neuroped-md-watcher")
    monitor.start()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    server.daemon_threads = True
    server.serve_forever(poll_interval=0.5)

if __name__ == "__main__":
    main()
