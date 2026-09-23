(() => {
  const section = document.querySelector('[data-programs-transition]');
  if (!section) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  const index = section.querySelector('.programs-index');
  const back = section.querySelector('.programs-word--back');
  const front = section.querySelector('.programs-word--front');
  const athlete = section.querySelector('.bloom-athlete');
  const copy = section.querySelector('.programs-copy');
  const rail = section.querySelector('.programs-rail');

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

    current += (target - current) * (1 - Math.exp(-6 * dt));
    if (Math.abs(target - current) < 0.00035) current = target;

    const p = current;

    const intro = smooth(0.00, 0.14, p);
    const wordIn = smooth(0.04, 0.30, p);
    const athleteIn = smooth(0.14, 0.42, p);
    const frontIn = smooth(0.24, 0.48, p);
    const copyIn = smooth(0.46, 0.69, p);
    const settle = smooth(0.48, 0.86, p);

    if (index) {
      index.style.opacity = String(intro);
      index.style.transform = `translateY(${(1 - intro) * 12}px)`;
    }

    if (back) {
      const scale = 0.86 + wordIn * 0.14 + settle * 0.025;
      back.style.opacity = String(wordIn);
      back.style.transform =
        `translate3d(-50%, ${-50 - settle * 1.8}%, 0) scale(${scale})`;
    }

    if (athlete) {
      const blur = (1 - athleteIn) * 16;
      const y = (1 - athleteIn) * 8 - settle * 1.2;
      const scale = 1.08 - athleteIn * 0.08 + settle * 0.015;

      athlete.style.opacity = String(athleteIn);
      athlete.style.filter =
        `blur(${blur}px) saturate(${0.9 + athleteIn * 0.1}) contrast(1.02)`;
      athlete.style.transform =
        `translate3d(-50%, ${y}%, 0) scale(${scale})`;
    }

    if (front) {
      const scale = 0.94 + frontIn * 0.06 + settle * 0.025;
      front.style.opacity = String(frontIn);
      front.style.transform =
        `translate3d(-50%, ${-50 - settle * 1.8}%, 0) scale(${scale})`;
    }

    if (copy) {
      copy.style.opacity = String(copyIn);
      copy.style.transform =
        `translateY(${(1 - copyIn) * 34}px)`;
    }

    if (rail) {
      rail.style.opacity = String(smooth(0.56, 0.76, p));
    }

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
