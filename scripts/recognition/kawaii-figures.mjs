/**
 * Banco kawaii autoral do Reconhecimento Visual (NeuroPed, recognition-v3).
 *
 * Figuras desenhadas em SVG puro, sem texto, script, imagem embutida ou
 * referência externa, para a apresentação de 12 a 59 meses (1 a 4 anos):
 * silhueta prototípica grande e centrada, contorno macio e cores de alto
 * contraste com o fundo branco. O rosto kawaii fica sobre a superfície maior
 * da figura e nunca substitui o traço que identifica o objeto (orelhas, tromba,
 * pescoço, coroa do abacaxi, rodas etc.).
 *
 * Determinístico: a mesma entrada gera os mesmos bytes (o teste compara os
 * arquivos publicados com a regeneração). Não é instrumento normatizado.
 */

const K = "#4b3a3a"; // contorno marrom-escuro macio
const SW = 5;
const BLUSH = "#ff8fa3";
const EYE = "#2f2626";

const C = {
  yellow: "#ffd84d", yellowDark: "#f0b429", red: "#ff6b6b", redDark: "#e04848",
  orange: "#ffa94d", orangeDark: "#f08c2e", green: "#8fd16a", greenDark: "#5fae45",
  leaf: "#6cc551", blue: "#7cc6ff", blueDark: "#4a9be0", sky: "#cdeeff",
  purple: "#b08ae8", purpleDark: "#8a63cf", pink: "#ffb3c6", pinkDark: "#ff8fab",
  pinkLight: "#ffe3ea", brown: "#c68a5a", brownLight: "#ecc39a", brownDark: "#9a6338",
  cream: "#fff6e6", white: "#ffffff", gray: "#c3cbd8", grayDark: "#8f99aa",
  ink: "#4f5566", wood: "#e2a96b", woodDark: "#b97a40", skin: "#f1c3a0",
};

const n = (value) => {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? "0" : String(rounded);
};
const attrs = (extra = {}) => Object.entries(extra)
  .filter(([, value]) => value !== undefined && value !== null && value !== false)
  .map(([key, value]) => ` ${key}="${typeof value === "number" ? n(value) : value}"`).join("");

const circle = (cx, cy, r, fill, extra = {}) => `<circle${attrs({ cx, cy, r, fill, ...extra })}/>`;
const ellipse = (cx, cy, rx, ry, fill, extra = {}) => `<ellipse${attrs({ cx, cy, rx, ry, fill, ...extra })}/>`;
const rect = (x, y, width, height, rx, fill, extra = {}) => `<rect${attrs({ x, y, width, height, rx, fill, ...extra })}/>`;
const path = (d, fill, extra = {}) => `<path${attrs({ d, fill, ...extra })}/>`;
const line = (d, width = SW, color = K, extra = {}) => path(d, "none", { stroke: color, "stroke-width": width, ...extra });
const group = (body, extra = {}) => `<g${attrs(extra)}>${body}</g>`;
const noStroke = { stroke: "none" };
/** Tubo colorido com contorno: rabos, alças, cabos e trombas. */
const tube = (d, color, width) => line(d, width + SW * 2, K) + line(d, width, color);
/** Nuvem/juba sem traços internos: contornos primeiro, preenchimentos depois. */
const fluffy = (points, r, fill) => points.map(([x, y]) => circle(x, y, r, fill)).join("")
  + points.map(([x, y]) => circle(x, y, r - SW / 2, fill, noStroke)).join("");

/** Rosto kawaii: olhos ovais com brilho, bochechas e boca pequena. */
function face(cx, cy, scale = 1, options = {}) {
  const { mouth = "smile", blush = true, gap = 16, eyes = true, eyeColor = EYE, mouthColor = K } = options;
  const s = scale;
  let out = "";
  if (blush) {
    out += ellipse(cx - (gap + 9) * s, cy + 10 * s, 7.5 * s, 4.6 * s, BLUSH, { stroke: "none", opacity: 0.75 });
    out += ellipse(cx + (gap + 9) * s, cy + 10 * s, 7.5 * s, 4.6 * s, BLUSH, { stroke: "none", opacity: 0.75 });
  }
  if (eyes) {
    for (const side of [-1, 1]) {
      const ex = cx + side * gap * s;
      out += ellipse(ex, cy, 5.2 * s, 6.8 * s, eyeColor, noStroke);
      out += circle(ex + 1.7 * s, cy - 2.4 * s, 1.9 * s, C.white, noStroke);
    }
  }
  const mw = 3.4 * Math.max(0.7, s);
  if (mouth === "smile") out += line(`M${n(cx - 5 * s)} ${n(cy + 8 * s)} Q${n(cx)} ${n(cy + 13.5 * s)} ${n(cx + 5 * s)} ${n(cy + 8 * s)}`, mw, mouthColor);
  if (mouth === "cat") out += line(`M${n(cx - 8 * s)} ${n(cy + 9 * s)} q${n(4 * s)} ${n(5 * s)} ${n(8 * s)} 0 q${n(4 * s)} ${n(5 * s)} ${n(8 * s)} 0`, mw, mouthColor);
  if (mouth === "open") out += path(`M${n(cx - 6 * s)} ${n(cy + 8 * s)} Q${n(cx)} ${n(cy + 20 * s)} ${n(cx + 6 * s)} ${n(cy + 8 * s)} Z`, "#c4566f", { "stroke-width": mw });
  return out;
}
/** Olho único de perfil (peixe, pássaro, pato, galo, jabuti, avião). */
function profileEye(x, y, scale = 1, blushOffset = [8, 16]) {
  const s = scale;
  return ellipse(x + blushOffset[0] * s, y + blushOffset[1] * s, 7.5 * s, 4.6 * s, BLUSH, { stroke: "none", opacity: 0.75 })
    + ellipse(x, y, 5.6 * s, 7.2 * s, EYE, noStroke) + circle(x + 1.8 * s, y - 2.6 * s, 2 * s, C.white, noStroke);
}
const shine = (cx, cy, rx, ry, rotate = 0) => ellipse(cx, cy, rx, ry, C.white, { stroke: "none", opacity: 0.6, transform: rotate ? `rotate(${rotate} ${cx} ${cy})` : undefined });

/** Corpo chibi de quadrúpede: patas, corpo e (opcional) mancha; cabeça desenhada por cada bicho. */
function quadruped({ body, legs = [96, 114, 150, 168], legTop = 160, legHeight = 44, cx = 132, cy = 150, rx = 58, ry = 38, hoof }) {
  let out = "";
  for (const x of legs) {
    out += rect(x - 9, legTop, 18, legHeight, 9, body);
    if (hoof) out += rect(x - 9, legTop + legHeight - 10, 18, 10, 4, hoof);
  }
  out += ellipse(cx, cy, rx, ry, body);
  return out;
}

const FIGURES = [];
const add = (id, label, category, minMonths, draw, extra = {}) => FIGURES.push({ id, label, category, minMonths, draw, ...extra });

/* ----------------------------- ANIMAIS ----------------------------- */
add("cachorro", "Cachorro", "animais", 12, () =>
  tube("M184 140 Q212 120 204 92", C.brownLight, 11)
  + quadruped({ body: C.brownLight })
  + ellipse(156, 140, 18, 13, C.brown, noStroke)
  + circle(88, 100, 50, C.brownLight)
  + ellipse(44, 106, 15, 30, C.brown, { transform: "rotate(16 44 106)" })
  + ellipse(132, 106, 15, 30, C.brown, { transform: "rotate(-16 132 106)" })
  + ellipse(88, 122, 24, 17, C.cream)
  + path("M83 128 Q88 142 93 128 Z", C.pinkDark, { "stroke-width": 3 })
  + line("M80 126 Q88 132 96 126", 3.4)
  + ellipse(88, 113, 9, 6.5, K, noStroke)
  + face(88, 96, 1, { mouth: "none", gap: 18 }));

