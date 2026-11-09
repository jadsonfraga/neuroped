import { marked } from "marked";
export const sample = `## Quem é a criança\n\nEste é um **documento demonstrativo**, sem dados de paciente. Substitua este texto pelo conteúdo integral do laudo aprovado.\n\n## História e avaliação\n\nO texto do Markdown é preservado na renderização. Títulos, parágrafos, listas e tabelas recebem a identidade visual SuperNeuroPed.\n\n## Plano de acompanhamento\n\n- Registre as orientações já definidas na avaliação.\n- Descreva os objetivos individualizados.\n- Informe o acompanhamento conforme a decisão médica.\n\n| Domínio | Objetivo |\n| --- | --- |\n| Comunicação | Inserir objetivo aprovado |\n| Autonomia | Inserir objetivo aprovado |`;
function inline(tokens = []) {
  return tokens.flatMap((t) => {
    if (t.type === "image")
      throw Error(
        "Imagens no Markdown não são aceitas. Remova a referência à imagem antes de renderizar.",
      );
    if (t.type === "html")
      throw Error("Use Markdown puro: HTML embutido não é aceito.");
    if (t.type === "br") return [{ text: "\n" }];
    if (t.type === "strong" || t.type === "em" || t.type === "del")
      return inline(t.tokens).map((x) => ({
        ...x,
        ...(t.type === "strong"
          ? { bold: true }
          : t.type === "em"
            ? { italics: true }
            : { decoration: "lineThrough" }),
      }));
    if (t.type === "link")
      return inline(t.tokens).map((x) => ({
        ...x,
        color: "#8b6a1e",
        ...(/^https?:\/\//i.test(t.href) ? { link: t.href } : {}),
      }));
    if (t.tokens) return inline(t.tokens);
    return [{ text: t.text ?? t.raw ?? "" }];
  });
}
export function contentFromMarkdown(md) {
  let n = 0;
  function blocks(tokens) {
    return tokens.flatMap((t) => {
      switch (t.type) {
        case "space":
          return [];
        case "heading":
          n++;
          return [
            {
              stack: [
                {
                  text: String(n).padStart(2, "0"),
                  fontSize: 10,
                  color: "#a8801f",
                  characterSpacing: 2,
                  margin: [0, 0, 0, 5],
                },
                {
                  text: inline(t.tokens),
                  fontSize: t.depth > 2 ? 17 : 20,
                  bold: true,
                  color: "#0a1830",
                },
              ],
              unbreakable: true,
              margin: [0, 14, 0, 12],
              headlineLevel: 1,
            },
          ];
        case "paragraph":
        case "text":
          return [
            {
              text: inline(t.tokens || [{ text: t.text }]),
              margin: [0, 0, 0, 9],
              alignment: "justify",
            },
          ];
        case "list":
          return [
            {
              [t.ordered ? "ol" : "ul"]: t.items.map((i) => ({
                stack: blocks(i.tokens),
              })),
              ...(t.ordered ? { start: t.start } : {}),
              margin: [12, 0, 0, 10],
            },
          ];
        case "table":
          return [
            {
              table: {
                headerRows: 1,
                widths: t.header.map(() => "*"),
                body: [
                  t.header.map((c) => ({
                    text: inline(c.tokens),
                    bold: true,
                    fillColor: "#e9dfc9",
                  })),
                  ...t.rows.map((r) =>
                    r.map((c) => ({ text: inline(c.tokens) })),
                  ),
                ],
              },
              layout: {
                hLineColor: () => "#d9cba9",
                vLineColor: () => "#d9cba9",
                paddingLeft: () => 7,
                paddingRight: () => 7,
                paddingTop: () => 6,
                paddingBottom: () => 6,
              },
              fontSize: 11.5,
              margin: [0, 6, 0, 12],
            },
          ];
        case "blockquote":
          return [
            {
              stack: blocks(t.tokens),
              margin: [14, 0, 0, 10],
              italics: true,
              color: "#695631",
            },
          ];
        case "code":
          return [
            {
              text: t.text,
              fontSize: 11,
              margin: [8, 5, 0, 12],
              preserveLeadingSpaces: true,
            },
          ];
        case "hr":
          return [
            {
              canvas: [
                {
                  type: "line",
                  x1: 0,
                  y1: 4,
                  x2: 435,
                  y2: 4,
                  lineColor: "#c4a34d",
                },
              ],
              margin: [0, 6, 0, 12],
            },
          ];
        case "html":
          throw Error("Use Markdown puro: HTML embutido não é aceito.");
        default:
          throw Error("Elemento Markdown não suportado: " + t.type);
      }
    });
  }
  return blocks(marked.lexer(md));
}
export function definition(md, meta, logo) {
  const navy = "#0a1830",
    gold = "#c4a34d",
    ivory = "#f5efe2";
  return {
    pageSize: "A4",
    pageMargins: [79, 104, 79, 64],
    info: {
      title: meta.title,
      author: "Dr. Jadson Fraga Araújo Júnior",
      subject: "Laudo neuropediátrico",
    },
    defaultStyle: {
      font: "Cormorant",
      fontSize: 12.6,
      lineHeight: 1.2,
      color: "#1b2033",
    },
    background: (page) => ({
      canvas: [
        {
          type: "rect",
          x: 0,
          y: 0,
          w: 595.28,
          h: 841.89,
          color: page === 1 ? navy : ivory,
        },
        {
          type: "rect",
          x: 26,
          y: 26,
          w: 543.28,
          h: 789.89,
          lineColor: gold,
          lineWidth: 0.6,
        },
        {
          type: "rect",
          x: 30,
          y: 30,
          w: 535.28,
          h: 781.89,
          lineColor: gold,
          lineWidth: 0.3,
        },
      ],
    }),
    header: (page) =>
      page === 1
        ? null
        : {
            stack: [
              {
                columns: [
                  { image: logo, width: 25 },
                  {
                    text: "S U P E R N E U R O P E D",
                    fontSize: 11,
                    color: navy,
                    margin: [12, 10, 0, 0],
                  },
                  {
                    text: "Dr. Jadson Fraga Araújo Júnior\nNeuropediatra · CRM-PE 25.227 · RQE 17.756",
                    fontSize: 8,
                    alignment: "right",
                    color: "#777777",
                    margin: [0, 7, 0, 0],
                  },
                ],
              },
              {
                canvas: [
                  {
                    type: "line",
                    x1: 0,
                    y1: 13,
                    x2: 222,
                    y2: 13,
                    lineColor: gold,
                    lineWidth: 1.5,
                  },
                  {
                    type: "line",
                    x1: 222,
                    y1: 13,
                    x2: 261,
                    y2: 13,
                    lineColor: "#a41e1e",
                    lineWidth: 1.5,
                  },
                  {
                    type: "line",
                    x1: 261,
                    y1: 13,
                    x2: 437,
                    y2: 13,
                    lineColor: navy,
                    lineWidth: 1.5,
                  },
                ],
              },
            ],
            margin: [79, 43, 79, 0],
          },
    footer: (page, pages) =>
      page === 1
        ? null
        : {
            columns: [
              { text: meta.patient, color: "#8a8578" },
              {
                text: "Soli Deo Gloria",
                alignment: "center",
                color: "#8a8578",
              },
              {
                text: `fl. ${page - 1} de ${pages - 1}`,
                alignment: "right",
                color: "#8b6a1e",
              },
            ],
            fontSize: 8,
            margin: [79, 8, 79, 0],
          },
    content: [
      {
        stack: [
          {
            image: logo,
            width: 245,
            alignment: "center",
            margin: [0, 0, 0, 15],
          },
          {
            text: "S U P E R N E U R O P E D",
            fontSize: 12,
            color: gold,
            alignment: "center",
            margin: [0, 0, 0, 24],
          },
          {
            text: meta.title,
            fontSize: 35,
            color: ivory,
            alignment: "center",
            lineHeight: 1,
            margin: [0, 0, 0, 16],
          },
          {
            text: meta.subtitle.toLocaleUpperCase("pt-BR"),
            fontSize: 10,
            color: gold,
            characterSpacing: 1.5,
            alignment: "center",
            margin: [0, 0, 0, 48],
          },
          {
            text: "P A C I E N T E",
            fontSize: 10,
            color: gold,
            alignment: "center",
            margin: [0, 0, 0, 14],
          },
          {
            text: meta.patient,
            fontSize: 25,
            color: ivory,
            alignment: "center",
          },
          {
            text: meta.detail,
            fontSize: 12,
            color: ivory,
            alignment: "center",
            margin: [0, 10, 0, 0],
          },
        ],
        absolutePosition: { x: 60, y: 55 },
        width: 475,
      },
      {
        stack: [
          {
            text: "Dr. Jadson Fraga Araújo Júnior",
            fontSize: 15,
            color: ivory,
          },
          {
            text: "NEUROPEDIATRA · CRM-PE 25.227 · RQE 17.756",
            fontSize: 9,
            color: gold,
            margin: [0, 6, 0, 7],
          },
          {
            text: "Rua Raimundo Lacerda, 001 · São José · Petrolina/PE · CEP 56302-470",
            fontSize: 8,
            color: "#b4b8c0",
          },
        ],
        alignment: "center",
        absolutePosition: { x: 55, y: 710 },
        width: 485,
      },
      { text: "", pageBreak: "after" },
      ...contentFromMarkdown(md),
    ],
    pageBreakBefore: (node, following) =>
      node.headlineLevel === 1 && following.length === 0,
  };
}
