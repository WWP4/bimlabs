document.addEventListener("DOMContentLoaded", function () {
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 900,
      once: true,
      easing: "ease-in-out"
    });
  }

  const statNumbers = document.querySelectorAll(".stat-number");

  const animateCount = (el) => {
    const target = Number(el.dataset.count || 0);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const duration = 1600;
    const startTime = performance.now();

    const step = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * eased);

      el.textContent = `${prefix}${current}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = `${prefix}${target}${suffix}`;
      }
    };

    requestAnimationFrame(step);
  };

  if (statNumbers.length) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.45 });

    statNumbers.forEach((stat) => observer.observe(stat));
  }

  window.toggleMenu = function () {
    const menu = document.getElementById("mobileMenu");
    if (menu) menu.classList.toggle("active");
  };

  const showcaseStage = document.getElementById("swamiShowcaseStage");
  const showcaseShell = document.querySelector(".swami-showcase-shell");
  const cardMain = document.getElementById("cardMain");
  const cardA = document.getElementById("cardA");
  const cardB = document.getElementById("cardB");
  const cardC = document.getElementById("cardC");

  const isDesktop = () => window.innerWidth > 1100;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, progress) {
    return start + (end - start) * progress;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function updateShowcase() {
    if (!showcaseStage || !showcaseShell || !cardMain || !cardA || !cardB || !cardC) return;

    if (!isDesktop()) {
      showcaseShell.classList.add("is-animated");
      [cardMain, cardA, cardB, cardC].forEach((card) => {
        card.style.transform = "none";
        card.style.opacity = "1";
        card.style.filter = "blur(0px)";
      });
      return;
    }

    const rect = showcaseStage.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const total = rect.height + windowHeight;
    const raw = (windowHeight - rect.top) / total;
    const progress = clamp(raw, 0, 1);

    showcaseShell.classList.add("is-animated");

    const mainProgress = clamp(progress * 1.15, 0, 1);
    const aProgress = clamp((progress - 0.14) * 1.28, 0, 1);
    const bProgress = clamp((progress - 0.28) * 1.34, 0, 1);
    const cProgress = clamp((progress - 0.42) * 1.4, 0, 1);

    const mp = easeOutCubic(mainProgress);
    const ap = easeOutCubic(aProgress);
    const bp = easeOutCubic(bProgress);
    const cp = easeOutCubic(cProgress);

    cardMain.style.transform = `translate3d(${lerp(-40, 0, mp)}px, ${lerp(40, 0, mp)}px, 0) scale(${lerp(0.96, 1, mp)})`;
    cardMain.style.opacity = String(lerp(0.35, 1, mp));
    cardMain.style.filter = `blur(${lerp(3, 0, mp)}px)`;

    cardA.style.transform = `translate3d(${lerp(120, 0, ap)}px, ${lerp(-30, 0, ap)}px, 0) scale(${lerp(0.94, 1, ap)})`;
    cardA.style.opacity = String(lerp(0.15, 1, ap));
    cardA.style.filter = `blur(${lerp(4, 0, ap)}px)`;

    cardB.style.transform = `translate3d(${lerp(160, 0, bp)}px, ${lerp(30, 0, bp)}px, 0) scale(${lerp(0.95, 1, bp)})`;
    cardB.style.opacity = String(lerp(0.12, 1, bp));
    cardB.style.filter = `blur(${lerp(4, 0, bp)}px)`;

    cardC.style.transform = `translate3d(${lerp(140, 0, cp)}px, ${lerp(70, 0, cp)}px, 0) scale(${lerp(0.95, 1, cp)})`;
    cardC.style.opacity = String(lerp(0.12, 1, cp));
    cardC.style.filter = `blur(${lerp(4, 0, cp)}px)`;
  }

  let ticking = false;

  function requestTick() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(() => {
        updateShowcase();
        ticking = false;
      });
    }
  }

  updateShowcase();
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
});


(function () {
  const triggers = document.querySelectorAll(".swami-detail-trigger");

  const visual = document.querySelector(".swami-detail-visual");
  const number = document.getElementById("detailNumber");
  const label = document.getElementById("detailLabel");
  const step = document.getElementById("detailStep");
  const title = document.getElementById("detailTitle");
  const text = document.getElementById("detailText");
  const art = document.getElementById("detailArt");
  const progress = document.querySelector(".swami-detail-progress-line");

  if (!triggers.length || !visual || !number || !label || !step || !title || !text || !art || !progress) return;

  let activeIndex = 0;
  let isMobile = window.innerWidth <= 960;

  /* ---------- VISUAL SYSTEM ---------- */
  function renderArt(type) {
    if (type === "input") {
      art.innerHTML = `
        <div class="swami-art swami-art-input">
          <div class="swami-art-input-line one"></div>
          <div class="swami-art-input-line two"></div>
          <div class="swami-art-input-line three"></div>
        </div>
      `;
      return;
    }

    if (type === "insight") {
      art.innerHTML = `
        <div class="swami-art swami-art-insight">
          <div class="swami-art-bar a"></div>
          <div class="swami-art-bar b"></div>
          <div class="swami-art-bar c"></div>
          <div class="swami-art-bar d"></div>
          <div class="swami-art-bar e"></div>
        </div>
      `;
      return;
    }

    if (type === "result") {
      art.innerHTML = `
        <div class="swami-art swami-art-result">
          <div class="swami-art-score">78</div>
          <div class="swami-art-subline"></div>
          <div class="swami-art-caption">Cash Leak Score</div>
        </div>
      `;
      return;
    }

    art.innerHTML = "";
  }

  /* ---------- PROGRESS ---------- */
  function updateProgress(index) {
    const value = ((index + 1) / triggers.length) * 100;

    if (isMobile) {
      progress.style.width = value + "%";
    } else {
      progress.style.height = value + "%";
    }
  }

  /* ---------- CONTENT SWITCH ---------- */
  function setContent(trigger, index) {
    visual.classList.add("is-changing");

    setTimeout(() => {
      number.textContent = trigger.dataset.number || "";
      label.textContent = trigger.dataset.label || "";
      step.textContent = trigger.dataset.step || "";
      title.textContent = trigger.dataset.title || "";
      text.textContent = trigger.dataset.text || "";

      renderArt(trigger.dataset.visual);
      updateProgress(index);

      visual.classList.remove("is-changing");
    }, 200);
  }

  /* ---------- SCROLL OBSERVER ---------- */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const index = [...triggers].indexOf(entry.target);
        if (index === activeIndex) return;

        activeIndex = index;
        setContent(entry.target, index);
      });
    },
    {
      threshold: 0.55
    }
  );

  triggers.forEach((trigger) => observer.observe(trigger));

  /* ---------- INIT ---------- */
  renderArt("input");
  updateProgress(0);

  window.addEventListener("resize", () => {
    isMobile = window.innerWidth <= 960;
    updateProgress(activeIndex);
  });
})();
