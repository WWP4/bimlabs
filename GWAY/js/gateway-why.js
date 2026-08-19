(() => {
  const section = document.querySelector('.why-gsa');
  if (!section) return;

  const items = section.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  if (
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
  ) {
    items.forEach((item) => {
      item.classList.add('is-visible');
    });

    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;

        const delay =
          Number(el.dataset.delay || 0);

        window.setTimeout(() => {
          el.classList.add('is-visible');
        }, delay);

        observer.unobserve(el);
      });
    },
    {
      threshold: 0.14,
      rootMargin: '0px 0px -7% 0px'
    }
  );

  items.forEach((item) => {
    observer.observe(item);
  });
})();
