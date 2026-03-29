const button = document.getElementById("copy-email");
const toast = document.getElementById("copy-toast");

if (button && toast) {
  button.addEventListener("click", async () => {
    const user = button.getAttribute("data-user");
    const domain = button.getAttribute("data-domain");
    if (!user || !domain) return;
    const email = `${user}@${domain}`;

    // Copy to clipboard silently
    try {
      await navigator.clipboard.writeText(email);
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 1500);
    } catch {
      // clipboard failed, that's fine
    }

    // Always open mailto: link
    window.location.href = `mailto:${email}`;
  });
}
