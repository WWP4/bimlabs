(() => {
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  class ParticleWhisp {
    constructor() {
      this.canvas = document.getElementById('particle-whisp-canvas');
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.particles = [];
      this.path = [];
      this.time = 0;
      this.scrollProgress = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      this.isReducedMotion = reduceMotionQuery.matches;
      this.baseCount = 460;
      this.hero = document.querySelector('.hero');
      this.targetSection = document.querySelector('.editorial-transition');
      this.active = true;

      this.handleResize = this.handleResize.bind(this);
      this.onScroll = this.onScroll.bind(this);
      this.tick = this.tick.bind(this);
      this.handleMotionChange = this.handleMotionChange.bind(this);

      this.setup();
      this.bind();
      this.tick();
    }

    setup() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      this.path = this.buildPath();
      this.buildParticles();
    }

    buildPath() {
      const w = this.width;
      const h = this.height;
      const journey = this.journeyProgress ?? 0;
      const anchorY = h * (0.8 + journey * 0.22);
      return [
        { x: w * 0.16, y: h * 0.2 },
        { x: w * 0.28, y: h * 0.34 },
        { x: w * 0.44, y: h * 0.52 },
        { x: w * 0.62, y: h * 0.7 },
        { x: w * (0.78 - journey * 0.08), y: anchorY }
      ];
    }

    sampleCurve(t) {
      const p = this.path;
      const u = Math.max(0, Math.min(0.999, t)) * (p.length - 1);
      const i = Math.floor(u);
      const f = u - i;
      const p0 = p[Math.max(0, i - 1)];
      const p1 = p[i];
      const p2 = p[Math.min(p.length - 1, i + 1)];
      const p3 = p[Math.min(p.length - 1, i + 2)];

      const f2 = f * f;
      const f3 = f2 * f;

      return {
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * f + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * f2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * f3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * f + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * f2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * f3)
      };
    }

    tangent(t) {
      const a = this.sampleCurve(Math.max(0, t - 0.002));
      const b = this.sampleCurve(Math.min(0.999, t + 0.002));
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      return { x: dx / len, y: dy / len };
    }

    buildParticles() {
      const count = this.isReducedMotion ? 90 : this.baseCount;
      this.particles = new Array(count).fill(0).map((_, i) => ({
        t: (i / count + Math.random() * 0.4) % 1,
        speed: 0.018 + Math.random() * 0.035,
        spread: 8 + Math.random() * 30,
        size: 0.4 + Math.random() * 1.6,
        driftSeed: Math.random() * Math.PI * 2,
        depth: Math.random(),
        alpha: 0.06 + Math.random() * 0.7
      }));
    }

    bind() {
      window.addEventListener('resize', this.handleResize, { passive: true });
      window.addEventListener('scroll', this.onScroll, { passive: true });
      reduceMotionQuery.addEventListener('change', this.handleMotionChange);
      this.onScroll();
    }

    handleMotionChange(e) {
      this.isReducedMotion = e.matches;
      this.setup();
    }

    handleResize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      this.setup();
    }

    onScroll() {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const raw = window.scrollY / maxScroll;
      this.scrollProgress = Math.max(0, Math.min(1, raw));

      const heroBottom = this.hero ? this.hero.offsetHeight : window.innerHeight;
      const sectionRange = this.targetSection ? this.targetSection.offsetHeight : window.innerHeight;
      const travelRaw = (window.scrollY - heroBottom * 0.2) / Math.max(1, sectionRange);
      this.journeyProgress = Math.max(0, Math.min(1, travelRaw));
      this.path = this.buildPath();
    }

    draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      ctx.globalCompositeOperation = 'lighter';

      const pulse = 0.6 + Math.sin(this.time * 0.5) * 0.08;
      const flowBoost = this.scrollProgress * 0.11 + this.journeyProgress * 0.09;
      const compression = 1 - this.journeyProgress * 0.42;

      for (let i = 0; i < this.particles.length; i += 1) {
        const p = this.particles[i];
        const localSpeed = this.isReducedMotion ? p.speed * 0.2 : p.speed + flowBoost;
        p.t = (p.t + localSpeed * 0.0025) % 1;

        const curvePoint = this.sampleCurve((p.t + this.scrollProgress * 0.16) % 1);
        const tangent = this.tangent(p.t);
        const normalX = -tangent.y;
        const normalY = tangent.x;

        const turbulence = this.isReducedMotion
          ? 0
          : Math.sin(this.time * (0.4 + p.depth) + p.driftSeed + p.t * 20) * p.spread * 0.12;

        const laneOffset = (p.depth - 0.5) * p.spread * (1.4 - p.t * 0.9) * compression;
        const x = curvePoint.x + normalX * (laneOffset + turbulence) + tangent.x * (p.depth - 0.5) * 24;
        const y = curvePoint.y + normalY * (laneOffset + turbulence) + Math.sin(this.time * 0.2 + p.driftSeed) * 1.4;

        const tailFade = 1 - p.t;
        const sectionPullFade = 1 - this.journeyProgress * 0.2;
        const alpha = p.alpha * tailFade * pulse * sectionPullFade;
        const r = p.size * (0.7 + p.depth * 1.2);

        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
    }

    tick() {
      if (!this.active) return;
      this.time += 0.016;
      if (!this.isReducedMotion) {
        this.draw();
      } else {
        // Single calm frame for accessibility.
        this.draw();
      }
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ParticleWhisp(), { once: true });
  } else {
    new ParticleWhisp();
  }
})();
