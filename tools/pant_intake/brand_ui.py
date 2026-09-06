"""Camada visual premium NeuroPed SDG para o desktop nativo.

Este módulo altera somente apresentação. Não toca no contrato clínico, validação,
compilação, exportação, persistência ou regras PANT.
"""
from __future__ import annotations

import sys
from pathlib import Path
import tkinter as tk
from tkinter import ttk

from PIL import Image, ImageDraw, ImageOps, ImageTk

NAVY = "#06172C"
NAVY_2 = "#0D2947"
NAVY_3 = "#173B61"
BURGUNDY = "#8F232A"
RED = "#B52B32"
GOLD = "#D7A840"
GOLD_LIGHT = "#F1D58A"
GOLD_DARK = "#9D7424"
IVORY = "#FBF8F1"
WHITE = "#FFFFFF"
INK = "#112237"
MUTED = "#647487"
SOFT = "#F2F5F8"
SOFT_BLUE = "#EDF3F8"
SOFT_GOLD = "#F8F1E1"
BORDER = "#D5DEE8"
BORDER_GOLD = "#DCC37C"

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
    relative = Path(_ASSET_SOURCE[name])
    frozen = getattr(sys, "_MEIPASS", None)
    if frozen:
        return Path(frozen) / "assets" / relative.name
    root = Path(__file__).resolve().parents[2]
    return root / "attached_assets" / "images" / relative


def _photo(app, name: str, size: tuple[int, int], radius: int = 20):
    image = Image.open(resource_path(name)).convert("RGB")
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
    style.configure("TFrame", background=IVORY)
    style.configure("TLabel", background=IVORY, foreground=INK, font=("Segoe UI", 10))
    style.configure("TButton", padding=(14, 9), font=("Segoe UI", 9, "bold"),
                    foreground=NAVY, background=WHITE, bordercolor=BORDER)
    style.map("TButton", background=[("active", SOFT_GOLD), ("pressed", GOLD_LIGHT)])
    style.configure("TNotebook", background=SOFT, borderwidth=0, tabmargins=(4, 7, 4, 0))
    style.configure("TNotebook.Tab", padding=(18, 10), font=("Segoe UI", 9, "bold"),
                    background="#E6ECF2", foreground=NAVY)
    style.map("TNotebook.Tab", background=[("selected", NAVY_2)],
              foreground=[("selected", WHITE)])
    style.configure("Treeview", rowheight=29, background=WHITE, fieldbackground=WHITE,
                    foreground=INK, bordercolor=BORDER, font=("Segoe UI", 9))
    style.configure("Treeview.Heading", background=NAVY_2, foreground=WHITE,
                    font=("Segoe UI", 9, "bold"), padding=(8, 8))
    style.configure("TCombobox", padding=7)
    style.configure("TEntry", padding=7)


def _cta(parent, text: str, command, *, primary: bool = True) -> tk.Button:
    bg = GOLD if primary else NAVY_2
    fg = NAVY if primary else WHITE
    active = GOLD_LIGHT if primary else NAVY_3
    return tk.Button(parent, text=text, command=command, bg=bg, fg=fg,
                     activebackground=active, activeforeground=fg,
                     font=("Segoe UI", 9, "bold"), relief="flat",
                     bd=0, padx=16, pady=9, cursor="hand2")


def _framed_photo(parent, app, name: str, size: tuple[int, int], radius: int,
                  *, border: str = GOLD) -> tk.Frame:
    frame = tk.Frame(parent, bg=border, padx=2, pady=2)
    photo = _photo(app, name, size, radius)
    tk.Label(frame, image=photo, bg=NAVY).pack()
    return frame


