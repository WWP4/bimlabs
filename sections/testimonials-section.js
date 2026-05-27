(() => {
  const testimonials = [
    {
      text: "BIM Labs didn’t just build a website — they built the foundation for our digital ecosystem.",
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
  let autoTimer;

  function showTestimonial(index) {
    const item = testimonials[index];
    activeIndex = index;

    textEl.classList.add("is-changing");

    setTimeout(() => {
      textEl.textContent = item.text;
      countEl.textContent = `${String(index + 1).padStart(2, "0")} / ${String(testimonials.length).padStart(2, "0")}`;
      nameEl.textContent = item.name;
      roleEl.textContent = item.role;

      buttons.forEach((button, i) => {
        button.classList.toggle("is-active", i === index);
      });

      textEl.classList.remove("is-changing");
    }, 280);
  }

  function restartAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      showTestimonial((activeIndex + 1) % testimonials.length);
    }, 7500);
  }

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      showTestimonial(index);
      restartAuto();
    });
  });

  showTestimonial(0);
  restartAuto();
})();
