(() => {
  class PixelBreak {
    constructor(options = {}) {
      this.options = {
        section: options.section || ".work-archive",
        source: options.source || ".archive-content",
        layer: options.layer || ".pixel-transition",
        canvas: options.canvas || "#archivePixelCanvas",
        triggerBreakAt: options.triggerBreakAt ?? 0.69,
        triggerReformAt: options.triggerReformAt ?? 0.62,
        breakSpeed: options.breakSpeed ?? 0.86,
        reformSpeed: options.reformSpeed ?? 1.18,
        debug: !!options.debug
      };

      this.canvas = null;
      this.ctx = null;
      this.layer = null;
      this.source = null;
      this.section = null;
      this.particles = [];
      this.captured = false;
      this.capturing = false;
      this.progress = 0;
      this.target = 0;
      this.state = "formed";
      this.raf = null;
      this.lastTime = 0;
      this.dpr = 1;
      this.breakTriggered = false;
      this.reformTriggered = false;
      this.scrollTrigger = null;
    }

    init() {
      this.canvas = document.querySelector(this.options.canvas);
      this.layer = document.querySelector(this.options.layer);
      this.source = document.querySelector(this.options.source);
      this.section = document.querySelector(this.options.section);

      if (!this.canvas || !this.layer || !this.source || !this.section || !window.html2canvas) return;

      this.ctx = this.canvas.getContext("2d", { alpha: true });
      this.resize();
      window.addEventListener("resize", () => this.resize());
      this.setupScrollTrigger();
    }

    setupScrollTrigger() {
      if (!window.gsap || !window.ScrollTrigger) return;
      this.scrollTrigger = window.ScrollTrigger.create({
        trigger: this.section,
        start: "top top",
        end: "+=420%",
        scrub: false,
        onUpdate: (self) => this.handleProgress(self.progress)
      });
    }

    handleProgress(progress) {
      if (progress >= this.options.triggerBreakAt && !this.breakTriggered) {
        this.breakTriggered = true;
        this.reformTriggered = false;
        this.capture().then((ok) => {
          if (ok) this.play("break");
        });
      }

      if (progress <= this.options.triggerReformAt && !this.reformTriggered) {
        this.reformTriggered = true;
        this.breakTriggered = false;
        this.play("reform");
      }
    }

    resize() {
      if (!this.canvas || !this.ctx) return;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(window.innerWidth * this.dpr);
      this.canvas.height = Math.round(window.innerHeight * this.dpr);
      this.canvas.style.width = `${window.innerWidth}px`;
      this.canvas.style.height = `${window.innerHeight}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = false;
    }

    clamp(v, min = 0, max = 1) { return Math.min(Math.max(v, min), max); }
    ease(v) { return 1 - Math.pow(1 - v, 4); }
    rand(seed) { const n = Math.sin(seed) * 10000; return n - Math.floor(n); }

    async capture() {
      if (this.captured || this.capturing || !this.ctx || !this.source) return this.captured;
      this.capturing = true;
      this.resize();
      const rect = this.source.getBoundingClientRect();
      const captureScale = window.innerWidth < 760 ? 1.35 : 1.7;
      const sampleGap = window.innerWidth < 760 ? 4.2 : 3.45;
      const maxParticles = window.innerWidth < 760 ? 7200 : 13500;

      try {
        const shot = await window.html2canvas(this.source, { backgroundColor: null, scale: captureScale, useCORS: true, logging: false, removeContainer: true });
        const tmp = document.createElement("canvas");
        const tctx = tmp.getContext("2d", { willReadFrequently: true });
        tmp.width = shot.width; tmp.height = shot.height;
        tctx.imageSmoothingEnabled = false;
        tctx.drawImage(shot, 0, 0);
        const data = tctx.getImageData(0, 0, tmp.width, tmp.height).data;
        const sx = rect.width / tmp.width;
        const sy = rect.height / tmp.height;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        this.particles = [];

        for (let y = 0; y < tmp.height; y += sampleGap) {
          for (let x = 0; x < tmp.width; x += sampleGap) {
            if (this.particles.length >= maxParticles) break;
            const i = (Math.floor(y) * tmp.width + Math.floor(x)) * 4;
            const a = data[i + 3];
            if (a < 34) continue;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const ox = rect.left + x * sx;
            const oy = rect.top + y * sy;
            const dx = ox - cx, dy = oy - cy;
            const dist = Math.hypot(dx, dy) || 1;
            const rx = this.rand(x * 13.13 + y * 91.7);
            const ry = this.rand(x * 71.2 + y * 22.6);
            this.particles.push({
              ox, oy, color: `rgb(${r}, ${g}, ${b})`, alpha: a / 255, size: window.innerWidth < 760 ? 1 : 1.25,
              dirX: dx / dist, dirY: dy / dist, side: ox < cx ? -1 : 1, delay: rx * 0.24, speed: 0.58 + ry * 1.04
            });
          }
        }

        this.captured = true;
        this.capturing = false;
        return true;
      } catch (e) {
        this.capturing = false;
        if (this.options.debug) console.warn("PixelBreak capture failed", e);
        return false;
      }
    }

    play(direction = "break") {
      if (!this.captured || !this.ctx) return;
      this.target = direction === "break" ? 1 : 0;
      this.state = direction === "break" ? "breaking" : "reforming";
      if (this.raf) return;
      this.lastTime = performance.now();
      this.raf = requestAnimationFrame((t) => this.step(t));
    }

    step(now) {
      const dt = Math.min(64, now - this.lastTime) / 1000;
      this.lastTime = now;
      const dir = this.target > this.progress ? 1 : -1;
      const speed = this.state === "breaking" ? this.options.breakSpeed : this.options.reformSpeed;
      this.progress = this.clamp(this.progress + dir * speed * dt);
      this.draw();
      const done = (this.target === 1 && this.progress >= 0.999) || (this.target === 0 && this.progress <= 0.001);
      if (done) { this.progress = this.target; this.raf = null; this.draw(); return; }
      this.raf = requestAnimationFrame((t) => this.step(t));
    }

    draw() {
      if (!this.ctx || !this.canvas) return;
      const p = this.progress;
      const eased = this.ease(p);
      const w = this.canvas.width / this.dpr;
      const h = this.canvas.height / this.dpr;
      this.ctx.clearRect(0, 0, w, h);
      this.layer.style.opacity = p > 0.006 ? "1" : "0";
      this.source.classList.toggle("is-pixel-breaking", p > 0.012);
      if (p <= 0.006 || !this.particles.length) return;
      for (const px of this.particles) {
        const local = this.clamp((p - px.delay) / (1 - px.delay));
        if (local <= 0.002) continue;
        const le = this.ease(local);
        const x = px.ox + px.side * 315 * le * px.speed + px.dirX * 38 * le + Math.sin(px.oy * 0.038 + p * 8) * 72 * eased;
        const y = px.oy + (Math.cos(px.ox * 0.026 + p * 7) * 24 * eased) + (Math.sin(px.ox * 0.03) * 30 * le) - 48 * le;
        const alpha = px.alpha * Math.pow(1 - p, 1.02);
        if (alpha <= 0.01) continue;
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = px.color;
        this.ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(px.size)), Math.max(1, Math.round(px.size)));
      }
    }
  }

  window.PixelBreak = PixelBreak;
})();