def add_brand_hero(parent, app, *, before=None) -> None:
    shell = tk.Frame(parent, bg=GOLD, pady=2)
    shell.pack(fill="x", before=before)
    hero = tk.Frame(shell, bg=NAVY, padx=20, pady=13)
    hero.pack(fill="x")

    logo_box = tk.Frame(hero, bg=NAVY)
    logo_box.pack(side="left", padx=(0, 18))
    logo = _photo(app, "logo-master.jpeg", (98, 98), 18)
    tk.Label(logo_box, image=logo, bg=NAVY).pack()
    tk.Label(logo_box, text="NEUROPED SDG", bg=NAVY, fg=GOLD_LIGHT,
             font=("Segoe UI", 8, "bold")).pack(pady=(5, 0))

    copy = tk.Frame(hero, bg=NAVY)
    copy.pack(side="left", fill="both", expand=True)
    tk.Label(copy, text="NEUROLOGIA INFANTIL · MEDICINA DE PRECISÃO",
             bg=NAVY, fg=GOLD_LIGHT, font=("Segoe UI", 8, "bold")).pack(anchor="w")
    tk.Label(copy, text="Dr. Jadson Fraga", bg=NAVY, fg=WHITE,
             font=("Georgia", 25, "bold")).pack(anchor="w", pady=(2, 1))
    tk.Label(copy, text="Neurodesenvolvimento · epilepsia/EEG · avaliação clínica especializada",
             bg=NAVY, fg="#D9E4EF", font=("Segoe UI", 10)).pack(anchor="w")
    tk.Frame(copy, bg=GOLD, height=2, width=410).pack(anchor="w", pady=(8, 7))
    tk.Label(copy, text="Tecnologia a serviço de uma experiência clínica autoral, segura e reconhecível.",
             bg=NAVY, fg="#AFC1D3", font=("Segoe UI", 9)).pack(anchor="w")

    gallery = tk.Frame(hero, bg=NAVY)
    gallery.pack(side="right", padx=(14, 0))
    main = _framed_photo(gallery, app, "dr-jadson-selfie.jpeg", (82, 82), 41)
    main.pack(side="left", padx=(0, 8))
    mini = tk.Frame(gallery, bg=NAVY)
    mini.pack(side="left", padx=(0, 12))
    _framed_photo(mini, app, "dr-jadson-consultorio-full.jpeg", (54, 37), 9, border=NAVY_3).pack(pady=(0, 5))
    _framed_photo(mini, app, "dr-jadson-arte.jpeg", (54, 37), 9, border=NAVY_3).pack()

    actions = tk.Frame(gallery, bg=NAVY)
    actions.pack(side="left")
    _cta(actions, "INICIAR DEMONSTRAÇÃO", lambda: app.action(app.demo)).pack(fill="x")
    tk.Label(actions, text="CRM-PE 25227  ·  RQE 17756", bg=NAVY, fg=GOLD_LIGHT,
             font=("Segoe UI", 8, "bold")).pack(anchor="e", pady=(7, 1))
    tk.Label(actions, text="Petrolina · Pernambuco", bg=NAVY, fg="#9DB1C6",
             font=("Segoe UI", 8)).pack(anchor="e")


def add_action_strip(parent, app, *, before=None) -> None:
    outer = tk.Frame(parent, bg=SOFT, padx=14, pady=8)
    outer.pack(fill="x", before=before)
    strip = tk.Frame(outer, bg=WHITE, padx=15, pady=8,
                     highlightbackground=BORDER_GOLD, highlightthickness=1)
    strip.pack(fill="x")
    tk.Label(strip, text="ACESSO RÁPIDO", bg=WHITE, fg=MUTED,
             font=("Segoe UI", 8, "bold")).pack(side="left", padx=(0, 13))
    actions = (("＋ Novo caso", app.new), ("Abrir caso", app.open_case),
               ("★ Demonstração", app.demo), ("Salvar cópia", app.save_case))
    for index, (label, command) in enumerate(actions):
        _cta(strip, label, lambda fn=command: app.action(fn), primary=(index == 2)).pack(side="left", padx=(0, 7))
    tk.Label(strip, text="Soli Deo Gloria", bg=WHITE, fg=GOLD_DARK,
             font=("Georgia", 10, "italic")).pack(side="right")


