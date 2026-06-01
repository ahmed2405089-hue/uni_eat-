/* ─── Role Tab Selection ─────────────────────────── */
const roleTabs = document.querySelectorAll('.role-tab');
const selectedRole = document.getElementById('selected-role');
roleTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    roleTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (selectedRole) selectedRole.value = tab.dataset.role;
  });
});

/* ─── Password Visibility Toggle ────────────────── */
document.querySelectorAll('[id^="toggle-pwd"]').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.closest('.input-icon-wrap').querySelector('input[type="password"], input[type="text"]');
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.classList.toggle('fa-eye', !isHidden);
    btn.classList.toggle('fa-eye-slash', isHidden);
  });
});

/* ─── Password Strength ──────────────────────────── */
const pwdInput = document.getElementById('password');
const pwdFill  = document.getElementById('pwd-fill');
const pwdLabel = document.getElementById('pwd-label');
if (pwdInput && pwdFill) {
  pwdInput.addEventListener('input', () => {
    const v = pwdInput.value;
    let strength = 0;
    if (v.length >= 6)  strength++;
    if (v.length >= 10) strength++;
    if (/[A-Z]/.test(v) && /[0-9]/.test(v)) strength++;
    if (/[^A-Za-z0-9]/.test(v)) strength++;

    const map = { 0: ['0%', '', 'Enter a password'], 1: ['30%', 'weak', 'Weak'], 2: ['60%', 'medium', 'Medium'], 3: ['80%', 'medium', 'Good'], 4: ['100%', 'strong', 'Strong'] };
    const [w, cls, lbl] = map[strength] || map[0];
    pwdFill.style.width = w;
    pwdFill.className = 'pwd-bar__fill' + (cls ? ' ' + cls : '');
    if (pwdLabel) pwdLabel.textContent = lbl;
  });
}

/* ─── Alert helper ───────────────────────────────── */
function showAlert(msg, type = 'error') {
  const el = document.getElementById('auth-alert');
  const msgEl = document.getElementById('auth-alert-msg');
  if (!el) return;
  el.className = `auth-alert auth-alert--${type}`;
  if (msgEl) msgEl.textContent = msg; else el.textContent = msg;
  el.style.display = 'flex';
}
function hideAlert() {
  const el = document.getElementById('auth-alert');
  if (el) el.style.display = 'none';
}

/* ─── Login Form ─────────────────────────────────── */
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    const btn = document.getElementById('login-btn');
    const spinner = document.getElementById('login-spinner');
    const text = document.getElementById('login-btn-text');

    btn.disabled = true;
    if (spinner) spinner.style.display = 'block';
    if (text)    text.style.display = 'none';

    try {
      const data = await window.api.post('/api/auth/login', {
        email:    document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
      });

      const role = data.data.user.role;
      const redirects = { admin: '/admin/dashboard', owner: '/owner/dashboard', student: '/student/home' };
      window.location.href = redirects[role] || '/';
    } catch (err) {
      showAlert(err.message || 'Login failed. Please check your credentials.');
      btn.disabled = false;
      if (spinner) spinner.style.display = 'none';
      if (text)    text.style.display = 'block';
    }
  });
}

/* ─── Register Form ──────────────────────────────── */
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    const btn = document.getElementById('register-btn');
    const spinner = document.getElementById('register-spinner');
    const text = document.getElementById('register-btn-text');

    const password = document.getElementById('password').value;
    if (password.length < 6) {
      showAlert('Password must be at least 6 characters.');
      return;
    }

    btn.disabled = true;
    if (spinner) spinner.style.display = 'block';
    if (text)    text.style.display = 'none';

    try {
      const data = await window.api.post('/api/auth/register', {
        name:     document.getElementById('name').value.trim(),
        email:    document.getElementById('email').value.trim(),
        password,
        role:     document.getElementById('selected-role')?.value || 'student',
      });

      const role = data.data.user.role;
      const redirects = { admin: '/admin/dashboard', owner: '/owner/dashboard', student: '/student/home' };
      window.location.href = redirects[role] || '/';
    } catch (err) {
      showAlert(err.message || 'Registration failed. Please try again.');
      btn.disabled = false;
      if (spinner) spinner.style.display = 'none';
      if (text)    text.style.display = 'block';
    }
  });
}

/* ─── Forgot Password Form ───────────────────────── */
const forgotForm = document.getElementById('forgot-form');
if (forgotForm) {
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('forgot-btn');
    const alertEl = document.getElementById('auth-alert');
    btn.disabled = true;
    try {
      await window.api.post('/api/auth/forgot-password', {
        email: document.getElementById('email').value.trim(),
      });
      if (alertEl) {
        alertEl.className = 'auth-alert auth-alert--success';
        alertEl.innerHTML = '<i class="fa-solid fa-check-circle"></i> Reset link sent! Check your email.';
        alertEl.style.display = 'flex';
      }
    } catch (err) {
      showAlert(err.message || 'Could not send reset email.');
      btn.disabled = false;
    }
  });
}
