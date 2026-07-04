import { useEffect, useState } from "react";

const ACK_KEY = "neuroped:aviso-educativo-aceito-v1";

function alreadyAccepted(): boolean {
  try {
    return !!localStorage.getItem(ACK_KEY);
  } catch {
    return false;
  }
}

/**
 * Aceite único de ciência na PRIMEIRA visita: registra que o usuário viu e
 * entendeu que o app tem finalidade exclusivamente educativa. Guarda a ciência
 * (com data) no navegador. Não é imunidade legal — é uma camada de comunicação
 * e registro de ciência do usuário.
 */
export function AvisoLegalGate() {
  const [accepted, setAccepted] = useState<boolean>(() => alreadyAccepted());

  useEffect(() => {
    if (accepted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [accepted]);

  if (accepted) return null;

  function aceitar() {
    try {
      localStorage.setItem(ACK_KEY, JSON.stringify({ accepted: true, at: new Date().toISOString(), v: 1 }));
    } catch { /* storage indisponível — segue liberando a sessão */ }
    setAccepted(true);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="aviso-legal-title"
      className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-7">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl dark:bg-amber-950/40" aria-hidden="true">⚕️</div>
        <h1 id="aviso-legal-title" className="text-center text-lg font-black text-foreground">Aviso importante</h1>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-muted-foreground">
          O <strong className="font-semibold text-foreground">NeuroPed</strong> tem finalidade
          <strong className="font-semibold text-foreground"> exclusivamente educativa</strong>. Não é dispositivo
          médico e <strong className="font-semibold text-foreground">não substitui</strong> a avaliação, o diagnóstico
          ou a conduta de um profissional de saúde. Parte do conteúdo é educativa e pode não ter validação clínica
          formal. Em caso de dúvida ou urgência, procure um médico.
        </p>

        <button
          type="button"
          onClick={aceitar}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-primary to-chart-2 px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-95 active:scale-[0.99]"
          data-testid="button-aviso-aceitar"
        >
          Li e entendi — continuar
        </button>
        <a
          href="#/termos"
          onClick={aceitar}
          className="mt-3 block text-center text-xs font-semibold text-primary underline underline-offset-4 hover:opacity-80"
        >
          Ler os Termos de Uso e Aviso Legal completos
        </a>
      </div>
    </div>
  );
}
