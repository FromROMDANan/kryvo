(() => {
  const route = document.querySelector('.kr-journey');
  if (!route) return;

  const panels = [...route.querySelectorAll('.kr-journey__panel')];
  const panelIds = panels.map((panel) => panel.id);
  const links = [...route.querySelectorAll('[data-journey-step]')];
  const stage = route.querySelector('.kr-journey__stage');
  const frame = route.querySelector('.kr-journey__frame');
  const readout = route.querySelector('[data-journey-readout]');
  const pathGroup = route.querySelector('.kr-journey__path g');
  const pageHeader = document.querySelector('.header, .site-header');
  const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
  const mobile = window.matchMedia('(max-width: 47rem)');
  const lastStep = panels.length - 1;
  const handoff = 3;
  const leadIn = .42;
  const layoutColumns = [0, 1, 2, 3, 3, 2, 1, 0];
  const layoutStagger = [-.32, .48, -.38, .4, -.34, .48, -.4, .32];

  let headerHeight = 0;
  let stepDistance = 0;
  let camera;
  let animationFrame = 0;
  let previousDistance = -1;
  let previousStep = -1;

  const clamp = (value, max = 1) => Math.max(0, Math.min(value, max));
  const isAnimated = () => route.hasAttribute('data-journey-motion');
  const createPath = (className) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', className);
    return path;
  };

  const captions = panels.map((panel) => panel.querySelector('.kr-journey__copy').cloneNode(true));
  captions.forEach((caption) => { caption.inert = true; });
  readout?.append(...captions);

  const anchors = panels.map(() => {
    const anchor = document.createElement('span');
    anchor.className = 'kr-journey__anchor';
    anchor.setAttribute('aria-hidden', 'true');
    return anchor;
  });
  route.prepend(...anchors);

  const routeLine = createPath('kr-journey__line');
  const arrows = panels.slice(1).map(() => {
    const arrow = createPath('kr-journey__path-arrow');
    arrow.setAttribute('d', 'M -8 -6 L 2 0 L -8 6 L -4 0 Z');
    return arrow;
  });
  pathGroup?.append(routeLine, ...arrows);

  function pointOn(segment, t) {
    const q = 1 - t;
    const weights = [q ** 3, 3 * q * q * t, 3 * q * t * t, t ** 3];
    return {
      x: segment.reduce((x, point, index) => x + point.x * weights[index], 0),
      y: segment.reduce((y, point, index) => y + point.y * weights[index], 0),
    };
  }

  function setCameraGeometry(width, height) {
    const photoWidth = Math.min(550, width * (width < 760 ? .79 : .46), height * 1.6);
    const photoHeight = Math.min(420, height * .82, photoWidth * .76);
    const gap = Math.max(26, Math.min(76, width * .065));
    const stride = photoWidth + gap;
    const stagger = Math.min(58, height * .13);
    const secondRow = Math.max(photoHeight + 2 * gap, height * .83);

    const points = panels.map((panel, index) => {
      const x = width / 2 + layoutColumns[index] * stride;
      const y = height / 2 + layoutStagger[index] * stagger + (index > handoff ? secondRow : 0);
      panel.style.setProperty('--station-x', `${x}px`);
      panel.style.setProperty('--station-y', `${y}px`);
      return { x, y };
    });
    route.style.setProperty('--journey-photo-width', `${photoWidth}px`);
    route.style.setProperty('--journey-photo-height', `${photoHeight}px`);

    const segments = points.slice(1).map((end, index) => {
      const start = points[index];
      const dx = end.x - start.x;
      if (index === handoff) {
        const bend = Math.min(photoWidth * .24, 104);
        const dy = end.y - start.y;
        return [start, { x: start.x + bend, y: start.y + dy * .24 },
          { x: end.x + bend, y: end.y - dy * .24 }, end];
      }
      return [start, { x: start.x + dx * .4, y: start.y },
        { x: end.x - dx * .4, y: end.y }, end];
    });

    const coordinates = (point) => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    const curves = segments.map((segment) => `C ${segment.slice(1).map(coordinates).join(' ')}`);
    routeLine.setAttribute('d', `M ${coordinates(points[0])} ${curves.join(' ')}`);
    segments.forEach((segment, index) => {
      const center = pointOn(segment, .5);
      const forward = pointOn(segment, .51);
      const angle = Math.atan2(forward.y - center.y, forward.x - center.x) * 180 / Math.PI;
      arrows[index].setAttribute('transform', `translate(${coordinates(center)}) rotate(${angle})`);
    });

    camera = { width, height, segments };
  }

  function setCurrent(index) {
    if (index === previousStep) return;
    const captionHadFocus = previousStep >= 0 && captions[previousStep].contains(document.activeElement);
    previousStep = index;
    links.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
      link.toggleAttribute('data-journey-passed', i < index);
    });
    panels.forEach((panel, i) => { panel.inert = i !== index; });
    captions.forEach((caption, i) => {
      caption.toggleAttribute('data-journey-active', i === index);
      caption.inert = i !== index;
    });
    if (captionHadFocus) links[index].focus({ preventScroll: true });
  }

  function render() {
    animationFrame = 0;
    if (!isAnimated() || !camera) return;
    const distance = clamp(headerHeight - route.getBoundingClientRect().top, stepDistance * (leadIn + lastStep));
    if (distance === previousDistance) return;
    previousDistance = distance;

    const travel = distance / stepDistance;
    const position = clamp(travel - leadIn, lastStep);
    const segment = Math.min(Math.floor(position), lastStep - 1);
    const current = pointOn(camera.segments[segment], position - segment);
    const entrance = (1 - clamp(travel / leadIn)) ** 1.6;
    route.style.setProperty('--journey-x', `${camera.width / 2 - current.x + camera.width * .29 * entrance}px`);
    route.style.setProperty('--journey-y', `${camera.height / 2 - current.y}px`);
    route.style.setProperty('--journey-china', `${100 * clamp(position / handoff)}%`);
    route.style.setProperty('--journey-handoff', `${100 * clamp(position - handoff)}%`);
    route.style.setProperty('--journey-germany', `${100 * clamp((position - handoff - 1) / (lastStep - handoff - 1))}%`);
    if (previousStep < 0 || Math.abs(position - previousStep) >= .56) {
      setCurrent(Math.round(position));
    }
  }

  function schedule() {
    if (!animationFrame && isAnimated()) animationFrame = requestAnimationFrame(render);
  }

  function positionAnchors() {
    // Keep fragment links on the scroll axis instead of the transformed artwork.
    const scrollPadding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const offset = scrollPadding - headerHeight - route.clientTop;
    anchors.forEach((anchor, index) => {
      panels[index].removeAttribute('id');
      anchor.id = panelIds[index];
      anchor.style.top = `${offset + (leadIn + index) * stepDistance}px`;
    });
  }

  function measure() {
    const stableHeight = Number.parseFloat(getComputedStyle(route, '::before').height) || window.innerHeight;
    headerHeight = pageHeader && getComputedStyle(pageHeader).position === 'sticky'
      ? pageHeader.getBoundingClientRect().height
      : 0;
    const available = stableHeight - headerHeight;
    const canPin = motion.matches && available >= 505;

    if (!canPin) {
      if (isAnimated()) {
        route.removeAttribute('data-journey-motion');
        links.forEach((link) => {
          link.removeAttribute('aria-current');
          link.removeAttribute('data-journey-passed');
        });
        panels.forEach((panel) => { panel.inert = false; });
        anchors.forEach((anchor, index) => {
          anchor.removeAttribute('id');
          panels[index].id = panelIds[index];
        });
        captions.forEach((caption) => { caption.inert = true; });
        for (const property of ['--journey-china', '--journey-germany', '--journey-handoff']) {
          route.style.removeProperty(property);
        }
      }
      previousStep = -1;
      camera = undefined;
      return;
    }

    // Browser controls can resize the viewport without moving the reader to another stop.
    stepDistance = Math.max(410, Math.min(540, window.innerWidth * .72));
    const leadOut = mobile.matches ? .18 : .42;
    route.style.setProperty('--journey-top', `${headerHeight}px`);
    route.style.setProperty('--journey-pin', `${available}px`);
    route.style.setProperty('--journey-runway', `${stepDistance * (leadIn + lastStep + leadOut)}px`);
    route.setAttribute('data-journey-motion', '');
    positionAnchors();
    const { clientWidth: width, clientHeight: height } = frame;
    if (!camera || width !== camera.width || height !== camera.height) setCameraGeometry(width, height);
    if (mobile.matches && readout) {
      const padding = Number.parseFloat(getComputedStyle(stage).paddingBlockEnd);
      const sceneHeight = Math.ceil(readout.offsetTop + readout.offsetHeight + padding + 1);
      route.style.setProperty('--journey-pin', `${Math.min(available, sceneHeight)}px`);
    }
    previousDistance = NaN;
    schedule();
  }

  function goTo(index, animate = false) {
    const sectionTop = window.scrollY + route.getBoundingClientRect().top - headerHeight;
    window.scrollTo({
      top: sectionTop + (leadIn + index) * stepDistance,
      behavior: animate ? 'smooth' : 'instant',
    });
  }

  function matchingStep(hash) {
    return panelIds.findIndex((id) => `#${id}` === hash);
  }

  function followHash() {
    const index = matchingStep(window.location.hash);
    if (index >= 0 && isAnimated()) {
      requestAnimationFrame(() => {
        if (isAnimated()) goTo(index);
      });
    }
  }

  document.addEventListener('click', (event) => {
    if (!isAnimated() || event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#route-"]');
    if (!link) return;
    const index = matchingStep(link.hash);
    if (index < 0) return;
    event.preventDefault();
    const fromScale = link.hasAttribute('data-journey-step');
    if (!fromScale && window.location.hash !== link.hash) history.pushState(null, '', link.hash);
    goTo(index, fromScale);
  });

  links.forEach((link, index) => {
    link.addEventListener('keydown', (event) => {
      const directions = {
        ArrowLeft: index - 1,
        ArrowRight: index + 1,
        ArrowUp: index - 1,
        ArrowDown: index + 1,
        Home: 0,
        End: lastStep,
      };
      const target = directions[event.key];
      if (target === undefined) return;
      event.preventDefault();
      const destination = clamp(target, lastStep);
      links[destination].focus({ preventScroll: isAnimated() });
      if (isAnimated()) goTo(destination, true);
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
  followHash();
})();
