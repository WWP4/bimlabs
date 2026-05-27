(() => {
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const processSection = document.querySelector(".bim-process");
  const testimonialSection = document.querySelector(".bim-testimonials");

  const processCards = [...document.querySelectorAll(".process-card")];
  const testimonialCards = [...document.querySelectorAll(".testimonial-card")];
  const testimonialCopy = document.querySelector(".testimonial-copy");
  const testimonialBg = document.querySelector(".testimonial-bg img");

  function getProgress(section) {
    if (!section) return 0;

    const rect = section.getBoundingClientRect();
    const scrollLength = rect.height - window.innerHeight;

    if (scrollLength <= 0) return 0;

    return clamp(-rect.top / scrollLength, 0, 1);
  }

  function animate() {
    const processProgress = getProgress(processSection);
    const testimonialProgress = getProgress(testimonialSection);

    processCards.forEach((card, index) => {
      const start = index * 0.16;
      const local = clamp((processProgress - start) / 0.45, 0, 1);

      const y = (1 - local) * 90;
      const scale = 0.94 + local * 0.06;
      const opacity = 0.28 + local * 0.72;

      card.style.setProperty("--processY", `${y}px`);
      card.style.setProperty("--processScale", scale.toFixed(3));
      card.style.setProperty("--processOpacity", opacity.toFixed(3));
    });

    testimonialCards.forEach((card, index) => {
      const start = index * 0.14;
      const local = clamp((testimonialProgress - start) / 0.5, 0, 1);
      const direction = index % 2 === 0 ? 1 : -1;

      card.style.setProperty("--cardX", `${direction * (1 - local) * 90}px`);
      card.style.setProperty("--cardY", `${(1 - local) * 120}px`);
      card.style.setProperty("--cardRotate", `${direction * (1 - local) * 5}deg`);
      card.style.setProperty("--cardScale", `${0.92 + local * 0.08}`);
      card.style.setProperty("--cardOpacity", `${0.18 + local * 0.82}`);
    });

    if (testimonialCopy) {
      testimonialCopy.style.setProperty(
        "--copyY",
        `${(1 - testimonialProgress) * 80}px`
      );
    }

    if (testimonialBg) {
      testimonialBg.style.setProperty("--bgScale", `${1.04 + testimonialProgress * 0.08}`);
      testimonialBg.style.setProperty("--bgX", `${(testimonialProgress - 0.5) * 22}px`);
      testimonialBg.style.setProperty("--bgY", `${(testimonialProgress - 0.5) * -16}px`);
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
