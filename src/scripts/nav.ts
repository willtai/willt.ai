const SECTION_IDS = ["top", "experience", "projects", "contact"] as const;

export function initNav(): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".nav-link"));
  if (links.length === 0) return;

  let current = "";
  let queued = false;

  const update = (): void => {
    queued = false;
    let active: string = SECTION_IDS[0];
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.38) active = id;
    }
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight > 4;
    if (scrollable && window.scrollY + window.innerHeight >= doc.scrollHeight - 4) active = "contact";
    if (active === current) return;
    current = active;
    for (const link of links) {
      link.setAttribute("aria-current", link.dataset.section === active ? "true" : "false");
    }
  };

  window.addEventListener(
    "scroll",
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );
  update();
}
