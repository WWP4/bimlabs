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

const showcase = document.querySelector(".showcase-scroll");
const showcaseTexts = document.querySelectorAll("[data-showcase-text]");
const showcaseFrames = document.querySelectorAll("[data-showcase-frame]");
const showcaseDots = document.querySelectorAll("[data-showcase-dot]");
const showcaseTriggers = document.querySelectorAll("[data-showcase-step]");

const showcaseThemes = [
  "",
  "theme-portal",
  "theme-install",
  "theme-momentum"
];

function setShowcaseStep(index) {
  if (!showcase) return;

  showcaseTexts.forEach((item) => {
    item.classList.toggle("active", Number(item.dataset.showcaseText) === index);
  });

  showcaseFrames.forEach((item) => {
    item.classList.toggle("active", Number(item.dataset.showcaseFrame) === index);
  });

  showcaseDots.forEach((item) => {
    item.classList.toggle("active", Number(item.dataset.showcaseDot) === index);
  });

  showcase.classList.remove("theme-portal", "theme-install", "theme-momentum");

  if (showcaseThemes[index]) {
    showcase.classList.add(showcaseThemes[index]);
  }
}

if (showcaseTriggers.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const index = Number(entry.target.dataset.showcaseStep);
        setShowcaseStep(index);
      });
    },
    {
      threshold: 0.45
    }
  );

  showcaseTriggers.forEach((trigger) => observer.observe(trigger));
}

showcaseDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const index = Number(dot.dataset.showcaseDot);
    setShowcaseStep(index);
  });
});
