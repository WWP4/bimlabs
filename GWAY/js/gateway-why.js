(() => {

  const section =
    document.querySelector(
      '.why-gsa'
    );

  if (!section) return;


  const items =
    section.querySelectorAll(
      '[data-reveal]'
    );

  if (!items.length) return;


  const reducedMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;


  if (reducedMotion) {

    items.forEach(
      (item) => {
        item.classList.add(
          'is-visible'
        );
      }
    );

    return;
  }


  const observer =
    new IntersectionObserver(

      (entries) => {

        entries.forEach(
          (entry) => {

            if (
              !entry.isIntersecting
            ) return;


            const el =
              entry.target;


            const delay =
              Number(
                el.dataset.delay ||
                0
              );


            window.setTimeout(
              () => {

                el.classList.add(
                  'is-visible'
                );

              },
              delay
            );


            observer.unobserve(
              el
            );
          }
        );
      },

      {
        /*
          Begin revealing almost
          immediately as Section 2
          enters the viewport.
        */
        threshold: 0.04,

        rootMargin:
          '0px 0px -2% 0px'
      }
    );


  items.forEach(
    (item) => {
      observer.observe(item);
    }
  );

})();
