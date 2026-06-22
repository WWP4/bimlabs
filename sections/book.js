/* ==========================================================
   BIM LABS — BOOK WITH US
   Homepage booking gateway.
========================================================== */

(() => {
  "use strict";

  const section = document.querySelector(".book-with-us");
  if (!section) return;

  const link = section.querySelector(".book-with-us__button");
  if (!link) return;

  link.href = "/book.html?source=home-book";
})();
