(() => {
  const testimonials = [
    {
      text: "BIM Labs didn’t just build a website — they built the foundation for our digital ecosystem. The work felt thoughtful, sharp, and deeply aligned with where we wanted the brand to go.",
      name: "Daniel K.",
      role: "CEO, Nexora"
    },
    {
      text: "The level of detail, strategy, and execution is unmatched. Our brand finally feels as considered online as it does in the room.",
      name: "Sophia R.",
      role: "Founder, Lumen"
    },
    {
      text: "They operate like an extension of our team — reliable, strategic, and world-class from concept to launch.",
      name: "Marcus T.",
      role: "CTO, Aurora"
    }
  ];

  const textEl = document.querySelector("#testimonialText");
  const countEl = document.querySelector("#testimonialCount");
  const nameEl = document.querySelector("#testimonialName");
  const roleEl = document.querySelector("#testimonialRole");
  const buttons = [...document.querySelectorAll(".testimonial-progress button")];

  if (!textEl || !countEl || !nameEl || !roleEl) return;

  let activeIndex = 0;
  let charIndex = 0;
  let typingTimer = null;

  function setActiveButton(index) {
    buttons.forEach((button, i) => {
      button.classList.toggle("is-active", i === index);
    });
  }

  function typeTestimonial(index) {
    clearTimeout(typingTimer);

    const item = testimonials[index];
    activeIndex = index;
    charIndex = 0;

    textEl.textContent = "";
    countEl.textContent = `${String(index + 1).padStart(2, "0")} / ${String(testimonials.length).padStart(2, "0")}`;
    nameEl.textContent = item.name;
    roleEl.textContent = item.role;
    setActiveButton(index);

    function typeNext() {
      textEl.textContent = item.text.slice(0, charIndex);
      charIndex++;

      if (charIndex <= item.text.length) {
        const prevChar = item.text[charIndex - 2];
        const delay = [".", "—", ","].includes(prevChar) ? 180 : 31;
        typingTimer = setTimeout(typeNext, delay);
      }
    }

    typeNext();
  }

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => typeTestimonial(index));
  });

  let wheelLocked = false;

  window.addEventListener(
    "wheel",
    (event) => {
      const section = document.querySelector(".bim-testimonials");
      if (!section || wheelLocked) return;

      const rect = section.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.35 && rect.bottom > window.innerHeight * 0.65;

      if (!inView) return;

      wheelLocked = true;

      if (event.deltaY > 0) {
        typeTestimonial((activeIndex + 1) % testimonials.length);
      } else {
        typeTestimonial((activeIndex - 1 + testimonials.length) % testimonials.length);
      }

      setTimeout(() => {
        wheelLocked = false;
      }, 900);
    },
    { passive: true }
  );

  typeTestimonial(0);
})();
