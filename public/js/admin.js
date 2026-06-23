(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  async function api(path, options = {}) {
    const res = await fetch('/api/admin' + path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) {
      window.location.href = res.status === 401 ? '/' : '/builder';
      throw new Error(data.error || 'Access denied');
    }
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  async function loadStats() {
    const stats = await api('/stats');
    const grid = $('#stat-grid');
    grid.innerHTML = `
      <div class="stat-card"><strong>${stats.bots}</strong><span>Bots</span></div>
      <div class="stat-card"><strong>${stats.users}</strong><span>Users</span></div>
      <div class="stat-card"><strong>${stats.messages}</strong><span>Messages</span></div>
      <div class="stat-card"><strong>${stats.conversations}</strong><span>Conversations</span></div>
      <div class="stat-card"><strong>${stats.blogPosts}</strong><span>Blog posts</span></div>`;
  }

  async function loadBots() {
    const bots = await api('/bots');
    $('#bots-table').innerHTML = bots.length
      ? bots
          .map(
            (b) => `<tr>
          <td>${esc(b.name || 'Untitled')}</td>
          <td>${esc(b.product_type)}</td>
          <td><code>${esc(b.owner_id || '—')}</code></td>
          <td>${fmtDate(b.created_at)}</td>
          <td><button class="btn btn-danger btn-sm" data-delete-bot="${b.id}">Delete</button></td>
        </tr>`
          )
          .join('')
      : '<tr><td colspan="5">No bots yet.</td></tr>';
  }

  async function loadUsers() {
    const users = await api('/users');
    $('#users-table').innerHTML = users.length
      ? users
          .map(
            (u) => `<tr>
          <td><div class="user-cell">${u.picture ? `<img src="${esc(u.picture)}" alt="">` : ''}${esc(u.name || '—')}</div></td>
          <td>${esc(u.email)}</td>
          <td>${fmtDate(u.created_at)}</td>
          <td>${fmtDate(u.last_login_at)}</td>
        </tr>`
          )
          .join('')
      : '<tr><td colspan="4">No users yet.</td></tr>';
  }

  async function loadPosts() {
    const posts = await api('/posts');
    $('#posts-table').innerHTML = posts.length
      ? posts
          .map(
            (p) => `<tr>
          <td>${esc(p.title)}</td>
          <td><a href="/blog/${esc(p.slug)}" target="_blank">${esc(p.slug)}</a></td>
          <td>${p.published ? '✅ Published' : '⏸ Draft'}</td>
          <td>${fmtDate(p.updated_at)}</td>
          <td>
            <button class="btn btn-ghost btn-sm" data-toggle-post="${p.id}" data-published="${p.published}">${p.published ? 'Unpublish' : 'Publish'}</button>
            <button class="btn btn-danger btn-sm" data-delete-post="${p.id}">Delete</button>
          </td>
        </tr>`
          )
          .join('')
      : '<tr><td colspan="5">No posts yet.</td></tr>';
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  $$('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.admin-tab').forEach((t) => t.classList.remove('active'));
      $$('.admin-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      $(`#panel-${tab.dataset.tab}`).classList.add('active');
    });
  });

  $('#blog-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/posts', {
        method: 'POST',
        body: JSON.stringify({
          slug: $('#post-slug').value,
          title: $('#post-title').value,
          excerpt: $('#post-excerpt').value,
          content: $('#post-content').value,
          published: $('#post-published').checked,
        }),
      });
      e.target.reset();
      await loadPosts();
      await loadStats();
      alert('Post created!');
    } catch (err) {
      alert(err.message);
    }
  });

  document.addEventListener('click', async (e) => {
    const delBot = e.target.closest('[data-delete-bot]');
    if (delBot) {
      if (!confirm('Delete this bot and all its messages?')) return;
      await api(`/bots/${delBot.dataset.deleteBot}`, { method: 'DELETE' });
      await loadBots();
      await loadStats();
    }

    const togglePost = e.target.closest('[data-toggle-post]');
    if (togglePost) {
      const published = togglePost.dataset.published !== 'true';
      await api(`/posts/${togglePost.dataset.togglePost}`, {
        method: 'PUT',
        body: JSON.stringify({ published }),
      });
      await loadPosts();
    }

    const delPost = e.target.closest('[data-delete-post]');
    if (delPost) {
      if (!confirm('Delete this post?')) return;
      await api(`/posts/${delPost.dataset.deletePost}`, { method: 'DELETE' });
      await loadPosts();
      await loadStats();
    }
  });

  fetch('/auth/me', { credentials: 'same-origin' })
    .then((r) => r.json())
    .then((d) => {
      if (!d.user) return;
      $('#admin-user').textContent = d.user.email;
      $('#user-name').textContent = d.user.name || d.user.email.split('@')[0];
      if (d.user.picture) {
        const av = $('#user-avatar');
        av.src = d.user.picture;
        av.classList.remove('hidden');
      }
    });

  Promise.all([loadStats(), loadBots(), loadUsers(), loadPosts()]).catch((err) => {
    alert(err.message);
  });
})();
