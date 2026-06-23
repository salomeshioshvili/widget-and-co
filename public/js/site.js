(function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const menuBtn = document.getElementById('user-menu-btn');
  const dropdown = document.getElementById('user-dropdown');
  if (menuBtn && dropdown) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
      menuBtn.setAttribute('aria-expanded', String(!dropdown.classList.contains('hidden')));
    });
    document.addEventListener('click', () => {
      dropdown.classList.add('hidden');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  }

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' });
      window.location.href = '/';
    });
  }

  const loginError = document.getElementById('login-error');
  if (loginError && new URLSearchParams(location.search).get('error')) {
    loginError.classList.remove('hidden');
  }
})();
