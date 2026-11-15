(() => {
  const section = document.querySelector('[data-warehouse]');
  if (!section) return;

  const choices = section.querySelector('[data-warehouse-choices]');
  const buttons = [...choices.querySelectorAll('[data-warehouse-tab]')];
  const panels = [...section.querySelectorAll('[data-warehouse-panel]')];

  function showPhoto(name) {
    for (const panel of panels) panel.hidden = panel.dataset.warehousePanel !== name;
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.warehouseTab === name));
    }
  }

  choices.addEventListener('click', event => {
    const button = event.target.closest('[data-warehouse-tab]');
    if (button) showPhoto(button.dataset.warehouseTab);
  });

  choices.addEventListener('keydown', event => {
    const button = event.target.closest('[data-warehouse-tab]');
    if (!button || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const step = event.key === 'ArrowLeft' ? -1 : 1;
    const next = buttons[(buttons.indexOf(button) + step + buttons.length) % buttons.length];
    next.focus();
    showPhoto(next.dataset.warehouseTab);
  });

  section.setAttribute('data-enhanced', '');
  showPhoto(buttons[0].dataset.warehouseTab);
  choices.hidden = false;
})();
