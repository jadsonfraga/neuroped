/**
 * Sanitização de HTML confiável (conteúdo próprio do app, não de usuário/CMS externo).
 *
 * Implementa a recomendação do issue #382 (item 3): remove tags e atributos
 * potencialmente perigosos antes de renderizar com dangerouslySetInnerHTML,
 * mesmo quando o HTML vem de fonte interna — defesa em profundidade caso o
 * conteúdo passe a vir de fonte externa/CMS no futuro.
 *
 * Estratégia: allow-list de tags e atributos, usando o parser do próprio
 * DOM (DOMParser) em vez de regex, para evitar bypasses comuns de sanitização
 * baseada em regex (ex.: tags quebradas, encoding, atributos duplicados).
 */

const ALLOWED_TAGS = new Set([
  "P",
  "STRONG",
  "EM",
  "H3",
  "UL",
  "LI",
  "DIV",
  "SPAN",
  "BR",
]);

const ALLOWED_CLASSES = new Set(["tip-box", "tip-title", "source-note"]);

const DANGEROUS_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "LINK",
  "META",
  "FORM",
  "SVG",
  "BASE",
]);

function sanitizeElement(el: Element): Node | null {
  const tag = el.tagName;

  if (DANGEROUS_TAGS.has(tag)) {
    return null;
  }

  // Tags fora da allow-list: descarta o elemento, mas preserva o texto dos
  // filhos (evita perder conteúdo por causa de uma tag inesperada).
  if (!ALLOWED_TAGS.has(tag)) {
    const fragment = document.createDocumentFragment();
    Array.from(el.childNodes).forEach((child) => {
      const sanitizedChild = sanitizeNode(child);
      if (sanitizedChild) fragment.appendChild(sanitizedChild);
    });
    return fragment;
  }

  const clean = document.createElement(tag.toLowerCase());

  // Apenas a classe, filtrada pela allow-list; nenhum outro atributo
  // (nada de on*, style, src, href, etc.) é copiado.
  const classAttr = el.getAttribute("class");
  if (classAttr) {
    const keptClasses = classAttr
      .split(/\s+/)
      .filter((c) => ALLOWED_CLASSES.has(c));
    if (keptClasses.length > 0) {
      clean.setAttribute("class", keptClasses.join(" "));
    }
  }

  Array.from(el.childNodes).forEach((child) => {
    const sanitizedChild = sanitizeNode(child);
    if (sanitizedChild) clean.appendChild(sanitizedChild);
  });

  return clean;
}

function sanitizeNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent ?? "");
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    return sanitizeElement(node as Element);
  }
  // Comentários, processing instructions, etc. são descartados.
  return null;
}

/**
 * Sanitiza uma string HTML de origem própria (artigos do Portal das
 * Famílias) antes de renderizar com dangerouslySetInnerHTML.
 */
export function sanitizeTrustedArticleHtml(html: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    // Ambiente sem DOM (SSR/build): não deveria ocorrer neste app (SPA
    // client-side), mas por segurança retorna string vazia em vez de HTML
    // não sanitizado.
    return "";
  }

  const parsed = new DOMParser().parseFromString(html, "text/html");
  const container = document.createElement("div");

  Array.from(parsed.body.childNodes).forEach((child) => {
    const sanitizedChild = sanitizeNode(child);
    if (sanitizedChild) container.appendChild(sanitizedChild);
  });

  return container.innerHTML;
}