add("gato", "Gato", "animais", 12, () =>
  tube("M178 150 Q216 140 204 98", "#ffb366", 11)
  + quadruped({ body: "#ffb366", legs: [100, 118, 152, 170], cx: 138, cy: 155, rx: 52, ry: 34, legTop: 166, legHeight: 38 })
  + line("M138 128 v14 M156 130 v12 M120 131 v11", 4, C.orangeDark)
  + path("M50 86 L56 36 L90 62 Z", "#ffb366") + path("M134 86 L128 36 L94 62 Z", "#ffb366")
  + path("M60 74 L62 50 L78 64 Z", C.pink, noStroke) + path("M124 74 L122 50 L106 64 Z", C.pink, noStroke)
  + circle(92, 104, 48, "#ffb366")
  + line("M92 58 v13 M80 61 l3 11 M104 61 l-3 11", 4, C.orangeDark)
  + line("M64 116 L36 110 M64 122 L36 128 M120 116 L148 110 M120 122 L148 128", 3)
  + path("M87 112 L97 112 L92 118 Z", C.pinkDark, { "stroke-width": 2.5 })
  + face(92, 100, 1, { mouth: "cat", gap: 18 }));

add("coelho", "Coelho", "animais", 24, () =>
  ellipse(94, 54, 15, 42, "#f5efe9", { transform: "rotate(-8 94 54)" })
  + ellipse(94, 58, 7, 30, C.pink, { stroke: "none", transform: "rotate(-8 94 58)" })
  + ellipse(146, 54, 15, 42, "#f5efe9", { transform: "rotate(8 146 54)" })
  + ellipse(146, 58, 7, 30, C.pink, { stroke: "none", transform: "rotate(8 146 58)" })
  + ellipse(120, 174, 52, 42, "#f5efe9")
  + ellipse(120, 182, 30, 26, C.pinkLight, noStroke)
  + ellipse(90, 212, 20, 11, "#f5efe9") + ellipse(150, 212, 20, 11, "#f5efe9")
  + ellipse(78, 168, 11, 16, "#f5efe9") + ellipse(162, 168, 11, 16, "#f5efe9")
  + circle(120, 114, 46, "#f5efe9")
  + rect(114, 128, 12, 11, 3, C.white, { "stroke-width": 3 }) + line("M120 128 v11", 2.5)
  + ellipse(120, 121, 5.5, 4.2, C.pinkDark, noStroke)
  + face(120, 110, 1, { mouth: "none", gap: 18 }));

add("peixe", "Peixe", "animais", 12, () =>
  circle(32, 66, 9, C.sky, { stroke: C.blueDark, "stroke-width": 3 }) + circle(48, 42, 6, C.sky, { stroke: C.blueDark, "stroke-width": 3 })
  + path("M90 78 Q118 38 154 80 Z", C.orangeDark)
  + path("M166 120 L214 82 Q204 120 214 158 Z", C.orangeDark)
  + ellipse(114, 122, 72, 52, "#ff9f43")
  + ellipse(108, 140, 46, 24, "#ffd2a1", noStroke)
  + path("M124 130 Q148 120 152 144 Q134 150 124 130 Z", C.orangeDark, { "stroke-width": 4 })
  + line("M150 86 Q140 122 150 158", 6, "#ffd2a1")
  + line("M50 128 Q56 135 64 128", 3.4)
  + profileEye(72, 108, 1.15, [4, 18]));

add("passaro", "Pássaro", "animais", 24, () =>
  rect(36, 200, 168, 13, 6.5, C.woodDark)
  + line("M112 178 L110 202 M132 178 L134 202", 6, C.orange)
  + path("M164 120 L212 104 L204 132 Z", C.blueDark) + path("M166 132 L210 128 L196 152 Z", C.blueDark)
  + ellipse(118, 128, 64, 56, C.blue)
  + ellipse(104, 148, 38, 28, "#dff1ff", noStroke)
  + path("M118 124 Q168 110 166 156 Q136 166 118 124 Z", C.blueDark, { "stroke-width": 4 })
  + path("M108 72 Q100 52 118 48 Q114 60 122 70 Z", C.blue)
  + path("M60 112 L34 122 L60 132 Z", "#ffb347")
  + profileEye(84, 108, 1.1, [6, 18]));

add("vaca", "Vaca", "animais", 24, () => {
  const clip = `<clipPath id="vaca-corpo">${ellipse(132, 150, 58, 38)}</clipPath><clipPath id="vaca-cabeca">${circle(84, 102, 44)}</clipPath>`;
  return `<defs>${clip}</defs>`
    + tube("M182 140 Q210 152 204 184", C.white, 7) + ellipse(204, 188, 7, 10, "#5a4a4a")
    + quadruped({ body: C.white, hoof: "#6b5a5a" })
    + group(ellipse(152, 136, 22, 16, "#4b4b5a", noStroke) + ellipse(112, 168, 16, 11, "#4b4b5a", noStroke) + ellipse(184, 168, 12, 10, "#4b4b5a", noStroke), { "clip-path": "url(#vaca-corpo)" })
    + ellipse(132, 150, 58, 38, "none")
    + path("M58 72 Q48 52 62 44 Q64 58 72 66 Z", C.cream) + path("M110 72 Q120 52 106 44 Q104 58 96 66 Z", C.cream)
    + ellipse(38, 94, 17, 9, C.white, { transform: "rotate(-20 38 94)" }) + ellipse(130, 94, 17, 9, C.white, { transform: "rotate(20 130 94)" })
    + circle(84, 102, 44, C.white)
    + group(ellipse(110, 78, 16, 13, "#4b4b5a", noStroke), { "clip-path": "url(#vaca-cabeca)" })
    + circle(84, 102, 44, "none")
    + ellipse(84, 126, 28, 17, C.pink)
    + ellipse(74, 126, 4, 5, C.pinkDark, noStroke) + ellipse(94, 126, 4, 5, C.pinkDark, noStroke)
    + face(84, 98, 0.95, { mouth: "none", gap: 18 });
});

add("cavalo", "Cavalo", "animais", 24, () =>
  path("M176 118 Q216 128 206 188 Q192 160 176 140 Z", C.brownDark)
  + quadruped({ body: C.brown, legs: [104, 122, 156, 174], cx: 140, cy: 140, rx: 56, ry: 32, legTop: 150, legHeight: 58, hoof: "#5b4636" })
  + fluffy([[112, 50], [124, 66], [130, 86], [130, 106]], 13, C.brownDark)
  + path("M84 118 L100 70 L128 82 L124 130 Q104 140 84 118 Z", C.brown)
  + path("M92 52 L96 22 L108 46 Z", C.brown) + path("M106 54 L118 30 L120 58 Z", C.brown)
  + ellipse(80, 84, 30, 46, C.brown, { transform: "rotate(30 80 84)" })
  + ellipse(62, 110, 22, 17, C.brownLight)
  + ellipse(54, 112, 3.5, 4.5, C.brownDark, noStroke)
  + face(86, 78, 0.85, { mouth: "none", gap: 14 })
  + line("M60 120 Q66 124 72 120", 3));

add("galo", "Galo", "animais", 24, () =>
  path("M150 118 Q196 52 216 104 Q196 92 170 128 Z", C.red)
  + path("M154 128 Q210 88 214 140 Q192 122 168 140 Z", "#3fbf8f")
  + path("M156 140 Q204 128 200 170 Q184 150 164 152 Z", C.blueDark)
  + line("M108 184 L106 212 M130 184 L132 212 M94 214 h24 M120 214 h24", 6, C.orange)
  + ellipse(120, 142, 54, 48, "#fff8ee")
  + path("M110 142 Q142 120 162 148 Q140 172 110 142 Z", "#f3e3c9", { "stroke-width": 4 })
  + path("M72 62 Q70 42 86 46 Q88 28 104 38 Q116 32 116 50 L112 66 Z", C.red)
  + circle(92, 88, 34, "#fff8ee")
  + path("M60 88 L38 96 L60 104 Z", "#ffc94d")
  + path("M62 104 Q56 124 70 124 Q78 122 74 104 Z", C.red)
  + profileEye(80, 84, 1, [8, 15]));

add("porco", "Porquinho", "animais", 36, () =>
  line("M180 140 q20 -4 16 -18 q-4 -12 -14 -3 q-6 8 8 12", 5, C.pinkDark)
  + quadruped({ body: C.pink, legTop: 166, legHeight: 38, hoof: C.pinkDark })
  + path("M50 76 L46 40 L80 60 Z", C.pink) + path("M126 76 L130 40 L96 60 Z", C.pink)
  + circle(88, 104, 48, C.pink)
  + ellipse(88, 122, 23, 15, C.pinkDark)
  + ellipse(80, 122, 4, 6, "#c4567a", noStroke) + ellipse(96, 122, 4, 6, "#c4567a", noStroke)
  + face(88, 96, 1, { mouth: "none", gap: 20 })
  + line("M82 142 Q88 147 94 142", 3.4));

