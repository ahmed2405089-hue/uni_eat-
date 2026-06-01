/* ─── Toast Notifications ─────────────────────────── */
window.toast = {
  _show(type, title, msg, duration = 4000) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const container = document.getElementById('toast-container');
    if (!container) return;

    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.innerHTML = `
      <span class="toast__icon">${icons[type] || '📢'}</span>
      <div class="toast__body">
        <div class="toast__title">${title}</div>
        ${msg ? `<div class="toast__msg">${msg}</div>` : ''}
      </div>
      <span class="toast__close" onclick="this.closest('.toast').remove()">×</span>
    `;
    container.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, duration);
    return t;
  },
  success: (msg, sub) => window.toast._show('success', msg, sub),
  error:   (msg, sub) => window.toast._show('error',   msg, sub),
  warning: (msg, sub) => window.toast._show('warning', msg, sub),
  info:    (msg, sub) => window.toast._show('info',    msg, sub),
};

/* ─── API Helper ─────────────────────────────────── */
window.api = {
  async request(method, url, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  },
  get:    (url)       => window.api.request('GET',    url),
  post:   (url, body) => window.api.request('POST',   url, body),
  put:    (url, body) => window.api.request('PUT',    url, body),
  patch:  (url, body) => window.api.request('PATCH',  url, body),
  delete: (url, body) => window.api.request('DELETE', url, body),
};

/* ─── Logout ─────────────────────────────────────── */
document.addEventListener('click', async (e) => {
  if (e.target.closest('#logout-btn')) {
    try {
      await window.api.post('/api/auth/logout');
    } catch { /* ignore */ }
    window.location.href = '/auth/login';
  }
});

/* ─── Mobile Hamburger ───────────────────────────── */
const hamburger = document.getElementById('hamburger-btn');
const navbarNav = document.getElementById('navbar-nav');
if (hamburger && navbarNav) {
  hamburger.addEventListener('click', () => {
    navbarNav.classList.toggle('open');
    const spans = hamburger.querySelectorAll('span');
    hamburger.classList.toggle('active');
    if (hamburger.classList.contains('active')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
}

/* ─── Sidebar mobile toggle ──────────────────────── */
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

/* ─── Active nav link highlighting ──────────────── */
document.querySelectorAll('[data-nav], [data-sidebar]').forEach(link => {
  if (link.href && window.location.pathname.startsWith(new URL(link.href).pathname) &&
      new URL(link.href).pathname !== '/') {
    link.classList.add('active');
  }
});

/* ─── Scroll animations ──────────────────────────── */
const observer = new IntersectionObserver(
  (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.1 }
);
document.querySelectorAll('[data-anim]').forEach(el => observer.observe(el));

/* ─── Cart badge updater ─────────────────────────── */
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('ue_cart') || '[]');
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const badge = document.getElementById('nav-cart-count');
  if (badge) badge.textContent = count;
}
updateCartBadge();

/* ─── Modal helper ───────────────────────────────── */
window.openModal  = (id) => document.getElementById(id)?.classList.add('open');
window.closeModal = (id) => document.getElementById(id)?.classList.remove('open');

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) e.target.classList.remove('open');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
});

/* ─── Confirm delete helper ──────────────────────── */
window.confirmDelete = (name, cb) => {
  if (confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) cb();
};
