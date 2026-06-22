(function () {
  const state = {
    productTypes: [],
    selectedType: null,
    botId: null,
    conversationId: null,
    config: {},
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function showError(msg) {
    const existing = $('.error-toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'error-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  async function api(path, options = {}) {
    const res = await fetch('/api' + path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json();
    if (res.status === 401) {
      window.location.href = '/login';
      throw new Error('Please sign in');
    }
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function loadUser() {
    const res = await fetch('/auth/me', { credentials: 'same-origin' });
    if (!res.ok) {
      window.location.href = '/login';
      return;
    }
    const { user } = await res.json();
    $('#user-name').textContent = user.name || user.email;
    if (user.picture) {
      const avatar = $('#user-avatar');
      avatar.src = user.picture;
      avatar.classList.remove('hidden');
    }
  }

  function goToStep(n) {
    $$('.panel').forEach((p) => p.classList.remove('active'));
    $(`#step-${n}`).classList.add('active');
    $$('.step').forEach((s) => {
      const num = parseInt(s.dataset.step, 10);
      s.classList.toggle('active', num === n);
      s.classList.toggle('done', num < n);
    });
  }

  async function loadProductTypes() {
    state.productTypes = await api('/product-types');
    const container = $('#product-cards');
    container.innerHTML = state.productTypes
      .map(
        (pt) => `
      <label class="product-card" data-id="${pt.id}">
        <input type="radio" name="productType" value="${pt.id}">
        <strong>${escapeHtml(pt.name)}</strong>
        <p>${escapeHtml(pt.description)}</p>
      </label>`
      )
      .join('');

    container.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      if (!card) return;
      $$('.product-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      card.querySelector('input').checked = true;
      state.selectedType = state.productTypes.find((p) => p.id === card.dataset.id);
      $('#btn-step1-next').disabled = false;
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function renderDynamicFields() {
    const container = $('#dynamic-fields');
    container.innerHTML = '';
    if (!state.selectedType) return;

    state.selectedType.configSchema.forEach((field) => {
      container.appendChild(buildField(field));
    });
  }

  function buildField(field) {
    if (field.type === 'array') return buildArrayField(field);
    if (field.type === 'stringArray') return buildStringArrayField(field);
    return buildSimpleField(field);
  }

  function buildSimpleField(field) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    wrap.dataset.key = field.key;

    const label = document.createElement('label');
    label.textContent = field.label + (field.required ? ' *' : '');
    wrap.appendChild(label);

    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
    } else if (field.type === 'select') {
      input = document.createElement('select');
      field.options.forEach((opt) => {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        if (opt.value === field.default) o.selected = true;
        input.appendChild(o);
      });
    } else {
      input = document.createElement('input');
      input.type = 'text';
    }

    input.name = field.key;
    input.required = !!field.required;
    if (field.placeholder) input.placeholder = field.placeholder;
    wrap.appendChild(input);
    return wrap;
  }

  function buildArrayField(field) {
    const group = document.createElement('div');
    group.className = 'array-group';
    group.dataset.key = field.key;

    const header = document.createElement('div');
    header.className = 'array-group-header';
    header.innerHTML = `<strong>${escapeHtml(field.label)}</strong>`;
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-secondary btn-sm';
    addBtn.textContent = '+ Add';
    header.appendChild(addBtn);
    group.appendChild(header);

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'array-items';
    group.appendChild(itemsContainer);

    function addItem(data = {}) {
      const idx = itemsContainer.children.length;
      const item = document.createElement('div');
      item.className = 'array-item';

      const itemHeader = document.createElement('div');
      itemHeader.className = 'array-item-header';
      itemHeader.innerHTML = `<span>Item ${idx + 1}</span>`;
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-secondary btn-sm btn-danger';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => item.remove());
      itemHeader.appendChild(removeBtn);
      item.appendChild(itemHeader);

      field.itemSchema.forEach((sub) => {
        const subWrap = document.createElement('div');
        subWrap.className = 'field';
        const subLabel = document.createElement('label');
        subLabel.textContent = sub.label;
        subWrap.appendChild(subLabel);

        let subInput;
        if (sub.type === 'textarea') {
          subInput = document.createElement('textarea');
        } else {
          subInput = document.createElement('input');
          subInput.type = 'text';
        }
        subInput.dataset.subkey = sub.key;
        subInput.required = !!sub.required;
        if (data[sub.key]) subInput.value = data[sub.key];
        subWrap.appendChild(subInput);
        item.appendChild(subWrap);
      });

      itemsContainer.appendChild(item);
    }

    addBtn.addEventListener('click', () => addItem());
    const min = field.minItems || 1;
    for (let i = 0; i < min; i++) addItem();

    return group;
  }

  function buildStringArrayField(field) {
    const group = document.createElement('div');
    group.className = 'array-group';
    group.dataset.key = field.key;

    const header = document.createElement('div');
    header.className = 'array-group-header';
    header.innerHTML = `<strong>${escapeHtml(field.label)}</strong>`;
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-secondary btn-sm';
    addBtn.textContent = '+ Add';
    header.appendChild(addBtn);
    group.appendChild(header);

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'array-items';
    group.appendChild(itemsContainer);

    function addItem(value = '') {
      const item = document.createElement('div');
      item.className = 'array-item';
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'string-array-input';
      input.placeholder = field.placeholder || '';
      input.required = true;
      input.value = value;
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-secondary btn-sm btn-danger';
      removeBtn.textContent = 'Remove';
      removeBtn.style.marginTop = '0.5rem';
      removeBtn.addEventListener('click', () => item.remove());
      item.appendChild(input);
      item.appendChild(removeBtn);
      itemsContainer.appendChild(item);
    }

    addBtn.addEventListener('click', () => addItem());
    const min = field.minItems || 1;
    for (let i = 0; i < min; i++) addItem();

    return group;
  }

  function collectConfig() {
    const config = {};
    state.selectedType.configSchema.forEach((field) => {
      if (field.type === 'array') {
        const group = $(`.array-group[data-key="${field.key}"]`);
        config[field.key] = [...group.querySelectorAll('.array-item')].map((item) => {
          const obj = {};
          field.itemSchema.forEach((sub) => {
            obj[sub.key] = item.querySelector(`[data-subkey="${sub.key}"]`).value.trim();
          });
          return obj;
        });
      } else if (field.type === 'stringArray') {
        const group = $(`.array-group[data-key="${field.key}"]`);
        config[field.key] = [...group.querySelectorAll('.string-array-input')]
          .map((inp) => inp.value.trim())
          .filter(Boolean);
      } else {
        const el = $(`[name="${field.key}"]`);
        if (el) config[field.key] = el.value.trim();
      }
    });
    return config;
  }

  function addChatBubble(role, content) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${role}`;
    div.textContent = content;
    $('#chat-messages').appendChild(div);
    $('#chat-messages').scrollTop = $('#chat-messages').scrollHeight;
  }

  function renderStaticCard(summary) {
    const card = $('#static-card');
    const sentimentClass = (summary.sentiment || 'mixed').toLowerCase();
    card.innerHTML = `
      <span class="sentiment ${sentimentClass}">${escapeHtml(summary.sentiment || 'mixed')}</span>
      <p>${escapeHtml(summary.summary || '')}</p>
      ${summary.themes?.length ? `<ul>${summary.themes.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>` : ''}
    `;
  }

  async function runStaticBuild() {
    $('#static-card').innerHTML = '<p class="static-loading">Generating summary...</p>';
    const result = await api('/build', {
      method: 'POST',
      body: JSON.stringify({ botId: state.botId }),
    });
    renderStaticCard(result.summary);
  }

  async function loadVisitorMessages() {
    const container = $('#visitor-messages');
    try {
      const messages = await api(`/bots/${state.botId}/messages`);
      const userMsgs = messages.filter((m) => m.role === 'user');
      if (!userMsgs.length) {
        container.innerHTML = '<div class="empty-state">No visitor messages yet.</div>';
        return;
      }
      container.innerHTML = userMsgs
        .map(
          (m) => `
        <div class="visitor-msg">
          <span class="time">${new Date(m.created_at).toLocaleString()}</span>
          <div class="role">Visitor</div>
          ${escapeHtml(m.content)}
        </div>`
        )
        .join('');
    } catch {
      container.innerHTML = '<div class="empty-state">Could not load messages.</div>';
    }
  }

  function updateEmbedSnippet() {
    const origin = window.location.origin;
    const snippet = `<script src="${origin}/widget.js" data-bot-id="${state.botId}"><\/script>`;
    $('#embed-snippet').textContent = snippet;
  }

  // Event bindings
  $('#btn-step1-next').addEventListener('click', () => {
    renderDynamicFields();
    goToStep(2);
  });

  $('#btn-step2-next').addEventListener('click', async () => {
    try {
      const name = $('#bot-name').value.trim() || 'My Widget';
      state.config = collectConfig();
      const result = await api('/bots', {
        method: 'POST',
        body: JSON.stringify({
          name,
          product_type: state.selectedType.id,
          config: state.config,
        }),
      });
      state.botId = result.botId;
      state.conversationId = null;

      const isStatic = state.selectedType.isStaticWidget;
      $('#chat-preview').classList.toggle('hidden', isStatic);
      $('#static-preview').classList.toggle('hidden', !isStatic);

      if (isStatic) {
        await runStaticBuild();
      } else {
        $('#chat-messages').innerHTML = '';
        $('#hot-lead-badge').classList.add('hidden');
        addChatBubble('assistant', getWelcomeMessage());
      }

      goToStep(3);
    } catch (err) {
      showError(err.message);
    }
  });

  function getWelcomeMessage() {
    const welcomes = {
      chatbot: 'Hi! How can I help you today?',
      quiz: "Hi! I'll ask you a few quick questions to find the best fit for you.",
      lead_qualifier: "Hi there! I'd love to learn more about what you're looking for.",
      faq_search: 'Hi! Ask me anything — I can help with common questions.',
    };
    return welcomes[state.selectedType?.id] || 'Hello! How can I help?';
  }

  $('#chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('#chat-input');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    addChatBubble('user', message);

    try {
      const result = await api('/chat', {
        method: 'POST',
        body: JSON.stringify({
          botId: state.botId,
          message,
          conversationId: state.conversationId,
        }),
      });
      state.conversationId = result.conversationId;
      addChatBubble('assistant', result.reply);

      if (state.selectedType.id === 'lead_qualifier' && result.isHotLead !== null) {
        const badge = $('#hot-lead-badge');
        badge.classList.remove('hidden', 'hot', 'cold');
        badge.classList.add(result.isHotLead ? 'hot' : 'cold');
        badge.textContent = result.isHotLead ? '🔥 Hot Lead' : '❄️ Cold Lead';
      }
    } catch (err) {
      showError(err.message);
    }
  });

  $('#btn-rebuild').addEventListener('click', async () => {
    try {
      await runStaticBuild();
    } catch (err) {
      showError(err.message);
    }
  });

  $('#btn-step3-next').addEventListener('click', async () => {
    updateEmbedSnippet();
    await loadVisitorMessages();
    goToStep(4);
  });

  $('#btn-copy').addEventListener('click', async () => {
    const text = $('#embed-snippet').textContent;
    await navigator.clipboard.writeText(text);
    $('#btn-copy').textContent = 'Copied!';
    setTimeout(() => ($('#btn-copy').textContent = 'Copy to Clipboard'), 2000);
  });

  $('#btn-start-over').addEventListener('click', () => {
    state.botId = null;
    state.conversationId = null;
    state.selectedType = null;
    state.config = {};
    $$('.product-card').forEach((c) => c.classList.remove('selected'));
    $('#btn-step1-next').disabled = true;
    $('#config-form').reset();
    goToStep(1);
  });

  $('#btn-logout').addEventListener('click', async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.href = '/login';
  });

  $$('[data-back]').forEach((btn) => {
    btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.back, 10)));
  });

  loadUser()
    .then(() => loadProductTypes())
    .catch((err) => showError(err.message));
})();
