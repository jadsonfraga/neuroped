/**
 * SkipNav.tsx — Link de navegação rápida para acessibilidade (WCAG 2.4.1)
 *
 * Permite que usuários de teclado e leitores de tela saltem diretamente
 * para o conteúdo principal, evitando navegar por toda a barra de navegação.
 *
 * Também monta a camada decorativa global de mascotes no primeiro ponto
 * estável do Layout. A decoração é aria-hidden e pointer-events-none, então
 * não altera a ordem de foco nem a semântica do atalho de acessibilidade.
 *
 * USO:
 *  1. Adicione <SkipNav /> no início do Layout (antes do header)
 *  2. Adicione id="main-content" na tag <main> do Layout
 */
import { lazy, Suspense, type MouseEvent } from "react";

const PageMascotDecor = lazy(() =>
  import("@/components/PageMascotDecor").then(({ PageMascotDecor: Component }) => ({
    default: Component,
  })),
);

export function SkipNav() {
  const focusMainContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const main = document.getElementById("main-content");
    if (!main) return;
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: "start" });
  };

  return (
    <>
      <a
        href="#main-content"
        onClick={focusMainContent}
        className="skip-nav"
        aria-label="Ir para o conteúdo principal"
      >
        Ir para o conteúdo principal
      </a>
      <Suspense fallback={null}>
        <PageMascotDecor />
      </Suspense>
    </>
  );
}
