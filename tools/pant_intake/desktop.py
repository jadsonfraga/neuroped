"""NeuroPed Fluxo Desktop: interface nativa, somente local, sem emissão final."""
from __future__ import annotations

import argparse
import json
import sys
import tempfile
import traceback
from datetime import date
from pathlib import Path

import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from neuroped_fluxo.core import DOMAIN_LABELS, empty_case
from desktop_support import (DESKTOP_VERSION, Session, checked_json, export_case_bundle,
                             load_json, pretty, process_folder, safe_report, save_new)


def demonstration() -> dict:
    c = empty_case()
    today = date.today().isoformat()
    c.update(case_id="DEMO-001", encounter_id="CONSULTA-DEMO-001", encounter_date=today, purpose="evolucao", demo=True)
    c["patient"].update(age_months=72, school_enrolled=True)
    c["sources"] = [{"id": "pais", "type": "relato_pais", "date": today},
                    {"id": "medico", "type": "observacao_medico", "date": today}]
    c["domains"] = {k: [{"text": text, "source_id": sid, "review_status": "confirmado"}] for k, text, sid in (
        ("queixa", "Exemplo fictício de acompanhamento, sem paciente real.", "pais"),
        ("historia_atual", "Informações inteiramente sintéticas para testar o fluxo.", "pais"),
        ("conduta", "Conferência de dados fictícios; nenhuma prescrição foi realizada.", "medico"))}
    c["risk"]["signal"] = "ausente"
    c["focus"]["epilepsy"] = False
    return c


