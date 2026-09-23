(() => {
  const section = document.querySelector('[data-why-story]');
  if (!section) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  const stage = section.querySelector('.why-gsa__stage');
  const index = section.querySelector('.why-gsa__index');
  const wordBack = section.querySelector('.why-gsa__word--back');
  const wordFront = section.querySelector('.why-gsa__word--front');
  const photo = section.querySelector('.why-gsa__main-photo');
  const photoImg = photo?.querySelector('img');
  const copy = section.querySelector('.why-gsa__copy');
  const facts = section.querySelector('.why-gsa__facts');
  const inset = section.querySelector('.why-gsa__inset-photo');
  const handoff = section.querySelector('.why-gsa__handoff');
  const handoffText = handoff?.querySelector('span');
  const handoffLine = handoff?.querySelector('i');

  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const smooth = (a, b, v) => {
    const x = clamp((v - a) / (b - a));
    return x * x * (3 - 2 * x);
  };

  let target = 0;
  let current = 0;
  let raf = 0;
  let last = performance.now();

  function progress() {
    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, section.offsetHeight - innerHeight);
    return clamp(-rect.top / travel);
  }

  function request() {
    target = progress();
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(render);
    }
  }

  function render(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    current += (target - current) * (1 - Math.exp(-6.2 * dt));
    if (Math.abs(target - current) < 0.00035) current = target;

    const p = current;

    const intro = smooth(0.00, 0.18, p);
    const typeIn = smooth(0.02, 0.28, p);
    const photoIn = smooth(0.07, 0.31, p);
    const copyIn = smooth(0.20, 0.43, p);
    const detailsIn = smooth(0.32, 0.54, p);
    const drift = smooth(0.42, 0.76, p);
    const exit = smooth(0.72, 0.98, p);

    if (index) {
      index.style.opacity = String(intro * (1 - exit));
      index.style.transform = `translateY(${(1 - intro) * 12 - exit * 10}px)`;
    }

    if (wordBack) {
      const scale = 0.93 + typeIn * 0.07 + drift * 0.025;
      const y = -50 - drift * 2.2;
      wordBack.style.opacity = String(typeIn * (1 - exit * 0.65));
      wordBack.style.transform =
        `translate3d(-50%, ${y}%, 0) scale(${scale})`;
    }

    if (wordFront) {
      const frontIn = smooth(0.15, 0.36, p);
      const scale = 0.95 + frontIn * 0.05 + drift * 0.025;
      const y = -50 - drift * 2.2;
      wordFront.style.opacity = String(frontIn * 0.95 * (1 - exit * 0.72));
      wordFront.style.transform =
        `translate3d(-50%, ${y}%, 0) scale(${scale})`;
    }

    if (photo) {
      const x = (1 - photoIn) * 4 - drift * 1.7;
      const scale = 1.06 - photoIn * 0.06 + drift * 0.025;
      photo.style.opacity = String(photoIn * (1 - exit * 0.55));
      photo.style.transform =
        `translate3d(${x}vw, 0, 0) scale(${scale})`;
    }

    if (photoImg) {
      photoImg.style.transform =
        `translate3d(0, ${drift * -1.6}%, 0) scale(${1.08 + drift * 0.035})`;
    }

    if (copy) {
      copy.style.opacity = String(copyIn * (1 - exit));
      copy.style.transform =
        `translateY(${(1 - copyIn) * 34 - exit * 20}px)`;
    }

    if (facts) {
      facts.style.opacity = String(detailsIn * (1 - exit));
      facts.style.transform =
        `translateY(${(1 - detailsIn) * 26 - exit * 18}px)`;
    }

    if (inset) {
      const rotate = -3 + detailsIn * 1.2 + drift * 0.8;
      inset.style.opacity = String(detailsIn * (1 - exit * 0.9));
      inset.style.transform =
        `translate3d(${(1 - detailsIn) * -28}px, ${(1 - detailsIn) * 10 - drift * 12}px, 0) rotate(${rotate}deg)`;
    }

    if (handoff) {
      const y = (1 - exit) * 101;
      handoff.style.transform = `translate3d(0, ${y}%, 0)`;
    }

    if (handoffText) {
      const textIn = smooth(0.84, 0.96, p);
      handoffText.style.opacity = String(textIn);
      handoffText.style.transform = `translateY(${(1 - textIn) * 12}px)`;
    }

    if (handoffLine) {
      const lineIn = smooth(0.88, 1.00, p);
      handoffLine.style.transform = `scaleX(${lineIn})`;
    }

    if (stage) stage.style.setProperty('--why-progress', p.toFixed(4));

    if (current !== target) {
      raf = requestAnimationFrame(render);
    } else {
      raf = 0;
    }
  }

  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request, { passive: true });
  request();
})();
