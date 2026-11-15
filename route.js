(() => {
  const route = document.querySelector('.kr-journey');
  if (!route) return;

  const stage = route.querySelector('.kr-journey__stage');
  const panels = [...route.querySelectorAll('.kr-journey__panel')];
  const links = [...route.querySelectorAll('[data-journey-step]')];
  const pageHeader = document.querySelector('.header, .site-header');
  const motion = window.matchMedia('(min-width: 320px) and (min-height: 590px) and (prefers-reduced-motion: no-preference)');
  const compact = window.matchMedia('(max-width: 47rem)');
  const stageAngles = panels.map((panel) => Number.parseFloat(panel.style.getPropertyValue('--chapter-tilt')));
  const lastStep = panels.length - 1;
  let headerHeight = 0;
  let runway = 0;
  let frame = 0;
  let previousProgress = -1;
  let previousStep = -1;

  const clamp = (value, max = 1) => Math.max(0, Math.min(value, max));

  function setCurrent(index) {
    if (index === previousStep) return;
    previousStep = index;
    links.forEach((link, linkIndex) => {
      if (linkIndex === index) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    panels.forEach((panel, panelIndex) => panel.toggleAttribute('inert', panelIndex !== index));
  }

  function render() {
    frame = 0;
    if (!route.hasAttribute('data-journey-motion')) return;

    const distance = headerHeight - route.getBoundingClientRect().top;
    const progress = clamp(distance / runway);
    if (progress === previousProgress) return;
    previousProgress = progress;

    const position = progress * lastStep;
    const currentStep = Math.round(position);
    const cardPosition = compact.matches ? currentStep : position;
    route.style.setProperty('--journey-shift', `${-100 * cardPosition}%`);
    route.style.setProperty('--journey-progress', `${100 * progress}%`);
    route.style.setProperty('--journey-china', `${100 * clamp(position / 4)}%`);
    route.style.setProperty('--journey-germany', `${100 * clamp((position - 4) / (lastStep - 4))}%`);
    setCurrent(currentStep);

    panels.forEach((panel, index) => {
      const separation = clamp(Math.abs(cardPosition - index), 1);
      panel.style.setProperty('--chapter-angle', `${stageAngles[index] * separation}deg`);
      panel.style.setProperty('--chapter-scale', 1 - .09 * separation);
      panel.style.setProperty('--chapter-lift', `${14 * separation}px`);
    });
  }

  function schedule() {
    if (!frame && motion.matches) frame = requestAnimationFrame(render);
  }

  function measure() {
    headerHeight = pageHeader && getComputedStyle(pageHeader).position === 'sticky'
      ? pageHeader.getBoundingClientRect().height
      : 0;
    const available = window.innerHeight - headerHeight;
    const canPin = motion.matches && available >= 510;
    route.toggleAttribute('data-journey-motion', canPin);
    runway = Math.max(255, Math.min(420, available * (window.innerWidth < 760 ? .43 : .52))) * lastStep;
    route.style.setProperty('--journey-top', `${headerHeight}px`);
    route.style.setProperty('--journey-pin', `${available}px`);
    route.style.setProperty('--journey-runway', `${runway}px`);
    previousProgress = -1;
    previousStep = -1;
    if (!canPin) {
      panels.forEach((panel) => panel.removeAttribute('inert'));
      links.forEach((link) => link.removeAttribute('aria-current'));
      route.style.removeProperty('--journey-china');
      route.style.removeProperty('--journey-germany');
    }
    schedule();
  }

  function goTo(index, behavior = 'smooth') {
    const sectionTop = window.scrollY + route.getBoundingClientRect().top - headerHeight;
    window.scrollTo({ top: sectionTop + runway * index / lastStep, behavior });
  }

  function matchingStep(hash) {
    return panels.findIndex((panel) => `#${panel.id}` === hash);
  }

  function followHash() {
    if (!route.hasAttribute('data-journey-motion')) return;
    const index = matchingStep(window.location.hash);
    if (index >= 0) requestAnimationFrame(() => goTo(index, 'instant'));
  }

  document.addEventListener('click', (event) => {
    if (!route.hasAttribute('data-journey-motion') || event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#route-"]');
    if (!link) return;
    const index = matchingStep(link.hash);
    if (index < 0) return;
    event.preventDefault();
    if (!link.hasAttribute('data-journey-step') && window.location.hash !== link.hash) history.pushState(null, '', link.hash);
    goTo(index);
  });

  links.forEach((link, index) => {
    link.addEventListener('keydown', (event) => {
      if (!route.hasAttribute('data-journey-motion')) return;
      const directions = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: lastStep };
      const target = directions[event.key];
      if (target === undefined) return;
      event.preventDefault();
      const destination = clamp(target, lastStep);
      links[destination].focus({ preventScroll: true });
      goTo(destination);
    });
  });

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('hashchange', followHash);
  motion.addEventListener('change', measure);
  document.fonts?.ready.then(() => {
    measure();
    followHash();
  });
  measure();
})();
