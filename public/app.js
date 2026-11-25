(() => {
  const PRODUCTS = [
    {
      id: 'tote',
      name: 'Canvas Tote Bag',
      description: 'Heavyweight 12oz organic cotton',
      pricePaise: 49900,
      iconSvg:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1 13H5L6 7z"></path><path d="M9 7V5a3 3 0 0 1 6 0v2"></path></svg>',
    },
    {
      id: 'mug',
      name: 'Ceramic Coffee Mug',
      description: 'Hand-glazed stoneware, 12 oz',
      pricePaise: 29950,
      iconSvg:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" y1="2" x2="6" y2="4"></line><line x1="10" y1="2" x2="10" y2="4"></line><line x1="14" y1="2" x2="14" y2="4"></line></svg>',
    },
  ];

  const MAX_QTY = 99;
  const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const state = {
    cart: {}, // { [productId]: quantity }
    orderPlaced: false,
    orderCounter: 1000,
    confirmedOrder: null,
    lastAddedProductId: null,
    lastInsertedRowId: null,
  };

  const els = {
    productList: document.getElementById('product-list'),
    cartEmpty: document.getElementById('cart-empty'),
    cartTableWrapper: document.getElementById('cart-table-wrapper'),
    cartItems: document.getElementById('cart-items'),
    orderTotal: document.getElementById('order-total'),
    headerCartPill: document.querySelector('.header-cart-pill'),
    headerItemCount: document.getElementById('header-item-count'),
    headerTotalPreview: document.getElementById('header-total-preview'),
    cartCountBadge: document.getElementById('cart-count-badge'),
    clearCartBtn: document.getElementById('clear-cart-btn'),
    summaryItemCount: document.getElementById('summary-item-count'),
    stepSelect: document.getElementById('step-select'),
    stepReview: document.getElementById('step-review'),
    stepConfirm: document.getElementById('step-confirm'),
    form: document.getElementById('checkout-form'),
    customerName: document.getElementById('customer-name'),
    orderNote: document.getElementById('order-note'),
    validationError: document.getElementById('validation-error'),
    placeOrderBtn: document.getElementById('place-order-btn'),
    confirmationRegion: document.getElementById('confirmation-region'),
  };

  function formatMoney(paise) {
    return INR_FORMATTER.format(paise / 100);
  }

  function formatItemCount(count) {
    return `${count} ${count === 1 ? 'item' : 'items'}`;
  }

  function getCartEntries() {
    return PRODUCTS.filter((product) => (state.cart[product.id] || 0) > 0).map((product) => {
      const quantity = state.cart[product.id];
      return {
        product,
        quantity,
        lineTotalPaise: product.pricePaise * quantity,
      };
    });
  }

  function getOrderTotalPaise(entries) {
    return entries.reduce((sum, entry) => sum + entry.lineTotalPaise, 0);
  }

  function getTotalItemCount(entries) {
    return entries.reduce((sum, entry) => sum + entry.quantity, 0);
  }

  function triggerClassAnimation(element, className) {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  function syncSummaryIndicators(entries, animateTotal = false) {
    const totalPaise = getOrderTotalPaise(entries);
    const itemCount = getTotalItemCount(entries);
    const formattedTotal = formatMoney(totalPaise);
    const formattedCount = formatItemCount(itemCount);

    els.orderTotal.textContent = formattedTotal;
    els.headerTotalPreview.textContent = formattedTotal;
    els.headerItemCount.textContent = formattedCount;
    els.cartCountBadge.textContent = formattedCount;
    els.cartCountBadge.className = itemCount > 0 ? 'badge badge-accent' : 'badge badge-neutral';
    els.clearCartBtn.hidden = itemCount === 0;
    els.clearCartBtn.disabled = state.orderPlaced;
    els.summaryItemCount.textContent = String(itemCount);

    if (animateTotal) {
      triggerClassAnimation(els.orderTotal, 'total-pop');
      triggerClassAnimation(els.headerCartPill, 'is-updated');
    }

    if (state.orderPlaced) {
      els.stepSelect.dataset.state = 'done';
      els.stepReview.dataset.state = 'done';
      els.stepConfirm.dataset.state = 'done';
    } else if (itemCount > 0) {
      els.stepSelect.dataset.state = 'done';
      els.stepReview.dataset.state = 'active';
      els.stepConfirm.dataset.state = 'pending';
    } else {
      els.stepSelect.dataset.state = 'active';
      els.stepReview.dataset.state = 'pending';
      els.stepConfirm.dataset.state = 'pending';
    }
  }

  function clearValidationError() {
    els.validationError.textContent = '';
    els.validationError.hidden = true;
    els.customerName.removeAttribute('aria-invalid');
  }

  function showValidationError(message, nameInvalid) {
    els.validationError.textContent = message;
    els.validationError.hidden = false;
    triggerClassAnimation(els.validationError, 'is-shaking');
    if (nameInvalid) {
      els.customerName.setAttribute('aria-invalid', 'true');
    } else {
      els.customerName.removeAttribute('aria-invalid');
    }
  }

  function addItem(productId) {
    if (state.orderPlaced) return;
    const current = state.cart[productId] || 0;
    state.cart[productId] = Math.min(MAX_QTY, current + 1);
    state.lastAddedProductId = productId;
    state.lastInsertedRowId = current === 0 ? productId : null;
    clearValidationError();
    render(true);
  }

  function clearCart() {
    if (state.orderPlaced) return;
    state.cart = {};
    clearValidationError();
    render(true);
  }

  function updateQuantity(productId, nextQty) {
    if (state.orderPlaced) return;
    if (!Number.isInteger(nextQty) || nextQty < 1) return;
    state.cart[productId] = Math.min(MAX_QTY, nextQty);
    clearValidationError();
    render(true);
  }

  function removeItem(productId) {
    if (state.orderPlaced) return;
    delete state.cart[productId];
    clearValidationError();
    render(true);
  }

  function generateOrderReference() {
    state.orderCounter += 1;
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `ORD-${state.orderCounter}-${suffix}`;
  }

  function renderProducts() {
    els.productList.innerHTML = '';
    for (const product of PRODUCTS) {
      const qtyInCart = state.cart[product.id] || 0;

      const card = document.createElement('div');
      card.className =
        state.lastAddedProductId === product.id ? 'product-card is-just-added' : 'product-card';
      card.dataset.testid = `product-${product.id}`;

      const top = document.createElement('div');
      top.className = 'product-top';

      const thumb = document.createElement('div');
      thumb.className = 'product-thumb';
      thumb.setAttribute('aria-hidden', 'true');
      thumb.innerHTML = product.iconSvg;

      const info = document.createElement('div');
      const nameEl = document.createElement('div');
      nameEl.className = 'product-name';
      nameEl.textContent = product.name;

      const descEl = document.createElement('div');
      descEl.className = 'product-desc';
      descEl.textContent = product.description;
      info.append(nameEl, descEl);

      top.append(thumb, info);

      const bottom = document.createElement('div');
      bottom.className = 'product-bottom';

      const priceWrap = document.createElement('div');
      priceWrap.className = 'product-price-wrap';

      const priceEl = document.createElement('div');
      priceEl.className = 'product-price';
      priceEl.textContent = formatMoney(product.pricePaise);
      priceWrap.appendChild(priceEl);

      if (qtyInCart > 0) {
        const inCartEl = document.createElement('div');
        inCartEl.className = 'product-in-cart';
        inCartEl.dataset.productBadge = product.id;
        inCartEl.textContent = `${qtyInCart} in cart`;
        priceWrap.appendChild(inCartEl);
      }

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn btn-outline-primary';
      addBtn.dataset.testid = `add-${product.id}`;
      addBtn.textContent = 'Add to Cart';
      addBtn.disabled = state.orderPlaced;
      addBtn.addEventListener('click', () => addItem(product.id));

      bottom.append(priceWrap, addBtn);
      card.append(top, bottom);
      els.productList.appendChild(card);
    }
  }

  function renderCart(animateTotal = false) {
    const entries = getCartEntries();
    syncSummaryIndicators(entries, animateTotal);

    if (entries.length === 0) {
      els.cartEmpty.hidden = false;
      els.cartTableWrapper.hidden = true;
      els.cartItems.innerHTML = '';
      return;
    }

    els.cartEmpty.hidden = true;
    els.cartTableWrapper.hidden = false;
    els.cartItems.innerHTML = '';

    for (const { product, quantity, lineTotalPaise } of entries) {
      const row = document.createElement('tr');
      if (state.lastInsertedRowId === product.id) {
        row.className = 'cart-row-enter';
      }
      row.dataset.testid = `cart-row-${product.id}`;

      const nameCell = document.createElement('td');
      nameCell.textContent = product.name;

      const unitPriceCell = document.createElement('td');
      unitPriceCell.className = 'tabular';
      unitPriceCell.textContent = formatMoney(product.pricePaise);

      const qtyCell = document.createElement('td');
      const qtyControls = document.createElement('div');
      qtyControls.className = 'qty-controls';

      const decBtn = document.createElement('button');
      decBtn.type = 'button';
      decBtn.className = 'qty-btn';
      decBtn.textContent = '-';
      decBtn.setAttribute('aria-label', `Decrease quantity for ${product.name}`);
      decBtn.dataset.testid = `dec-${product.id}`;
      decBtn.disabled = state.orderPlaced || quantity <= 1;
      decBtn.addEventListener('click', () => {
        updateQuantity(product.id, (state.cart[product.id] || 1) - 1);
      });

      const qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.min = '1';
      qtyInput.max = String(MAX_QTY);
      qtyInput.className = 'qty-input';
      qtyInput.value = String(quantity);
      qtyInput.setAttribute('aria-label', `Quantity for ${product.name}`);
      qtyInput.dataset.testid = `qty-${product.id}`;
      qtyInput.disabled = state.orderPlaced;

      const applyInlineQuantity = (nextQty) => {
        state.cart[product.id] = nextQty;
        const updatedEntries = getCartEntries();
        lineTotalCell.textContent = formatMoney(product.pricePaise * nextQty);
        syncSummaryIndicators(updatedEntries, true);
        const badge = document.querySelector(`[data-product-badge="${product.id}"]`);
        if (badge) {
          badge.textContent = `${nextQty} in cart`;
        }
        decBtn.disabled = state.orderPlaced || nextQty <= 1;
        incBtn.disabled = state.orderPlaced || nextQty >= MAX_QTY;
        clearValidationError();
      };

      qtyInput.addEventListener('input', () => {
        const parsed = Number(qtyInput.value);
        if (Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_QTY) {
          applyInlineQuantity(parsed);
        }
      });
      qtyInput.addEventListener('change', () => {
        const parsed = Math.trunc(Number(qtyInput.value));
        const normalized = Number.isFinite(parsed)
          ? Math.min(MAX_QTY, Math.max(1, parsed))
          : state.cart[product.id] || 1;
        qtyInput.value = String(normalized);
        applyInlineQuantity(normalized);
      });

      const incBtn = document.createElement('button');
      incBtn.type = 'button';
      incBtn.className = 'qty-btn';
      incBtn.textContent = '+';
      incBtn.setAttribute('aria-label', `Increase quantity for ${product.name}`);
      incBtn.dataset.testid = `inc-${product.id}`;
      incBtn.disabled = state.orderPlaced || quantity >= MAX_QTY;
      incBtn.addEventListener('click', () => {
        updateQuantity(product.id, (state.cart[product.id] || 1) + 1);
      });

      qtyControls.append(decBtn, qtyInput, incBtn);
      qtyCell.appendChild(qtyControls);

      const lineTotalCell = document.createElement('td');
      lineTotalCell.className = 'num-col';
      lineTotalCell.dataset.testid = `line-total-${product.id}`;
      lineTotalCell.textContent = formatMoney(lineTotalPaise);

      const actionCell = document.createElement('td');
      actionCell.className = 'action-col';
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-sm btn-danger';
      removeBtn.textContent = 'Remove';
      removeBtn.setAttribute('aria-label', `Remove ${product.name}`);
      removeBtn.dataset.testid = `remove-${product.id}`;
      removeBtn.disabled = state.orderPlaced;
      removeBtn.addEventListener('click', () => removeItem(product.id));
      actionCell.appendChild(removeBtn);

      row.append(nameCell, unitPriceCell, qtyCell, lineTotalCell, actionCell);
      els.cartItems.appendChild(row);
    }
  }

  function renderFormState() {
    els.customerName.disabled = state.orderPlaced;
    els.orderNote.disabled = state.orderPlaced;
    els.placeOrderBtn.disabled = state.orderPlaced;
    els.placeOrderBtn.textContent = state.orderPlaced ? 'Order Placed' : 'Place Order';
  }

  function renderConfirmation() {
    els.confirmationRegion.innerHTML = '';
    if (!state.confirmedOrder) return;

    const { reference, customerName, orderNote, entries, totalPaise } = state.confirmedOrder;

    const card = document.createElement('div');
    card.className = 'confirmation-card';
    card.id = 'order-confirmation';
    card.dataset.testid = 'order-confirmation';
    card.setAttribute('role', 'status');

    const header = document.createElement('div');
    header.className = 'confirmation-header';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'confirmation-icon';
    iconWrap.setAttribute('aria-hidden', 'true');
    iconWrap.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    const confettiVectors = [
      { tx: '-26px', ty: '-22px', color: '#0f6b47' },
      { tx: '26px', ty: '-20px', color: '#2557d6' },
      { tx: '-30px', ty: '8px', color: '#d97706' },
      { tx: '30px', ty: '10px', color: '#0f6b47' },
      { tx: '0px', ty: '-30px', color: '#2557d6' },
      { tx: '14px', ty: '26px', color: '#d97706' },
    ];
    for (const { tx, ty, color } of confettiVectors) {
      const dot = document.createElement('span');
      dot.className = 'confetti-dot';
      dot.style.setProperty('--tx', tx);
      dot.style.setProperty('--ty', ty);
      dot.style.background = color;
      iconWrap.appendChild(dot);
    }

    const titleWrap = document.createElement('div');
    const heading = document.createElement('h2');
    heading.textContent = 'Order Confirmed';
    const subtitle = document.createElement('p');
    subtitle.className = 'confirmation-subtitle';
    subtitle.textContent = 'Thank you for your purchase. Your receipt summary is below.';
    titleWrap.append(heading, subtitle);
    header.append(iconWrap, titleWrap);

    const meta = document.createElement('div');
    meta.className = 'confirmation-meta';

    const refPara = document.createElement('p');
    refPara.className = 'ref-row';
    refPara.innerHTML = '<span>Order Reference:</span> <strong class="ref-badge" data-testid="order-reference"></strong>';
    refPara.querySelector('strong').textContent = reference;

    const copyRefBtn = document.createElement('button');
    copyRefBtn.type = 'button';
    copyRefBtn.className = 'copy-ref-btn';
    copyRefBtn.dataset.testid = 'copy-ref-btn';
    copyRefBtn.textContent = 'Copy';
    copyRefBtn.setAttribute('aria-label', `Copy order reference ${reference}`);
    copyRefBtn.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(reference);
        }
      } catch {
        // Ignore clipboard permission denials in restricted contexts; feedback still confirms action.
      }
      copyRefBtn.textContent = 'Copied!';
      copyRefBtn.classList.add('is-copied');
      window.setTimeout(() => {
        if (copyRefBtn.isConnected) {
          copyRefBtn.textContent = 'Copy';
          copyRefBtn.classList.remove('is-copied');
        }
      }, 1800);
    });
    refPara.appendChild(copyRefBtn);

    const namePara = document.createElement('p');
    namePara.textContent = `Customer: ${customerName}`;

    const totalPara = document.createElement('p');
    totalPara.innerHTML = 'Total Paid: <strong class="tabular" data-testid="confirmed-total"></strong>';
    totalPara.querySelector('strong').textContent = formatMoney(totalPaise);

    meta.append(refPara, namePara, totalPara);

    if (orderNote) {
      const notePara = document.createElement('p');
      notePara.textContent = `Order Note: ${orderNote}`;
      meta.appendChild(notePara);
    }

    const list = document.createElement('ul');
    list.className = 'confirmation-items';
    for (const entry of entries) {
      const li = document.createElement('li');
      li.textContent = `${entry.product.name} x ${entry.quantity} — ${formatMoney(entry.lineTotalPaise)}`;
      list.appendChild(li);
    }

    const newOrderBtn = document.createElement('button');
    newOrderBtn.type = 'button';
    newOrderBtn.className = 'btn';
    newOrderBtn.dataset.testid = 'new-order-btn';
    newOrderBtn.textContent = 'Start New Order';
    newOrderBtn.addEventListener('click', resetOrder);

    card.append(header, meta, list, newOrderBtn);
    els.confirmationRegion.appendChild(card);
  }

  function resetOrder() {
    state.cart = {};
    state.orderPlaced = false;
    state.confirmedOrder = null;
    els.customerName.value = '';
    els.orderNote.value = '';
    clearValidationError();
    render();
  }

  function render(animateTotal = false) {
    renderProducts();
    renderCart(animateTotal);
    renderFormState();
    renderConfirmation();
    state.lastAddedProductId = null;
    state.lastInsertedRowId = null;
  }

  els.clearCartBtn.addEventListener('click', clearCart);

  els.customerName.addEventListener('input', () => {
    if (els.customerName.value.trim() !== '') {
      els.customerName.removeAttribute('aria-invalid');
    }
  });

  els.form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Synchronous idempotency guard prevents duplicate confirmations on rapid double-clicks.
    if (state.orderPlaced) {
      return;
    }

    const entries = getCartEntries();
    const customerName = els.customerName.value.trim();
    const orderNote = els.orderNote.value.trim();
    const cartEmpty = entries.length === 0;
    const nameMissing = customerName.length === 0;

    if (cartEmpty && nameMissing) {
      showValidationError(
        'Your cart is empty and Full Name is required. Add at least one item and enter your name to place your order.',
        true
      );
      return;
    }

    if (cartEmpty) {
      showValidationError(
        'Your cart is empty. Please add at least one item before placing your order.',
        false
      );
      return;
    }

    if (nameMissing) {
      showValidationError(
        'Full Name is required. Please enter your name before placing your order.',
        true
      );
      els.customerName.focus();
      return;
    }

    state.orderPlaced = true;
    clearValidationError();
    state.confirmedOrder = {
      reference: generateOrderReference(),
      customerName,
      orderNote,
      entries,
      totalPaise: getOrderTotalPaise(entries),
    };
    render();
    els.confirmationRegion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  render();
})();
