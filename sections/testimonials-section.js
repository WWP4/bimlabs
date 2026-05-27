(() => {

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    {
      threshold: 0.15,
    }
  );

  document
    .querySelectorAll(
      ".reveal-text, .reveal-image, .reveal-card, .reveal-testimonial"
    )
    .forEach((el) => observer.observe(el));

})();
