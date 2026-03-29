const nav = document.getElementById("site-nav");
const links = document.querySelectorAll<HTMLAnchorElement>(".nav-link");

if (nav) {
  const showNav = () => {
    const scrolled = window.scrollY > 300;
    nav.classList.toggle("opacity-0", !scrolled);
    nav.classList.toggle("pointer-events-none", !scrolled);
    nav.classList.toggle("opacity-100", scrolled);
    nav.classList.toggle("pointer-events-auto", scrolled);
  };

  window.addEventListener("scroll", showNav, { passive: true });
  showNav();
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach((link) => {
          const isActive = link.getAttribute("data-section") === id;
          link.classList.toggle("text-white", isActive);
          link.classList.toggle("bg-white/10", isActive);
        });
      }
    }
  },
  { threshold: 0.3 }
);

document.querySelectorAll("section[id]").forEach((section) => {
  sectionObserver.observe(section);
});
