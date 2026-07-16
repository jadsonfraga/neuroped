import DOMPurify from "dompurify";

/**
 * HTML aceito nos artigos educativos. O conteúdo hoje é local, mas passa pela
 * mesma fronteira de segurança de um CMS para que uma futura fonte remota não
 * transforme `dangerouslySetInnerHTML` em execução de código.
 */
const ALLOWED_TAGS = [
  "a",
  "blockquote",
  "br",
  "div",
  "em",
  "h2",
  "h3",
  "h4",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "ul",
];

const ALLOWED_CLASSES = new Set(["source-note", "tip-box", "tip-title"]);
const SAFE_LINK_PROTOCOL = /^(?:https?:|mailto:|tel:|\/|#)/i;

export function sanitizeArticleHtml(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["class", "href", "rel", "target"],
    ALLOW_ARIA_ATTR: false,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["embed", "iframe", "object", "script", "style", "svg"],
    RETURN_TRUSTED_TYPE: false,
  });

  // Segunda camada: classes e destinos de links também seguem allowlist.
  const template = document.createElement("template");
  template.innerHTML = clean;
  template.content.querySelectorAll<HTMLElement>("*").forEach((element) => {
    if (element.hasAttribute("class")) {
      const safeClasses = Array.from(element.classList).filter((name) =>
        ALLOWED_CLASSES.has(name),
      );
      if (safeClasses.length > 0) {
        element.className = safeClasses.join(" ");
      } else {
        element.removeAttribute("class");
      }
    }

    if (element instanceof HTMLAnchorElement) {
      const href = element.getAttribute("href")?.trim() ?? "";
      if (!SAFE_LINK_PROTOCOL.test(href)) {
        element.removeAttribute("href");
      }
      if (element.getAttribute("target") === "_blank") {
        element.setAttribute("rel", "noopener noreferrer");
      } else {
        element.removeAttribute("target");
        element.removeAttribute("rel");
      }
    }
  });

  return template.innerHTML;
}
