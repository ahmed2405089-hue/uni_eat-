/* Depends on cart.js loaded first */

/* ─── Restaurant Page: Cart Interactions ─────────── */
function initRestaurantPage() {
  const restaurantId = window.__RESTAURANT_ID__;
  if (!restaurantId) return;

  function renderCartSidebar() {
    const items = Cart.get();
    const cartItemsEl   = document.getElementById('cart-items');
    const cartTotals    = document.getElementById('cart-totals');
    const cartPlaceholder = document.getElementById('cart-placeholder');
    const cartEmpty     = document.getElementById('cart-empty');

    if (!cartItemsEl) return;

    const restaurantItems = items.filter(i => i.restaurantId === restaurantId);

    if (restaurantItems.length === 0) {
      if (cartEmpty) cartEmpty.style.display = 'block';
      if (cartTotals) cartTotals.style.display = 'none';
      if (cartPlaceholder) cartPlaceholder.style.display = 'block';
      cartItemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());
      return;
    }

    if (cartEmpty) cartEmpty.style.display = 'none';
    if (cartTotals) cartTotals.style.display = 'block';
    if (cartPlaceholder) cartPlaceholder.style.display = 'none';

    cartItemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());
    restaurantItems.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="cart-item__name">${item.name} <span style="color:var(--clr-text-muted)">×${item.quantity}</span></div>
        <div class="cart-item__price">EGP ${(item.price * item.quantity).toFixed(2)}</div>
        <span class="cart-item__remove" data-id="${item.id}">×</span>
      `;
      div.querySelector('.cart-item__remove').addEventListener('click', () => {
        Cart.remove(item.id);
      });
      cartItemsEl.appendChild(div);
    });

    const sub = restaurantItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = +(sub * 0.05).toFixed(2);
    const total = +(sub + tax).toFixed(2);

    const subEl   = document.getElementById('cart-subtotal');
    const taxEl   = document.getElementById('cart-tax');
    const totalEl = document.getElementById('cart-total');
    if (subEl)   subEl.textContent   = `EGP ${sub.toFixed(2)}`;
    if (taxEl)   taxEl.textContent   = `EGP ${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `EGP ${total.toFixed(2)}`;
  }

  function syncQtyControls() {
    const items = Cart.get();
    document.querySelectorAll('.qty-control').forEach(ctrl => {
      const id = ctrl.dataset.id;
      const item = items.find(i => i.id === id);
      const numEl = document.getElementById(`qty-${id}`);
      if (numEl) numEl.textContent = item ? item.quantity : 0;
    });
  }

  document.addEventListener('cartUpdated', () => {
    renderCartSidebar();
    syncQtyControls();
  });

  document.addEventListener('click', (e) => {
    const incBtn = e.target.closest('.qty-inc');
    const decBtn = e.target.closest('.qty-dec');

    if (incBtn) {
      const id   = incBtn.dataset.id;
      const name = incBtn.dataset.name;
      const price = parseFloat(incBtn.dataset.price);
      const rId  = incBtn.dataset.restaurantId;
      const rName = incBtn.dataset.restaurantName;

      const existingRestId = Cart.restaurantId();
      if (existingRestId && existingRestId !== rId) {
        if (!confirm(`Your cart has items from another restaurant. Clear cart and add this item?`)) return;
        Cart.clear();
      }

      Cart.add({ id, name, price, restaurantId: rId, restaurantName: rName });
      window.toast?.success(`Added ${name}`);
    }

    if (decBtn) {
      const id = decBtn.dataset.id;
      const items = Cart.get();
      const item = items.find(i => i.id === id);
      if (item) Cart.setQty(id, item.quantity - 1);
    }
  });

  document.getElementById('clear-cart-btn')?.addEventListener('click', () => {
    Cart.clear();
    window.toast?.info('Cart cleared');
  });

  renderCartSidebar();
  syncQtyControls();
}

