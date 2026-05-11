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

const caseSlides = document.querySelectorAll("[data-case-slide]");
const caseDots = document.querySelectorAll("[data-case-dot]");
const caseTriggers = document.querySelectorAll("[data-case-step]");

function setCaseSlide(index) {
  caseSlides.forEach((slide) => {
    slide.classList.toggle("active", Number(slide.dataset.caseSlide) === index);
  });

  caseDots.forEach((dot) => {
    dot.classList.toggle("active", Number(dot.dataset.caseDot) === index);
  });
}

if (caseTriggers.length) {
  const caseObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setCaseSlide(Number(entry.target.dataset.caseStep));
      });
    },
    { threshold: 0.5 }
  );

  caseTriggers.forEach((trigger) => caseObserver.observe(trigger));
}

caseDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    setCaseSlide(Number(dot.dataset.caseDot));
  });
});
