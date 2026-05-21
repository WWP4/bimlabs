const header = document.querySelector(".site-header");

let ticking = false;

function updateHeader() {
  if (window.scrollY > 40) {
    header.classList.add("is-scrolled");
  } else {
    header.classList.remove("is-scrolled");
  }

  ticking = false;
}

window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(updateHeader);
    ticking = true;
  }
}, { passive: true });

const lazySplines = document.querySelectorAll(".lazy-spline");

const splineObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    const spline = entry.target;
    const url = spline.dataset.url;

    if (url && !spline.getAttribute("url")) {
      spline.setAttribute("url", url);
    }

    splineObserver.unobserve(spline);
  });
}, {
  rootMargin: "500px 0px"
});

lazySplines.forEach((spline) => splineObserver.observe(spline));
