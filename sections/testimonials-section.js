(() => {
  const items = document.querySelectorAll(".reveal-testimonial");

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const index = [...items].indexOf(el);

        setTimeout(() => {
          el.classList.add("is-visible");
        }, index * 120);

        observer.unobserve(el);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  items.forEach(item => observer.observe(item));

  const section = document.querySelector(".bim-testimonials");
  const cards = document.querySelectorAll(".testimonial-card");

  if (!section || !cards.length) return;

  section.addEventListener("mousemove", e => {
    const rect = section.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    cards.forEach((card, i) => {
      const depth = (i + 1) * 6;
      card.style.transform = `translate3d(${x * depth}px, ${y * depth}px, 0)`;
    });
  });

  section.addEventListener("mouseleave", () => {
    cards.forEach(card => {
      card.style.transform = "";
    });
  });
})();
