export function initCopyEmail(): void {
  const button = document.getElementById("copy-email");
  const toast = document.getElementById("copy-toast");
  if (!button || !toast) return;

  let timer = 0;
  button.addEventListener("click", async () => {
    const user = button.getAttribute("data-user");
    const domain = button.getAttribute("data-domain");
    if (!user || !domain) return;
    const email = `${user}@${domain}`;

    try {
      await navigator.clipboard.writeText(email);
      toast.classList.add("show");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => toast.classList.remove("show"), 1500);
    } catch {
      // clipboard unavailable, the mailto below still works
    }

    window.location.href = `mailto:${email}`;
  });
}
