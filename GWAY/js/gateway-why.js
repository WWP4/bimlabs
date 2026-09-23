(() => {
  const section = document.querySelector('[data-why-story]');
  if (!section) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || window.matchMedia('(max-width: 760px)').matches) return;

  const stage = section.querySelector('.why-gsa__stage');
  const copy = section.querySelector('.why-gsa__copy');
  const visual = section.querySelector('.why-gsa__visual');
  const photo = visual?.querySelector('img');
  const footer = section.querySelector('.why-gsa__footer');

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
    const travel = Math.max(1, section.offsetHeight - innerHeight);
    return clamp(-rect.top / travel);
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
      (1 - Math.exp(-6.4 * dt));

    if (Math.abs(target - current) < 0.00035) {
      current = target;
    }

    const p = current;

    /*
      Motion is intentionally quiet:
      - image opens slightly
      - crop drifts
      - copy breathes upward a few pixels
      - lower rail settles
      Nothing performs for attention.
    */

    const open = smooth(0.00, 0.48, p);
    const settle = smooth(0.24, 0.82, p);

    if (visual) {
      const cut = 8 * (1 - open);
      const x = -18 * settle;
      const y = -5 * settle;
      const scale = 1 + settle * 0.012;

      visual.style.setProperty('--why-image-cut', `${cut}%`);
      visual.style.setProperty('--why-image-x', `${x}px`);
      visual.style.setProperty('--why-image-y', `${y}px`);
      visual.style.setProperty('--why-image-scale', String(scale));
    }

    if (photo) {
      const photoScale = 1.055 + settle * 0.022;
      const photoY = -14 * settle;

      photo.style.setProperty('--why-photo-scale', String(photoScale));
      photo.style.setProperty('--why-photo-y', `${photoY}px`);
    }

    if (copy) {
      copy.style.transform =
        `translate3d(0, calc(-48% - ${settle * 10}px), 0)`;
    }

    if (footer) {
      footer.style.opacity = String(0.72 + open * 0.28);
      footer.style.transform =
        `translate3d(0, ${(1 - open) * 8}px, 0)`;
    }

    if (stage) {
      stage.style.setProperty(
        '--why-scroll-line',
        `${-100 + p * 100}%`
      );
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