add("ovelha", "Ovelha", "animais", 36, () =>
  [102, 120, 152, 170].map((x) => rect(x - 8, 178, 16, 40, 8, "#5a4a4a")).join("")
  + fluffy([[100, 138], [128, 122], [158, 128], [178, 146], [168, 170], [138, 176], [108, 172], [92, 156]], 26, C.white)
  + circle(136, 150, 32, C.white, noStroke)
  + ellipse(42, 114, 15, 8, "#f6e3d3", { transform: "rotate(-20 42 114)" }) + ellipse(114, 114, 15, 8, "#f6e3d3", { transform: "rotate(20 114 114)" })
  + ellipse(78, 118, 32, 34, "#f6e3d3")
  + fluffy([[62, 88], [78, 80], [94, 88]], 13, C.white)
  + face(78, 118, 0.85, { gap: 15 }));

add("pato", "Pato", "animais", 24, () =>
  path("M20 200 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 V226 H20 Z", "#bfe6ff", { "stroke-width": 4 })
  + path("M182 140 L212 118 L204 160 Z", C.yellow)
  + ellipse(130, 162, 66, 38, C.yellow)
  + path("M122 156 Q152 140 174 160 Q152 178 122 156 Z", C.yellowDark, { "stroke-width": 4 })
  + circle(86, 102, 38, C.yellow)
  + path("M54 100 Q30 104 34 116 Q48 122 64 112 Z", "#ffa64d")
  + profileEye(84, 94, 1, [8, 16]));

add("borboleta", "Borboleta", "animais", 36, () =>
  ellipse(72, 92, 50, 42, C.pink, { transform: "rotate(-20 72 92)" })
  + ellipse(168, 92, 50, 42, C.pink, { transform: "rotate(20 168 92)" })
  + ellipse(84, 164, 36, 30, C.purple, { transform: "rotate(20 84 164)" })
  + ellipse(156, 164, 36, 30, C.purple, { transform: "rotate(-20 156 164)" })
  + circle(64, 90, 14, C.yellow) + circle(176, 90, 14, C.yellow)
  + circle(82, 166, 9, C.white) + circle(158, 166, 9, C.white)
  + line("M112 58 Q100 28 86 30 M128 58 Q140 28 154 30", 4)
  + circle(86, 30, 5, K, noStroke) + circle(154, 30, 5, K, noStroke)
  + ellipse(120, 136, 15, 54, "#8c7ab8")
  + circle(120, 76, 24, "#8c7ab8")
  + face(120, 74, 0.6, { gap: 14, eyeColor: EYE }));

add("abelha", "Abelha", "animais", 48, () => {
  const clip = `<clipPath id="abelha-corpo">${ellipse(120, 134, 64, 56)}</clipPath>`;
  return `<defs>${clip}</defs>`
    + ellipse(96, 72, 22, 32, "#e3f4ff", { transform: "rotate(-25 96 72)" })
    + ellipse(144, 72, 22, 32, "#e3f4ff", { transform: "rotate(25 144 72)" })
    + line("M106 84 Q96 56 84 50 M134 84 Q144 56 156 50", 4) + circle(84, 50, 5, K, noStroke) + circle(156, 50, 5, K, noStroke)
    + path("M110 186 L120 210 L130 186 Z", "#5a4a4a")
    + ellipse(120, 134, 64, 56, C.yellow)
    + group(rect(40, 146, 160, 16, 0, "#4b3a3a", noStroke) + rect(40, 174, 160, 14, 0, "#4b3a3a", noStroke), { "clip-path": "url(#abelha-corpo)" })
    + ellipse(120, 134, 64, 56, "none")
    + face(120, 112, 1, { gap: 20 });
});

add("tartaruga", "Jabuti", "animais", 36, () =>
  [[76, 178], [100, 184], [150, 184], [172, 178]].map(([x, y]) => ellipse(x, y, 14, 18, "#9ed46e")).join("")
  + path("M196 160 L214 168 L196 172 Z", "#9ed46e")
  + path("M62 154 Q40 140 46 118 L74 124 Z", "#9ed46e")
  + circle(48, 128, 28, "#9ed46e")
  + path("M62 168 Q62 72 128 72 Q194 72 196 168 Z", "#6fb35a")
  + path("M104 96 L128 84 L152 96 L152 124 L128 136 L104 124 Z", "#8ed36f", { "stroke-width": 4 })
  + path("M80 140 L104 124 L104 96 M152 96 L152 124 L176 140 M104 124 L128 136 L152 124 M128 136 V164", "none", { "stroke-width": 4 })
  + rect(56, 160, 146, 14, 7, "#c6e8a8")
  + profileEye(42, 122, 0.95, [10, 15])
  + line("M30 136 Q36 141 42 137", 3));

add("sapo", "Sapo", "animais", 36, () =>
  ellipse(62, 192, 28, 17, C.green) + ellipse(178, 192, 28, 17, C.green)
  + ellipse(120, 160, 62, 46, C.green)
  + ellipse(120, 172, 38, 30, "#dcf5bf", noStroke)
  + ellipse(98, 208, 15, 8, C.green) + ellipse(142, 208, 15, 8, C.green)
  + circle(82, 74, 24, C.green) + circle(158, 74, 24, C.green)
  + ellipse(120, 112, 66, 42, C.green)
  + circle(82, 72, 14, C.white, { "stroke-width": 3 }) + circle(158, 72, 14, C.white, { "stroke-width": 3 })
  + circle(84, 74, 7.5, EYE, noStroke) + circle(156, 74, 7.5, EYE, noStroke)
  + circle(86, 71, 2.4, C.white, noStroke) + circle(158, 71, 2.4, C.white, noStroke)
  + ellipse(74, 114, 9, 5, BLUSH, { stroke: "none", opacity: 0.75 }) + ellipse(166, 114, 9, 5, BLUSH, { stroke: "none", opacity: 0.75 })
  + line("M88 116 Q120 140 152 116", 4));

add("elefante", "Elefante", "animais", 48, () =>
  line("M192 146 Q206 156 202 170", 5)
  + quadruped({ body: "#b8c4d6", legs: [100, 118, 156, 174], cx: 142, cy: 150, rx: 56, ry: 40, legTop: 164, legHeight: 42 })
  + ellipse(118, 98, 34, 42, "#b8c4d6") + ellipse(120, 100, 22, 30, C.pinkLight, noStroke)
  + circle(78, 98, 44, "#b8c4d6")
  + tube("M66 118 Q44 152 58 172 Q66 182 78 170", "#b8c4d6", 19)
  + face(76, 92, 0.95, { mouth: "none", gap: 17 }));

add("leao", "Leão", "animais", 48, () => {
  const mane = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [84 + Math.cos(a) * 46, 100 + Math.sin(a) * 46];
  });
  return tube("M188 150 Q214 136 206 110", "#f7c35c", 9) + ellipse(206, 104, 9, 12, "#d9822b")
    + quadruped({ body: "#f7c35c", legs: [102, 120, 154, 172], cx: 140, cy: 154, rx: 54, ry: 36, legTop: 166, legHeight: 40 })
    + fluffy(mane, 19, "#d9822b") + circle(84, 100, 46, "#d9822b", noStroke)
    + circle(60, 70, 11, "#f7c35c") + circle(108, 70, 11, "#f7c35c")
    + circle(84, 100, 38, "#f7c35c")
    + ellipse(84, 118, 18, 12, C.cream)
    + path("M78 110 H90 L84 117 Z", C.brownDark, { "stroke-width": 2.5 })
    + line("M76 122 q4 5 8 0 q4 5 8 0", 3)
    + face(84, 96, 0.9, { mouth: "none", gap: 16 });
});

