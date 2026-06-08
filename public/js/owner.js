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
    const imgInput = document.getElementById('modal-image');
    if (imgInput) imgInput.value = '';
    document.getElementById('item-image-preview').style.display = 'none';
    window.openModal('item-modal');
  };

  document.getElementById('modal-image')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById('item-img-thumb').src = ev.target.result;
      document.getElementById('item-image-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

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

  /* Item form submit — uses FormData to support optional image upload */
  document.getElementById('item-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId      = document.getElementById('modal-item-id').value;
    const category    = document.getElementById('modal-category').value.trim();
    const name        = document.getElementById('modal-name').value.trim();
    const price       = parseFloat(document.getElementById('modal-price').value);
    const description = document.getElementById('modal-desc').value.trim();
    const imgFile     = document.getElementById('modal-image')?.files[0];

    if (!name || isNaN(price)) { window.toast?.error('Name and price are required.'); return; }

    const formData = new FormData();
    formData.append('category',    category);
    formData.append('name',        name);
    formData.append('price',       price);
    formData.append('description', description);
    if (itemId)  formData.append('itemId', itemId);
    if (imgFile) formData.append('image',  imgFile);

    try {
      const method = itemId ? 'PUT' : 'POST';
      const res    = await fetch(`/api/restaurants/${restaurantId}/menu`, { method, body: formData, credentials: 'include' });
      const data   = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      window.toast?.success(itemId ? 'Item updated.' : 'Item added.');
      window.closeModal('item-modal');
      setTimeout(() => location.reload(), 800);
    } catch (err) { window.toast?.error(err.message); }
  });

  /* ─── Orders Page ───────────────────────────────── */

  function nextActionButtons(orderId, status) {
    const id = orderId;
    if (status === 'Pending') return `
      <button class="btn btn--success btn--sm update-status-btn" data-order-id="${id}" data-new-status="Confirmed">
        <i class="fa-solid fa-check"></i> Confirm
      </button>
      <button class="btn btn--danger btn--sm update-status-btn" data-order-id="${id}" data-new-status="Cancelled">
        <i class="fa-solid fa-xmark"></i> Reject
      </button>`;
    if (status === 'Confirmed') return `
      <button class="btn btn--primary btn--sm update-status-btn" data-order-id="${id}" data-new-status="Preparing">
        <i class="fa-solid fa-fire-burner"></i> Start Preparing
      </button>`;
    if (status === 'Preparing') return `
      <button class="btn btn--accent btn--sm update-status-btn" data-order-id="${id}" data-new-status="Ready">
        <i class="fa-solid fa-bell"></i> Mark Ready
      </button>`;
    if (status === 'Ready') return `
      <button class="btn btn--success btn--sm update-status-btn" data-order-id="${id}" data-new-status="Completed">
        <i class="fa-solid fa-circle-check"></i> Complete
      </button>`;
    return `<span style="color:var(--clr-text-muted);font-size:var(--text-sm)">${status}</span>`;
  }

  /* Event delegation — works for dynamically added buttons too */
  document.getElementById('orders-list')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.update-status-btn');
    if (!btn) return;

    const orderId   = btn.dataset.orderId;
    const newStatus = btn.dataset.newStatus;
    btn.disabled = true;

    try {
      await window.api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      window.toast?.success(`Order marked as ${newStatus}`);

      const row = btn.closest('[data-order-id]');
      if (row) {
        row.dataset.status = newStatus;
        const badge = row.querySelector('.badge');
        if (badge) { badge.className = `badge badge--${newStatus.toLowerCase()}`; badge.textContent = newStatus; }
        const actionsEl = row.querySelector('.order-row__actions');
        if (actionsEl) actionsEl.innerHTML = nextActionButtons(orderId, newStatus);
      }
    } catch (err) {
      window.toast?.error(err.message);
      btn.disabled = false;
    }
  });

  /* Status filter */
  document.getElementById('status-filter')?.addEventListener('change', (e) => {
    const val = e.target.value.toLowerCase();
    document.querySelectorAll('[data-order-id]').forEach(row => {
      row.style.display = (!val || row.dataset.status.toLowerCase() === val) ? '' : 'none';
    });
  });
});
