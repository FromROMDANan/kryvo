(() => {
  "use strict";

  const dialog = document.querySelector("[data-commerce]");
  if (!dialog) return;

  const products = {
    balenciaga: { brand: "Balenciaga", title: "Verwaschener schwarzer Hoodie", price: 289, image: "hoodie.webp" },
    vetements: { brand: "Vetements", title: "Weinroter Zip-Hoodie", price: 379, image: "zip.webp" },
    "acne-denim": { brand: "Acne Studios", title: "Weite Jeans", price: 219, image: "denim.webp" },
    "acne-jacket": { brand: "Acne Studios", title: "Verwaschene graue Jeansjacke", price: 299, image: "jacket.webp" },
    "jil-sander": { brand: "Jil Sander", title: "Wollblazer", price: 320, image: "blazer.webp" },
    gmbh: { brand: "GmbH", title: "Cargo-Hose", price: 249, image: "cargo.webp" },
    "032c": { brand: "032c", title: "Beige Nylonjacke", price: 269, image: "nylon.webp" },
    akog: { brand: "A Kind of Guise", title: "Boxy Hemd", price: 159, image: "hemd.webp" },
  };
  const storageKey = "kryvo.cart.v1";
  const orderKeyPrefix = "kryvo-orders:";
  const maximumQuantity = 20;
  const currency = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  });

  const heading = dialog.querySelector("#kryvo-commerce-heading");
  const closeButton = dialog.querySelector(".kryvo-commerce__close");
  const cartView = dialog.querySelector("[data-cart-view]");
  const cartEmpty = dialog.querySelector("[data-cart-empty]");
  const cartItems = dialog.querySelector("[data-cart-items]");
  const cartFooter = dialog.querySelector("[data-cart-footer]");
  const cartTotal = dialog.querySelector("[data-cart-total]");
  const checkout = dialog.querySelector("[data-checkout]");
  const checkoutTotal = dialog.querySelector("[data-checkout-total]");
  const checkoutDone = dialog.querySelector("[data-checkout-done]");
  const checkoutSummary = dialog.querySelector("[data-checkout-summary]");
  const checkoutTrack = dialog.querySelector("[data-checkout-track]");
  const checkoutCode = dialog.querySelector("[data-checkout-code]");
  const checkoutTrackingError = dialog.querySelector("[data-checkout-tracking-error]");
  const notice = document.querySelector("[data-cart-notice]");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const productCards = document.querySelectorAll("[data-product][data-category]");
  const catalogCount = document.querySelector("[data-catalog-count]");
  let storageAvailable = true;
  let cart = readCart();
  let view = "cart";
  let opener;
  let noticeTimer;

  function readCart(fallback = {}) {
    if (!storageAvailable) return fallback;
    let value;
    try {
      value = localStorage.getItem(storageKey);
    } catch {
      storageAvailable = false;
      return fallback;
    }
    if (!value) return {};
    try {
      const parsed = JSON.parse(value);
      return Object.fromEntries(
        Object.keys(products).flatMap((id) => {
          const count = parsed?.[id];
          return Number.isInteger(count) && count > 0
            ? [[id, Math.min(count, maximumQuantity)]]
            : [];
        }),
      );
    } catch {
      return fallback;
    }
  }

  function saveCart(nextCart) {
    cart = nextCart;
    try {
      if (storageAvailable) localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
      storageAvailable = false;
    }
    renderCart();
  }

  function itemLabel(count) {
    return `${count} Artikel`;
  }

  function cartAmount() {
    return Object.entries(cart).reduce(
      (total, [id, count]) => total + products[id].price * count,
      0,
    );
  }

  function formatPrice(price) {
    return currency.format(price);
  }

  function renderCart() {
    const active = document.activeElement;
    const activeAction = cartItems.contains(active) ? active.dataset.cartAction : null;
    const activeProduct = active?.dataset.cartProduct;
    const itemCount = Object.values(cart).reduce((total, count) => total + count, 0);
    const total = formatPrice(cartAmount());

    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = itemCount;
    });
    document.querySelectorAll("[data-cart-open]").forEach((button) => {
      button.setAttribute("aria-label", `Warenkorb, ${itemLabel(itemCount)}`);
      button.setAttribute("aria-haspopup", "dialog");
    });
    cartTotal.textContent = total;
    checkoutTotal.textContent = total;
    cartItems.replaceChildren(...Object.entries(cart).map(([id, count]) => renderItem(id, count)));
    cartEmpty.hidden = itemCount > 0;
    cartFooter.hidden = view !== "cart" || itemCount === 0;

    if (!itemCount && view === "checkout") {
      showView("cart", true);
    }

    if (activeAction && dialog.open) {
      const previousControl = [...cartItems.querySelectorAll("[data-cart-action]")].find((button) => (
        button.dataset.cartProduct === activeProduct && button.dataset.cartAction === activeAction
      ));
      (previousControl || cartItems.querySelector("button") || closeButton).focus();
    }
  }

  function renderItem(id, count) {
    const product = products[id];
    const item = document.createElement("li");
    item.className = "kryvo-commerce__item";
    item.innerHTML = `
      <img src="assets/${product.image}" alt="" width="74" height="79">
      <div>
        <p class="kryvo-commerce__item-brand">${product.brand}</p>
        <p class="kryvo-commerce__item-name">${product.title}</p>
        <p class="kryvo-commerce__item-price">${formatPrice(product.price * count)}</p>
        <div class="kryvo-commerce__item-actions">
          <div class="kryvo-commerce__counter">
            <button type="button" data-cart-action="decrease" data-cart-product="${id}" aria-label="${product.title}: Menge verringern">−</button>
            <span aria-label="Menge: ${count}">${count}</span>
            <button type="button" data-cart-action="increase" data-cart-product="${id}" aria-label="${product.title}: Menge erhöhen" aria-disabled="${count >= maximumQuantity}">+</button>
          </div>
          <button type="button" class="kryvo-commerce__link" data-cart-action="remove" data-cart-product="${id}" aria-label="${product.title} entfernen">Entfernen</button>
        </div>
      </div>`;
    return item;
  }

  function showView(nextView, focusHeading = false) {
    view = nextView;
    heading.textContent = {
      cart: "Warenkorb",
      checkout: "Demo-Kasse",
      done: "Demo-Bestellung bestätigt",
    }[view];
    cartView.hidden = view !== "cart";
    checkout.hidden = view !== "checkout";
    checkoutDone.hidden = view !== "done";
    cartFooter.hidden = view !== "cart" || Object.keys(cart).length === 0;
    dialog.scrollTop = 0;
    if (focusHeading) heading.focus();
  }

  function announce(text) {
    if (!notice) return;
    window.clearTimeout(noticeTimer);
    notice.textContent = text;
    notice.classList.add("is-visible");
    noticeTimer = window.setTimeout(() => {
      notice.classList.remove("is-visible");
      notice.textContent = "";
    }, 2200);
  }

  function setFilter(category) {
    let shown = 0;
    filterButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === category));
    });
    productCards.forEach((card) => {
      card.hidden = category !== "all" && !card.dataset.category.split(/\s+/).includes(category);
      if (!card.hidden) shown += 1;
    });
    if (catalogCount) catalogCount.textContent = itemLabel(shown);
  }

  function changeQuantity(nextCart, id, step) {
    if (!Object.hasOwn(products, id)) return false;
    const previousCount = nextCart[id] || 0;
    const count = Math.max(0, Math.min(previousCount + step, maximumQuantity));
    if (count === previousCount) return false;
    if (count > 0) nextCart[id] = count;
    else delete nextCart[id];
    return true;
  }

  function updateItem(id, step) {
    const nextCart = readCart(cart);
    if (!changeQuantity(nextCart, id, step)) return false;
    saveCart(nextCart);
    return true;
  }

  function addProducts(ids) {
    const nextCart = readCart(cart);
    let added = 0;
    ids.forEach((id) => {
      if (changeQuantity(nextCart, id, 1)) added += 1;
    });
    if (added) saveCart(nextCart);
    return { added, skipped: ids.length - added };
  }

  function saveDemoOrder() {
    try {
      let id;
      do {
        const bytes = crypto.getRandomValues(new Uint8Array(4));
        const code = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
        id = `KRYVO-${code.toUpperCase()}`;
      } while (localStorage.getItem(orderKeyPrefix + id));

      const at = new Date().toISOString();
      const order = {
        id,
        local: true,
        status: "received",
        createdAt: at,
        updatedAt: at,
        events: [{ status: "received", at }],
      };
      localStorage.setItem(orderKeyPrefix + id, JSON.stringify(order));
      return id;
    } catch {
      return "";
    }
  }

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const add = event.target.closest("[data-add]");
    const open = event.target.closest("[data-cart-open]");
    const filter = event.target.closest("[data-filter]");

    if (add) {
      const id = add.dataset.add;
      if (!Object.hasOwn(products, id)) return;
      event.preventDefault();
      if (updateItem(id, 1)) announce(`${products[id].title} liegt im Warenkorb. ${itemLabel(cart[id])}.`);
      else announce("Höchstmenge für diesen Artikel erreicht.");
      return;
    }

    if (open) {
      event.preventDefault();
      if (dialog.open) return;
      opener = open;
      cart = readCart(cart);
      renderCart();
      showView("cart");
      dialog.showModal();
      return;
    }

    if (filter) {
      event.preventDefault();
      setFilter(filter.dataset.filter);
    }
  });

  dialog.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
      return;
    }
    if (event.target.closest("[data-cart-close]")) {
      dialog.close();
      return;
    }
    if (event.target.closest("[data-checkout-track]")) {
      opener = null;
      dialog.close();
      return;
    }
    if (event.target.closest("[data-cart-browse]")) {
      const catalog = document.querySelector("#catalog");
      if (catalog) opener = null;
      dialog.close();
      if (catalog) {
        const target = catalog.querySelector("h2") || catalog;
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
        catalog.scrollIntoView();
      }
      return;
    }
    if (event.target.closest("[data-checkout-open]")) {
      showView("checkout", true);
      return;
    }
    if (event.target.closest("[data-checkout-back]")) {
      showView("cart", true);
      return;
    }

    const control = event.target.closest("[data-cart-action]");
    if (!control || control.getAttribute("aria-disabled") === "true") return;
    const { cartProduct, cartAction } = control.dataset;
    const steps = { decrease: -1, increase: 1, remove: -maximumQuantity };
    updateItem(cartProduct, steps[cartAction]);
  });

  dialog.addEventListener("close", () => {
    checkout.reset();
    showView("cart");
    if (opener?.isConnected) opener.focus();
    opener = null;
  });

  checkout.addEventListener("submit", (event) => {
    event.preventDefault();
    if (view !== "checkout") return;
    cart = readCart(cart);
    if (Object.keys(cart).length === 0) {
      renderCart();
      return;
    }
    const delivery = new FormData(checkout).get("delivery");
    checkoutSummary.textContent = `Warenwert ${formatPrice(cartAmount())} · ${delivery}`;
    const orderId = saveDemoOrder();
    checkoutCode.textContent = orderId;
    if (orderId) checkoutTrack.href = `#tracking=${encodeURIComponent(orderId)}`;
    else checkoutTrack.removeAttribute("href");
    checkoutTrack.hidden = !orderId;
    checkoutTrackingError.hidden = Boolean(orderId);
    showView("done", true);
    saveCart({});
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== storageKey) return;
    cart = readCart(cart);
    renderCart();
  });

  window.KryvoCart = Object.freeze({ addProducts, getProducts: () => products });
  setFilter("all");
  renderCart();
})();