def add_tab_banner(parent, app, *, photo: str, eyebrow: str, headline: str,
                   body: str, cta: str, command, tone: str = "gold", before=None) -> None:
    accent = GOLD if tone == "gold" else BURGUNDY if tone == "red" else NAVY_3
    bg = SOFT_GOLD if tone == "gold" else "#F6ECEC" if tone == "red" else SOFT_BLUE
    shadow = tk.Frame(parent, bg="#D5DCE4", padx=1, pady=1)
    shadow.pack(fill="x", pady=(1, 12), before=before)
    card = tk.Frame(shadow, bg=bg, padx=15, pady=11)
    card.pack(fill="x")
    tk.Frame(card, bg=accent, width=4).pack(side="left", fill="y", padx=(0, 12))

    portrait = _photo(app, photo, (104, 74), 15)
    tk.Label(card, image=portrait, bg=bg).pack(side="left", padx=(0, 14))

    right = tk.Frame(card, bg=bg)
    right.pack(side="right", padx=(12, 0))
    _cta(right, cta, command).pack(fill="x")
    mascot_shell = tk.Frame(right, bg=accent, padx=2, pady=2)
    mascot_shell.pack(anchor="e", pady=(7, 0))
    mascot = _photo(app, "mascote.png", (46, 52), 12)
    tk.Label(mascot_shell, image=mascot, bg=bg).pack()

    text = tk.Frame(card, bg=bg)
    text.pack(side="left", fill="both", expand=True)
    tk.Label(text, text=eyebrow, bg=bg, fg=BURGUNDY,
             font=("Segoe UI", 8, "bold")).pack(anchor="w")
    tk.Label(text, text=headline, bg=bg, fg=NAVY,
             font=("Georgia", 15, "bold")).pack(anchor="w", pady=(2, 2))
    tk.Label(text, text=body, bg=bg, fg=MUTED, font=("Segoe UI", 9),
             wraplength=540, justify="left").pack(anchor="w")


def style_textbox(text: tk.Text) -> None:
    text.configure(bg=WHITE, fg=INK, insertbackground=BURGUNDY,
                   selectbackground=NAVY_2, selectforeground=WHITE,
                   relief="flat", bd=0, padx=12, pady=10,
                   highlightthickness=1, highlightbackground=BORDER,
                   highlightcolor=GOLD)


def add_brand_footer(parent, status_var: tk.StringVar) -> None:
    status = tk.Frame(parent, bg=SOFT, padx=14, pady=7)
    status.pack(fill="x", padx=14, pady=(7, 0))
    tk.Label(status, text="STATUS OPERACIONAL", bg=SOFT, fg=BURGUNDY,
             font=("Segoe UI", 8, "bold")).pack(side="left", padx=(0, 10))
    tk.Label(status, textvariable=status_var, bg=SOFT, fg=INK,
             font=("Segoe UI", 9), anchor="w").pack(side="left", fill="x", expand=True)

    footer = tk.Frame(parent, bg=NAVY, padx=17, pady=8)
    footer.pack(fill="x", pady=(6, 0))
    tk.Label(footer, text="DR. JADSON FRAGA", bg=NAVY, fg=GOLD_LIGHT,
             font=("Segoe UI", 9, "bold")).pack(side="left")
    tk.Label(footer, text="  ·  Neuropediatra  ·  CRM-PE 25227  ·  RQE 17756",
             bg=NAVY, fg=WHITE, font=("Segoe UI", 9)).pack(side="left")
    tk.Label(footer, text="@drjadsonfraganeuroped  ·  Soli Deo Gloria",
             bg=NAVY, fg="#B9C9D8", font=("Segoe UI", 8)).pack(side="right")


def apply_brand_overlay(app) -> None:
    """Reestiliza a janela já construída sem alterar handlers, dados ou contrato."""
    app._brand_images = []
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
         "Estrutura clínica com assinatura visual.",
         "Dados, fontes, hipóteses e conduta permanecem sob o mesmo contrato; a interface ganha hierarquia e presença institucional.",
         "CARREGAR DEMO", lambda: app.action(app.demo), "gold"),
        (app.capture, "dr-jadson-consultorio-superman.jpeg", "02 · PRÉ-CONSULTA",
         "Entrada clara, acolhedora e proprietária.",
         "A experiência reforça sua marca sem confirmar dados automaticamente nem modificar a lógica de revisão.",
         "IMPORTAR TEXTO", lambda: app.action(app.open_text), "blue"),
        (app.review, "dr-jadson-arte.jpeg", "03 · REVISÃO MÉDICA",
         "Do dado ao rascunho, com rigor e identidade.",
         "Validação e pendências permanecem intactas; a apresentação prioriza decisão, contraste e chamada para a próxima ação.",
         "VALIDAR AGORA", lambda: app.action(app.validate), "red"),
        (app.batch, "dr-jadson-selfie.jpeg", "04 · FLUXO LOCAL",
         "Seu método em uma superfície de alto padrão.",
         "O processamento de pastas continua local, separado da emissão final e sem alterar as salvaguardas existentes.",
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
