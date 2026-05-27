(() => {
  const revealItems = document.querySelectorAll(
    ".reveal-text, .reveal-image, .reveal-card"
  );

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const item = entry.target;
        const delay = [...revealItems].indexOf(item) * 90;

        setTimeout(() => {
          item.classList.add("is-visible");
        }, delay);

        observer.unobserve(item);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  revealItems.forEach(item => observer.observe(item));

  const cards = document.querySelectorAll(".process-card");

  cards.forEach(card => {
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;

      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
    });

    card.addEventListener("mouseleave", () => {
      card.style.setProperty("--mx", "0px");
      card.style.setProperty("--my", "0px");
    });
  });
})();
