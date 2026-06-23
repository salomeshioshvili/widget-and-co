(function () {
  const $ = (s) => document.querySelector(s);

  async function api(path) {
    const res = await fetch('/api' + path, { credentials: 'same-origin' });
    const data = await res.json();
    if (res.status === 401) {
      window.location.href = '/';
      throw new Error('Sign in required');
    }
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const TYPE_LABELS = {
    chatbot: 'Chatbot',
    quiz: 'Product Quiz',
    lead_qualifier: 'Lead Qualifier',
    faq_search: 'FAQ Search',
    review_summarizer: 'Review Summarizer',
  };

  async function loadUser() {
    const res = await fetch('/auth/me', { credentials: 'same-origin' });
    if (!res.ok) return (window.location.href = '/');
    const { user, isAdmin } = await res.json();
    $('#user-name').textContent = user.name || user.email.split('@')[0];
    if (user.picture) {
      const av = $('#user-avatar');
      av.src = user.picture;
      av.classList.remove('hidden');
    }
    if (isAdmin) {
      const adminTab = document.getElementById('admin-nav-link');
      if (adminTab) adminTab.classList.remove('hidden');
    }
  }

  async function loadBots() {
    const bots = await api('/my/bots');
    if (!bots.length) {
      $('#dashboard-empty').classList.remove('hidden');
      $('#dashboard-list').innerHTML = '';
      return;
    }
    $('#dashboard-empty').classList.add('hidden');
    $('#dashboard-list').innerHTML = bots
      .map(
        (b) => `
      <article class="dashboard-card" data-id="${b.id}">
        <div class="dashboard-card-top">
          <h3>${esc(b.name || 'Untitled')}</h3>
          <span class="dashboard-badge">${esc(TYPE_LABELS[b.product_type] || b.product_type)}</span>
        </div>
        <p class="dashboard-meta">Created ${fmtDate(b.created_at)}</p>
        <div class="dashboard-mini-stats">
          <span><strong>${b.visitorMessages}</strong> messages</span>
          <span><strong>${b.conversations}</strong> chats</span>
          ${b.product_type === 'lead_qualifier' ? `<span><strong>${b.hotLeads}</strong> hot leads</span>` : ''}
        </div>
        <div class="dashboard-card-actions">
          <a href="${esc(b.shareUrl)}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">Open link</a>
          <button type="button" class="btn btn-primary btn-sm" data-view="${b.id}">View details</button>
        </div>
      </article>`
      )
      .join('');
  }

  async function showDetail(id) {
    const bot = await api(`/my/bots/${id}`);
    $('#dashboard-list').classList.add('hidden');
    $('#dashboard-detail').classList.remove('hidden');

    $('#detail-name').textContent = bot.name || 'Untitled';
    $('#detail-type').textContent = TYPE_LABELS[bot.product_type] || bot.product_type;

    $('#detail-stats').innerHTML = `
      <div class="stat-card"><strong>${bot.visitorMessages}</strong><span>Messages</span></div>
      <div class="stat-card"><strong>${bot.conversations}</strong><span>Conversations</span></div>
      ${bot.product_type === 'lead_qualifier' ? `<div class="stat-card"><strong>${bot.hotLeads}</strong><span>Hot leads</span></div>` : ''}`;

    $('#detail-share-url').value = bot.shareUrl;
    $('#detail-embed').textContent = bot.embedSnippet;

    const userMsgs = (bot.messages || []).filter((m) => m.role === 'user');
    $('#detail-messages').innerHTML = userMsgs.length
      ? userMsgs
          .map(
            (m) => `<div class="visitor-msg">
          <span class="time">${new Date(m.created_at).toLocaleString()}</span>
          <div class="role">Visitor</div>${esc(m.content)}</div>`
          )
          .join('')
      : '<div class="empty-state">No visitor messages yet. Share your link to get started!</div>';
  }

  $('#dashboard-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (btn) showDetail(btn.dataset.view);
  });

  $('#btn-back-list').addEventListener('click', () => {
    $('#dashboard-detail').classList.add('hidden');
    $('#dashboard-list').classList.remove('hidden');
  });

  $('#btn-copy-share').addEventListener('click', async () => {
    await navigator.clipboard.writeText($('#detail-share-url').value);
    $('#btn-copy-share').textContent = 'Copied!';
    setTimeout(() => ($('#btn-copy-share').textContent = 'Copy link'), 2000);
  });

  $('#btn-copy-embed').addEventListener('click', async () => {
    await navigator.clipboard.writeText($('#detail-embed').textContent);
    $('#btn-copy-embed').textContent = 'Copied!';
    setTimeout(() => ($('#btn-copy-embed').textContent = 'Copy embed'), 2000);
  });

  loadUser()
    .then(() => loadBots())
    .catch((err) => alert(err.message));
})();