add("girafa", "Girafa", "animais", 48, () =>
  tube("M190 146 Q204 160 200 182", "#ffd166", 5) + ellipse(200, 186, 6, 8, C.brownDark)
  + quadruped({ body: "#ffd166", legs: [124, 140, 168, 182], cx: 152, cy: 148, rx: 44, ry: 28, legTop: 156, legHeight: 56, hoof: C.brownDark })
  + path("M106 150 L128 136 L98 62 L76 70 Z", "#ffd166")
  + line("M72 40 L68 20 M90 40 L94 20", 5) + circle(68, 18, 6, C.brownDark) + circle(94, 18, 6, C.brownDark)
  + ellipse(56, 50, 11, 6, "#ffd166", { transform: "rotate(-25 56 50)" }) + ellipse(108, 50, 11, 6, "#ffd166", { transform: "rotate(25 108 50)" })
  + ellipse(82, 56, 28, 23, "#ffd166")
  + ellipse(70, 66, 15, 11, C.cream)
  + [[146, 140, 9, 7], [168, 154, 8, 6], [172, 134, 7, 6], [132, 158, 7, 5], [100, 104, 8, 6], [90, 84, 7, 5], [112, 128, 7, 6]]
    .map(([x, y, rx, ry]) => ellipse(x, y, rx, ry, "#e08a3c", noStroke)).join("")
  + face(84, 52, 0.7, { mouth: "smile", gap: 14 }));

add("pintinho", "Pintinho", "animais", 24, () =>
  line("M110 46 Q108 30 118 28 M120 46 Q124 30 134 34", 4, C.yellowDark)
  + circle(120, 112, 64, C.yellow)
  + ellipse(58, 120, 12, 22, C.yellow, { transform: "rotate(20 58 120)" }) + ellipse(182, 120, 12, 22, C.yellow, { transform: "rotate(-20 182 120)" })
  + path("M54 150 L70 136 L86 152 L102 136 L120 152 L138 136 L154 152 L170 136 L186 150 Q186 212 120 212 Q54 212 54 150 Z", C.white)
  + face(120, 100, 1.05, { mouth: "none", gap: 20 })
  + path("M111 112 L129 112 L120 124 Z", "#ffa64d", { "stroke-width": 3 }));

add("urso", "Urso", "animais", 24, () =>
  ellipse(120, 176, 54, 42, C.brown)
  + ellipse(120, 182, 32, 26, C.brownLight, noStroke)
  + ellipse(72, 166, 14, 22, C.brown) + ellipse(168, 166, 14, 22, C.brown)
  + ellipse(86, 210, 20, 12, C.brown) + ellipse(154, 210, 20, 12, C.brown)
  + circle(78, 62, 18, C.brown) + circle(162, 62, 18, C.brown)
  + circle(78, 62, 9, C.brownLight, noStroke) + circle(162, 62, 9, C.brownLight, noStroke)
  + circle(120, 104, 50, C.brown)
  + ellipse(120, 124, 22, 16, C.brownLight)
  + ellipse(120, 116, 8, 6, K, noStroke)
  + line("M112 128 Q120 134 128 128", 3.4)
  + face(120, 98, 1, { mouth: "none", gap: 20 }));

add("macaco", "Macaco", "animais", 36, () =>
  tube("M152 196 Q206 200 200 154 Q196 132 178 140", "#a86b3c", 9)
  + ellipse(120, 180, 40, 36, "#a86b3c") + ellipse(120, 186, 24, 22, "#f3cfa6", noStroke)
  + ellipse(84, 208, 16, 10, "#a86b3c") + ellipse(156, 208, 16, 10, "#a86b3c")
  + circle(66, 100, 18, "#a86b3c") + circle(174, 100, 18, "#a86b3c")
  + circle(66, 100, 9, "#f3cfa6", noStroke) + circle(174, 100, 9, "#f3cfa6", noStroke)
  + circle(120, 100, 50, "#a86b3c")
  + circle(104, 96, 20, "#f3cfa6") + circle(136, 96, 20, "#f3cfa6") + ellipse(120, 120, 30, 21, "#f3cfa6")
  + circle(104, 96, 20, "#f3cfa6", noStroke) + circle(136, 96, 20, "#f3cfa6", noStroke) + ellipse(120, 120, 30, 21, "#f3cfa6", noStroke)
  + line("M112 54 Q120 40 130 50", 4)
  + circle(115, 116, 2.4, K, noStroke) + circle(125, 116, 2.4, K, noStroke)
  + line("M108 126 Q120 136 132 126", 3.4)
  + face(120, 96, 0.85, { mouth: "none", gap: 16 }));

add("joaninha", "Joaninha", "animais", 36, () =>
  line("M56 112 L40 102 M52 140 L34 140 M58 170 L42 182 M184 112 L200 102 M188 140 L206 140 M182 170 L198 182", 5)
  + circle(120, 136, 70, C.red)
  + line("M120 70 V206", 4)
  + [[88, 112, 12], [152, 112, 12], [80, 152, 10], [160, 152, 10], [104, 184, 8], [136, 184, 8]].map(([x, y, r]) => circle(x, y, r, K, noStroke)).join("")
  + line("M106 46 Q96 26 84 24 M134 46 Q144 26 156 24", 4) + circle(84, 24, 5, K, noStroke) + circle(156, 24, 5, K, noStroke)
  + ellipse(120, 66, 42, 30, "#4b3a3a")
  + face(120, 62, 0.8, { gap: 16, eyeColor: C.white, mouthColor: C.white }));

add("zebra", "Zebra", "animais", 48, () => {
  const neck = "M84 118 L100 70 L128 82 L124 130 Q104 140 84 118 Z";
  const clip = `<clipPath id="zebra-corpo">${ellipse(140, 140, 56, 32)}${path(neck)}</clipPath>`
    + `<clipPath id="zebra-cabeca">${ellipse(80, 84, 30, 46, "#000", { transform: "rotate(30 80 84)" })}</clipPath>`
    + `<clipPath id="zebra-patas">${[104, 122, 156, 174].map((x) => rect(x - 9, 150, 18, 48, 9)).join("")}</clipPath>`;
  const stripe = "#4b4b5a";
  return `<defs>${clip}</defs>`
    + path("M176 118 Q206 128 200 176 Q190 156 176 140 Z", stripe)
    + quadruped({ body: C.white, legs: [104, 122, 156, 174], cx: 140, cy: 140, rx: 56, ry: 32, legTop: 150, legHeight: 58, hoof: stripe })
    + group(line("M95 176 H185 M95 190 H185", 6, stripe), { "clip-path": "url(#zebra-patas)" })
    + fluffy([[112, 50], [124, 66], [130, 86], [130, 106]], 12, stripe)
    + path(neck, C.white)
    + group(line("M118 104 Q126 138 120 172 M142 106 Q150 140 144 172 M166 110 Q172 140 168 170 M188 124 Q192 140 188 158 M92 112 L126 98 M98 94 L126 86", 8, stripe), { "clip-path": "url(#zebra-corpo)" })
    + ellipse(140, 140, 56, 32, "none") + path(neck, "none")
    + path("M92 52 L96 22 L108 46 Z", C.white) + path("M106 54 L118 30 L120 58 Z", C.white)
    + ellipse(80, 84, 30, 46, C.white, { transform: "rotate(30 80 84)" })
    + group(line("M96 48 Q86 62 100 72 M112 66 Q102 80 112 92 M82 46 Q74 54 84 60 M104 96 Q96 104 102 112", 6, stripe), { "clip-path": "url(#zebra-cabeca)" })
    + ellipse(80, 84, 30, 46, "none", { transform: "rotate(30 80 84)" })
    + ellipse(62, 110, 22, 17, "#7d7f8f")
    + ellipse(54, 112, 3.5, 4.5, stripe, noStroke)
    + face(82, 80, 0.85, { mouth: "none", gap: 14 });
});

add("coruja", "Coruja", "animais", 48, () =>
  rect(30, 200, 180, 14, 7, C.woodDark)
  + path("M70 66 L74 30 L100 54 Z", "#a0693f") + path("M170 66 L166 30 L140 54 Z", "#a0693f")
  + ellipse(120, 128, 64, 76, "#b07a4f")
  + ellipse(120, 156, 40, 44, "#ecc39a", noStroke)
  + line("M104 146 l6 6 6 -6 M124 146 l6 6 6 -6 M114 166 l6 6 6 -6 M104 184 l6 6 6 -6 M124 184 l6 6 6 -6", 3, "#c68a5a")
  + ellipse(60, 138, 14, 36, "#a0693f", { transform: "rotate(12 60 138)" }) + ellipse(180, 138, 14, 36, "#a0693f", { transform: "rotate(-12 180 138)" })
  + circle(96, 98, 26, C.white) + circle(144, 98, 26, C.white)
  + circle(98, 100, 13, EYE, noStroke) + circle(142, 100, 13, EYE, noStroke)
  + circle(102, 95, 4, C.white, noStroke) + circle(146, 95, 4, C.white, noStroke)
  + path("M112 118 L128 118 L120 132 Z", "#ffa64d", { "stroke-width": 3 })
  + ellipse(78, 128, 8, 5, BLUSH, { stroke: "none", opacity: 0.75 }) + ellipse(162, 128, 8, 5, BLUSH, { stroke: "none", opacity: 0.75 })
  + line("M104 202 v-8 M112 202 v-8 M128 202 v-8 M136 202 v-8", 5, C.orange));

