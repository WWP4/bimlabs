document.addEventListener("DOMContentLoaded", () => {
  /* ---------------------- */
  /* HEADER SCROLL */
  /* ---------------------- */

  const header = document.querySelector(".site-header");

  window.addEventListener("scroll", () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  });


  /* ---------------------- */
  /* SMOOTH ANCHOR SCROLL */
  /* ---------------------- */

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


  /* ---------------------- */
  /* CONTACT FORM PLACEHOLDER */
  /* ---------------------- */

  const contactForm = document.querySelector(".contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      alert("Request received. Replace this with your real form handler.");
      contactForm.reset();
    });
  }


  /* ---------------------- */
  /* AOS ANIMATION INIT */
  /* ---------------------- */

  if (window.AOS) {
    AOS.init({
      duration: 850,
      easing: "ease-out-cubic",
      once: false,
      mirror: true,
      offset: 80,
    });
  }


  /* ---------------------- */
  /* PROOF SECTION / THEATRE */
  /* ---------------------- */

  const theatreProjects = [
    {
      label: "01 / AI Workspace",
      title: "Orynd AI",
      text: "A guided planning workspace for budget, equipment, surfacing, quotes, and next steps.",
      screenTitle: "Orynd AI",
      cards: [
        {
          label: "Flow",
          value: "Guided planning",
        },
        {
          label: "Output",
          value: "Board-ready assets",
        },
        {
          label: "System",
          value: "Client-facing workflow",
        },
      ],
    },
    {
      label: "02 / Client Portal",
      title: "Project Portal",
      text: "A branded client hub for quotes, products, files, timelines, and project clarity.",
      screenTitle: "Client Portal",
      cards: [
        {
          label: "Flow",
          value: "Quote to decision",
        },
        {
          label: "Output",
          value: "Shared project clarity",
        },
        {
          label: "System",
          value: "Portal-based workflow",
        },
      ],
    },
    {
      label: "03 / Technical System",
      title: "3D Install System",
      text: "Interactive install steps, part references, model views, and contractor-ready guidance.",
      screenTitle: "3D Install System",
      cards: [
        {
          label: "Flow",
          value: "Step-by-step install",
        },
        {
          label: "Output",
          value: "Contractor guidance",
        },
        {
          label: "System",
          value: "3D visual reference",
        },
      ],
    },
    {
      label: "04 / Launch Experience",
      title: "Momentum Toolkit",
      text: "Premium pages and enrollment flows for programs, partners, parents, and schools.",
      screenTitle: "Momentum Toolkit",
      cards: [
        {
          label: "Flow",
          value: "Program launch",
        },
        {
          label: "Output",
          value: "Partner-ready assets",
        },
        {
          label: "System",
          value: "Enrollment experience",
        },
      ],
    },
  ];

  const theatreLabel = document.getElementById("theatreLabel");
  const theatreTitle = document.getElementById("theatreTitle");
  const theatreText = document.getElementById("theatreText");

  const theatreButtons = document.querySelectorAll("[data-project]");
  const theatreImages = document.querySelectorAll(".screen-img");

  const proofScreenLabel = document.querySelector(".proof-screen-label strong");
  const floatingCards = document.querySelectorAll(".proof-floating-card");

  function setTheatreProject(index) {
    const project = theatreProjects[index];

    if (!project) return;

    if (theatreLabel) theatreLabel.textContent = project.label;
    if (theatreTitle) theatreTitle.textContent = project.title;
    if (theatreText) theatreText.textContent = project.text;
    if (proofScreenLabel) proofScreenLabel.textContent = project.screenTitle;

    theatreButtons.forEach((button) => {
      const isActive = Number(button.dataset.project) === index;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    theatreImages.forEach((image, imageIndex) => {
      const isActive = imageIndex === index;
      image.classList.toggle("active", isActive);
      image.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    floatingCards.forEach((card, cardIndex) => {
      const cardData = project.cards[cardIndex];

      if (!cardData) return;

      const label = card.querySelector("span");
      const value = card.querySelector("strong");

      if (label) label.textContent = cardData.label;
      if (value) value.textContent = cardData.value;
    });

    if (window.AOS) {
      AOS.refresh();
    }
  }

  theatreButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setTheatreProject(Number(button.dataset.project));
    });
  });

  if (theatreButtons.length && theatreImages.length) {
    setTheatreProject(0);
  }
});

const proofTabs = document.querySelectorAll(".proof-tabs button");
const proofImages = document.querySelectorAll(".screen-img");

const proofLabel = document.getElementById("theatreLabel");
const proofTitle = document.getElementById("theatreTitle");
const proofText = document.getElementById("theatreText");
const proofQuote = document.getElementById("theatreQuote");

proofTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const index = Number(tab.dataset.project);

    proofTabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");

    proofImages.forEach((img, imgIndex) => {
      img.classList.toggle("active", imgIndex === index);
    });

    proofLabel.textContent = tab.dataset.label;
    proofTitle.textContent = tab.dataset.title;
    proofText.textContent = tab.dataset.text;
    proofQuote.textContent = tab.dataset.quote;
  });
});
