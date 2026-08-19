(() => {
  const section = document.querySelector('.why-gsa');
  if (!section) return;

  const items = [
    ...section.querySelectorAll('[data-reveal]')
  ];

  if (!items.length) return;

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (reducedMotion) {
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

        const requestedDelay =
          Number(el.dataset.delay || 0);

        const delay =
          Math.min(requestedDelay, 180);

        window.setTimeout(() => {
          el.classList.add('is-visible');
        }, delay);

        observer.unobserve(el);
      });
    },
    {
      threshold: 0.06,
      rootMargin: '0px 0px -3% 0px'
    }
  );

  items.forEach((item) => {
    observer.observe(item);
  });

  const photos = [
    ...section.querySelectorAll('.why-gsa__photo img')
  ];

  if (!photos.length) return;

  let ticking = false;

  function updateParallax() {
    ticking = false;

    const rect = section.getBoundingClientRect();
    const viewport = window.innerHeight;

    const progress = Math.min(
      1,
      Math.max(
        0,
        (viewport - rect.top) /
          (viewport + rect.height)
      )
    );

    const shift =
      (progress - 0.5) * 18;

    photos.forEach((photo, index) => {
      const direction =
        index % 2 === 0 ? 1 : -1;

      photo.style.setProperty(
        '--photo-shift',
        `${shift * direction}px`
      );
    });
  }

  function requestParallax() {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(updateParallax);
  }

  window.addEventListener(
    'scroll',
    requestParallax,
    { passive: true }
  );

  window.addEventListener(
    'resize',
    requestParallax,
    { passive: true }
  );

  requestParallax();
})();