/* ----------------------------- FRUTAS ----------------------------- */
const leafAt = (x, y, rotate = -30) => path(`M${x} ${y} Q${x + 16} ${y - 26} ${x + 44} ${y - 18} Q${x + 26} ${y + 8} ${x} ${y} Z`, C.leaf, { transform: `rotate(${rotate} ${x} ${y})` });

add("banana", "Banana", "frutas", 12, () =>
  path("M56 70 L60 48 L74 52 L70 72 Z", C.brownDark)
  + path("M60 70 Q48 172 150 188 Q196 194 206 178 Q190 168 170 166 Q92 156 82 66 Q72 56 60 70 Z", C.yellow)
  + line("M70 86 Q76 154 158 174", 4, C.yellowDark)
  + circle(206, 178, 5, C.brownDark, noStroke)
  + face(112, 140, 0.8, { gap: 16 }));

add("maca", "Maçã", "frutas", 24, () =>
  line("M120 76 Q118 52 128 40", 6, C.brownDark)
  + leafAt(126, 58, -10)
  + path("M120 76 C92 58 46 70 46 126 C46 178 86 212 120 198 C154 212 194 178 194 126 C194 70 148 58 120 76 Z", C.red)
  + shine(80, 108, 10, 18, 20)
  + face(120, 136, 1.05, { gap: 22 }));

add("laranja", "Laranja", "frutas", 24, () =>
  circle(120, 132, 76, C.orange)
  + [[86, 100], [150, 96], [170, 150], [74, 160], [128, 186], [100, 76], [158, 176]].map(([x, y]) => circle(x, y, 2.4, C.orangeDark, noStroke)).join("")
  + line("M120 56 v-14", 6, C.brownDark) + leafAt(122, 50, -20)
  + shine(82, 104, 10, 18, 25)
  + face(120, 136, 1.05, { gap: 22 }));

add("pera", "Pera", "frutas", 36, () =>
  line("M120 52 Q118 34 128 26", 6, C.brownDark) + leafAt(126, 40, -10)
  + path("M120 50 C96 50 98 96 84 116 C58 150 62 208 120 208 C178 208 182 150 156 116 C142 96 144 50 120 50 Z", "#c6e06b")
  + shine(90, 150, 9, 18, 15)
  + face(120, 160, 0.95, { gap: 20 }));

add("uva", "Uva", "frutas", 24, () => {
  const grapes = [[84, 84], [112, 84], [140, 84], [168, 84], [98, 112], [126, 112], [154, 112], [84, 140], [112, 140], [140, 140], [98, 168], [126, 168], [112, 196]];
  return line("M126 70 Q124 50 136 38", 6, C.brownDark) + leafAt(132, 56, -25)
    + grapes.map(([x, y]) => circle(x, y, 17, C.purple)).join("")
    + grapes.map(([x, y]) => circle(x - 6, y - 6, 3.6, C.white, { stroke: "none", opacity: 0.65 })).join("")
    + circle(126, 124, 25, C.purple)
    + face(126, 122, 0.72, { gap: 13 });
});

add("morango", "Morango", "frutas", 36, () =>
  path("M120 206 C70 182 44 122 64 92 C80 70 104 76 120 84 C136 76 160 70 176 92 C196 122 170 182 120 206 Z", C.red)
  + [[86, 116], [154, 116], [96, 152], [144, 152], [120, 182], [74, 140], [166, 140], [110, 196], [130, 196]]
    .map(([x, y]) => ellipse(x, y, 3, 4.5, "#ffe08a", noStroke)).join("")
  + path("M120 92 L94 70 L112 74 L102 54 L120 68 L138 54 L128 74 L146 70 Z", C.leaf)
  + face(120, 132, 0.9, { gap: 18 }));

add("abacaxi", "Abacaxi", "frutas", 36, () => {
  const clip = `<clipPath id="abacaxi-corpo">${ellipse(120, 152, 52, 62)}</clipPath>`;
  return `<defs>${clip}</defs>`
    + path("M120 98 L98 44 L112 72 L120 22 L128 72 L142 44 Z", C.greenDark)
    + path("M118 100 L80 62 L104 78 Z", C.leaf) + path("M122 100 L160 62 L136 78 Z", C.leaf)
    + ellipse(120, 152, 52, 62, C.yellow)
    + group(line("M60 108 L170 218 M60 138 L150 228 M60 168 L120 228 M84 92 L180 188 M110 90 L180 160 M180 108 L70 218 M180 138 L90 228 M180 168 L120 228 M156 92 L60 188 M130 90 L60 160", 3, C.yellowDark), { "clip-path": "url(#abacaxi-corpo)" })
    + ellipse(120, 152, 52, 62, "none")
    + ellipse(120, 156, 30, 22, C.yellow, { stroke: "none", opacity: 0.9 })
    + face(120, 150, 0.9, { gap: 18 });
});

add("melancia", "Melancia", "frutas", 36, () =>
  path("M26 72 A94 94 0 0 0 214 72 Z", C.greenDark)
  + path("M40 72 A80 80 0 0 0 200 72 Z", "#eaf7d7", noStroke)
  + path("M50 72 A70 70 0 0 0 190 72 Z", "#ff6b81", { "stroke-width": 3 })
  + path("M26 72 A94 94 0 0 0 214 72 Z", "none")
  + [[80, 98], [160, 98], [100, 124], [140, 124], [120, 132]].slice(0, 4).map(([x, y]) => ellipse(x, y, 3.2, 5.2, "#3d2f2f", noStroke)).join("")
  + face(120, 94, 0.85, { gap: 18 }));

add("limao", "Limão-siciliano", "frutas", 60, () =>
  path("M22 132 L38 122 Q50 76 120 74 Q190 76 202 122 L218 132 L202 142 Q190 188 120 190 Q50 188 38 142 Z", "#fff06a")
  + leafAt(118, 76, -15)
  + shine(78, 112, 10, 16, 50)
  + face(120, 134, 1, { gap: 22 }));

add("pessego", "Pêssego", "frutas", 60, () =>
  line("M120 70 Q120 52 128 44", 5, C.brownDark) + leafAt(126, 56, -15)
  + path("M120 68 C70 52 42 102 46 142 C50 192 90 212 120 208 C150 212 190 192 194 142 C198 102 170 52 120 68 Z", "#ffb59a")
  + ellipse(156, 120, 30, 36, "#ff8f8f", { stroke: "none", opacity: 0.45 })
  + line("M120 72 Q100 134 120 204", 4, "#e8846a")
  + face(96, 140, 0.85, { gap: 16 }));

add("manga", "Manga", "frutas", 36, () =>
  line("M74 78 Q66 62 72 50", 6, C.brownDark) + leafAt(72, 58, -40)
  + path("M70 80 C110 40 200 60 196 132 C192 192 120 214 76 188 C38 166 40 110 70 80 Z", "#ffc04d")
  + ellipse(156, 98, 32, 24, "#ff7f50", { stroke: "none", opacity: 0.55 })
  + ellipse(84, 170, 26, 18, C.green, { stroke: "none", opacity: 0.55 })
  + path("M70 80 C110 40 200 60 196 132 C192 192 120 214 76 188 C38 166 40 110 70 80 Z", "none")
  + face(122, 134, 0.95, { gap: 20 }));

add("coco", "Coco", "frutas", 48, () =>
  tube("M138 74 L166 18", C.red, 7) + line("M152 46 L160 30", 3, C.white)
  + circle(120, 136, 78, "#7cc45a")
  + ellipse(120, 74, 34, 12, "#f4f7e6")
  + ellipse(120, 74, 20, 6, "#d8ecbc", noStroke)
  + shine(78, 118, 10, 18, 20)
  + face(120, 144, 1.05, { gap: 22 }));

