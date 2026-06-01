document.addEventListener('DOMContentLoaded', () => {

  /* ─── Restaurant Search ─────────────────────────── */
  document.getElementById('rest-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#restaurants-table tbody tr').forEach(row => {
      row.style.display = row.dataset.name?.includes(q) ? '' : 'none';
    });
  });

  /* ─── User Search & Role Filter ─────────────────── */
  function filterUsers() {
    const q    = (document.getElementById('user-search')?.value || '').toLowerCase();
    const role = (document.getElementById('role-filter')?.value || '').toLowerCase();
    document.querySelectorAll('#users-table tbody tr').forEach(row => {
      const matchQ    = !q    || row.dataset.name?.includes(q)    || row.dataset.email?.includes(q);
      const matchRole = !role || row.dataset.role === role;
      row.style.display = matchQ && matchRole ? '' : 'none';
    });
  }
  document.getElementById('user-search')?.addEventListener('input', filterUsers);
  document.getElementById('role-filter')?.addEventListener('change', filterUsers);

  /* ─── Order Search & Status Filter ──────────────── */
  function filterOrders() {
    const q      = (document.getElementById('order-search')?.value || '').toLowerCase();
    const status = (document.getElementById('order-status-filter')?.value || '').toLowerCase();
    document.querySelectorAll('#orders-table tbody tr').forEach(row => {
      const matchQ      = !q      || (row.dataset.search || '').toLowerCase().includes(q);
      const matchStatus = !status || row.dataset.status === status;
      row.style.display = matchQ && matchStatus ? '' : 'none';
    });
  }
  document.getElementById('order-search')?.addEventListener('input', filterOrders);
  document.getElementById('order-status-filter')?.addEventListener('change', filterOrders);

  /* ─── Admin Status Select (Orders table) ────────── */
  document.querySelectorAll('.admin-status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const orderId = sel.dataset.orderId;
      const status  = sel.value;
      if (!status) return;
      try {
        await window.api.patch(`/api/orders/${orderId}/status`, { status });
        window.toast?.success(`Order updated to ${status}`);
        const row   = sel.closest('tr');
        const badge = row?.querySelector('.badge');
        if (badge) { badge.className = `badge badge--${status.toLowerCase()}`; badge.textContent = status; }
      } catch (err) { window.toast?.error(err.message); sel.value = ''; }
    });
  });

  /* ─── Restaurant Modal ───────────────────────────── */
  document.getElementById('add-restaurant-btn')?.addEventListener('click', () => {
    document.getElementById('rest-modal-title').textContent = 'Add Restaurant';
    document.getElementById('rest-modal-id').value = '';
    document.getElementById('rest-name').value = '';
    document.getElementById('rest-desc').value = '';
    document.getElementById('rest-delivery').value = '';
    document.getElementById('rest-approved').value = 'true';
    window.openModal('rest-modal');
  });

  document.querySelectorAll('.edit-rest-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('rest-modal-title').textContent = 'Edit Restaurant';
      document.getElementById('rest-modal-id').value = btn.dataset.id;
      document.getElementById('rest-name').value     = btn.dataset.name;
      document.getElementById('rest-desc').value     = btn.dataset.desc;
      document.getElementById('rest-delivery').value = btn.dataset.delivery;
      document.getElementById('rest-approved').value = btn.dataset.approved;
      window.openModal('rest-modal');
    });
  });

  document.getElementById('close-rest-modal')?.addEventListener('click',  () => window.closeModal('rest-modal'));
  document.getElementById('cancel-rest-modal')?.addEventListener('click', () => window.closeModal('rest-modal'));

  document.getElementById('rest-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id       = document.getElementById('rest-modal-id').value;
    const payload  = {
      name:        document.getElementById('rest-name').value.trim(),
      description: document.getElementById('rest-desc').value.trim(),
      deliveryTime: document.getElementById('rest-delivery').value.trim(),
      isApproved:  document.getElementById('rest-approved').value === 'true',
    };
    try {
      if (id) { await window.api.put(`/api/restaurants/${id}`, payload); }
      else    { await window.api.post('/api/restaurants', payload); }
      window.toast?.success(id ? 'Restaurant updated.' : 'Restaurant created.');
      window.closeModal('rest-modal');
      setTimeout(() => location.reload(), 800);
    } catch (err) { window.toast?.error(err.message); }
  });

  document.querySelectorAll('.delete-rest-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.confirmDelete(btn.dataset.name, async () => {
        try {
          await window.api.delete(`/api/restaurants/${btn.dataset.id}`);
          window.toast?.success('Restaurant deleted.');
          btn.closest('tr')?.remove();
        } catch (err) { window.toast?.error(err.message); }
      });
    });
  });

  /* ─── Assign Owner Modal ─────────────────────────── */
  document.querySelectorAll('.assign-owner-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('assign-rest-name').textContent = btn.dataset.name;
      document.getElementById('assign-rest-id').value = btn.dataset.id;
      const sel = document.getElementById('assign-owner-select');
      if (sel && btn.dataset.ownerId) sel.value = btn.dataset.ownerId;
      window.openModal('assign-modal');
    });
  });

  document.getElementById('close-assign-modal')?.addEventListener('click',  () => window.closeModal('assign-modal'));
  document.getElementById('cancel-assign-modal')?.addEventListener('click', () => window.closeModal('assign-modal'));

  document.getElementById('confirm-assign-btn')?.addEventListener('click', async () => {
    const restId  = document.getElementById('assign-rest-id').value;
    const ownerId = document.getElementById('assign-owner-select').value;
    try {
      await window.api.patch(`/api/restaurants/${restId}/assign-owner`, { ownerId: ownerId || null });
      window.toast?.success('Owner assigned successfully.');
      window.closeModal('assign-modal');
      setTimeout(() => location.reload(), 800);
    } catch (err) { window.toast?.error(err.message); }
  });

  /* ─── User Modal ──────────────────────────────────── */
  document.querySelectorAll('.edit-user-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('user-modal-id').value = btn.dataset.id;
      document.getElementById('user-name').value     = btn.dataset.name;
      document.getElementById('user-role').value     = btn.dataset.role;
      document.getElementById('user-active').value   = btn.dataset.active;
      window.openModal('user-modal');
    });
  });

  document.getElementById('close-user-modal')?.addEventListener('click',  () => window.closeModal('user-modal'));
  document.getElementById('cancel-user-modal')?.addEventListener('click', () => window.closeModal('user-modal'));

  document.getElementById('user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('user-modal-id').value;
    try {
      await window.api.patch(`/api/users/${id}`, {
        name:     document.getElementById('user-name').value.trim(),
        role:     document.getElementById('user-role').value,
        isActive: document.getElementById('user-active').value === 'true',
      });
      window.toast?.success('User updated.');
      window.closeModal('user-modal');
      setTimeout(() => location.reload(), 800);
    } catch (err) { window.toast?.error(err.message); }
  });

  document.querySelectorAll('.delete-user-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.confirmDelete(btn.dataset.name, async () => {
        try {
          await window.api.delete(`/api/users/${btn.dataset.id}`);
          window.toast?.success('User deleted.');
          btn.closest('tr')?.remove();
        } catch (err) { window.toast?.error(err.message); }
      });
    });
  });
});
