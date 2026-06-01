document.addEventListener('DOMContentLoaded', () => {

  /* ─── Profile Info Form ──────────────────────────── */
  document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true;
    try {
      await window.api.patch('/api/users/me', {
        name:  document.getElementById('profile-name').value.trim(),
        phone: document.getElementById('profile-phone').value.trim(),
      });
      window.toast?.success('Profile updated!');
    } catch (err) {
      window.toast?.error(err.message);
    } finally { btn.disabled = false; }
  });

  /* ─── Change Password Form ───────────────────────── */
  document.getElementById('pwd-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPwd     = document.getElementById('new-pwd').value;
    const confirmPwd = document.getElementById('confirm-pwd').value;

    if (newPwd !== confirmPwd) { window.toast?.error('Passwords do not match.'); return; }
    if (newPwd.length < 6)     { window.toast?.error('Password must be at least 6 characters.'); return; }

    const btn = document.getElementById('change-pwd-btn');
    btn.disabled = true;
    try {
      await window.api.patch('/api/auth/update-password', {
        currentPassword: document.getElementById('current-pwd').value,
        newPassword:     newPwd,
      });
      window.toast?.success('Password changed!');
      document.getElementById('pwd-form').reset();
    } catch (err) {
      window.toast?.error(err.message);
    } finally { btn.disabled = false; }
  });
});