add("abacate", "Abacate", "frutas", 36, () =>
  path("M120 30 C86 30 82 78 68 104 C44 148 60 214 120 214 C180 214 196 148 172 104 C158 78 154 30 120 30 Z", "#4e8a3a")
  + path("M120 44 C96 44 94 84 82 108 C62 146 76 200 120 200 C164 200 178 146 158 108 C146 84 144 44 120 44 Z", "#d6ef9a", { "stroke-width": 3 })
  + circle(120, 152, 30, C.brown)
  + shine(110, 142, 7, 10)
  + face(120, 96, 0.75, { gap: 15 }));

add("mamao", "Mamão", "frutas", 36, () =>
  path("M120 22 C70 22 46 72 48 122 C50 182 84 218 120 218 C156 218 190 182 192 122 C194 72 170 22 120 22 Z", "#ffcf5c")
  + path("M120 36 C78 36 62 78 62 122 C62 172 90 204 120 204 C150 204 178 172 178 122 C178 78 162 36 120 36 Z", "#ff9a52", { "stroke-width": 3 })
  + ellipse(120, 146, 26, 42, "#ffb878", { "stroke-width": 3 })
  + [[112, 124], [128, 124], [108, 140], [120, 138], [132, 140], [112, 156], [128, 156], [120, 170], [120, 112]]
    .map(([x, y]) => circle(x, y, 4.2, "#3d2f2f", noStroke)).join("")
  + face(120, 78, 0.75, { gap: 15 }));

/* --------------------------- TRANSPORTES --------------------------- */
const wheel = (x, y, r, hub = C.gray) => circle(x, y, r, "#4b4b5a") + circle(x, y, r * 0.42, hub);

add("carro", "Carro", "transportes", 12, () =>
  path("M30 152 Q30 124 56 120 L76 120 L98 86 Q104 78 116 78 L160 78 Q172 78 180 88 L200 118 Q214 122 214 142 L214 156 Q214 166 204 166 L40 166 Q30 166 30 156 Z", C.red)
  + path("M108 90 L92 118 L134 118 L134 90 Z", C.sky, { "stroke-width": 4 })
  + path("M146 90 L146 118 L190 118 L174 92 Z", C.sky, { "stroke-width": 4 })
  + ellipse(36, 138, 6, 9, C.yellow, { "stroke-width": 3 })
  + wheel(74, 166, 23) + wheel(172, 166, 23)
  + face(124, 140, 0.75, { gap: 16 }));

add("onibus", "Ônibus", "transportes", 24, () =>
  rect(22, 62, 196, 118, 20, "#ffcf3f")
  + [38, 80, 122, 164].map((x) => rect(x, 76, 34, 34, 7, C.sky, { "stroke-width": 4 })).join("")
  + rect(22, 120, 196, 10, 0, C.orange, noStroke)
  + rect(22, 62, 196, 118, 20, "none")
  + ellipse(26, 160, 5, 8, C.white, { "stroke-width": 3 })
  + wheel(64, 182, 21) + wheel(176, 182, 21)
  + face(120, 148, 0.8, { gap: 18 }));

add("bicicleta", "Bicicleta", "transportes", 24, () =>
  circle(62, 160, 40, "none", { "stroke-width": 7 }) + circle(178, 160, 40, "none", { "stroke-width": 7 })
  + line("M62 128 V192 M30 160 H94 M178 128 V192 M146 160 H210", 2.5, C.grayDark)
  + tube("M62 160 L102 112 L164 112 L178 160 M102 112 L124 160 L164 112 M124 160 L62 160", C.blueDark, 6)
  + tube("M164 112 L158 92 Q170 86 182 90", C.ink, 4)
  + path("M86 102 Q102 94 118 102 L114 108 L90 108 Z", "#4b4b5a", { "stroke-width": 3 })
  + circle(124, 160, 9, C.gray));

add("moto", "Motocicleta", "transportes", 36, () =>
  wheel(58, 168, 30) + wheel(182, 168, 30)
  + line("M170 116 L182 168", 7) + tube("M160 104 L188 100", C.ink, 4)
  + path("M72 144 Q88 112 126 112 L168 112 Q186 116 186 140 Q140 150 72 144 Z", C.red)
  + path("M80 118 Q104 102 132 112 L80 124 Z", "#4b4b5a", { "stroke-width": 3 })
  + rect(96, 140, 48, 24, 6, C.gray)
  + tube("M40 170 L96 160", C.grayDark, 6)
  + circle(194, 126, 9, C.yellow, { "stroke-width": 3 })
  + face(148, 128, 0.6, { gap: 14 }));

add("caminhao", "Caminhão", "transportes", 36, () =>
  rect(104, 66, 114, 104, 12, C.orange)
  + path("M22 170 V110 Q22 96 36 96 L72 96 Q82 96 88 106 L104 128 L104 170 Z", C.blue)
  + path("M34 106 H68 L82 128 H34 Z", C.sky, { "stroke-width": 4 })
  + ellipse(24, 152, 4, 8, C.yellow, { "stroke-width": 3 })
  + wheel(56, 174, 20) + wheel(146, 174, 20) + wheel(190, 174, 20)
  + face(160, 116, 0.9, { gap: 18 }));

add("aviao", "Avião", "transportes", 24, () =>
  path("M176 110 L200 52 L222 52 L212 114 Z", C.red)
  + ellipse(120, 120, 98, 32, "#f4f8ff")
  + path("M112 126 L154 126 L118 192 L88 192 Z", C.blue)
  + path("M30 112 Q36 96 56 94 L62 112 Z", C.sky, { "stroke-width": 4 })
  + [96, 120, 144, 168].map((x) => circle(x, 112, 7, C.sky, { "stroke-width": 3 })).join("")
  + path("M184 126 L222 124 L214 140 L184 138 Z", C.red)
  + face(64, 124, 0.65, { gap: 13 }));

add("barco", "Barco", "transportes", 36, () =>
  path("M6 196 q19 -10 38 0 t38 0 t38 0 t38 0 t38 0 t38 0 V232 H6 Z", "#bfe6ff", { "stroke-width": 4 })
  + line("M120 152 V36", 6, C.woodDark)
  + path("M126 42 L126 142 L198 142 Z", C.white)
  + path("M114 58 L114 142 L56 142 Z", C.yellow)
  + path("M120 36 L144 44 L120 52 Z", C.red, { "stroke-width": 3 })
  + path("M36 150 L204 150 L182 188 Q120 198 58 188 Z", C.red)
  + face(120, 164, 0.65, { gap: 16 }));

add("trem", "Trem", "transportes", 48, () =>
  rect(14, 200, 212, 8, 4, C.woodDark)
  + circle(42, 46, 14, "#e6e9ef", { "stroke-width": 3 }) + circle(66, 30, 11, "#e6e9ef", { "stroke-width": 3 })
  + path("M50 110 L44 72 L76 72 L70 110 Z", "#5b5b6b")
  + rect(28, 108, 98, 70, 16, C.red)
  + rect(120, 64, 72, 114, 12, C.blue)
  + rect(132, 78, 46, 36, 6, C.sky, { "stroke-width": 4 })
  + rect(112, 54, 88, 16, 8, "#5b5b6b")
  + path("M28 166 L12 190 L36 190 Z", C.gray, { "stroke-width": 4 })
  + wheel(56, 184, 16) + wheel(100, 184, 16) + wheel(158, 182, 20)
  + face(78, 140, 0.85, { gap: 17 }));

add("helicoptero", "Helicóptero", "transportes", 48, () =>
  tube("M24 66 H184", C.ink, 7) + rect(98, 66, 12, 22, 3, C.ink)
  + path("M158 118 L212 106 L212 126 L158 142 Z", "#ffcf3f")
  + line("M212 94 V138 M200 116 H224", 5, C.ink)
  + line("M80 172 V194 M134 172 V194", 6) + tube("M54 194 H164 Q172 194 172 186", C.ink, 5)
  + ellipse(106, 132, 66, 46, "#ffcf3f")
  + path("M46 134 Q46 98 86 92 L96 92 L96 134 Z", C.sky, { "stroke-width": 4 })
  + face(130, 140, 0.8, { gap: 17 }));

