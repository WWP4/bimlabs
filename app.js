document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const contactForm = document.querySelector(".contact-form");

  window.addEventListener("scroll", () => {
    if (!header) return;

    header.classList.toggle("is-scrolled", window.scrollY > 20);
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      alert("Request received. Replace this with your real form handler.");
      contactForm.reset();
    });
  }
});




const theatreProjects = [
  {
    label: "01 / AI Workspace",
    title: "Orynd AI",
    text: "A guided planning workspace for budget, equipment, surfacing, quotes, and next steps."
  },
  {
    label: "02 / Client Portal",
    title: "Project Portal",
    text: "A branded client hub for quotes, products, files, timelines, and project clarity."
  },
  {
    label: "03 / Technical System",
    title: "3D Install System",
    text: "Interactive install steps, part references, model views, and contractor-ready guidance."
  },
  {
    label: "04 / Launch Experience",
    title: "Momentum Toolkit",
    text: "Premium pages and enrollment flows for programs, partners, parents, and schools."
  }
];

const theatreLabel = document.getElementById("theatreLabel");
const theatreTitle = document.getElementById("theatreTitle");
const theatreText = document.getElementById("theatreText");
const theatreButtons = document.querySelectorAll("[data-project]");
const theatreImages = document.querySelectorAll(".screen-img");

function setTheatreProject(index) {
  const project = theatreProjects[index];

  theatreLabel.textContent = project.label;
  theatreTitle.textContent = project.title;
  theatreText.textContent = project.text;

  theatreButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.project) === index);
  });

  theatreImages.forEach((image, imageIndex) => {
    image.classList.toggle("active", imageIndex === index);
  });
}

theatreButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setTheatreProject(Number(button.dataset.project));
  });
});
