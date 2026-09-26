import AgendarPage from "@/pages/agendar";

/**
 * Porta pública canônica da Secretaria NeuroPed.
 *
 * Desde esta versão, a marcação não depende de marketplace externo: usa a
 * Operational Suite do próprio NeuroPad, com disponibilidade, bloqueio de
 * conflitos, remarcação, cancelamento, lista de espera e evidência de aceite
 * de privacidade persistidos no backend.
 */
export default function MarcacaoPage() {
  return <AgendarPage />;
}
