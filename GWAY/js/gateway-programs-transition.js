(() => {
  const section = document.querySelector('[data-programs-transition]');
  if (!section) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  const track = section.querySelector('.programs-marquee__track');
  const copy = section.querySelector('.programs-copy');
  const visual = section.querySelector('.programs-visual');
  const image = visual?.querySelector('img');
  const footer = section.querySelector('.programs-footer');

  const clamp = (v, min = 0, max = 1) =>
    Math.min(max, Math.max(min, v));

  const smooth = (a, b, v) => {
    const x = clamp((v - a) / (b - a));
    return x * x * (3 - 2 * x);
  };

  let target = 0;
  let current = 0;
  let raf = 0;
  let last = performance.now();

  function getProgress() {
    const rect = section.getBoundingClientRect();
    const viewport = innerHeight;

    return clamp(
      (viewport - rect.top) /
      Math.max(1, viewport + rect.height)
    );
  }

  function requestRender() {
    target = getProgress();

    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(render);
    }
  }

  function render(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    current +=
      (target - current) *
      (1 - Math.exp(-6.2 * dt));

    if (Math.abs(target - current) < 0.00035) {
      current = target;
    }

    const p = current;

    const inView = smooth(0.04, 0.36, p);
    const settle = smooth(0.18, 0.78, p);

    if (track) {
      track.style.setProperty(
        '--culture-marquee-x',
        `${-170 * p}px`
      );
    }

    if (copy) {
      copy.style.opacity = String(inView);
      copy.style.transform =
        `translate3d(0, ${(1 - inView) * 30 - settle * 6}px, 0)`;
    }

    if (visual && innerWidth > 760) {
      visual.style.setProperty(
        '--culture-image-cut',
        `${10 * (1 - inView)}%`
      );

      visual.style.setProperty(
        '--culture-image-y',
        `${(1 - inView) * 28 - settle * 14}px`
      );
    }

    if (image && innerWidth > 760) {
      image.style.setProperty(
        '--culture-photo-y',
        `${-14 * settle}px`
      );

      image.style.setProperty(
        '--culture-photo-scale',
        String(1.06 + settle * 0.018)
      );
    }

    if (footer) {
      const footerIn = smooth(0.28, 0.52, p);
      footer.style.opacity = String(footerIn);
      footer.style.transform =
        `translateY(${(1 - footerIn) * 10}px)`;
    }

    if (current !== target) {
      raf = requestAnimationFrame(render);
    } else {
      raf = 0;
    }
  }

  addEventListener('scroll', requestRender, { passive: true });
  addEventListener('resize', requestRender, { passive: true });

  requestRender();
})();
