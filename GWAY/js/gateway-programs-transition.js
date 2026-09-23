(() => {
  const section = document.querySelector('[data-programs-transition]');
  if (!section) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  const track = section.querySelector('.programs-marquee__track');
  const copy = section.querySelector('.programs-copy');
  const main = section.querySelector('.programs-visual--main');
  const cards = [...section.querySelectorAll('.programs-card')];
  const mediaImages = [...section.querySelectorAll('.programs-media img')];
  const footer = section.querySelector('.programs-footer');

  const clamp = (v,min=0,max=1) => Math.min(max,Math.max(min,v));
  const smooth = (a,b,v) => {
    const x = clamp((v-a)/(b-a));
    return x*x*(3-2*x);
  };

  let target = 0;
  let current = 0;
  let raf = 0;
  let last = performance.now();

  function progress() {
    const rect = section.getBoundingClientRect();
    return clamp((innerHeight - rect.top) / Math.max(1, innerHeight + rect.height));
  }

  function requestRender() {
    target = progress();
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(render);
    }
  }

  function render(now) {
    const dt = Math.min((now-last)/1000,.05);
    last = now;

    current += (target-current) * (1-Math.exp(-6.2*dt));
    if (Math.abs(target-current) < .00035) current = target;

    const p = current;
    const inView = smooth(.03,.34,p);
    const settle = smooth(.18,.78,p);

    if (track) {
      track.style.setProperty('--culture-marquee-x', `${-190*p}px`);
    }

    if (copy) {
      copy.style.opacity = String(inView);
      copy.style.transform =
        `translate3d(0,${(1-inView)*28 - settle*6}px,0)`;
    }

    if (main && innerWidth > 760) {
      main.style.setProperty('--culture-image-cut', `${8*(1-inView)}%`);
      main.style.setProperty('--culture-image-y', `${(1-inView)*24 - settle*10}px`);
    }

    cards.forEach((card,index) => {
      const q = smooth(.14 + index*.06,.40 + index*.06,p);
      card.style.opacity = String(q);
      card.style.transform = `translate3d(${(1-q)*22}px,0,0)`;
    });

    mediaImages.forEach((img,index) => {
      const q = settle * (index === 0 ? 1 : .65);
      img.style.setProperty('--culture-photo-y', `${-10*q}px`);
      img.style.setProperty('--culture-photo-scale', String(1.045 + q*.016));
    });

    if (footer) {
      const q = smooth(.30,.52,p);
      footer.style.opacity = String(q);
      footer.style.transform = `translateY(${(1-q)*10}px)`;
    }

    if (current !== target) {
      raf = requestAnimationFrame(render);
    } else {
      raf = 0;
    }
  }

  addEventListener('scroll',requestRender,{passive:true});
  addEventListener('resize',requestRender,{passive:true});
  requestRender();
})();
