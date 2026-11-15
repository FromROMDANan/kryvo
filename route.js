(() => {
  const route = document.querySelector('.kr-journey');
  if (!route) return;

  const panels = [...route.querySelectorAll('.kr-journey__panel')];
  const links = [...route.querySelectorAll('[data-journey-step]')];
  const cardFrame = route.querySelector('.kr-journey__frame');
  const controls = route.querySelector('[data-journey-controls]');
  const back = controls.querySelector('[data-journey-direction="-1"]');
  const next = controls.querySelector('[data-journey-direction="1"]');
  const status = controls.querySelector('[data-journey-status]');
  const pageHeader = document.querySelector('.header, .site-header');
  const motion = window.matchMedia('(min-height: 590px) and (prefers-reduced-motion: no-preference)');
  const compact = window.matchMedia('(max-width: 47rem), (pointer: coarse) and (max-height: 32rem)');
  const stageAngles = panels.map((panel) => Number.parseFloat(panel.style.getPropertyValue('--chapter-tilt')));
  const lastStep = panels.length - 1;
  let headerHeight = 0;
  let runway = 0;
  let frame = 0;
  let previousProgress = -1;
  let previousStep = -1;
  let gesture;

  const clamp = (value, max = 1) => Math.max(0, Math.min(value, max));
  const isPager = () => route.hasAttribute('data-journey-pager');
  const isEnhanced = () => isPager() || route.hasAttribute('data-journey-motion');

  function setCurrent(index) {
    if (index === previousStep) return;
    previousStep = index;
    links.forEach((link, linkIndex) => {
      if (linkIndex === index) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    panels.forEach((panel, panelIndex) => panel.toggleAttribute('inert', panelIndex !== index));
  }

  function setPosition(position) {
    route.style.setProperty('--journey-shift', `${-100 * position}%`);
    route.style.setProperty('--journey-china', `${100 * clamp(position / 4)}%`);
    route.style.setProperty('--journey-germany', `${100 * clamp((position - 4) / (lastStep - 4))}%`);
  }

  function showPage(index, animate = true) {
    const step = clamp(index, lastStep);
    if (previousStep === step) return;
    const adjacent = previousStep >= 0 && Math.abs(step - previousStep) === 1;
    route.toggleAttribute('data-journey-sliding', animate && adjacent);
    setPosition(step);
    setCurrent(step);
    back.setAttribute('aria-disabled', String(step === 0));
    next.setAttribute('aria-disabled', String(step === lastStep));
    status.textContent = `Etappe ${step + 1} von ${panels.length} · ${links[step].querySelector('strong').textContent}`;
  }

  function render() {
    frame = 0;
    if (!route.hasAttribute('data-journey-motion')) return;

    const distance = headerHeight - route.getBoundingClientRect().top;
    const progress = clamp(distance / runway);
    if (progress === previousProgress) return;
    previousProgress = progress;

    const position = progress * lastStep;
    setPosition(position);
    setCurrent(Math.round(position));

    panels.forEach((panel, index) => {
      const separation = clamp(Math.abs(position - index), 1);
      panel.style.setProperty('--chapter-angle', `${stageAngles[index] * separation}deg`);
      panel.style.setProperty('--chapter-scale', 1 - .09 * separation);
      panel.style.setProperty('--chapter-lift', `${14 * separation}px`);
    });
  }

  function schedule() {
    if (!frame && route.hasAttribute('data-journey-motion')) frame = requestAnimationFrame(render);
  }

  function measure() {
    if (compact.matches) {
      if (isPager()) return;
      const step = Math.max(0, previousStep);
      route.removeAttribute('data-journey-motion');
      route.setAttribute('data-journey-pager', '');
      controls.hidden = false;
      previousStep = -1;
      showPage(step, false);
      return;
    }

    route.removeAttribute('data-journey-pager');
    route.removeAttribute('data-journey-sliding');
    controls.hidden = true;
    headerHeight = pageHeader && getComputedStyle(pageHeader).position === 'sticky'
      ? pageHeader.getBoundingClientRect().height
      : 0;
    const available = window.innerHeight - headerHeight;
    const canPin = motion.matches && available >= 510;
    runway = Math.max(255, Math.min(420, available * (window.innerWidth < 760 ? .43 : .52))) * lastStep;
    route.toggleAttribute('data-journey-motion', canPin);
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

  function goTo(index, { reveal = false, animate = true } = {}) {
    if (isPager()) {
      showPage(index, animate && !reveal);
      if (reveal) route.scrollIntoView({ behavior: 'instant', block: 'start' });
      return;
    }
    const sectionTop = window.scrollY + route.getBoundingClientRect().top - headerHeight;
    window.scrollTo({ top: sectionTop + runway * index / lastStep, behavior: animate ? 'smooth' : 'instant' });
  }

  function matchingStep(hash) {
    return panels.findIndex((panel) => `#${panel.id}` === hash);
  }

  function followHash() {
    if (!isEnhanced()) return;
    const index = matchingStep(window.location.hash);
    if (index >= 0) requestAnimationFrame(() => goTo(index, { reveal: true, animate: false }));
  }

  document.addEventListener('click', (event) => {
    if (!isEnhanced() || event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#route-"]');
    if (!link) return;
    const index = matchingStep(link.hash);
    if (index < 0) return;
    event.preventDefault();
    const reveal = !link.hasAttribute('data-journey-step');
    if (reveal && window.location.hash !== link.hash) history.pushState(null, '', link.hash);
    goTo(index, { reveal });
  });

  links.forEach((link, index) => {
    link.addEventListener('keydown', (event) => {
      if (!isEnhanced()) return;
      const directions = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: lastStep };
      if (isPager()) {
        directions.ArrowUp = index - 1;
        directions.ArrowDown = index + 1;
      }
      const target = directions[event.key];
      if (target === undefined) return;
      event.preventDefault();
      const destination = clamp(target, lastStep);
      links[destination].focus({ preventScroll: true });
      goTo(destination);
    });
  });

  back.addEventListener('click', () => showPage(previousStep - 1));
  next.addEventListener('click', () => showPage(previousStep + 1));

  function clearGesture() { gesture = undefined; }

  cardFrame.addEventListener('touchstart', (event) => {
    clearGesture();
    if (!isPager() || event.touches.length !== 1 || window.visualViewport?.scale > 1.02) return;
    // The text and controls remain ordinary page-scrolling surfaces.
    if (!event.target.closest?.('.kr-journey__media')) return;
    const touch = event.touches[0];
    gesture = { id: touch.identifier, x: touch.clientX, y: touch.clientY, step: previousStep, direction: 0 };
  }, { passive: true });

  cardFrame.addEventListener('touchmove', (event) => {
    if (!gesture) return;
    const touch = event.touches[0];
    if (!isPager() || event.touches.length !== 1 || touch.identifier !== gesture.id
      || previousStep !== gesture.step || !event.cancelable || window.visualViewport?.scale > 1.02) {
      clearGesture();
      return;
    }

    if (!gesture.direction) {
      const dx = touch.clientX - gesture.x;
      const dy = gesture.y - touch.clientY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 7) return;
      const direction = Math.sign(dy);
      const dest = gesture.step + direction;
      if (Math.abs(dy) < Math.abs(dx) * 1.25 || dest < 0 || dest > lastStep) {
        clearGesture();
        return;
      }
      gesture.direction = direction;
    }
    event.preventDefault();
  }, { passive: false });

  cardFrame.addEventListener('touchend', (event) => {
    const swipe = gesture;
    clearGesture();
    if (!swipe?.direction || event.touches.length || !isPager() || previousStep !== swipe.step) return;
    const touch = Array.from(event.changedTouches).find((point) => point.identifier === swipe.id);
    if (touch && (swipe.y - touch.clientY) * swipe.direction >= 44) {
      showPage(swipe.step + swipe.direction);
    }
  }, { passive: true });

  cardFrame.addEventListener('touchcancel', clearGesture, { passive: true });
  document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 1) clearGesture();
  }, { passive: true });

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('hashchange', followHash);
  compact.addEventListener('change', measure);
  motion.addEventListener('change', measure);
  document.fonts?.ready.then(() => {
    measure();
    followHash();
  });
  measure();
  followHash();
})();
