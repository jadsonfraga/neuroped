/**
 * Endereços de experiências externas vinculadas ao NeuroPed.
 *
 * O módulo de agenda/Secretaria IA roda em domínio próprio para isolar dados
 * administrativos e a sessão da equipe do restante do ambiente clínico.
 * VITE_NEUROPED_CONNECT_URL é a variável preferida; a variável Manus antiga
 * permanece como fallback temporário para não quebrar ambientes existentes.
 */
export const SECRETARIA_IA_URL =
  import.meta.env.VITE_NEUROPED_CONNECT_URL ||
  import.meta.env.VITE_MANUS_SECRETARIA_URL ||
  "https://neuroped-connect.lovable.app";
