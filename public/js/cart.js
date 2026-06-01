/* ─── Cart Module ────────────────────────────────── */
const CART_KEY = 'ue_cart';

const Cart = {
  get() { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); },
  save(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.updateCartBadge?.();
    Cart._dispatch();
  },
  add(item) {
    const items = Cart.get();
    const existing = items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      items.push({ ...item, quantity: item.quantity || 1 });
    }
    Cart.save(items);
  },
  remove(id) {
    Cart.save(Cart.get().filter(i => i.id !== id));
  },
  setQty(id, qty) {
    const items = Cart.get();
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (qty <= 0) { Cart.remove(id); return; }
    item.quantity = qty;
    Cart.save(items);
  },
  clear() { Cart.save([]); },
  subtotal() {
    return Cart.get().reduce((s, i) => s + i.price * i.quantity, 0);
  },
  tax() { return +(Cart.subtotal() * 0.05).toFixed(2); },
  total() { return +(Cart.subtotal() + Cart.tax()).toFixed(2); },
  count() { return Cart.get().reduce((s, i) => s + i.quantity, 0); },
  restaurantId() {
    const items = Cart.get();
    return items.length ? items[0].restaurantId : null;
  },
  _dispatch() {
    document.dispatchEvent(new CustomEvent('cartUpdated', { detail: Cart.get() }));
  },
};

window.Cart = Cart;
