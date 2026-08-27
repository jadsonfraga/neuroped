export const MOBILE_MENU_OPEN_EVENT = "neuroped:open-mobile-menu";

export function openMobileMenu(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MOBILE_MENU_OPEN_EVENT));
  }
}
