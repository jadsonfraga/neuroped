/**
 * SkipNav.tsx — Link de navegação rápida para acessibilidade (WCAG 2.4.1)
 *
 * Permite que usuários de teclado e leitores de tela saltem diretamente
 * para o conteúdo principal, evitando navegar por toda a barra de navegação.
 *
 * Também monta decoração e chrome de produto em pontos globais estáveis.
 * Ambos respeitam a semântica do app; a navegação móvel só aparece em sessão
 * profissional e não cria persistência clínica paralela.
 */
import { lazy, Suspense, type MouseEvent } from "react";
import "@/styles/app-store-finish.css";

const PageMascotDecor = lazy(() =>
  import("@/components/PageMascotDecor").then(({ PageMascotDecor: Component }) => ({
    default: Component,
  })),
);

const ProductChrome = lazy(() =>
  import("@/components/ProductChrome").then(({ ProductChrome: Component }) => ({
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
        <ProductChrome />
      </Suspense>
    </>
  );
}
