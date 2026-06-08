export const commandPaletteOpenEventName = "neuroped:open-command";

/** Dispara a abertura da paleta de qualquer lugar (ex.: botão do header). */
export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(commandPaletteOpenEventName));
  }
}
