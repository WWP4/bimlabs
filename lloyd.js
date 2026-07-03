const loader = document.getElementById("loader");
const header = document.getElementById("siteHeader");
const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");
const mobileLinks = document.querySelectorAll(".mobile-menu a");
const revealItems = document.querySelectorAll(".reveal");

window.addEventListener("load", () => {
  setTimeout(() => {
    loader.classList.add("loaded");
  }, 850);
});

function updateHeader() {
  if (window.scrollY > 40) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

menuToggle.addEventListener("click", () => {
  mobileMenu.classList.toggle("open");
  document.body.classList.toggle("no-scroll");
});

mobileLinks.forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    document.body.classList.remove("no-scroll");
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -60px 0px"
  }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 35, 180)}ms`;
  revealObserver.observe(item);
});

const heroImage = document.querySelector(".hero__bg img");
const speakingImage = document.querySelector(".speaking-photo img");

window.addEventListener("scroll", () => {
  const y = window.scrollY;

  if (heroImage) {
    heroImage.style.transform = `scale(1.04) translateY(${y * 0.045}px)`;
  }

  if (speakingImage) {
    const section = document.querySelector(".speaking-section");
    const rect = section.getBoundingClientRect();

    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      speakingImage.style.transform = `scale(${1.04 + progress * 0.04}) translateY(${progress * -24}px)`;
    }
  }
}, { passive: true });

const newsletterForm = document.querySelector(".newsletter-form");

if (newsletterForm) {
  newsletterForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const input = newsletterForm.querySelector("input");
    const button = newsletterForm.querySelector("button");

    if (!input.value.trim()) {
      input.focus();
      return;
    }

    button.textContent = "Joined";
    button.disabled = true;
    input.value = "";
  });
}
