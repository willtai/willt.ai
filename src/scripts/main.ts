import { startMurmuration, type Sky } from "./murmuration";
import { initNav } from "./nav";
import { initCopyEmail } from "./copy-email";

initNav();
initCopyEmail();

const back = document.getElementById("sky-back");
const front = document.getElementById("sky-front");

if (back instanceof HTMLCanvasElement && front instanceof HTMLCanvasElement) {
  const dark = window.matchMedia("(prefers-color-scheme: dark)");
  const sky = (): Sky => (dark.matches ? "bluehour" : "dusk");
  const flock = startMurmuration(back, front, { sky: sky() });
  dark.addEventListener("change", () => flock.set({ sky: sky() }));
}
