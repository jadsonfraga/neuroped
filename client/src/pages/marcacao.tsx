import AgendarPage from "@/pages/agendar";

/**
 * Porta pública canônica da Secretaria NeuroPed.
 *
 * Desde esta versão, a marcação não depende de marketplace externo: usa a
 * Operational Suite do próprio NeuroPad, com disponibilidade, bloqueio de
 * conflitos, remarcação, cancelamento, lista de espera e evidência de aceite
 * de privacidade persistidos no backend.
 *
 * A rota é montada fora do Layout clínico (App.tsx), então o landmark <main>
 * precisa vir daqui; em /agendar, dentro do Layout, o shell já o fornece.
 */
export default function MarcacaoPage() {
  return (
    <main id="conteudo" className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <AgendarPage />
    </main>
  );
}
