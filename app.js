document.addEventListener("DOMContentLoaded", () => {
  AOS.init();

  const ctaBtn = document.getElementById("ctaBtn");
  const servicesSection = document.getElementById("services");

  if (ctaBtn && servicesSection) {
    ctaBtn.addEventListener("click", () => {
      servicesSection.scrollIntoView({ behavior: "smooth" });
    });
  }
});
