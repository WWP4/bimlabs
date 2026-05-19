(function () {
  "use strict";

  class PixelBreak {
    constructor(options = {}) {
      this.section = document.querySelector(options.section || ".work-archive");
      this.source = document.querySelector(options.source || ".archive-content");
      this.layer = document.querySelector(options.layer || ".pixel-transition");
      this.canvas = document.querySelector(options.canvas || "#archivePixelCanvas");

      this.config = {
        triggerBreakAt: options.triggerBreakAt ?? 0.69,
        triggerReformAt: options.triggerReformAt ?? 0.62,

        captureScaleDesktop: options.captureScaleDesktop ?? 1.7,
        captureScaleMobile: options.captureScaleMobile ?? 1.35,

        sampleGapDesktop: options.sampleGapDesktop ?? 3.45,
        sampleGapMobile: options.sampleGapMobile ?? 4.2,

        maxParticlesDesktop: options.maxParticlesDesktop ?? 13500,
        maxParticlesMobile: options.maxParticlesMobile ?? 7200,

        alphaCutoff: options.alphaCutoff ?? 34,
        dprCap: options.dprCap ?? 2,

        breakSpeed: options.breakSpeed ?? 0.86,
        reformSpeed: options.reformSpeed ?? 1.18,

        sidePull: options.sidePull ?? 315,
        outwardPull: options.outwardPull ?? 38,
        verticalPull: options.verticalPull ?? 105,
        lift: options.lift ?? 48,
        driftX: options.driftX ?? 72,
        driftY: options.driftY ?? 24,

        basePixelSizeDesktop: options.basePixelSizeDesktop ?? 1.25,
        basePixelSizeMobile: options.basePixelSizeMobile ?? 1,

        hideClass: options.hideClass || "is-pixel-breaking",
        debug: options.debug ?? false
      };

      this.ctx = null;
      this.particles = [];
      this.captured = false;
      this.capturing = false;
      this.progress = 0;
      this.target = 0;
      this.state = "formed";
      this.raf = null;
      this.lastTime = 0;
      this.dpr = 1;
      this.enabled = false;
      this.breakRequested = false;
      this.reformRequested = false;

      this.onResize = this.onResize.bind(this);
      this.onScroll = this.onScroll.bind(this);
      this.step = this.step.bind(this);
    }

    init() {
      if (!this.section || !this.source || !this.layer || !this.canvas) {
        this.log("PixelBreak skipped: missing required section/source/layer/canvas.");
        return false;
      }

      if (!window.html2canvas) {
        console.warn("PixelBreak needs html2canvas loaded before pixel-break.js.");
        return false;
      }

      this.ctx = this.canvas.getContext("2d", { alpha: true });
      this.enabled = true;
      this.resizeCanvas();

      window.addEventListener("resize", this.onResize);
      window.addEventListener("scroll", this.onScroll, { passive: true });

      this.onScroll();

      return true;
    }

    destroy() {
      window.removeEventListener("resize", this.onResize);
      window.removeEventListener("scroll", this.onScroll);

      if (this.raf) cancelAnimationFrame(this.raf);

      this.raf = null;
      this.enabled = false;
      this.particles = [];
      this.captured = false;
      this.capturing = false;
      this.progress = 0;
      this.target = 0;
      this.state = "formed";

      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }

      this.layer.style.opacity = "0";
      this.source.classList.remove(this.config.hideClass);
    }

    log(...args) {
      if (this.config.debug) console.log("[PixelBreak]", ...args);
    }

    isMobile() {
      return window.innerWidth < 760;
    }

    clamp(value, min = 0, max = 1) {
      return Math.min(Math.max(value, min), max);
    }

    easeOutQuart(value) {
      return 1 - Math.pow(1 - value, 4);
    }

    seedRandom(seed) {
      const value = Math.sin(seed) * 10000;
      return value - Math.floor(value);
    }

    resizeCanvas() {
      if (!this.canvas || !this.ctx) return;

      this.dpr = Math.min(window.devicePixelRatio || 1, this.config.dprCap);

      this.canvas.width = Math.round(window.innerWidth * this.dpr);
      this.canvas.height = Math.round(window.innerHeight * this.dpr);
      this.canvas.style.width = `${window.innerWidth}px`;
      this.canvas.style.height = `${window.innerHeight}px`;

      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = false;
    }

    sectionProgress() {
      const rect = this.section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;

      if (scrollable <= 0) return 0;

      return this.clamp(-rect.top / scrollable);
    }

    onScroll() {
      if (!this.enabled) return;

      const p = this.sectionProgress();

      if (p > this.config.triggerBreakAt && !this.breakRequested) {
        this.breakRequested = true;
        this.reformRequested = false;
        this.break();
      }

      if (p < this.config.triggerReformAt && !this.reformRequested) {
        this.reformRequested = true;
        this.breakRequested = false;
        this.reform();
      }

      if (!this.raf) {
        this.draw();
      }
    }

    onResize() {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.reset();
      }, 180);
    }

    reset() {
      this.captured = false;
      this.capturing = false;
      this.particles = [];
      this.progress = 0;
      this.target = 0;
      this.state = "formed";
      this.breakRequested = false;
      this.reformRequested = false;

      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = null;
      }

      this.resizeCanvas();

      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }

      this.layer.style.opacity = "0";
      this.source.classList.remove(this.config.hideClass);
      this.onScroll();
    }

    async capture() {
      if (this.captured) return true;
      if (this.capturing) return false;

      this.capturing = true;
      this.resizeCanvas();
      this.source.classList.remove(this.config.hideClass);

      const sourceRect = this.source.getBoundingClientRect();
      const isMobile = this.isMobile();

      const captureScale = isMobile
        ? this.config.captureScaleMobile
        : this.config.captureScaleDesktop;

      const sampleGap = isMobile
        ? this.config.sampleGapMobile
        : this.config.sampleGapDesktop;

      const maxParticles = isMobile
        ? this.config.maxParticlesMobile
        : this.config.maxParticlesDesktop;

      try {
        const shot = await window.html2canvas(this.source, {
          backgroundColor: null,
          scale: captureScale,
          useCORS: true,
          logging: false,
          removeContainer: true
        });

        const temp = document.createElement("canvas");
        const tempCtx = temp.getContext("2d", { willReadFrequently: true });

        temp.width = shot.width;
        temp.height = shot.height;
        tempCtx.imageSmoothingEnabled = false;
        tempCtx.drawImage(shot, 0, 0);

        const image = tempCtx.getImageData(0, 0, temp.width, temp.height);
        const data = image.data;

        const scaleX = sourceRect.width / temp.width;
        const scaleY = sourceRect.height / temp.height;
        const centerX = sourceRect.left + sourceRect.width / 2;
        const centerY = sourceRect.top + sourceRect.height / 2;

        this.particles = [];

        for (let y = 0; y < temp.height; y += sampleGap) {
          for (let x = 0; x < temp.width; x += sampleGap) {
            if (this.particles.length >= maxParticles) break;

            const ix = Math.floor(x);
            const iy = Math.floor(y);
            const index = (iy * temp.width + ix) * 4;
            const alpha = data[index + 3];

            if (alpha < this.config.alphaCutoff) continue;

            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const brightness = (r + g + b) / 765;

            if (brightness < 0.045 && alpha < 220) continue;

            const ox = sourceRect.left + x * scaleX;
            const oy = sourceRect.top + y * scaleY;
            const dx = ox - centerX;
            const dy = oy - centerY;
            const distance = Math.hypot(dx, dy) || 1;

            const rx = this.seedRandom(x * 13.13 + y * 91.7);
            const ry = this.seedRandom(x * 71.2 + y * 22.6);
            const rz = this.seedRandom(x * 9.9 + y * 37.4);
            const side = ox < centerX ? -1 : 1;

            this.particles.push({
              ox,
              oy,
              dirX: dx / distance,
              dirY: dy / distance,
              size: isMobile
                ? this.config.basePixelSizeMobile
                : this.config.basePixelSizeDesktop,
              color: `rgb(${r}, ${g}, ${b})`,
              alpha: alpha / 255,
              brightness,
              rx,
              ry,
              rz,
              side,
              delay: rx * 0.24,
              speed: 0.58 + ry * 1.04,
              isBar: rx > 0.94,
              isBlock: ry > 0.96,
              hasGlow: brightness > 0.74 && rz > 0.92,
              hasSplit: brightness > 0.78 && rx < 0.05,
              flickerSeed: this.seedRandom(x * 99.2 + y * 4.4)
            });
          }
        }

        this.captured = true;
        this.capturing = false;
        this.draw();

        this.log(`Captured ${this.particles.length} particles.`);

        return true;
      } catch (error) {
        console.warn("PixelBreak capture failed:", error);
        this.capturing = false;
        return false;
      }
    }

    async break() {
      if (!this.captured) {
        const didCapture = await this.capture();
        if (!didCapture) return;
      }

      this.play("break");
    }

    reform() {
      if (!this.captured) return;
      this.play("reform");
    }

    play(direction) {
      this.target = direction === "break" ? 1 : 0;
      this.state = direction === "break" ? "breaking" : "reforming";

      if (this.raf) return;

      this.lastTime = performance.now();
      this.raf = requestAnimationFrame(this.step);
    }

    step(now) {
      const delta = Math.min(64, now - this.lastTime) / 1000;
      this.lastTime = now;

      const direction = this.target > this.progress ? 1 : -1;
      const speed = this.state === "breaking"
        ? this.config.breakSpeed
        : this.config.reformSpeed;

      this.progress = this.clamp(this.progress + direction * speed * delta);

      this.draw();

      const doneBreaking = this.target === 1 && this.progress >= 0.999;
      const doneReforming = this.target === 0 && this.progress <= 0.001;

      if (doneBreaking || doneReforming) {
        this.progress = this.target;
        this.state = doneBreaking ? "broken" : "formed";
        this.raf = null;
        this.draw();
        return;
      }

      this.raf = requestAnimationFrame(this.step);
    }

    drawPixel(px, py, size, alpha, particle) {
      const s = Math.max(1, Math.round(size));

      if (particle.hasGlow) {
        this.ctx.globalAlpha = alpha * 0.11;
        this.ctx.fillStyle = "rgba(255,255,255,0.86)";
        this.ctx.fillRect(px - s, py - s, s * 3, s * 3);
      }

      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.fillRect(px, py, s, s);

      if (s >= 2 && particle.brightness > 0.25) {
        this.ctx.globalAlpha = alpha * 0.3;
        this.ctx.fillStyle = "rgba(255,255,255,0.9)";
        this.ctx.fillRect(px, py, 1, 1);

        this.ctx.globalAlpha = alpha * 0.2;
        this.ctx.fillStyle = "rgba(0,0,0,0.72)";
        this.ctx.fillRect(px + s - 1, py, 1, s);
        this.ctx.fillRect(px, py + s - 1, s, 1);
      }
    }

    draw() {
      if (!this.ctx || !this.canvas) return;

      const p = this.progress;
      const eased = this.easeOutQuart(p);
      const w = this.canvas.width / this.dpr;
      const h = this.canvas.height / this.dpr;

      this.ctx.clearRect(0, 0, w, h);
      this.ctx.imageSmoothingEnabled = false;

      this.layer.style.opacity = p > 0.006 ? "1" : "0";
      this.source.classList.toggle(this.config.hideClass, p > 0.012);

      if (p <= 0.006 || !this.particles.length) return;

      this.ctx.save();
      this.ctx.globalCompositeOperation = "source-over";

      this.particles.forEach((particle) => {
        const local = this.clamp((p - particle.delay) / (1 - particle.delay));
        const le = this.easeOutQuart(local);

        if (le <= 0.002) return;

        const waveX = Math.sin(particle.oy * 0.038 + p * 8)
          * this.config.driftX
          * eased
          * particle.rx;

        const waveY = Math.cos(particle.ox * 0.026 + p * 7)
          * this.config.driftY
          * eased
          * particle.ry;

        const x = particle.ox
          + particle.side * this.config.sidePull * le * particle.speed
          + particle.dirX * this.config.outwardPull * le
          + waveX;

        const y = particle.oy
          + (particle.ry - 0.5) * this.config.verticalPull * le
          - this.config.lift * le
          + waveY;

        const flicker = Math.sin(particle.flickerSeed * 22 + p * 22);
        const alpha = particle.alpha
          * Math.pow(1 - p, 1.02)
          * (1 - Math.abs(flicker) * 0.055);

        if (alpha <= 0.01) return;

        const px = Math.round(x);
        const py = Math.round(y);
        const size = particle.size * (particle.isBlock ? 1.65 : 1);

        if (particle.hasSplit && p > 0.12) {
          const split = 0.8 * le;

          this.ctx.globalAlpha = alpha * 0.1;
          this.ctx.fillStyle = "rgba(255,70,70,0.72)";
          this.ctx.fillRect(Math.round(px - split), py, 1, 1);

          this.ctx.fillStyle = "rgba(70,185,255,0.72)";
          this.ctx.fillRect(Math.round(px + split), py, 1, 1);
        }

        if (particle.isBar && p > 0.18) {
          const length = Math.max(2, Math.round(size * (3.5 + particle.ry * 8) * le));
          const height = Math.max(1, Math.round(size));

          this.ctx.globalAlpha = alpha;
          this.ctx.fillStyle = particle.color;
          this.ctx.fillRect(Math.round(px - length * 0.18), py, length, height);

          if (particle.brightness > 0.45) {
            this.ctx.globalAlpha = alpha * 0.26;
            this.ctx.fillStyle = "rgba(255,255,255,0.9)";
            this.ctx.fillRect(
              Math.round(px - length * 0.18),
              py,
              Math.max(1, Math.round(length * 0.32)),
              1
            );
          }
        } else {
          this.drawPixel(px, py, size, alpha, particle);
        }
      });

      this.ctx.restore();
    }
  }

  window.PixelBreak = PixelBreak;
})();
