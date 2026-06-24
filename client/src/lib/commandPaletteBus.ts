export const COMMAND_PALETTE_OPEN_EVENT = "neuroped:open-command";

/** Dispara a abertura da paleta de qualquer lugar sem importar o componente pesado. */
export function openCommandPalette() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT));
}
