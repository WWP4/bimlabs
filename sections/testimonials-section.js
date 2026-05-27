const testimonials = [
  {
    text: "BIM Labs didn’t just build a website — they built the foundation for our digital ecosystem.",
    name: "Daniel K.",
    role: "CEO, Nexora"
  },
  {
    text: "The experience felt intentional from the first screen. It didn’t feel like a template — it felt like a brand system.",
    name: "Sarah M.",
    role: "Creative Director"
  },
  {
    text: "Every detail felt considered. BIM Labs helped us turn a scattered idea into something polished, clear, and premium.",
    name: "Michael R.",
    role: "Founder"
  }
];

const section = document.querySelector(".bim-testimonials");
const textEl = document.getElementById("testimonialText");
const nameEl = document.getElementById("testimonialName");
const roleEl = document.getElementById("testimonialRole");
const countEl = document.getElementById("testimonialCount");
const ghostEl = document.getElementById("testimonialGhost");
const buttons = document.querySelectorAll(".testimonial-progress button");

let currentIndex = 0;
let isAnimating = false;
let autoTimer;

function formatCount(index) {
  return `0${index + 1} / 0${testimonials.length}`;
}

function setActiveButton(index) {
  buttons.forEach((button, i) => {
    button.classList.toggle("is-active", i === index);
  });
}

function showTestimonial(index) {
  if (isAnimating || index === currentIndex) return;

  isAnimating = true;
  section.classList.add("is-switching");

  textEl.classList.remove("is-visible");
  textEl.classList.add("is-leaving");

  window.setTimeout(() => {
    const item = testimonials[index];

    textEl.textContent = item.text;
    nameEl.textContent = item.name;
    roleEl.textContent = item.role;
    countEl.textContent = formatCount(index);
    ghostEl.textContent = `0${index + 1}`;

    setActiveButton(index);

    textEl.classList.remove("is-leaving");
    textEl.classList.add("is-entering");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        textEl.classList.remove("is-entering");
        textEl.classList.add("is-visible");
        section.classList.remove("is-switching");

        currentIndex = index;
        isAnimating = false;
      });
    });
  }, 950);
}

function nextTestimonial() {
  const nextIndex = (currentIndex + 1) % testimonials.length;
  showTestimonial(nextIndex);
}

function startAutoPlay() {
  clearInterval(autoTimer);
  autoTimer = setInterval(nextTestimonial, 7500);
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.testimonial);
    showTestimonial(index);
    startAutoPlay();
  });
});

textEl.classList.add("is-visible");
startAutoPlay();
