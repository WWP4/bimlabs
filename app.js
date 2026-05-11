document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const contactForm = document.querySelector(".contact-form");

  window.addEventListener("scroll", () => {
    if (!header) return;

    header.classList.toggle("is-scrolled", window.scrollY > 20);
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      alert("Request received. Replace this with your real form handler.");
      contactForm.reset();
    });
  }
});
