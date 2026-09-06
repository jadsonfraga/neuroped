"""Camada visual NeuroPed SDG para o desktop nativo.

Este módulo altera somente apresentação. Não toca no contrato clínico, validação,
compilação, exportação ou regras PANT.
"""
from __future__ import annotations

import sys
from pathlib import Path
import tkinter as tk
from tkinter import ttk

from PIL import Image, ImageDraw, ImageOps, ImageTk

NAVY = "#071A33"
NAVY_2 = "#102D50"
RED = "#B92D32"
GOLD = "#F4C45E"
GOLD_DARK = "#B98522"
WHITE = "#FFFDFC"
INK = "#102136"
MUTED = "#607184"
SOFT = "#F4F7FB"
SOFT_GOLD = "#FFF4D4"
SOFT_RED = "#FCEAEC"
BORDER = "#D8E2EE"

_ASSET_SOURCE = {
    "logo-master.jpeg": "dr-jadson-logo-super.jpeg",
    "dr-jadson-selfie.jpeg": "dr-jadson-selfie.jpeg",
    "dr-jadson-consultorio-full.jpeg": "dr-jadson-consultorio-full.jpeg",
    "dr-jadson-consultorio-superman.jpeg": "dr-jadson-consultorio-superman.jpeg",
    "dr-jadson-arte.jpeg": "dr-jadson-arte.jpeg",
    "mascote.png": "dr-fraga-kids/mascote.png",
    "logo-heroi.png": "dr-fraga-kids/logo-heroi.png",
}


def resource_path(name: str) -> Path:
    """Resolve ativos no fonte e no bundle PyInstaller."""
    relative = Path(_ASSET_SOURCE[name])
    frozen = getattr(sys, "_MEIPASS", None)
    if frozen:
        return Path(frozen) / "assets" / relative.name
    root = Path(__file__).resolve().parents[2]
    return root / "attached_assets" / "images" / relative


