/**
 * SkipNav.tsx — Link de navegação rápida para acessibilidade (WCAG 2.4.1)
 *
 * Permite que usuários de teclado e leitores de tela saltem diretamente
 * para o conteúdo principal, evitando navegar por toda a barra de navegação.
 *
 * USO:
 *  1. Adicione <SkipNav /> no início do Layout (antes do header)
 *  2. Adicione id="main-content" na tag <main> do Layout
 */
import type { MouseEvent } from "react";

export function SkipNav() {
  const focusMainContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const main = document.getElementById("main-content");
    if (!main) return;
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: "start" });
  };

  return (
    <a
      href="#main-content"
      onClick={focusMainContent}
      className="skip-nav"
      aria-label="Ir para o conteúdo principal"
    >
      Ir para o conteúdo principal
    </a>
  );
}
