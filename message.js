// message.js
gsap.registerPlugin(ScrollTrigger);

window.addEventListener("load", () => {
  const hero = document.querySelector("#hero");
  const message = document.querySelector("#message");

  if (!hero || !message) return;

  const curtain = document.createElement("div");
  curtain.className = "yellow-curtain";
  curtain.innerHTML = `
    <div class="yellow-curtain__text">THE MESSAGE</div>
  `;
  document.body.appendChild(curtain);

  gsap.set(curtain, {
    yPercent: 100,
    autoAlpha: 1
  });

  gsap.set(".yellow-curtain__text", {
    autoAlpha: 0,
    y: 16
  });

  gsap.set(message, {
    autoAlpha: 1
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "+=220%",
      scrub: 1.4,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  tl
    .to(curtain, {
      yPercent: 0,
      duration: 1.2,
      ease: "power2.inOut"
    })

    .to(".yellow-curtain__text", {
      autoAlpha: 1,
      y: 0,
      duration: .45,
      ease: "power2.out"
    }, "-=.25")

    .to({}, {
      duration: .45
    })

    .to(".yellow-curtain__text", {
      autoAlpha: 0,
      y: -16,
      duration: .35,
      ease: "power2.inOut"
    })

    .to(curtain, {
      yPercent: -100,
      duration: 1.25,
      ease: "power2.inOut"
    });

  ScrollTrigger.refresh();
});