def _photo(app, name: str, size: tuple[int, int], radius: int = 20):
    path = resource_path(name)
    image = Image.open(path).convert("RGB")
    image = ImageOps.fit(image, size, method=Image.Resampling.LANCZOS)
    if radius:
        mask = Image.new("L", size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
        rgba = image.convert("RGBA")
        rgba.putalpha(mask)
        image = rgba
    rendered = ImageTk.PhotoImage(image)
    app._brand_images.append(rendered)
    return rendered


def configure_styles(root: tk.Misc) -> None:
    style = ttk.Style(root)
    try:
        style.theme_use("clam")
    except tk.TclError:
        pass
    style.configure("TFrame", background=WHITE)
    style.configure("TLabel", background=WHITE, foreground=INK, font=("Segoe UI", 10))
    style.configure("TButton", padding=(12, 8), font=("Segoe UI", 9, "bold"),
                    foreground=NAVY, background=WHITE, bordercolor=BORDER)
    style.map("TButton", background=[("active", SOFT_GOLD), ("pressed", GOLD)],
              foreground=[("pressed", NAVY)])
    style.configure("TNotebook", background=SOFT, borderwidth=0, tabmargins=(4, 6, 4, 0))
    style.configure("TNotebook.Tab", padding=(16, 10), font=("Segoe UI", 9, "bold"),
                    background="#E9EEF5", foreground=NAVY)
    style.map("TNotebook.Tab", background=[("selected", NAVY)],
              foreground=[("selected", WHITE)])
    style.configure("Treeview", rowheight=27, background=WHITE, fieldbackground=WHITE,
                    foreground=INK, bordercolor=BORDER)
    style.configure("Treeview.Heading", background=NAVY_2, foreground=WHITE,
                    font=("Segoe UI", 9, "bold"), padding=(8, 7))
    style.configure("TCombobox", padding=6)
    style.configure("TEntry", padding=6)


def _cta(parent, text: str, command, *, primary: bool = True) -> tk.Button:
    bg = GOLD if primary else WHITE
    fg = NAVY if primary else NAVY_2
    active = "#FFD97F" if primary else SOFT_GOLD
    return tk.Button(parent, text=text, command=command, bg=bg, fg=fg,
                     activebackground=active, activeforeground=NAVY,
                     font=("Segoe UI", 9, "bold"), relief="flat",
                     bd=0, padx=15, pady=9, cursor="hand2")


def add_brand_hero(parent, app, *, before=None) -> None:
    hero = tk.Frame(parent, bg=NAVY, padx=18, pady=14)
    hero.pack(fill="x", before=before)
    logo = _photo(app, "logo-master.jpeg", (108, 108), 20)
    tk.Label(hero, image=logo, bg=NAVY).pack(side="left", padx=(0, 16))

    copy = tk.Frame(hero, bg=NAVY)
    copy.pack(side="left", fill="both", expand=True)
    tk.Label(copy, text="NEUROPED SDG", bg=NAVY, fg=GOLD,
             font=("Segoe UI", 10, "bold")).pack(anchor="w")
    tk.Label(copy, text="Dr. Jadson Fraga", bg=NAVY, fg=WHITE,
             font=("Segoe UI", 23, "bold")).pack(anchor="w", pady=(1, 2))
    tk.Label(copy, text="Neurologia infantil · neurodesenvolvimento · epilepsia/EEG",
             bg=NAVY, fg="#D7E5F5", font=("Segoe UI", 10)).pack(anchor="w")
    tk.Label(copy, text="Fluxo clínico local com identidade NeuroPed — claro, rápido e reconhecível.",
             bg=NAVY, fg="#AFC3DB", font=("Segoe UI", 9)).pack(anchor="w", pady=(5, 0))

    right = tk.Frame(hero, bg=NAVY)
    right.pack(side="right", padx=(14, 0))
    portrait = _photo(app, "dr-jadson-selfie.jpeg", (86, 86), 43)
    tk.Label(right, image=portrait, bg=NAVY).pack(side="left", padx=(0, 10))
    button_box = tk.Frame(right, bg=NAVY)
    button_box.pack(side="left")
    _cta(button_box, "CARREGAR DEMONSTRAÇÃO", lambda: app.action(app.demo)).pack(fill="x")
    tk.Label(button_box, text="CRM-PE 25227 · RQE 17756", bg=NAVY, fg=GOLD,
             font=("Segoe UI", 8, "bold")).pack(anchor="e", pady=(6, 0))


def add_action_strip(parent, app, *, before=None) -> None:
    strip = tk.Frame(parent, bg=WHITE, padx=18, pady=10,
                     highlightbackground=BORDER, highlightthickness=1)
    strip.pack(fill="x", padx=14, pady=(10, 8), before=before)
    tk.Label(strip, text="ATALHOS", bg=WHITE, fg=MUTED,
             font=("Segoe UI", 8, "bold")).pack(side="left", padx=(0, 12))
    actions = (
        ("＋ Novo", app.new),
        ("Abrir caso", app.open_case),
        ("★ Demonstração", app.demo),
        ("Salvar cópia", app.save_case),
    )
    for index, (label, command) in enumerate(actions):
        button = _cta(strip, label, lambda fn=command: app.action(fn), primary=(index == 2))
        button.pack(side="left", padx=(0, 8))
    tk.Label(strip, text="Soli Deo Gloria", bg=WHITE, fg=GOLD_DARK,
             font=("Georgia", 10, "italic")).pack(side="right")


def add_tab_banner(parent, app, *, photo: str, eyebrow: str, headline: str,
                   body: str, cta: str, command, tone: str = "gold", before=None) -> None:
    bg = SOFT_GOLD if tone == "gold" else SOFT_RED if tone == "red" else "#EAF2FB"
    card = tk.Frame(parent, bg=bg, padx=14, pady=10,
                    highlightbackground=GOLD if tone == "gold" else BORDER,
                    highlightthickness=1)
    card.pack(fill="x", pady=(0, 12), before=before)

    portrait = _photo(app, photo, (90, 76), 17)
    tk.Label(card, image=portrait, bg=bg).pack(side="left", padx=(0, 13))
    text = tk.Frame(card, bg=bg)
    text.pack(side="left", fill="both", expand=True)
    tk.Label(text, text=eyebrow, bg=bg, fg=RED, font=("Segoe UI", 8, "bold")).pack(anchor="w")
    tk.Label(text, text=headline, bg=bg, fg=NAVY, font=("Segoe UI", 14, "bold")).pack(anchor="w", pady=(1, 2))
    tk.Label(text, text=body, bg=bg, fg=MUTED, font=("Segoe UI", 9),
             wraplength=620, justify="left").pack(anchor="w")

    mascot = _photo(app, "mascote.png", (66, 76), 16)
    tk.Label(card, image=mascot, bg=bg).pack(side="right", padx=(12, 0))
    _cta(card, cta, command).pack(side="right", padx=(14, 0))


def style_textbox(text: tk.Text) -> None:
    text.configure(bg="#F9FBFE", fg=INK, insertbackground=RED,
                   selectbackground=NAVY_2, selectforeground=WHITE,
                   relief="flat", bd=0, padx=10, pady=9,
                   highlightthickness=1, highlightbackground=BORDER,
                   highlightcolor=GOLD)


def add_brand_footer(parent, status_var: tk.StringVar) -> None:
    status = tk.Frame(parent, bg=SOFT, padx=14, pady=8)
    status.pack(fill="x", padx=14, pady=(8, 0))
    tk.Label(status, text="STATUS", bg=SOFT, fg=RED,
             font=("Segoe UI", 8, "bold")).pack(side="left", padx=(0, 10))
    tk.Label(status, textvariable=status_var, bg=SOFT, fg=INK,
             font=("Segoe UI", 9), anchor="w").pack(side="left", fill="x", expand=True)

    footer = tk.Frame(parent, bg=NAVY, padx=16, pady=8)
    footer.pack(fill="x", pady=(7, 0))
    tk.Label(footer, text="DR. JADSON FRAGA", bg=NAVY, fg=GOLD,
             font=("Segoe UI", 9, "bold")).pack(side="left")
    tk.Label(footer, text="  ·  Neuropediatra  ·  CRM-PE 25227  ·  RQE 17756",
             bg=NAVY, fg=WHITE, font=("Segoe UI", 9)).pack(side="left")
    tk.Label(footer, text="@drjadsonfraganeuroped  ·  Soli Deo Gloria",
             bg=NAVY, fg="#BFD0E3", font=("Segoe UI", 8)).pack(side="right")


def apply_brand_overlay(app) -> None:
    """Reestiliza a janela já construída sem alterar handlers ou dados."""
    app._brand_images = []
    app.root.geometry("1280x900")
    app.root.minsize(1020, 720)
    app.root.configure(bg=SOFT)
    app.configure(padding=0)
    configure_styles(app.root)

    children = list(app.winfo_children())
    tab_index = children.index(app.tabs)
    for child in children[:tab_index] + children[tab_index + 1:]:
        child.pack_forget()

    add_brand_hero(app, app, before=app.tabs)
    add_action_strip(app, app, before=app.tabs)

    banners = (
        (app.entry, "dr-jadson-consultorio-full.jpeg", "01 · CASO ESTRUTURADO",
         "Dados com hierarquia, identidade e foco.",
         "O núcleo continua igual; a apresentação agora destaca o que importa e mantém sua marca em primeiro plano.",
         "CARREGAR DEMO", lambda: app.action(app.demo), "gold"),
        (app.capture, "dr-jadson-consultorio-superman.jpeg", "02 · PRÉ-CONSULTA",
         "Receba o relato com presença de marca.",
         "Foto, mascote e chamada clara acompanham a entrada sem modificar o contrato do caso nem confirmar dados automaticamente.",
         "IMPORTAR TEXTO", lambda: app.action(app.open_text), "blue"),
        (app.review, "dr-jadson-arte.jpeg", "03 · REVISÃO",
         "Do dado ao rascunho, com Dr. Jadson no centro.",
         "Validação, pendências e rascunhos permanecem funcionais; a tela ganha contraste, assinatura visual e CTA inequívoco.",
         "VALIDAR AGORA", lambda: app.action(app.validate), "red"),
        (app.batch, "dr-jadson-selfie.jpeg", "04 · FLUXO LOCAL",
         "Seu método. Sua identidade. Seu fluxo.",
         "A automação de pastas continua local e separada da emissão final, agora com uma superfície mais memorável e proprietária.",
         "PROCESSAR PASTA", lambda: app.action(app.process), "gold"),
    )
    for parent, photo, eyebrow, headline, body, cta, command, tone in banners:
        first = parent.winfo_children()[0] if parent.winfo_children() else None
        add_tab_banner(parent, app, photo=photo, eyebrow=eyebrow, headline=headline,
                       body=body, cta=cta, command=command, tone=tone, before=first)

    for text in (app.json_text, app.transcript, app.document, app.batch_result):
        style_textbox(text)

    app.tabs.pack_configure(fill="both", expand=True, padx=14)
    add_brand_footer(app, app.status)
