import { useEffect } from "react";
import { useLocation } from "wouter";
import { DoorOpen } from "lucide-react";

export function readSafeNextPath(hash: string): string {
  try {
    const route = hash.replace(/^#/, "");
    const queryIndex = route.indexOf("?");
    if (queryIndex === -1) return "/";
    const next = new URLSearchParams(route.slice(queryIndex + 1)).get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  } catch {
    // Hash inválido: volta para a raiz sem permitir redirecionamento externo.
  }
  return "/";
}

/**
 * Rota legada de login.
 *
 * O app está em modo aberto local. A página é mantida apenas para links antigos
 * e redireciona imediatamente para o destino interno solicitado, sem formulário,
 * e-mail, PIN ou senha.
 */
export default function LoginPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate(readSafeNextPath(window.location.hash));
  }, [navigate]);

  return (
    <div
      className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <DoorOpen className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="text-lg font-bold text-foreground">Acesso aberto</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Nenhuma credencial é necessária. Abrindo o NeuroPed…
      </p>
    </div>
  );
}