class App(ttk.Frame):
    def __init__(self, root):
        super().__init__(root, padding=16)
        self.root = root
        self.session = Session(empty_case())
        self.watch_enabled = False
        self.watch_job = None
        self.source_dir = tk.StringVar()
        self.destination_dir = tk.StringVar()
        self.status = tk.StringVar(value="Novo registro vazio. Use apenas dados fictícios ou previamente anonimizados.")
        root.title("NeuroPed SDG | Fluxo Desktop " + DESKTOP_VERSION)
        root.geometry("1120x820")
        root.minsize(860, 650)
        self.pack(fill="both", expand=True)
        ttk.Label(self, text="NeuroPed SDG · Entrada e revisão", font=("Segoe UI", 19, "bold")).pack(anchor="w")
        ttk.Label(self, text="Execução local · sem conta, sem envio à nuvem e sem publicação de laudos").pack(anchor="w", pady=(3, 12))
        bar = ttk.Frame(self)
        bar.pack(fill="x", pady=(0, 10))
        for label, action in (("Novo", self.new), ("Abrir caso JSON", self.open_case),
                              ("Demonstração fictícia", self.demo), ("Salvar cópia do caso", self.save_case)):
            ttk.Button(bar, text=label, command=lambda fn=action: self.action(fn)).pack(side="left", padx=(0, 8))
        self.tabs = ttk.Notebook(self)
        self.tabs.pack(fill="both", expand=True)
        self.entry = ttk.Frame(self.tabs, padding=12)
        self.capture = ttk.Frame(self.tabs, padding=12)
        self.review = ttk.Frame(self.tabs, padding=12)
        self.batch = ttk.Frame(self.tabs, padding=12)
        for frame, title in ((self.entry, "1. Caso estruturado"), (self.capture, "2. Texto / pré-consulta"),
                             (self.review, "3. Pendências e rascunhos"), (self.batch, "4. Pasta de entrada")):
            self.tabs.add(frame, text=title)
        ttk.Label(self.entry, text="Identificação, fontes, peso, hipóteses e conduta no contrato JSON. Nada é preenchido por inferência.", wraplength=990).pack(anchor="w")
        self.json_text = self.textbox(self.entry)
        ttk.Button(self.entry, text="Aplicar alterações e invalidar rascunho anterior", command=lambda: self.action(self.apply)).pack(anchor="w", pady=8)
        ttk.Label(self.capture, text="Escolha a fonte. Use domínio: texto por linha; os trechos entram pendentes de conferência.", wraplength=980).pack(anchor="w")
        self.source = tk.StringVar(value="relato_pais")
        ttk.Combobox(self.capture, textvariable=self.source, state="readonly", width=35, values=("relato_pais", "observacao_medico", "documento_escolar", "relatorio_terapeutico", "documento_externo", "paciente")).pack(anchor="w", pady=6)
        self.transcript = self.textbox(self.capture)
        self.transcript.insert("1.0", "\n".join(k + ": " for k in DOMAIN_LABELS))
        capture_bar = ttk.Frame(self.capture)
        capture_bar.pack(fill="x", pady=8)
        for label, action in (("Importar arquivo de texto", self.open_text), ("Estruturar no caso", self.import_text),
                              ("Importar Notes JSON", self.open_notes)):
            ttk.Button(capture_bar, text=label, command=lambda fn=action: self.action(fn)).pack(side="left", padx=(0, 8))
        ttk.Label(self.capture, text="Pré-consulta: a família preenche apenas esta área como relato. Exporte cópia e confira o JSON antes de mudar review_status para confirmado.", wraplength=990).pack(anchor="w")
        review_bar = ttk.Frame(self.review)
        review_bar.pack(fill="x")
        for label, action in (("Validar entrada", self.validate), ("Compilar rascunhos", self.compile),
                              ("Exportar pasta de conferência", self.export)):
            ttk.Button(review_bar, text=label, command=lambda fn=action: self.action(fn)).pack(side="left", padx=(0, 8))
        self.result = tk.StringVar(value="NÃO AVALIADO")
        ttk.Label(self.review, textvariable=self.result, font=("Segoe UI", 12, "bold")).pack(anchor="w", pady=8)
        self.issues = ttk.Treeview(self.review, columns=("level", "code", "message"), show="headings", height=7)
        for name, title, width in (("level", "Gravidade", 90), ("code", "Código", 115), ("message", "Pendência", 720)):
            self.issues.heading(name, text=title)
            self.issues.column(name, width=width, stretch=(name == "message"))
        self.issues.pack(fill="x")
        self.doc_kind = tk.StringVar(value="anamnese")
        combo = ttk.Combobox(self.review, textvariable=self.doc_kind, state="readonly", values=("anamnese", "evolucao", "escola", "encaminhamento", "receita_conferencia"))
        combo.pack(anchor="w", pady=8)
        combo.bind("<<ComboboxSelected>>", lambda _: self.show_document())
        self.document = self.textbox(self.review, height=8)
        self.document.configure(state="disabled")
        ttk.Label(self.review, text="Rascunhos não são receitas ou laudos finais. PDF PANT, assinatura e integração ao motor continuam separados.", wraplength=990).pack(anchor="w", pady=5)
        ttk.Label(self.batch, text="Processa arquivos JSON completos da pasta escolhida. Não lê o Desktop inteiro, não move originais e não aprova casos.", wraplength=980).pack(anchor="w", pady=8)
        for title, var in (("Pasta de entrada", self.source_dir), ("Pasta de saída, fora da entrada", self.destination_dir)):
            ttk.Label(self.batch, text=title).pack(anchor="w")
            row = ttk.Frame(self.batch)
            row.pack(fill="x", pady=6)
            ttk.Entry(row, textvariable=var).pack(side="left", fill="x", expand=True)
            ttk.Button(row, text="Escolher", command=lambda v=var: self.choose_folder(v)).pack(side="left", padx=6)
        batch_bar = ttk.Frame(self.batch)
        batch_bar.pack(fill="x", pady=10)
        ttk.Button(batch_bar, text="Processar agora", command=lambda: self.action(self.process)).pack(side="left", padx=(0, 8))
        self.watch_button = ttk.Button(batch_bar, text="Observar enquanto aberto", command=self.toggle_watch)
        self.watch_button.pack(side="left")
        self.batch_result = self.textbox(self.batch)
        ttk.Label(self.batch, text="A observação só existe com esta janela aberta. Não instala tarefa agendada, não sobe com o Windows e não envia documentos.", wraplength=990).pack(anchor="w")
        ttk.Label(self, textvariable=self.status, wraplength=1060).pack(fill="x", pady=(12, 0))
        ttk.Label(self, text="Dr. Jadson Fraga · Neuropediatra · CRM-PE 25227 · RQE 17756 | Soli Deo Gloria").pack(anchor="w", pady=(8, 0))
        root.protocol("WM_DELETE_WINDOW", self.close)
        self.refresh()

    @staticmethod
    def textbox(parent, height=12):
        frame = ttk.Frame(parent)
        frame.pack(fill="both", expand=True, pady=6)
        text = tk.Text(frame, wrap="word", height=height, undo=True, font=("Consolas", 10))
        scroll = ttk.Scrollbar(frame, orient="vertical", command=text.yview)
        text.configure(yscrollcommand=scroll.set)
        text.pack(side="left", fill="both", expand=True)
        scroll.pack(side="right", fill="y")
        return text

    def action(self, fn):
        try:
            fn()
        except Exception as exc:
            # Não grava conteúdo clínico ou stack trace em arquivo.
            self.status.set("Operação não concluída. Nenhum laudo foi emitido.")
            messagebox.showerror("Não concluído", str(exc)[:400], parent=self.root)

    def refresh(self):
        self.json_text.delete("1.0", "end")
        self.json_text.insert("1.0", pretty(self.session.case))
        self.issues.delete(*self.issues.get_children())
        self.result.set("NÃO AVALIADO — alterações invalidam o resultado anterior")
        self.show_document()

    def apply(self):
        self.session.set_case(checked_json(self.json_text.get("1.0", "end")))
        self.refresh()
        self.status.set("Alterações aplicadas. É necessário validar novamente.")

    def new(self):
        if messagebox.askyesno("Novo registro", "Descartar alterações não exportadas e iniciar registro vazio?", parent=self.root):
            self.session.set_case(empty_case())
            self.refresh()

    def demo(self):
        self.session.set_case(demonstration())
        self.refresh()
        self.status.set("DEMONSTRAÇÃO FICTÍCIA — não corresponde a paciente real.")

    def open_case(self):
        name = filedialog.askopenfilename(parent=self.root, filetypes=[("Caso JSON", "*.json")])
        if name:
            self.session.set_case(load_json(Path(name)))
            self.refresh()
            self.status.set("Caso aberto em memória. O original não foi alterado.")

    def save_case(self):
        self.apply()
        name = filedialog.asksaveasfilename(parent=self.root, defaultextension=".json", initialfile="caso_copia.json")
        if name:
            save_new(Path(name), pretty(self.session.case))
            self.status.set("Nova cópia exportada. Arquivos existentes nunca são substituídos.")

    def open_text(self):
        name = filedialog.askopenfilename(parent=self.root, filetypes=[("Texto", "*.txt *.md")])
        if name:
            p = Path(name)
            if p.stat().st_size > 500_000:
                raise ValueError("Texto maior que 500 KB.")
            self.transcript.delete("1.0", "end")
            self.transcript.insert("1.0", p.read_text(encoding="utf-8-sig"))

    def import_text(self):
        self.apply()
        self.session.text(self.transcript.get("1.0", "end"), self.source.get())
        self.refresh()
        self.status.set("Texto importado. Cada trecho permanece pendente; confira fonte e conteúdo no JSON.")

    def open_notes(self):
        self.apply()
        name = filedialog.askopenfilename(parent=self.root, filetypes=[("Notes JSON", "*.json")])
        if name:
            self.session.notes(load_json(Path(name)))
            self.refresh()
            self.status.set("Notes importado; mistura de atendimentos e versão divergente são bloqueadas.")

    def show_report(self, report):
        self.issues.delete(*self.issues.get_children())
        for i in report["issues"]:
            self.issues.insert("", "end", values=(i["severity"], i["code"], i["message"]))
        self.result.set(f'{report["status"]} | preenchimento {report["completeness"]}% — não é nota clínica')

    def validate(self):
        self.apply()
        self.show_report(self.session.validate())
        self.tabs.select(self.review)

    def compile(self):
        self.validate()
        self.session.compile()
        self.show_document()
        self.status.set("Rascunhos compilados a partir de dados fornecidos. Nenhum PDF final foi emitido.")

    def show_document(self):
        content = "Nenhum rascunho atual. Alterações no caso invalidam a compilação anterior."
        if self.session.draft:
            content = self.session.draft["documents"].get(self.doc_kind.get(), content)
        self.document.configure(state="normal")
        self.document.delete("1.0", "end")
        self.document.insert("1.0", content)
        self.document.configure(state="disabled")

    def export(self):
        self.apply()
        directory = filedialog.askdirectory(parent=self.root, title="Saída local: dados exportados não são criptografados")
        if directory:
            target = export_case_bundle(self.session.case, Path(directory))
            self.status.set("Pasta exportada: " + str(target) + ". Confira qa_entrada.json; não é documento final.")

    def choose_folder(self, var):
        directory = filedialog.askdirectory(parent=self.root)
        if directory:
            var.set(directory)

    def process(self):
        if not self.source_dir.get() or not self.destination_dir.get():
            raise ValueError("Selecione as duas pastas explicitamente.")
        result = process_folder(Path(self.source_dir.get()), Path(self.destination_dir.get()))
        self.batch_result.delete("1.0", "end")
        self.batch_result.insert("1.0", pretty(result))
        self.status.set(f'{result["processed"]} entradas examinadas; status {result["status"]}; zero PDFs finais.')
        return result

    def toggle_watch(self):
        if self.watch_enabled:
            self.watch_enabled = False
            if self.watch_job:
                self.root.after_cancel(self.watch_job)
                self.watch_job = None
            self.watch_button.configure(text="Observar enquanto aberto")
            self.status.set("Observação encerrada. Não existe tarefa em segundo plano.")
        else:
            try:
                self.process()
            except Exception as exc:
                messagebox.showerror("Não iniciado", str(exc)[:300], parent=self.root)
                return
            self.watch_enabled = True
            self.watch_button.configure(text="Parar observação")
            self.watch_job = self.root.after(10000, self.tick)

    def tick(self):
        if self.watch_enabled:
            try:
                self.process()
            except Exception:
                self.toggle_watch()
                self.status.set("Observação interrompida por erro de acesso/entrada. Confira as pastas.")
                return
            self.watch_job = self.root.after(10000, self.tick)

    def close(self):
        if messagebox.askokcancel("Encerrar", "Encerrar? Alterações não exportadas serão perdidas; a observação de pastas também para.", parent=self.root):
            if self.watch_job:
                self.root.after_cancel(self.watch_job)
            self.root.destroy()


