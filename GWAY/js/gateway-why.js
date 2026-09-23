(() => {
  const section = document.querySelector('[data-why-story]');
  if (!section) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  const topLine = section.querySelector('.why-gsa__topline');
  const wordBack = section.querySelector('.why-gsa__word--back');
  const wordFront = section.querySelector('.why-gsa__word--front');
  const photo = section.querySelector('.why-gsa__main-photo');
  const photoImg = photo?.querySelector('img');
  const caption = photo?.querySelector('figcaption');
  const copy = section.querySelector('.why-gsa__copy');
  const pillars = section.querySelector('.why-gsa__pillars');
  const progressBar = section.querySelector('.why-gsa__progress i');

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

  function readProgress() {
    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, section.offsetHeight - innerHeight);
    return clamp(-rect.top / travel);
  }

  function requestRender() {
    target = readProgress();

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
      STORY:
      1. editorial header appears
      2. MORE settles into the canvas
      3. team photo opens through the word
      4. thin red outline completes the layered type effect
      5. copy and three focus words arrive
    */

    const chromeIn = smooth(0.00, 0.12, p);
    const wordIn = smooth(0.00, 0.23, p);
    const photoIn = smooth(0.08, 0.40, p);
    const outlineIn = smooth(0.23, 0.48, p);
    const captionIn = smooth(0.34, 0.50, p);
    const copyIn = smooth(0.37, 0.61, p);
    const pillarsIn = smooth(0.50, 0.69, p);
    const drift = smooth(0.52, 1.00, p);

    if (topLine) {
      topLine.style.opacity = String(chromeIn);
      topLine.style.transform =
        `translateY(${(1 - chromeIn) * 10}px)`;
    }

    if (wordBack) {
      const scale = 0.96 + wordIn * 0.04;
      const x = -52 + wordIn * 2 - drift * 1.4;

      wordBack.style.opacity = String(wordIn);
      wordBack.style.transform =
        `translate3d(${x}%, -50%, 0) scale(${scale})`;
    }

    if (photo) {
      const side = 49 * (1 - photoIn);
      const y = (1 - photoIn) * 2.8 - drift * 0.7;
      const scale = 1.035 - photoIn * 0.035 + drift * 0.012;

      photo.style.clipPath =
        `inset(0 ${side}% 0 ${side}%)`;

      photo.style.transform =
        `translate3d(-50%, ${y}vh, 0) scale(${scale})`;
    }

    if (photoImg) {
      const scale = 1.12 - photoIn * 0.07 + drift * 0.025;
      const y = drift * -1.2;

      photoImg.style.transform =
        `translate3d(0, ${y}%, 0) scale(${scale})`;
    }

    if (wordFront) {
      const scale = 0.985 + outlineIn * 0.015;
      const x = -50 - drift * 1.4;

      wordFront.style.opacity = String(outlineIn);
      wordFront.style.transform =
        `translate3d(${x}%, -50%, 0) scale(${scale})`;
    }

    if (caption) {
      caption.style.opacity = String(captionIn);
      caption.style.transform =
        `translateY(${(1 - captionIn) * 10}px)`;
    }

    if (copy) {
      copy.style.opacity = String(copyIn);
      copy.style.transform =
        `translateY(${(1 - copyIn) * 30 - drift * 5}px)`;
    }

    if (pillars) {
      pillars.style.opacity = String(pillarsIn);
      pillars.style.transform =
        `translateY(${(1 - pillarsIn) * 18 - drift * 3}px)`;
    }

    if (progressBar) {
      progressBar.style.transform =
        `translateY(${(1 - p) * -100}%)`;
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