add("ambulancia", "Ambulância", "transportes", 60, () => {
  const star = [0, 60, 120].map((a) => rect(55, 100, 10, 34, 3, "#3a7bd5", { stroke: "none", transform: `rotate(${a} 60 117)` })).join("");
  return rect(54, 66, 44, 18, 6, C.red, { "stroke-width": 4 }) + rect(76, 66, 22, 18, 0, C.blue, { stroke: "none" })
    + rect(54, 66, 44, 18, 6, "none", { "stroke-width": 4 })
    + path("M22 172 V96 Q22 84 34 84 L150 84 Q162 84 170 96 L204 136 Q214 146 214 158 V172 Z", "#fbfbff")
    + path("M154 96 L190 138 H154 Z", C.sky, { "stroke-width": 4 })
    + rect(22, 146, 192, 12, 0, C.red, noStroke)
    + path("M22 172 V96 Q22 84 34 84 L150 84 Q162 84 170 96 L204 136 Q214 146 214 158 V172 Z", "none")
    + star
    + wheel(62, 176, 19) + wheel(172, 176, 19)
    + face(116, 118, 0.7, { gap: 15 });
});

add("trator", "Trator", "transportes", 36, () =>
  tube("M70 120 V84", "#5b5b6b", 7) + circle(70, 70, 10, "#e6e9ef", { "stroke-width": 3 })
  + path("M118 132 V62 H186 V132 Z", C.red)
  + rect(130, 74, 44, 40, 6, C.sky, { "stroke-width": 4 })
  + rect(32, 118, 110, 42, 10, C.red)
  + wheel(166, 162, 46, C.yellow) + wheel(62, 178, 26, C.yellow)
  + face(84, 134, 0.6, { gap: 14 }));

add("foguete", "Foguete", "transportes", 48, () =>
  path("M96 164 Q120 232 144 164 Z", C.orange) + path("M108 164 Q120 206 132 164 Z", C.yellow, { "stroke-width": 3 })
  + path("M86 128 L54 180 L88 170 Z", C.red) + path("M154 128 L186 180 L152 170 Z", C.red)
  + path("M120 20 C154 46 162 100 158 166 L82 166 C78 100 86 46 120 20 Z", C.white)
  + path("M120 20 C140 36 150 58 154 78 L86 78 C90 58 100 36 120 20 Z", C.red)
  + circle(120, 108, 19, C.sky, { "stroke-width": 5 })
  + shine(114, 102, 5, 8, 30)
  + face(120, 140, 0.6, { gap: 14 }));

/* ----------------------------- OBJETOS ----------------------------- */
add("bola", "Bola", "objetos", 12, () => {
  const clip = `<clipPath id="bola-corpo">${circle(120, 124, 82)}</clipPath>`;
  return `<defs>${clip}</defs>` + circle(120, 124, 82, C.yellow)
    + group(path("M120 42 C64 70 64 178 120 206 C92 170 92 78 120 42 Z", C.red, { "stroke-width": 4 })
      + path("M120 42 C176 70 176 178 120 206 C148 170 148 78 120 42 Z", C.blue, { "stroke-width": 4 }), { "clip-path": "url(#bola-corpo)" })
    + circle(120, 124, 82, "none")
    + shine(78, 88, 10, 16, 35)
    + face(120, 126, 0.65, { gap: 12 });
});

add("caneca", "Caneca", "objetos", 24, () =>
  line("M90 54 q-8 -12 0 -24 M118 50 q-8 -12 0 -24", 4, C.grayDark)
  + tube("M158 96 Q204 98 200 138 Q196 170 158 166", C.blue, 15)
  + rect(54, 66, 108, 132, 20, C.blue)
  + ellipse(108, 72, 50, 10, "#8a5a3c", { "stroke-width": 4 })
  + face(108, 134, 1, { gap: 20 }));

add("colher", "Colher", "objetos", 12, () =>
  tube("M106 114 L192 206", C.gray, 16)
  + ellipse(80, 82, 36, 50, C.gray, { transform: "rotate(-40 80 82)" })
  + ellipse(74, 76, 18, 28, "#e9edf3", { stroke: "none", transform: "rotate(-40 74 76)" }));

add("prato", "Prato", "objetos", 24, () =>
  ellipse(120, 130, 104, 62, "#bfe0ff")
  + ellipse(120, 128, 88, 50, C.white, { "stroke-width": 3 })
  + ellipse(120, 128, 62, 32, "#f3f7fc", { "stroke-width": 3 })
  + [[48, 130], [192, 130], [120, 74], [120, 184]].map(([x, y]) => circle(x, y, 4, C.blueDark, noStroke)).join(""));

add("tigela", "Tigela", "objetos", 36, () =>
  rect(88, 192, 64, 14, 5, "#ff8fab")
  + path("M28 106 H212 Q208 198 120 198 Q32 198 28 106 Z", C.pink)
  + ellipse(120, 106, 92, 20, C.pinkLight)
  + ellipse(120, 108, 76, 12, "#f6c7d4", noStroke)
  + face(120, 150, 0.9, { gap: 20 }));

add("garrafa", "Garrafa", "objetos", 36, () =>
  rect(92, 22, 56, 22, 6, C.blue)
  + path("M98 42 H142 V62 Q170 82 170 112 V196 Q170 212 154 212 H86 Q70 212 70 196 V112 Q70 82 98 62 Z", "#e3f3ff")
  + path("M80 112 H160 V194 Q160 202 152 202 H88 Q80 202 80 194 Z", C.white, { "stroke-width": 3 })
  + face(120, 150, 0.9, { gap: 18 }));

add("cadeira", "Cadeira", "objetos", 24, () =>
  rect(142, 28, 20, 182, 9, C.wood)
  + rect(52, 118, 112, 20, 7, C.wood)
  + rect(56, 136, 18, 74, 7, C.wood)
  + rect(60, 106, 96, 16, 8, C.pink)
  + line("M152 52 V100", 4, C.woodDark));

add("mesa", "Mesa", "objetos", 24, () =>
  rect(38, 108, 18, 98, 7, C.wood) + rect(184, 108, 18, 98, 7, C.wood)
  + rect(34, 104, 172, 16, 0, C.woodDark)
  + rect(20, 84, 200, 24, 11, C.wood)
  + shine(70, 92, 26, 3));

add("cama", "Cama", "objetos", 24, () =>
  rect(20, 70, 32, 140, 12, C.wood)
  + rect(194, 112, 28, 98, 10, C.wood)
  + rect(40, 126, 170, 44, 14, C.white)
  + path("M110 120 H206 Q214 120 214 132 V170 H110 Z", C.blue)
  + line("M132 128 V168 M160 128 V168 M188 128 V168", 3, C.blueDark)
  + rect(54, 100, 58, 32, 15, C.white)
  + rect(44, 170, 14, 30, 5, C.woodDark) + rect(196, 170, 14, 30, 5, C.woodDark));

add("tesoura", "Tesoura", "objetos", 48, () =>
  path("M116 118 L206 36 L214 44 L130 132 Z", C.gray)
  + path("M124 118 L34 36 L26 44 L110 132 Z", C.gray)
  + circle(86, 176, 24, "none", { stroke: K, "stroke-width": 20 }) + circle(86, 176, 24, "none", { stroke: C.red, "stroke-width": 10 })
  + circle(154, 176, 24, "none", { stroke: K, "stroke-width": 20 }) + circle(154, 176, 24, "none", { stroke: C.red, "stroke-width": 10 })
  + tube("M110 132 L96 156 M130 132 L144 156", C.red, 10)
  + circle(120, 125, 6, C.grayDark));

add("lapis", "Lápis", "objetos", 36, () => group(
  rect(46, 100, 128, 40, 0, C.yellow)
  + line("M46 113 H174 M46 127 H174", 3, C.yellowDark)
  + rect(22, 100, 28, 40, 8, C.pink)
  + rect(44, 100, 16, 40, 0, C.gray)
  + path("M174 100 L214 120 L174 140 Z", "#f5d7b0")
  + path("M198 112 L214 120 L198 128 Z", K, { "stroke-width": 3 }),
  { transform: "rotate(-30 120 120)" }));

