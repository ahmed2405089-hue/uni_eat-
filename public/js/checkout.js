document.addEventListener('DOMContentLoaded', () => {
  const content  = document.getElementById('checkout-content');
  const emptyEl  = document.getElementById('checkout-empty');
  const itemsEl  = document.getElementById('checkout-items');
  const summaryEl = document.getElementById('checkout-summary-items');

  const items = Cart.get();

  if (!items.length) {
    if (content)  content.style.display  = 'none';
    if (emptyEl)  emptyEl.style.display  = 'flex';
    return;
  }

  if (content) content.style.display = 'grid';
  if (emptyEl) emptyEl.style.display = 'none';

  if (itemsEl) {
    itemsEl.innerHTML = '';
    items.forEach(item => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:var(--sp-3) 0;border-bottom:1px solid var(--clr-border)';
      row.innerHTML = `
        <div>
          <div style="font-weight:600;font-size:var(--text-sm)">${item.quantity}× ${item.name}</div>
          <div style="font-size:var(--text-xs);color:var(--clr-text-muted)">${item.restaurantName || ''}</div>
        </div>
        <div style="font-weight:700;color:var(--clr-primary-l)">EGP ${(item.price * item.quantity).toFixed(2)}</div>
      `;
      itemsEl.appendChild(row);
    });
  }

  if (summaryEl) {
    summaryEl.innerHTML = '';
    items.forEach(item => {
      const r = document.createElement('div');
      r.className = 'summary-row';
      r.innerHTML = `<span>${item.quantity}× ${item.name}</span><span>EGP ${(item.price * item.quantity).toFixed(2)}</span>`;
      summaryEl.appendChild(r);
    });
  }

  const sub = Cart.subtotal();
  const tax = Cart.tax();
  const total = Cart.total();
  document.getElementById('checkout-subtotal').textContent = `EGP ${sub.toFixed(2)}`;
  document.getElementById('checkout-tax').textContent      = `EGP ${tax.toFixed(2)}`;
  document.getElementById('checkout-total').textContent    = `EGP ${total.toFixed(2)}`;

  document.getElementById('place-order-btn')?.addEventListener('click', async () => {
    const btn     = document.getElementById('place-order-btn');
    const text    = document.getElementById('place-order-text');
    const spinner = document.getElementById('place-order-spinner');
    const comment = document.getElementById('order-comment')?.value.trim() || '';

    btn.disabled = true;
    if (spinner) spinner.style.display = 'block';
    if (text)    text.style.display = 'none';

    try {
      const restaurantId = Cart.restaurantId();
      const orderItems = items.map(i => ({
        name:         i.name,
        price:        i.price,
        quantity:     i.quantity,
        restaurantId: i.restaurantId,
      }));

      const data = await window.api.post('/api/orders', {
        restaurantId,
        items: orderItems,
        comment,
      });

      Cart.clear();
      window.toast?.success('Order placed!', 'Redirecting to tracking…');
      setTimeout(() => {
        window.location.href = `/student/tracking/${data.data.order._id}`;
      }, 1000);
    } catch (err) {
      window.toast?.error(err.message || 'Failed to place order.');
      btn.disabled = false;
      if (spinner) spinner.style.display = 'none';
      if (text)    text.style.display = 'block';
    }
  });
});
