document.addEventListener('DOMContentLoaded', () => {

  /* ─── Menu Page ─────────────────────────────────── */
  const restaurantId = window.__RESTAURANT_ID__;

  /* Toggle open/closed */
  document.getElementById('toggle-open-btn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const isOpen = btn.dataset.isOpen === 'true';
    try {
      await window.api.put(`/api/restaurants/${restaurantId}`, { isOpen: !isOpen });
      window.toast?.success(isOpen ? 'Restaurant marked as closed.' : 'Restaurant is now open!');
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      window.toast?.error(err.message);
    }
  });

  /* Modal helpers */
  const modal = document.getElementById('item-modal');
  const openItemModal = (title, data = {}) => {
    if (!modal) return;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-item-id').value  = data.itemId  || '';
    document.getElementById('modal-category').value = data.category || '';
    document.getElementById('modal-name').value     = data.name     || '';
    document.getElementById('modal-price').value    = data.price    || '';
    document.getElementById('modal-desc').value     = data.desc     || '';
    window.openModal('item-modal');
  };

  document.getElementById('add-item-btn')?.addEventListener('click', () =>
    openItemModal('Add Menu Item'));

  document.querySelectorAll('.add-to-category-btn').forEach(btn => {
    btn.addEventListener('click', () =>
      openItemModal('Add Item', { category: btn.dataset.category }));
  });

  document.querySelectorAll('.edit-item-btn').forEach(btn => {
    btn.addEventListener('click', () =>
      openItemModal('Edit Item', {
        itemId:   btn.dataset.itemId,
        category: btn.dataset.category,
        name:     btn.dataset.name,
        price:    btn.dataset.price,
        desc:     btn.dataset.desc,
      }));
  });

  document.querySelectorAll('.delete-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.confirmDelete(btn.dataset.name, async () => {
        try {
          await window.api.delete(`/api/restaurants/${restaurantId}/menu`, {
            category: btn.dataset.category,
            itemId:   btn.dataset.itemId,
          });
          window.toast?.success('Item deleted.');
          setTimeout(() => location.reload(), 800);
        } catch (err) { window.toast?.error(err.message); }
      });
    });
  });

  document.getElementById('close-modal')?.addEventListener('click',  () => window.closeModal('item-modal'));
  document.getElementById('cancel-modal')?.addEventListener('click', () => window.closeModal('item-modal'));

  /* Item form submit */
  document.getElementById('item-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId   = document.getElementById('modal-item-id').value;
    const category = document.getElementById('modal-category').value.trim();
    const name     = document.getElementById('modal-name').value.trim();
    const price    = parseFloat(document.getElementById('modal-price').value);
    const description = document.getElementById('modal-desc').value.trim();

    if (!name || isNaN(price)) { window.toast?.error('Name and price are required.'); return; }

    try {
      if (itemId) {
        await window.api.put(`/api/restaurants/${restaurantId}/menu`, { category, itemId, name, price, description });
      } else {
        await window.api.post(`/api/restaurants/${restaurantId}/menu`, { category, name, price, description });
      }
      window.toast?.success(itemId ? 'Item updated.' : 'Item added.');
      window.closeModal('item-modal');
      setTimeout(() => location.reload(), 800);
    } catch (err) { window.toast?.error(err.message); }
  });

  /* ─── Orders Page ───────────────────────────────── */
  document.querySelectorAll('.update-status-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId   = btn.dataset.orderId;
      const newStatus = btn.dataset.newStatus;
      try {
        await window.api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
        window.toast?.success(`Order marked as ${newStatus}`);
        const row = btn.closest('[data-order-id]');
        if (row) {
          const badge = row.querySelector('.badge');
          if (badge) {
            badge.className = `badge badge--${newStatus.toLowerCase()}`;
            badge.textContent = newStatus;
          }
          const actionsEl = row.querySelector('.order-row__actions');
          if (actionsEl) actionsEl.innerHTML = `<span style="color:var(--clr-text-muted);font-size:var(--text-sm)">${newStatus}</span>`;
        }
      } catch (err) { window.toast?.error(err.message); }
    });
  });

  /* Status filter */
  document.getElementById('status-filter')?.addEventListener('change', (e) => {
    const val = e.target.value.toLowerCase();
    document.querySelectorAll('[data-order-id]').forEach(row => {
      row.style.display = (!val || row.dataset.status.toLowerCase() === val) ? '' : 'none';
    });
  });
});