add("sapato", "Sapato", "objetos", 24, () =>
  path("M24 170 H212 Q218 194 198 196 H40 Q20 196 24 170 Z", C.white)
  + path("M32 172 Q24 96 66 92 L108 94 Q118 118 150 122 Q206 130 210 172 Z", C.red)
  + ellipse(84, 98, 26, 9, "#9c2f3a", { "stroke-width": 4 })
  + tube("M100 104 Q132 92 156 124", C.redDark, 9)
  + circle(154, 124, 7, C.yellow, { "stroke-width": 3 })
  + shine(62, 140, 14, 6, -10));

add("meia", "Meia", "objetos", 36, () => {
  const sock = "M84 26 H148 V124 Q150 144 170 156 Q206 176 192 204 Q178 228 142 206 L92 172 Q76 160 80 138 Z";
  const clip = `<clipPath id="meia-corpo">${path(sock)}</clipPath>`;
  return `<defs>${clip}</defs>` + path(sock, C.white)
    + group(rect(70, 26, 100, 24, 0, C.blue, noStroke) + rect(70, 72, 100, 14, 0, C.red, noStroke) + rect(70, 102, 100, 14, 0, C.yellow, noStroke)
      + circle(186, 200, 26, C.blue, noStroke) + circle(88, 160, 20, C.red, noStroke), { "clip-path": "url(#meia-corpo)" })
    + path(sock, "none") + line("M84 50 H148", 4);
});

add("chapeu", "Chapéu", "objetos", 48, () =>
  ellipse(120, 156, 104, 32, "#f6d27a")
  + path("M66 156 Q66 78 120 76 Q174 78 174 156 Z", "#f6d27a")
  + path("M68 134 Q120 148 172 134 L174 152 Q120 166 66 152 Z", C.red, { "stroke-width": 4 })
  + line("M84 112 Q120 120 156 112 M76 172 Q120 184 164 172", 3, "#e0b456"));

add("escova", "Escova de dentes", "objetos", 36, () => group(
  tube("M20 120 H140", C.blue, 18)
  + rect(138, 104, 62, 30, 10, C.blue)
  + rect(144, 78, 50, 26, 4, C.white, { "stroke-width": 4 })
  + line("M154 80 V102 M166 80 V102 M178 80 V102 M190 80 V102", 3, C.grayDark)
  + path("M146 76 Q150 56 168 62 Q176 48 192 60 Q200 74 186 78 Z", "#bfe8ff", { "stroke-width": 4 }),
  { transform: "rotate(-25 120 120)" }));

add("pente", "Pente", "objetos", 36, () => group(
  Array.from({ length: 12 }, (_, i) => rect(44 + i * 13, 108, 8, 58, 3, C.pink)).join("")
  + rect(32, 82, 176, 34, 12, C.pink),
  { transform: "rotate(-12 120 124)" }));

add("chave", "Chave", "objetos", 48, () => group(
  rect(96, 108, 112, 22, 6, C.yellow)
  + rect(170, 128, 12, 24, 3, C.yellow) + rect(190, 128, 12, 32, 3, C.yellow)
  + circle(70, 119, 38, C.yellow)
  + circle(70, 119, 14, C.white),
  { transform: "rotate(-20 120 120)" }));

add("guarda-chuva", "Guarda-chuva", "objetos", 36, () => {
  const canopy = "M22 120 Q28 38 120 34 Q212 38 218 120 Q200 104 178 120 Q160 104 140 120 Q120 104 100 120 Q80 104 62 120 Q42 104 22 120 Z";
  const clip = `<clipPath id="chuva-copa">${path(canopy)}</clipPath>`;
  return `<defs>${clip}</defs>`
    + tube("M120 116 V198 Q120 216 104 216 Q90 216 90 202", C.ink, 6)
    + path(canopy, C.red)
    + group(path("M120 30 L62 130 L100 130 Z", C.white, noStroke) + path("M120 30 L140 130 L178 130 Z", C.white, noStroke), { "clip-path": "url(#chuva-copa)" })
    + path(canopy, "none") + line("M120 34 L100 120 M120 34 L140 120", 3)
    + line("M120 34 V22", 6);
});

add("copo", "Copo", "objetos", 12, () =>
  tube("M138 112 L166 26", C.red, 7)
  + path("M62 68 H178 L162 208 H78 Z", "#e3f3ff")
  + path("M68 110 H172 L162 204 H78 Z", C.orange, { "stroke-width": 3 })
  + path("M62 68 H178 L162 208 H78 Z", "none")
  + face(120, 154, 0.9, { gap: 18 }));

add("mamadeira", "Mamadeira", "objetos", 12, () =>
  path("M102 54 Q102 22 120 22 Q138 22 138 54 Z", "#ffd8a8")
  + rect(88, 52, 64, 22, 7, C.blue)
  + rect(80, 72, 80, 140, 26, "#e3f3ff")
  + rect(88, 112, 64, 92, 20, C.white, { "stroke-width": 3 })
  + line("M80 96 h14 M80 120 h10 M80 144 h14 M80 168 h10", 3, C.blueDark)
  + face(124, 152, 0.85, { gap: 16 }));

add("livro", "Livro", "objetos", 24, () =>
  path("M18 70 Q70 50 120 70 Q170 50 222 70 V200 Q170 182 120 202 Q70 182 18 200 Z", C.red)
  + path("M28 62 Q74 46 120 64 V190 Q74 172 28 188 Z", C.white)
  + path("M212 62 Q166 46 120 64 V190 Q166 172 212 188 Z", C.white)
  + circle(64, 102, 16, C.yellow, { "stroke-width": 3 })
  + line("M44 140 Q72 132 100 140 M44 158 Q72 150 100 158", 4, C.grayDark)
  + path("M140 150 L166 112 L192 150 Z", C.green, { "stroke-width": 4 })
  + rect(158, 150, 16, 16, 2, C.woodDark, { "stroke-width": 3 }));

add("balao", "Balão", "objetos", 24, () =>
  line("M120 178 Q108 194 124 208 Q138 222 116 232", 3)
  + path("M112 182 L120 166 L128 182 Z", C.red, { "stroke-width": 3 })
  + ellipse(120, 96, 62, 74, C.red)
  + shine(94, 66, 12, 22, 25)
  + face(120, 104, 1, { gap: 20 }));

add("boneca", "Boneca", "objetos", 24, () =>
  rect(94, 186, 18, 26, 6, C.skin) + rect(128, 186, 18, 26, 6, C.skin)
  + ellipse(103, 212, 14, 7, C.red) + ellipse(137, 212, 14, 7, C.red)
  + ellipse(70, 146, 10, 22, C.skin, { transform: "rotate(20 70 146)" }) + ellipse(170, 146, 10, 22, C.skin, { transform: "rotate(-20 170 146)" })
  + path("M86 118 H154 L182 192 H58 Z", C.pink)
  + path("M100 118 L120 136 L140 118 Z", C.white, { "stroke-width": 4 })
  + circle(70, 76, 18, C.brownDark) + circle(170, 76, 18, C.brownDark)
  + circle(120, 78, 42, C.skin)
  + path("M80 74 Q82 34 120 34 Q158 34 160 74 Q140 52 120 62 Q100 52 80 74 Z", C.brownDark)
  + face(120, 88, 0.85, { gap: 16 }));

add("celular", "Celular", "objetos", 24, () =>
  rect(66, 20, 108, 200, 20, "#5b6070")
  + rect(78, 42, 84, 152, 8, C.sky, { "stroke-width": 3 })
  + [[90, 56, C.red], [114, 56, C.yellow], [138, 56, C.green], [90, 82, C.blue], [114, 82, C.pink], [138, 82, C.orange], [90, 108, C.purple], [114, 108, C.leaf], [138, 108, C.redDark]]
    .map(([x, y, fill]) => rect(x, y, 14, 14, 4, fill, { "stroke-width": 2.5 })).join("")
  + circle(120, 206, 6, "#8f99aa", noStroke) + rect(108, 28, 24, 6, 3, "#8f99aa", noStroke));

export const KAWAII_FIGURES = FIGURES.map(({ draw, ...meta }) => meta);

export function renderKawaiiSvg(id) {
  const figure = FIGURES.find((entry) => entry.id === id);
  if (!figure) throw new Error(`Figura kawaii inexistente: ${id}`);
  const body = figure.draw();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" overflow="hidden">`
    + `<g stroke="${K}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>\n`;
}
