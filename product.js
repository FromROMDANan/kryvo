(() => {
  "use strict";

  const dialog = document.querySelector("[data-product-detail]");
  if (!dialog) return;

  const details = {
    balenciaga: {
      fit: "Oversize mit tief sitzender Schulter.",
      condition: "Sichtbare Waschspuren an den Bündchen.",
      look: "Look 01 · Lagen bauen",
      pair: "acne-denim",
      measures: [
        { label: "Brustweite", cm: 66, points: [[28, 47], [73, 47]], marker: [60, 47] },
        { label: "Länge ab Schulter", cm: 72, points: [[39, 24], [39, 92]], marker: [39, 73] },
        { label: "Ärmellänge", cm: 56, points: [[81, 39], [92, 64], [80, 92]], marker: [91, 62] },
      ],
    },
    vetements: {
      fit: "Weiter Rumpf und tief sitzende Ärmel.",
      condition: "Leichte Patina am Reißverschluss.",
      look: "Look 03 · Akzent setzen",
      pair: "acne-jacket",
      measures: [
        { label: "Brustweite", cm: 70, points: [[25, 46], [75, 46]], marker: [61, 46] },
        { label: "Länge ab Schulter", cm: 74, points: [[38, 24], [38, 93]], marker: [38, 74] },
        { label: "Ärmellänge", cm: 60, points: [[81, 38], [92, 65], [79, 93]], marker: [92, 65] },
      ],
    },
    "acne-denim": {
      fit: "Weites Bein mit geradem Verlauf.",
      condition: "Helle Waschung mit weichen Tragespuren.",
      look: "Look 01 · Lagen bauen",
      pair: "balenciaga",
      measures: [
        { label: "Bundweite", cm: 42, points: [[23, 5], [49, 1.5]], marker: [37, 9] },
        { label: "Innenbeinlänge", cm: 78, points: [[44, 31], [40, 62], [46, 94]], marker: [41, 62] },
        { label: "Außenbeinlänge", cm: 108, points: [[49, 2], [73, 39], [96, 82]], marker: [76, 46] },
      ],
    },
    "acne-jacket": {
      fit: "Gerader Schnitt mit Platz für eine Lage darunter.",
      condition: "Leicht ausgeblichene Nähte.",
      look: "Look 03 · Akzent setzen",
      pair: "vetements",
      measures: [
        { label: "Brustweite", cm: 57, points: [[25, 41], [75, 41]], marker: [59, 41] },
        { label: "Länge ab Schulter", cm: 64, points: [[40, 14], [40, 88]], marker: [40, 73] },
        { label: "Ärmellänge", cm: 58, points: [[81, 28], [94, 63], [81, 92]], marker: [93, 61] },
      ],
    },
    "jil-sander": {
      fit: "Gerader Rumpf und definierte Schultern.",
      condition: "Leichte Tragespuren an der Ärmelkante.",
      look: "Look 02 · Silhouette formen",
      pair: "gmbh",
      measures: [
        { label: "Brustweite", cm: 54, points: [[28, 39], [73, 39]], marker: [59, 39] },
        { label: "Länge ab Schulter", cm: 76, points: [[41, 11], [41, 95]], marker: [41, 75] },
        { label: "Ärmellänge", cm: 63, points: [[77, 24], [87, 55], [83, 86]], marker: [86, 60] },
      ],
    },
    gmbh: {
      fit: "Lockeres Bein mit Platz an den Oberschenkeln.",
      condition: "Weiche Knickspuren an den Taschen.",
      look: "Look 02 · Silhouette formen",
      pair: "jil-sander",
      measures: [
        { label: "Bundweite", cm: 44, points: [[25, 7], [52, 2.5]], marker: [39, 11] },
        { label: "Innenbeinlänge", cm: 79, points: [[46, 39], [49, 70], [56, 94]], marker: [50, 70] },
        { label: "Außenbeinlänge", cm: 107, points: [[53, 3], [76, 42], [93, 82]], marker: [76, 42] },
      ],
    },
    "032c": {
      fit: "Leicht weite Silhouette für zusätzliche Lagen.",
      condition: "Feine Knicke im leichten Nylon.",
      look: "Sandton mit Denim",
      pair: "acne-denim",
      measures: [
        { label: "Brustweite", cm: 61, points: [[24, 42], [77, 42]], marker: [59, 42] },
        { label: "Länge ab Schulter", cm: 62, points: [[40, 15], [40, 77]], marker: [40, 64] },
        { label: "Ärmellänge", cm: 57, points: [[80, 36], [90, 61], [75, 88]], marker: [89, 61] },
      ],
    },
    akog: {
      fit: "Kastig und locker über dem Bund.",
      condition: "Leichte Waschspuren am Kragen.",
      look: "Klarer Lagenlook",
      pair: "jil-sander",
      measures: [
        { label: "Brustweite", cm: 58, points: [[27, 37], [74, 37]], marker: [61, 37] },
        { label: "Länge ab Schulter", cm: 73, points: [[41, 10], [41, 94]], marker: [41, 73] },
        { label: "Ärmellänge", cm: 60, points: [[79, 24], [88, 57], [74, 81]], marker: [87, 57] },
      ],
    },
  };

  const image = dialog.querySelector("[data-detail-image]");
  const brand = dialog.querySelector("[data-detail-brand]");
  const title = dialog.querySelector("[data-detail-title]");
  const description = dialog.querySelector("[data-detail-description]");
  const fit = dialog.querySelector("[data-detail-fit]");
  const condition = dialog.querySelector("[data-detail-condition]");
  const pair = dialog.querySelector("[data-detail-pair]");
  const pairName = dialog.querySelector("[data-detail-pair-name]");
  const look = dialog.querySelector("[data-detail-look]");
  const price = dialog.querySelector("[data-detail-price]");
  const add = dialog.querySelector("[data-detail-add]");
  const inquiry = dialog.querySelector("[data-product-inquiry]");
  const draft = dialog.querySelector("[data-detail-draft]");
  const status = dialog.querySelector("[data-detail-status]");
  let opener;

  const measurements = setupMeasurements();

  function setupMeasurements() {
    const photo = document.createElement("div");
    photo.className = "product-detail__photo";
    photo.innerHTML = '<div class="product-measure-overlay" role="group" aria-label="Messpunkte auf dem Produktfoto" hidden></div>';
    image.before(photo);
    photo.prepend(image);
    const overlay = photo.lastElementChild;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "product-measure-toggle";
    toggle.setAttribute("aria-controls", "product-measurements");
    brand.after(toggle);

    const readout = document.createElement("p");
    readout.className = "product-measure-readout";
    readout.setAttribute("role", "status");
    readout.hidden = true;
    toggle.after(readout);

    const panel = document.createElement("div");
    panel.id = "product-measurements";
    panel.className = "product-measure-panel";
    panel.hidden = true;
    panel.innerHTML = `
      <p>Beispielmaße in Zentimetern. Wähle ein Maß, um die Messstrecke im Foto zu sehen.</p>
      <ol class="product-measure-list" aria-label="Beispielmaße"></ol>`;
    fit.closest("dl").after(panel);
    const list = panel.querySelector("ol");
    let measures = [];
    let labels = [];

    function select(index) {
      overlay.querySelectorAll("[data-measure-stroke]").forEach((line) => {
        line.classList.toggle("is-active", Number(line.dataset.measureStroke) === index);
      });
      for (const container of [overlay, list]) {
        container.querySelectorAll("[data-measure-point]").forEach((button) => {
          button.setAttribute("aria-pressed", String(Number(button.dataset.measurePoint) === index));
        });
      }
      const { label } = measures[index];
      const selected = `${label} · ${labels[index]} · Beispielmaß`;
      if (readout.textContent !== selected) readout.textContent = selected;
    }

    function show(visible) {
      overlay.hidden = !visible;
      panel.hidden = !visible;
      readout.hidden = !visible;
      toggle.setAttribute("aria-expanded", String(visible));
      toggle.textContent = visible ? "Maße ausblenden" : "Maße zeigen";
    }

    toggle.addEventListener("click", () => show(panel.hidden));
    for (const container of [overlay, list]) {
      container.addEventListener("click", (event) => {
        const point = event.target.closest("[data-measure-point]");
        if (point) select(Number(point.dataset.measurePoint));
      });
    }

    return {
      render(nextMeasures) {
        measures = nextMeasures;
        const format = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
        labels = measures.map(({ cm }) => `${format.format(cm)} cm`);
        overlay.replaceChildren();
        list.replaceChildren();
        measures.forEach(({ label, points, marker }, index) => {
          for (let part = 1; part < points.length; part++) {
            const start = points[part - 1];
            const dx = points[part][0] - start[0];
            const dy = points[part][1] - start[1];
            const line = document.createElement("span");
            line.className = "product-measure-stroke";
            line.setAttribute("aria-hidden", "true");
            line.dataset.measureStroke = index;
            if (part === 1) line.classList.add("has-start");
            if (part === points.length - 1) line.classList.add("has-end");
            line.style.setProperty("--point-x", `${start[0]}%`);
            line.style.setProperty("--point-y", `${start[1]}%`);
            line.style.setProperty("--stroke-length", `${Math.hypot(dx, dy)}%`);
            line.style.setProperty("--stroke-turn", `${Math.atan2(dy, dx)}rad`);
            overlay.append(line);
          }

          const spot = document.createElement("button");
          spot.type = "button";
          spot.className = "product-measure-point";
          spot.dataset.measurePoint = index;
          spot.setAttribute("aria-label", `${index + 1}. ${label}, ${labels[index]}, Beispielmaß`);
          spot.textContent = index + 1;
          spot.style.setProperty("--point-x", `${marker[0]}%`);
          spot.style.setProperty("--point-y", `${marker[1]}%`);
          overlay.append(spot);

          const item = document.createElement("li");
          item.innerHTML = `<button type="button" data-measure-point="${index}"><span aria-hidden="true">${index + 1}</span><span>${label}</span><strong>${labels[index]}</strong></button>`;
          list.append(item);
        });
        show(false);
        select(0);
      },
    };
  }

  function getCard(key) {
    return document.getElementById(`produkt-${key}`);
  }

  function revealHash(hash) {
    if (!hash.startsWith("#produkt-")) return;
    const card = document.getElementById(hash.slice(1));
    if (!card?.matches("[data-product]") || !card.hidden) return;
    const allFilter = document.querySelector('[data-filter="all"]');
    allFilter?.click();
    return card.hidden ? undefined : card;
  }

  function openDetails(button) {
    const key = button.dataset.productOpen;
    if (!Object.hasOwn(details, key) || dialog.open) return;
    const card = getCard(key);
    if (!card) return;
    const data = details[key];
    const cardImage = card.querySelector(".product-photo img");
    const cardTitle = card.querySelector("h3").textContent.trim();
    const cardBrand = card.querySelector(".product-tape").textContent.trim();
    const pairCard = getCard(data.pair);
    image.src = cardImage.src;
    image.alt = cardImage.alt;
    brand.textContent = cardBrand;
    title.textContent = cardTitle;
    description.textContent = card.querySelector(".product-body p").textContent;
    fit.textContent = data.fit;
    condition.textContent = data.condition;
    measurements.render(data.measures);
    pair.href = `#produkt-${data.pair}`;
    pairName.textContent = pairCard ? `Dazu passt ${pairCard.querySelector("h3").textContent}` : "";
    look.textContent = data.look;
    price.textContent = card.querySelector(".product-buy strong").textContent;
    add.dataset.add = key;
    add.setAttribute("aria-label", `${cardTitle} in den Warenkorb legen`);
    inquiry.open = false;
    draft.value = `Hallo, ich interessiere mich für ${cardTitle} von ${cardBrand}. Welche Maße hat das Stück? Was kostet die Lieferung nach Deutschland und mit welcher Lieferzeit kann ich rechnen? Vielen Dank!`;
    status.textContent = "";
    opener = button;
    dialog.scrollTop = 0;
    dialog.showModal();
  }

  async function copyDraft() {
    if (!draft.value.trim()) {
      status.textContent = "Der Entwurf ist leer.";
      draft.focus();
      return;
    }
    const value = draft.value;
    try {
      await navigator.clipboard.writeText(value);
      status.textContent = "Entwurf kopiert.";
    } catch {
      draft.focus();
      draft.select();
      status.textContent = "Der Entwurf ist markiert. Kopiere ihn mit der Kopierfunktion deines Geräts.";
    }
  }

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("[data-product-open]");
    if (button) {
      openDetails(button);
      return;
    }
    const link = event.target.closest('a[href^="#produkt-"]');
    if (link && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      revealHash(link.hash);
    }
  });

  window.addEventListener("hashchange", () => revealHash(window.location.hash)?.scrollIntoView());

  dialog.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const pairing = event.target.closest("[data-detail-pair]");
    if (pairing && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      opener = null;
      dialog.close();
      return;
    }
    if (event.target.closest("[data-detail-close], [data-detail-add]")) {
      dialog.close();
      return;
    }
    if (event.target.closest("[data-detail-copy]")) {
      void copyDraft();
      return;
    }
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }
  });

  dialog.addEventListener("close", () => {
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });
})();
