(() => {
  const section = document.querySelector('[data-tracking]');
  if (!section) return;

  const form = section.querySelector('[data-tracking-form]');
  const input = form.elements.tracking;
  const message = form.querySelector('[data-tracking-message]');
  const result = section.querySelector('[data-tracking-result]');
  const reference = result.querySelector('[data-tracking-reference]');
  const headline = result.querySelector('[data-tracking-status]');
  const note = result.querySelector('[data-tracking-note]');
  const stages = [...result.querySelectorAll('[data-tracking-stage]')];
  const stageKeys = stages.map(stage => stage.dataset.trackingStage);
  const dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
  const storagePrefix = 'kryvo-orders:';
  const example = {
    id: 'KRYVO-DEMO',
    status: 'shipping',
    events: [
      { status: 'received', at: '2026-01-12T09:00:00+01:00' },
      { status: 'preparing', at: '2026-01-13T14:20:00+01:00' },
      { status: 'photographed', at: '2026-01-14T12:45:00+01:00' },
      { status: 'shipping', at: '2026-01-15T11:10:00+01:00' },
    ],
  };

  function normalize(value) {
    return value.trim().toUpperCase().replace(/[‐‑‒–—―]/g, '-').replace(/\s+/g, '');
  }

  function showMessage(text, isAnnouncement = false) {
    message.toggleAttribute('data-announcement', isAnnouncement);
    message.textContent = text;
  }

  function showError(text) {
    result.hidden = true;
    input.setAttribute('aria-invalid', 'true');
    showMessage(text);
  }

  function isValidDate(value) {
    return typeof value === 'string' && Number.isFinite(Date.parse(value));
  }

  function getStatusDates(record) {
    const dates = new Map();
    const events = Array.isArray(record.events) ? record.events : [];
    for (const event of events) {
      if (!stageKeys.includes(event?.status) || !isValidDate(event.at)) continue;
      const previous = dates.get(event.status);
      if (!previous || Date.parse(event.at) > Date.parse(previous)) dates.set(event.status, event.at);
    }
    if (!dates.has('received') && isValidDate(record.createdAt)) dates.set('received', record.createdAt);
    if (!dates.has(record.status) && isValidDate(record.updatedAt)) dates.set(record.status, record.updatedAt);
    return dates;
  }

  function showResult(record, isExample) {
    const currentIndex = stageKeys.indexOf(record.status);
    const dates = getStatusDates(record);
    const statusLabel = stages[currentIndex].querySelector('.kr-tracking__step-title').textContent;
    reference.textContent = isExample ? `Beispiel · ${record.id}` : record.id;
    headline.textContent = statusLabel;
    if (isExample) {
      note.textContent = 'Beispielansicht mit fiktiven Versanddaten. Das Paket ist auf dem Weg von China nach Deutschland.';
    } else if (record.local === true && record.status === 'received') {
      note.textContent = 'Anfrage auf diesem Gerät gespeichert. Das Speichern sendet keine Nachricht an KRYVO.';
    } else {
      note.textContent = 'Der Tracker zeigt den auf diesem Gerät gespeicherten Stand.';
    }

    stages.forEach((stage, index) => {
      if (currentIndex === index) stage.setAttribute('aria-current', 'step');
      else stage.removeAttribute('aria-current');
      stage.toggleAttribute('data-complete', index < currentIndex);
      const time = stage.querySelector('time');
      const date = dates.get(stage.dataset.trackingStage);
      const hasDate = Boolean(date) && index <= currentIndex;
      time.hidden = !hasDate;
      if (hasDate) {
        time.dateTime = date;
        time.textContent = dateFormat.format(new Date(date));
      } else {
        time.removeAttribute('datetime');
        time.textContent = '';
      }
    });

    input.removeAttribute('aria-invalid');
    result.hidden = false;
    showMessage(`${record.id}. Aktueller Status: ${statusLabel}.`, true);
  }

  function lookup(rawValue) {
    const id = normalize(rawValue);
    input.value = id;
    if (id === example.id) {
      showResult(example, true);
      return;
    }

    if (!/^KRYVO-[A-F0-9]{8}$/.test(id)) {
      showError('Gib deine KRYVO-Nummer ein oder wähle das Beispiel.');
      return;
    }

    let stored;
    try {
      stored = localStorage.getItem(storagePrefix + id);
    } catch {
      showError('Der lokale Speicher ist in diesem Browser gerade nicht verfügbar.');
      return;
    }

    let record;
    try {
      record = JSON.parse(stored);
    } catch {
      record = null;
    }

    if (typeof record?.id !== 'string' || normalize(record.id) !== id || !stageKeys.includes(record.status)) {
      showError('Zu dieser Nummer wurde auf diesem Gerät kein Eintrag gefunden.');
      return;
    }

    showResult(record, false);
  }

  function followHash() {
    const prefix = '#tracking=';
    if (!window.location.hash.startsWith(prefix)) return;
    let number;
    try {
      number = decodeURIComponent(window.location.hash.slice(prefix.length));
    } catch {
      number = '';
    }
    lookup(number);
    section.scrollIntoView({ block: 'start' });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    lookup(input.value);
  });
  form.querySelector('[data-tracking-example]').addEventListener('click', () => lookup(example.id));
  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    showMessage('');
    result.hidden = true;
  });
  window.addEventListener('hashchange', followHash);
  followHash();
})();
