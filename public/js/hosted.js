(function () {
  const botId = document.body.dataset.botId;
  const isStatic = document.body.dataset.static === 'true';
  if (!botId) return;

  let conversationId = null;

  function addMsg(role, content) {
    const el = document.createElement('div');
    el.className = `hosted-bubble ${role}`;
    el.textContent = content;
    document.getElementById('hosted-messages').appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  async function loadStatic() {
    const box = document.getElementById('hosted-static');
    const res = await fetch(`/api/bots/${botId}`);
    const bot = await res.json();
    let summary = bot.config?.summary;
    if (!summary) {
      const buildRes = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId }),
      });
      const data = await buildRes.json();
      summary = data.summary;
    }
    const sentiment = (summary.sentiment || 'mixed').toLowerCase();
    const themes = (summary.themes || []).map((t) => `<li>${esc(t)}</li>`).join('');
    box.innerHTML = `
      <span class="sentiment ${sentiment}">${esc(summary.sentiment || 'mixed')}</span>
      <p>${esc(summary.summary || '')}</p>
      ${themes ? `<ul>${themes}</ul>` : ''}`;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  if (isStatic) {
    loadStatic().catch(() => {
      document.getElementById('hosted-static').innerHTML = '<p>Unable to load.</p>';
    });
    return;
  }

  addMsg('assistant', 'Hi! How can I help you today?');

  document.getElementById('hosted-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('hosted-input');
    const message = input.value.trim();
    if (!message) return;
    input.value = '';
    addMsg('user', message);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId, message, conversationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      conversationId = data.conversationId;
      addMsg('assistant', data.reply);
    } catch {
      addMsg('assistant', 'Sorry, something went wrong. Please try again.');
    }
    input.focus();
  });
})();
