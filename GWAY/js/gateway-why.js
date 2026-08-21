(() => {
  const section = document.querySelector('.why-gsa');
  if (!section) return;

  const reveals = [
    ...section.querySelectorAll('[data-reveal]')
  ];

  const reducedMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

  if (reducedMotion) {
    reveals.forEach((item) => {
      item.classList.add('is-visible');
    });

    return;
  }

  /* =========================================
     REVEAL ANIMATIONS
  ========================================= */

  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;

          const requestedDelay =
            Number(
              el.dataset.delay || 0
            );

          const delay =
            Math.min(
              requestedDelay,
              220
            );

          window.setTimeout(
            () => {
              el.classList.add(
                'is-visible'
              );
            },
            delay
          );

          observer.unobserve(el);
        });
      },
      {
        threshold: 0.08,
        rootMargin:
          '0px 0px -4% 0px'
      }
    );

  reveals.forEach((item) => {
    observer.observe(item);
  });

  /* =========================================
     PHOTO PARALLAX
  ========================================= */

  const mainPhoto =
    section.querySelector(
      '.why-gsa__main-photo img'
    );

  const inset =
    section.querySelector(
      '.why-gsa__inset-photo'
    );

  if (!mainPhoto || !inset) {
    return;
  }

  let ticking = false;

  function updateParallax() {
    ticking = false;

    const rect =
      section.getBoundingClientRect();

    const viewport =
      window.innerHeight;

    const progress =
      Math.min(
        1,
        Math.max(
          0,
          (
            viewport -
            rect.top
          ) /
          (
            viewport +
            rect.height
          )
        )
      );

    /*
      Main team image moves very slightly
      downward/upward with scroll.

      Inset trophy moves opposite direction.
    */

    const mainShift =
      (
        progress -
        0.5
      ) *
      28;

    const insetShift =
      (
        progress -
        0.5
      ) *
      -16;

    mainPhoto.style.setProperty(
      '--main-photo-shift',
      `${mainShift}px`
    );

    inset.style.setProperty(
      '--inset-photo-shift',
      `${insetShift}px`
    );
  }

  function requestTick() {
    if (ticking) return;

    ticking = true;

    requestAnimationFrame(
      updateParallax
    );
  }

  /* =========================================
     EVENTS
  ========================================= */

  window.addEventListener(
    'scroll',
    requestTick,
    {
      passive: true
    }
  );

  window.addEventListener(
    'resize',
    requestTick,
    {
      passive: true
    }
  );

  requestTick();
})();