/* ─── Student Home: Search + Filter ─────────────── */
function initStudentHome() {
  const grid = document.getElementById('restaurants-grid');
  const noResults = document.getElementById('no-results');
  if (!grid) return;

  const allCards = [...grid.querySelectorAll('.restaurant-card')];
  const restaurants = window.__RESTAURANTS__ || [];

  function applyFilter(search, filter) {
    let visible = 0;
    allCards.forEach(card => {
      const name = card.querySelector('.restaurant-card__name')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('.restaurant-card__desc')?.textContent.toLowerCase() || '';
      const isOpen = card.dataset.open === 'true';
      const rating = parseFloat(card.dataset.rating || 0);

      const matchSearch = !search || name.includes(search) || desc.includes(search);
      const matchFilter = filter === 'all'
        || (filter === 'open' && isOpen)
        || (filter === 'top'  && rating >= 4)
        || (filter === 'fast');

      if (matchSearch && matchFilter) { card.style.display = ''; visible++; }
      else card.style.display = 'none';
    });
    if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
  }

  let currentFilter = 'all';
  let currentSearch = '';

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      applyFilter(currentSearch, currentFilter);
    });
  });

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    // Prefill from URL param
    const urlSearch = new URLSearchParams(location.search).get('search');
    if (urlSearch) { searchInput.value = urlSearch; currentSearch = urlSearch.toLowerCase(); applyFilter(currentSearch, currentFilter); }

    searchInput.addEventListener('input', () => {
      currentSearch = searchInput.value.trim().toLowerCase();
      applyFilter(currentSearch, currentFilter);
    });
  }

  document.getElementById('search-btn')?.addEventListener('click', () => {
    currentSearch = document.getElementById('search-input')?.value.trim().toLowerCase() || '';
    applyFilter(currentSearch, currentFilter);
  });
}

/* ─── Cart Page ───────────────────────────────────── */
function initCartPage() {
  const content = document.getElementById('cart-content');
  const emptyState = document.getElementById('cart-empty-state');
  const itemsEl = document.getElementById('cart-page-items');
  if (!content) return;

  function render() {
    const items = Cart.get();
    if (items.length === 0) {
      content.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }
    content.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    itemsEl.innerHTML = '';
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-page-item';
      div.innerHTML = `
        <div class="cart-page-item__img" style="display:grid;place-items:center;font-size:2rem;background:var(--clr-bg-3)">🍴</div>
        <div style="flex:1">
          <div class="cart-page-item__name">${item.name}</div>
          <div class="cart-page-item__rest" style="font-size:var(--text-xs);color:var(--clr-text-muted)">${item.restaurantName || ''}</div>
          <div style="display:flex;align-items:center;gap:var(--sp-3);margin-top:var(--sp-2)">
            <div class="qty-control" style="display:flex;align-items:center;gap:var(--sp-2);background:var(--clr-bg-3);border-radius:var(--r-full);padding:4px">
              <button style="width:28px;height:28px;border-radius:50%;background:var(--clr-bg-4);border:none;color:var(--clr-text);cursor:pointer;display:grid;place-items:center" onclick="Cart.setQty('${item.id}', ${item.quantity - 1}); renderCart()">−</button>
              <span style="min-width:24px;text-align:center;font-weight:700;font-size:var(--text-sm)">${item.quantity}</span>
              <button style="width:28px;height:28px;border-radius:50%;background:var(--clr-bg-4);border:none;color:var(--clr-text);cursor:pointer;display:grid;place-items:center" onclick="Cart.setQty('${item.id}', ${item.quantity + 1}); renderCart()">+</button>
            </div>
            <button style="color:var(--clr-danger);background:none;border:none;cursor:pointer;font-size:var(--text-sm)" onclick="Cart.remove('${item.id}'); renderCart()">
              <i class="fa-solid fa-trash"></i> Remove
            </button>
          </div>
        </div>
        <div class="cart-page-item__price">EGP ${(item.price * item.quantity).toFixed(2)}</div>
      `;
      itemsEl.appendChild(div);
    });

    const sub = Cart.subtotal();
    const tax = Cart.tax();
    const total = Cart.total();
    document.getElementById('summary-subtotal').textContent = `EGP ${sub.toFixed(2)}`;
    document.getElementById('summary-tax').textContent      = `EGP ${tax.toFixed(2)}`;
    document.getElementById('summary-total').textContent    = `EGP ${total.toFixed(2)}`;
  }

  window.renderCart = render;
  render();
  document.getElementById('clear-all-btn')?.addEventListener('click', () => { Cart.clear(); render(); });
}

/* ─── Init ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initRestaurantPage();
  initStudentHome();
  initCartPage();
});
