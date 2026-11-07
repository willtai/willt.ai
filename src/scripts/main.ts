import { startMurmuration, type FlockHandle, type Sky } from "./murmuration";
import { initNav } from "./nav";
import { initCopyEmail } from "./copy-email";

declare global {
  interface Window { __flock?: FlockHandle }
}

console.log("%cOne of them isn't like the others.", "font: italic 500 14px 'Cormorant Garamond', Georgia, serif; color: #463c4f");

initNav();
initCopyEmail();

const back = document.getElementById("sky-back");
const front = document.getElementById("sky-front");

if (back instanceof HTMLCanvasElement && front instanceof HTMLCanvasElement) {
  const dark = window.matchMedia("(prefers-color-scheme: dark)");
  const sky = (): Sky => (dark.matches ? "bluehour" : "dusk");
  const flock = startMurmuration(back, front, { sky: sky() });
  if (import.meta.env.DEV) window.__flock = flock;
  dark.addEventListener("change", () => flock.set({ sky: sky() }));
}
