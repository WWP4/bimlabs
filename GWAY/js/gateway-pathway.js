(() => {
  const section = document.querySelector('[data-pathway-section]');
  if (!section) return;

  const rows = [...section.querySelectorAll('[data-pathway-row]')];
  if (!rows.length) return;

  const activate = row => {
    rows.forEach(item => item.classList.toggle('is-active', item === row));
  };

  rows.forEach(row => {
    row.addEventListener('mouseenter', () => activate(row));
    row.addEventListener('focusin', () => activate(row));
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio);

      if (visible[0]?.target) activate(visible[0].target);
    }, {
      rootMargin:'-28% 0px -28% 0px',
      threshold:[.15,.35,.55,.75]
    });

    rows.forEach(row => observer.observe(row));
  }
})();
