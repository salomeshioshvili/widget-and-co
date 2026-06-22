(function () {
  const script = document.currentScript;
  if (!script) return;

  const botId = script.getAttribute('data-bot-id');
  if (!botId) {
    console.error('[AI Widget] Missing data-bot-id attribute');
    return;
  }

  const apiBase = script.src.replace(/\/widget\.js.*$/, '');

  const styles = `
    #aiw-container * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #aiw-bubble {
      position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px;
      border-radius: 50%; background: #4f46e5; color: #fff; border: none;
      cursor: pointer; box-shadow: 0 4px 20px rgba(79,70,229,0.4);
      font-size: 24px; z-index: 99998; display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s;
    }
    #aiw-bubble:hover { transform: scale(1.08); }
    #aiw-panel {
      position: fixed; bottom: 92px; right: 24px; width: 360px; max-width: calc(100vw - 48px);
      height: 480px; max-height: calc(100vh - 120px); background: #fff; border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.15); z-index: 99999; display: none;
      flex-direction: column; overflow: hidden; border: 1px solid #e2e8f0;
    }
    #aiw-panel.open { display: flex; }
    #aiw-header {
      padding: 14px 16px; background: #4f46e5; color: #fff; font-weight: 600;
      font-size: 15px; display: flex; justify-content: space-between; align-items: center;
    }
    #aiw-close { background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; line-height: 1; }
    #aiw-messages {
      flex: 1; overflow-y: auto; padding: 12px; background: #f8fafc;
      display: flex; flex-direction: column; gap: 8px;
    }
    .aiw-msg {
      max-width: 85%; padding: 8px 12px; border-radius: 12px; font-size: 14px; line-height: 1.45;
    }
    .aiw-msg.user { align-self: flex-end; background: #4f46e5; color: #fff; border-bottom-right-radius: 4px; }
    .aiw-msg.assistant { align-self: flex-start; background: #fff; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }
    #aiw-form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #e2e8f0; background: #fff; }
    #aiw-input {
      flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none;
    }
    #aiw-input:focus { border-color: #4f46e5; }
    #aiw-send {
      padding: 8px 14px; background: #4f46e5; color: #fff; border: none; border-radius: 8px;
      font-weight: 600; font-size: 13px; cursor: pointer;
    }
    #aiw-send:disabled { opacity: 0.5; cursor: not-allowed; }
    #aiw-static {
      position: fixed; bottom: 24px; right: 24px; width: 320px; max-width: calc(100vw - 48px);
      background: #fff; border-radius: 16px; box-shadow: 0 8px 40px rgba(0,0,0,0.12);
      border: 1px solid #e2e8f0; z-index: 99999; padding: 16px; font-size: 14px; line-height: 1.5;
    }
    #aiw-static .aiw-sentiment {
      display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px;
      font-weight: 700; text-transform: uppercase; margin-bottom: 8px;
    }
    .aiw-sentiment.positive { background: #dcfce7; color: #166534; }
    .aiw-sentiment.mixed { background: #fef9c3; color: #854d0e; }
    .aiw-sentiment.negative { background: #fee2e2; color: #991b1b; }
    #aiw-static ul { margin: 8px 0 0; padding-left: 18px; }
    #aiw-static li { margin-bottom: 4px; }
    #aiw-static .aiw-close-static {
      position: absolute; top: 8px; right: 10px; background: none; border: none;
      font-size: 18px; cursor: pointer; color: #94a3b8;
    }
  `;

  function injectStyles() {
    const el = document.createElement('style');
    el.textContent = styles;
    document.head.appendChild(el);
  }

  async function fetchBot() {
    const res = await fetch(`${apiBase}/api/bots/${botId}`);
    if (!res.ok) throw new Error('Failed to load widget');
    return res.json();
  }

  function renderStaticWidget(bot) {
    const summary = bot.config?.summary;
    const container = document.createElement('div');
    container.id = 'aiw-container';

    const card = document.createElement('div');
    card.id = 'aiw-static';
    card.style.position = 'fixed';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'aiw-close-static';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => card.remove());
    card.appendChild(closeBtn);

    if (!summary) {
      card.innerHTML += '<p style="color:#64748b;font-style:italic">Loading review summary...</p>';
      fetch(`${apiBase}/api/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId }),
      })
        .then((r) => r.json())
        .then((data) => {
          card.innerHTML = '';
          card.appendChild(closeBtn);
          fillStaticCard(card, data.summary);
        })
        .catch(() => {
          card.innerHTML = '<p>Unable to load summary.</p>';
        });
    } else {
      fillStaticCard(card, summary);
    }

    container.appendChild(card);
    document.body.appendChild(container);
  }

  function fillStaticCard(card, summary) {
    const sentiment = (summary.sentiment || 'mixed').toLowerCase();
    const themes = (summary.themes || [])
      .map((t) => `<li>${escapeHtml(t)}</li>`)
      .join('');
    const content = document.createElement('div');
    content.innerHTML = `
      <span class="aiw-sentiment ${sentiment}">${escapeHtml(summary.sentiment || 'mixed')}</span>
      <p>${escapeHtml(summary.summary || '')}</p>
      ${themes ? `<ul>${themes}</ul>` : ''}
    `;
    const closeBtn = card.querySelector('.aiw-close-static');
    card.innerHTML = '';
    if (closeBtn) card.appendChild(closeBtn);
    card.appendChild(content);
  }

  function renderChatWidget(bot) {
    const container = document.createElement('div');
    container.id = 'aiw-container';

    const bubble = document.createElement('button');
    bubble.id = 'aiw-bubble';
    bubble.textContent = '💬';
    bubble.setAttribute('aria-label', 'Open chat');

    const panel = document.createElement('div');
    panel.id = 'aiw-panel';
    panel.innerHTML = `
      <div id="aiw-header">
        <span>${escapeHtml(bot.name || 'Chat')}</span>
        <button id="aiw-close" aria-label="Close">×</button>
      </div>
      <div id="aiw-messages"></div>
      <form id="aiw-form">
        <input id="aiw-input" type="text" placeholder="Type a message..." autocomplete="off">
        <button id="aiw-send" type="submit">Send</button>
      </form>
    `;

    container.appendChild(panel);
    container.appendChild(bubble);
    document.body.appendChild(container);

    let conversationId = null;
    const messagesEl = panel.querySelector('#aiw-messages');
    const form = panel.querySelector('#aiw-form');
    const input = panel.querySelector('#aiw-input');
    const sendBtn = panel.querySelector('#aiw-send');

    function toggle(open) {
      panel.classList.toggle('open', open);
    }

    bubble.addEventListener('click', () => toggle(!panel.classList.contains('open')));
    panel.querySelector('#aiw-close').addEventListener('click', () => toggle(false));

    function addMsg(role, content) {
      const div = document.createElement('div');
      div.className = `aiw-msg ${role}`;
      div.textContent = content;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    addMsg('assistant', 'Hi! How can I help you today?');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = input.value.trim();
      if (!message) return;

      input.value = '';
      sendBtn.disabled = true;
      addMsg('user', message);

      try {
        const res = await fetch(`${apiBase}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botId, message, conversationId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Chat failed');
        conversationId = data.conversationId;
        addMsg('assistant', data.reply);
      } catch {
        addMsg('assistant', 'Sorry, something went wrong. Please try again.');
      } finally {
        sendBtn.disabled = false;
        input.focus();
      }
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  injectStyles();

  fetchBot()
    .then((bot) => {
      if (bot.product_type === 'review_summarizer') {
        renderStaticWidget(bot);
      } else {
        renderChatWidget(bot);
      }
    })
    .catch((err) => console.error('[AI Widget]', err.message));
})();
