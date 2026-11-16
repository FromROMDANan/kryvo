(() => {
  const section = document.querySelector('[data-styling]');
  if (!section) return;

  const runway = section.querySelector('[data-styling-runway]');
  const stage = section.querySelector('[data-styling-stage]');
  const nav = section.querySelector('[data-styling-nav]');
  const looks = [...section.querySelectorAll('[data-styling-look]')];
  const photos = looks.map(look => look.querySelector('.ks-look__photo'));
  const pendingDesktopPhotos = [...section.querySelectorAll('.ks-look__photo img[loading="lazy"]')];
  const buttons = [...nav.querySelectorAll('[data-styling-jump]')];
  const motion = window.matchMedia('(min-width: 760px) and (min-height: 645px) and (prefers-reduced-motion: no-preference)');
  const compactMotion = window.matchMedia('(max-width: 759px) and (prefers-reduced-motion: no-preference)');
  const header = document.querySelector('.header');
  const clamp = value => Math.max(0, Math.min(1, value));
  let queued = false;
  let previous = -1;
  let stickyTop = 0;
  let compactHeight = 0;

  looks.forEach(look => {
    const hotspot = look.querySelector('[data-styling-hotspot]');
    const outfit = look.querySelector('[data-styling-outfit]');
    const summary = outfit.querySelector('summary');
    hotspot.hidden = false;
    hotspot.addEventListener('click', () => {
      outfit.open = !outfit.open;
      if (outfit.open) summary.focus();
    });
    outfit.addEventListener('toggle', () => hotspot.setAttribute('aria-expanded', String(outfit.open)));
  });

  function updateCompact() {
    const bounds = section.getBoundingClientRect();
    if (bounds.top > compactHeight || bounds.bottom <= 0) return;

    // Measure the stationary frames before updating any of their artwork.
    const frames = photos.map(photo => photo.getBoundingClientRect());
    frames.forEach(({ top, height }, index) => {
      const photo = clamp((compactHeight * .95 - top) / (compactHeight * .78));
      const detail = clamp((compactHeight * .94 - top - height * .56) / (compactHeight * .49));
      const look = looks[index];
      look.style.setProperty('--ks-photo-reveal', (1 - (1 - photo) ** 1.6).toFixed(3));
      look.style.setProperty('--ks-detail-reveal', (1 - (1 - detail) ** 1.6).toFixed(3));
    });
  }

  function update() {
    queued = false;
    if (compactMotion.matches) {
      updateCompact();
      return;
    }
    if (!motion.matches) return;

    const { top } = runway.getBoundingClientRect();
    if (pendingDesktopPhotos.length && top < window.innerHeight * 1.6) {
      pendingDesktopPhotos.forEach(image => { image.loading = 'eager'; });
      pendingDesktopPhotos.length = 0;
    }
    const distance = Math.max(1, runway.clientHeight - stage.offsetHeight);
    const progress = clamp((stickyTop - top) / distance);
    const entry = clamp((window.innerHeight - top) / Math.max(1, window.innerHeight - stickyTop));
    const location = progress * looks.length;
    const index = Math.min(looks.length - 1, Math.floor(location));
    const part = location - index;
    const motionProgress = index === 0 ? entry * .42 + part * .58 : part;
    const look = looks[index];
    look.style.setProperty('--ks-model-zoom', (1.04 - motionProgress * .04).toFixed(3));
    look.style.setProperty('--ks-zoom', (1.01 + motionProgress * .24).toFixed(3));
    look.style.setProperty('--ks-marker-delay', `${-clamp((motionProgress - .12) / .59) * .38}s`);

    if (index === previous) return;
    const focusedLook = document.activeElement?.closest('[data-styling-look]');
    previous = index;
    looks.forEach((look, position) => {
      look.toggleAttribute('data-active', position === index);
      look.setAttribute('aria-hidden', String(position !== index));
    });
    buttons.forEach((button, position) => {
      if (position === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    if (focusedLook && focusedLook !== looks[index]) buttons[index].focus({ preventScroll: true });
  }

  function schedule() {
    if (queued || (!motion.matches && !compactMotion.matches)) return;
    queued = true;
    window.requestAnimationFrame(update);
  }

  function syncLayout() {
    stickyTop = (header?.getBoundingClientRect().height || 0) + 12;
    section.style.setProperty('--ks-sticky-top', `${stickyTop}px`);
    section.toggleAttribute('data-enhanced', motion.matches);
    section.toggleAttribute('data-look-motion', compactMotion.matches);
    nav.hidden = !motion.matches;
    previous = -1;

    if (!motion.matches) looks.forEach(look => look.removeAttribute('aria-hidden'));
    if (compactMotion.matches) {
      compactHeight = Number.parseFloat(getComputedStyle(section, '::before').height) || window.innerHeight;
    }
    schedule();
  }

  nav.addEventListener('click', event => {
    const button = event.target.closest('[data-styling-jump]');
    if (!button || !motion.matches) return;
    const index = Number(button.dataset.stylingJump);
    const distance = runway.clientHeight - stage.offsetHeight;
    const start = window.scrollY + runway.getBoundingClientRect().top - stickyTop;
    window.scrollTo({ top: start + distance * ((index + .53) / looks.length), behavior: 'smooth' });
  });

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', syncLayout);
  motion.addEventListener('change', syncLayout);
  compactMotion.addEventListener('change', syncLayout);
  if (header && 'ResizeObserver' in window) new ResizeObserver(syncLayout).observe(header);
  syncLayout();
})();

(() => {
  const builder = document.querySelector('[data-look-builder]');
  const cart = window.KryvoCart;
  if (!builder || !cart) return;

  const products = cart.getProducts();
  const presets = {
    layer: { title: 'Lagen bauen', slots: { top: 'balenciaga', bottom: 'acne-denim', outer: '' } },
    shape: { title: 'Silhouette formen', slots: { top: '', bottom: 'gmbh', outer: 'jil-sander' } },
    accent: { title: 'Akzent setzen', slots: { top: 'vetements', bottom: 'acne-denim', outer: '' } },
  };
  const options = {
    top: { empty: 'Ohne Oberteil', ids: ['', 'balenciaga', 'vetements', 'akog'] },
    bottom: { empty: 'Ohne Hose', ids: ['', 'acne-denim', 'gmbh'] },
    outer: { empty: 'Ohne Jacke', ids: ['', 'jil-sander', 'acne-jacket', '032c'] },
  };
  const storageKey = 'kryvo.looks.v1';
  const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const selects = [...builder.querySelectorAll('[data-builder-slot]')];
  const heading = builder.querySelector('#ks-builder-title');
  const model = builder.querySelector('[data-builder-model]');
  const preview = builder.querySelector('[data-builder-preview]');
  const total = builder.querySelector('[data-builder-total]');
  const hint = builder.querySelector('[data-builder-hint]');
  const name = builder.querySelector('[data-builder-name]');
  const savedPanel = builder.querySelector('[data-builder-saved]');
  const savedList = builder.querySelector('[data-builder-list]');
  const savedEmpty = builder.querySelector('[data-builder-empty]');
  const savedCount = builder.querySelector('[data-builder-count]');
  const save = builder.querySelector('[data-builder-save]');
  const add = builder.querySelector('[data-builder-add]');
  const status = builder.querySelector('[data-builder-status]');
  let preset = 'layer';
  let editingId = '';
  let opener;
  let saved = readSaved();

  function isValidSelection(slots) {
    if (!slots || typeof slots !== 'object') return false;
    return Object.entries(options).every(([slot, { ids }]) => (
      ids.includes(slots[slot]) && (!slots[slot] || Object.hasOwn(products, slots[slot]))
    ));
  }

  function readSaved(fallback = []) {
    try {
      const records = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(records) ? records.filter(item => (
        item && typeof item.id === 'string' && typeof item.name === 'string'
        && Object.hasOwn(presets, item.preset) && isValidSelection(item.slots)
      )) : fallback;
    } catch {
      return fallback;
    }
  }

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
      return true;
    } catch {
      return false;
    }
  }

  function selection() {
    return Object.fromEntries(selects.map(select => [select.dataset.builderSlot, select.value]));
  }

  function renderPiece(product) {
    const item = document.createElement('li');
    const figure = document.createElement('img');
    const label = document.createElement('div');
    const brand = document.createElement('span');
    const title = document.createElement('strong');
    const price = document.createElement('span');
    figure.src = `assets/${product.image}`;
    figure.alt = '';
    brand.textContent = product.brand;
    title.textContent = product.title;
    price.textContent = currency.format(product.price);
    label.append(brand, title, price);
    item.append(figure, label);
    return item;
  }

  function renderSelection() {
    const active = Object.values(selection()).filter(Boolean).map(id => products[id]);
    const complete = active.length >= 2;
    preview.replaceChildren(...active.map(renderPiece));
    total.textContent = currency.format(active.reduce((sum, product) => sum + product.price, 0));
    add.disabled = !complete;
    save.disabled = !complete;
    hint.hidden = complete;
  }

  function renderSaved() {
    savedEmpty.hidden = saved.length !== 0;
    savedCount.textContent = String(saved.length);
    savedList.replaceChildren(...saved.map(look => {
      const item = document.createElement('li');
      const load = document.createElement('button');
      const remove = document.createElement('button');
      load.type = 'button';
      load.textContent = look.name;
      load.setAttribute('aria-label', `${look.name} laden`);
      load.addEventListener('click', () => {
        loadLook(look.preset, look);
        status.textContent = `„${look.name}“ geladen.`;
        selects[0].focus();
      });
      remove.type = 'button';
      remove.textContent = 'Entfernen';
      remove.setAttribute('aria-label', `${look.name} entfernen`);
      remove.addEventListener('click', () => {
        saved = readSaved(saved).filter(entry => entry.id !== look.id);
        if (editingId === look.id) editingId = '';
        const persisted = persist();
        renderSaved();
        status.textContent = persisted ? `„${look.name}“ entfernt.` : `„${look.name}“ für diese Sitzung entfernt.`;
        savedPanel.querySelector('summary').focus();
      });
      item.append(load, remove);
      return item;
    }));
  }

  function loadLook(key, record) {
    preset = key;
    editingId = record?.id || '';
    model.textContent = `Ausgangslook: ${presets[key].title}`;
    name.value = record?.name || '';
    const slots = record?.slots || presets[key].slots;
    selects.forEach(select => { select.value = slots[select.dataset.builderSlot]; });
    renderSelection();
  }

  selects.forEach(select => {
    const { empty, ids } = options[select.dataset.builderSlot];
    select.replaceChildren(...ids.filter(id => !id || Object.hasOwn(products, id)).map(id => (
      new Option(id ? products[id].title : empty, id)
    )));
    select.addEventListener('change', () => {
      status.textContent = '';
      renderSelection();
    });
  });

  document.querySelectorAll('[data-build-look]').forEach(trigger => {
    trigger.hidden = false;
    trigger.addEventListener('click', () => {
      opener = trigger;
      const key = trigger.dataset.buildLook;
      const showSaved = key === 'saved';
      saved = readSaved(saved);
      renderSaved();
      savedPanel.open = showSaved;
      status.textContent = '';
      loadLook(showSaved ? 'layer' : key);
      builder.showModal();
      builder.scrollTop = 0;
      (showSaved ? savedPanel.querySelector('summary') : heading).focus();
    });
  });

  save.addEventListener('click', () => {
    saved = readSaved(saved);
    const lookName = name.value.trim() || presets[preset].title;
    const id = editingId || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const record = { id, name: lookName, preset, slots: selection() };
    const index = saved.findIndex(look => look.id === id);
    if (index >= 0) saved[index] = record;
    else saved.unshift(record);
    editingId = id;
    name.value = lookName;
    const persisted = persist();
    renderSaved();
    status.textContent = persisted ? `„${lookName}“ gespeichert.` : `„${lookName}“ für diese Sitzung gespeichert.`;
  });

  add.addEventListener('click', () => {
    const { added, skipped } = cart.addProducts(Object.values(selection()).filter(Boolean));
    if (added === 0) status.textContent = 'Die Höchstmenge für diese Teile ist bereits erreicht.';
    else if (skipped) status.textContent = `${added} ${added === 1 ? 'Teil' : 'Teile'} im Warenkorb. Für ${skipped} ist die Höchstmenge erreicht.`;
    else status.textContent = `${added} Teile in den Warenkorb gelegt.`;
  });

  builder.querySelector('[data-builder-close]').addEventListener('click', () => builder.close());
  builder.addEventListener('close', () => {
    opener?.focus({ preventScroll: true });
    opener = null;
  });
})();
