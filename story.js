const stickerSection = document.querySelector('.kr-scr-stickers');

if (stickerSection) {
  const stage = stickerSection.querySelector('.kr-scr-stickers__inner');
  const wall = stickerSection.querySelector('.kr-scr-stickers__wall');
  const stickers = [...wall.children];
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const pin = matchMedia('(min-width: 900px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)');
  const clamp = value => Math.min(1, Math.max(0, value));
  let frame;
  let offsets = [];

  function drawWall() {
    frame = undefined;
    const viewport = window.innerHeight;
    const runway = stickerSection.offsetHeight - stage.offsetHeight;
    const stickyTop = Number.parseFloat(getComputedStyle(stage).top) || 0;
    const progress = pin.matches && runway > 0
      ? clamp((stickyTop - stickerSection.getBoundingClientRect().top) / runway)
      : clamp((viewport * .94 - wall.getBoundingClientRect().top) / (viewport * .56));

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
    if (!motion.matches) {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      stickers.forEach(sticker => {
        for (const property of ['--sticker-x', '--sticker-y', '--sticker-turn', '--sticker-scale']) {
          sticker.style.removeProperty(property);
        }
      });
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
