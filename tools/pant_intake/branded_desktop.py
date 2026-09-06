"""Entrypoint visual premium do NeuroPed Fluxo Desktop.

A camada herda integralmente o App funcional e aplica somente a apresentação.
"""
from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path
import tkinter as tk

from PIL import ImageGrab

from brand_ui import apply_brand_overlay
from desktop import App, demonstration
from desktop_support import DESKTOP_VERSION, export_case_bundle, pretty, save_new


class BrandedApp(App):
    def __init__(self, root):
        super().__init__(root)
        apply_brand_overlay(self)
        screen_w = root.winfo_screenwidth()
        screen_h = root.winfo_screenheight()
        width = min(1280, max(980, screen_w - 60))
        height = min(860, max(680, screen_h - 70))
        root.geometry(f"{width}x{height}")
        root.minsize(min(980, width), min(680, height))
        root.title("NeuroPed SDG | Dr. Jadson Fraga | Fluxo Desktop " + DESKTOP_VERSION)


def smoke_gui(report_path: Path) -> None:
    """Homologação do shell visual usando somente dados sintéticos."""
    root = tk.Tk()
    app = BrandedApp(root)
    root.update()
    app.session.set_case(demonstration())
    app.refresh()
    app.compile()
    root.update()
    if app.session.report["status"] != "PRONTO" or not app.session.draft:
        raise RuntimeError("Fluxo GUI não concluiu validação/rascunho.")
    if len(app.tabs.tabs()) != 4 or len(app._brand_images) < 10:
        raise RuntimeError("Camada visual NeuroPed incompleta.")
    with tempfile.TemporaryDirectory() as tmp:
        folder = export_case_bundle(app.session.case, Path(tmp))
        expected = folder / "RASCUNHO_anamnese.md"
        if not expected.exists():
            raise RuntimeError("Exportação não comprovada.")

    root.lift()
    root.update()
    x, y = root.winfo_rootx(), root.winfo_rooty()
    w, h = root.winfo_width(), root.winfo_height()
    preview_path = report_path.with_suffix(".png")
    ImageGrab.grab(bbox=(x, y, x + w, y + h), all_screens=True).save(preview_path)
    if not preview_path.exists() or preview_path.stat().st_size < 20_000:
        raise RuntimeError("Prévia visual Windows não foi comprovada.")

    evidence = {
        "version": DESKTOP_VERSION,
        "gui": "tkinter-native-branded",
        "tabs": len(app.tabs.tabs()),
        "brand_images_loaded": len(app._brand_images),
        "brand_shell": "NeuroPed SDG / Dr. Jadson Fraga",
        "preview_written": True,
        "synthetic_only": True,
        "gate_status": app.session.report["status"],
        "drafts": len(app.session.draft["documents"]),
        "export_verified": True,
        "no_network_server": True,
        "frozen": bool(getattr(sys, "frozen", False)),
        "final_pdfs_emitted": 0,
        "platform": sys.platform,
    }
    root.destroy()
    save_new(report_path, pretty(evidence))


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="NeuroPed SDG Fluxo Desktop — edição visual")
    parser.add_argument("--smoke-gui", type=Path, help="Testar interface com dados fictícios")
    args = parser.parse_args(argv)
    if args.smoke_gui:
        smoke_gui(args.smoke_gui)
        return 0
    root = tk.Tk()
    BrandedApp(root)
    root.mainloop()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception:
        if sys.stderr is not None:
            print("NeuroPed Fluxo: operação não concluída.", file=sys.stderr)
        raise SystemExit(1)
