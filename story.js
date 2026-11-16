const stickerSection = document.querySelector('.kr-scr-stickers');

if (stickerSection) {
  const stage = stickerSection.querySelector('.kr-scr-stickers__inner');
  const wall = stickerSection.querySelector('.kr-scr-stickers__wall');
  const stickers = [...wall.children];
  const seams = [...stickerSection.querySelectorAll('.kr-sticker-seam')];
  const header = document.querySelector('.header');
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const pin = matchMedia('(min-width: 900px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)');
  const clamp = value => Math.min(1, Math.max(0, value));
  let frame;
  let offsets = [];
  let lastProgress;
  let viewport = window.innerHeight;
  let stickyTop = 0;
  let runway = 0;

  function getProgress(top) {
    if (runway > 0) {
      const entrance = Math.min(viewport * .18, 150);
      return clamp((stickyTop + entrance - top) / (runway + entrance));
    }
    return clamp((viewport * .94 - wall.getBoundingClientRect().top) / (viewport * .56));
  }

  function drawWall() {
    frame = undefined;
    const { top, bottom } = stickerSection.getBoundingClientRect();
    const edges = [top, bottom];
    const progress = getProgress(top);
    seams.forEach((seam, index) => {
      const crossing = clamp((viewport * .96 - edges[index]) / (viewport * .59));
      const eased = (1 - (1 - crossing) ** 1.7).toFixed(3);
      if (seam.style.getPropertyValue('--seam-progress') !== eased) {
        seam.style.setProperty('--seam-progress', eased);
      }
    });
    if (progress === lastProgress) return;
    lastProgress = progress;

    stickers.forEach((sticker, index) => {
      const t = clamp((progress - index * .073) / .56);
      const remaining = (1 - t) ** 2.2;
      const { x, y, fromTurn, toTurn } = offsets[index];
      sticker.style.setProperty('--sticker-x', `${x * remaining}px`);
      sticker.style.setProperty('--sticker-y', `${y * remaining}px`);
      sticker.style.setProperty('--sticker-turn', `${toTurn + (fromTurn - toTurn) * remaining}deg`);
      sticker.style.setProperty('--sticker-scale', `${1 - .28 * remaining}`);
    });
  }

  function scheduleWall() {
    if (motion.matches && frame === undefined) frame = requestAnimationFrame(drawWall);
  }

  function measureWall() {
    lastProgress = undefined;
    viewport = Number.parseFloat(getComputedStyle(stickerSection, '::before').height) || window.innerHeight;
    stickyTop = header?.getBoundingClientRect().height || 0;
    stickerSection.toggleAttribute('data-sticker-pin', pin.matches);
    const stageHeight = stage.offsetHeight;
    const canPin = pin.matches && stageHeight <= viewport - stickyTop - 8;
    stickerSection.toggleAttribute('data-sticker-pin', canPin);
    runway = canPin ? Math.round(Math.max(245, Math.min(460, viewport * .36))) : 0;
    if (canPin) {
      stickerSection.style.setProperty('--story-sticky-top', `${stickyTop}px`);
      stickerSection.style.setProperty('--story-stage-height', `${stageHeight + stickerSection.clientTop * 2}px`);
      stickerSection.style.setProperty('--story-runway', `${runway}px`);
    }

    if (!motion.matches) {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      stickers.forEach(sticker => {
        for (const property of ['--sticker-x', '--sticker-y', '--sticker-turn', '--sticker-scale']) {
          sticker.style.removeProperty(property);
        }
      });
      seams.forEach(seam => seam.style.removeProperty('--seam-progress'));
      return;
    }

    offsets = stickers.map(sticker => ({
      x: (wall.clientWidth / 2 - sticker.offsetLeft - sticker.offsetWidth / 2) * .97,
      y: (wall.clientHeight / 2 - sticker.offsetTop - sticker.offsetHeight / 2) * .97,
      fromTurn: Number.parseFloat(sticker.style.getPropertyValue('--stack-turn')),
      toTurn: Number.parseFloat(sticker.style.getPropertyValue('--rotation')),
    }));
    scheduleWall();
  }

  window.addEventListener('scroll', scheduleWall, { passive: true });
  window.addEventListener('resize', measureWall, { passive: true });
  motion.addEventListener('change', measureWall);
  pin.addEventListener('change', measureWall);
  document.fonts?.ready.then(measureWall);
  measureWall();
}