def smoke_gui(report_path: Path) -> None:
    """Homologação da interface real usando somente dados sintéticos."""
    root = tk.Tk()
    app = App(root)
    root.update()
    app.session.set_case(demonstration())
    app.refresh()
    app.compile()
    root.update()
    if app.session.report["status"] != "PRONTO" or not app.session.draft:
        raise RuntimeError("Fluxo GUI não concluiu validação/rascunho.")
    with tempfile.TemporaryDirectory() as tmp:
        folder = export_case_bundle(app.session.case, Path(tmp))
        expected = folder / "RASCUNHO_anamnese.md"
        if not expected.exists():
            raise RuntimeError("Exportação não comprovada.")
    evidence = {"version": DESKTOP_VERSION, "gui": "tkinter-native", "tabs": len(app.tabs.tabs()),
                "synthetic_only": True, "gate_status": app.session.report["status"],
                "drafts": len(app.session.draft["documents"]), "export_verified": True,
                "no_network_server": True, "frozen": bool(getattr(sys, "frozen", False)),
                "final_pdfs_emitted": 0, "platform": sys.platform}
    root.destroy()
    save_new(report_path, pretty(evidence))


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="NeuroPed SDG Fluxo Desktop")
    parser.add_argument("--smoke-gui", type=Path, help="Testar interface com dados fictícios e gravar evidência nova")
    args = parser.parse_args(argv)
    if args.smoke_gui:
        smoke_gui(args.smoke_gui)
        return 0
    root = tk.Tk()
    App(root)
    root.mainloop()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception:
        # Sem dumps que possam carregar dados do caso em falhas de execução.
        if sys.stderr is not None:
            print("NeuroPed Fluxo: operação não concluída.", file=sys.stderr)
        raise SystemExit(1)
