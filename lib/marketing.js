const ARROW_SVG =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const STAR_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.2 6.8H21l-5.5 4 2.1 6.7L12 17.8 6.4 20l2.1-6.7-5.5-4h6.8z"/></svg>';

function appNav(active = 'builder') {
  const tabs = [
    { href: '/builder', label: 'Builder', key: 'builder' },
    { href: '/dashboard', label: 'Dashboard', key: 'dashboard' },
    { href: '/admin', label: 'Admin', key: 'admin', id: 'admin-nav-link', adminOnly: true },
  ];
  const items = tabs
    .map((t) => {
      const cls = `${active === t.key ? 'active' : ''}${t.adminOnly && active !== 'admin' ? ' hidden' : ''}`.trim();
      const id = t.id ? ` id="${t.id}"` : '';
      return `<a href="${t.href}" class="${cls}"${id}>${t.label}</a>`;
    })
    .join('');

  return `<header class="mkt-header">
  <div class="mkt-header-inner">
    <a href="/dashboard" class="mkt-logo">${STAR_SVG} Widget &amp; Co</a>
    <button class="nav-toggle" type="button" aria-label="Menu" aria-expanded="false">Menu</button>
    <nav class="mkt-nav site-nav" aria-label="App"><div class="mkt-nav-pill">${items}</div></nav>
    <div class="mkt-header-actions mkt-user-wrap">
      <button type="button" class="mkt-user-btn" id="user-menu-btn" aria-haspopup="true" aria-expanded="false">
        <img id="user-avatar" class="mkt-user-avatar hidden" alt="">
        <span id="user-name" class="mkt-user-name">Account</span>
        <span class="mkt-user-chevron" aria-hidden="true">&#9662;</span>
      </button>
      <div class="mkt-dropdown hidden" id="user-dropdown" role="menu">
        <a href="/" class="mkt-dropdown-item" role="menuitem">Marketing site</a>
        <button type="button" id="btn-logout" class="mkt-dropdown-item mkt-dropdown-item--danger" role="menuitem">Sign out</button>
      </div>
    </div>
  </div>
</header>`;
}

function siteNav(active = '') {
  const links = [
    { href: '/', label: 'Home', key: 'home' },
    { href: '/about', label: 'About', key: 'about' },
    { href: '/pricing', label: 'Pricing', key: 'pricing' },
    { href: '/blog', label: 'Blog', key: 'blog' },
    { href: '/contact', label: 'Contact', key: 'contact' },
  ];
  const items = links
    .map(
      (l) =>
        `<a href="${l.href}" class="${active === l.key ? 'active' : ''}">${l.label}</a>`
    )
    .join('');

  return `<header class="mkt-header">
  <div class="mkt-header-inner">
    <a href="/" class="mkt-logo">${STAR_SVG} Widget &amp; Co</a>
    <button class="nav-toggle" type="button" aria-label="Menu" aria-expanded="false">Menu</button>
    <nav class="mkt-nav site-nav" aria-label="Main"><div class="mkt-nav-pill">${items}</div></nav>
    <div class="mkt-header-actions">
      <a href="/auth/google" class="mkt-link hide-mobile">Sign in</a>
      <a href="/auth/google" class="mkt-btn mkt-btn--dark">Get started</a>
    </div>
  </div>
</header>`;
}

function siteFooter() {
  return `<footer class="mkt-footer">
  <div class="mkt-footer-inner">
    <div class="mkt-footer-brand">
      <strong>Widget &amp; Co</strong>
      <p>Small-business widgets you configure once and share everywhere.</p>
    </div>
    <div class="mkt-footer-links">
      <a href="/about">About</a>
      <a href="/pricing">Pricing</a>
      <a href="/blog">Blog</a>
      <a href="/contact">Contact</a>
      <a href="/privacy">Privacy</a>
    </div>
    <div class="mkt-footer-links">
      <a href="/llms.txt">llms.txt</a>
      <a href="/sitemap.xml">Sitemap</a>
    </div>
  </div>
  <p class="mkt-footer-copy">&copy; ${new Date().getFullYear()} Widget &amp; Co</p>
</footer>`;
}

function bentoCard({ tone, chip, title, desc, wide = false }) {
  const wideCls = wide ? ' mkt-bento-card--wide' : '';
  return `<article class="mkt-bento-card mkt-bento-card--${tone}${wideCls}">
    <div class="mkt-bento-top">
      <span class="mkt-chip">${chip}</span>
      <span class="mkt-card-arrow">${ARROW_SVG}</span>
    </div>
    <h3>${title}</h3>
    <p>${desc}</p>
  </article>`;
}

function homePageBody() {
  return `
  <section class="mkt-hero">
    <div class="mkt-hero-grid">
      <div>
        <span class="mkt-hero-star" aria-hidden="true">*</span>
        <h1>Smart <em>widgets</em> for your business site</h1>
        <p class="mkt-lead">Chatbots, quizzes, lead scoring, FAQ answers, and review summaries — built in minutes, shared with one link or a single embed line.</p>
        <div class="mkt-hero-actions">
          <a href="/auth/google" class="mkt-btn mkt-btn--dark mkt-btn--lg">Start building</a>
          <a href="/pricing" class="mkt-btn mkt-btn--light mkt-btn--lg">See pricing</a>
        </div>
        <p id="login-error" class="login-error hidden">Sign-in failed. Please try again.</p>
      </div>
      <aside class="mkt-hero-aside" aria-hidden="true">
        <div class="mkt-orbit">
          <svg viewBox="0 0 120 120">
            <defs>
              <path id="mkt-orbit-path" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"/>
            </defs>
            <text>
              <textPath href="#mkt-orbit-path" startOffset="0">WIDGET &amp; CO · BUILD · SHARE · </textPath>
            </text>
          </svg>
          <span class="mkt-orbit-center">*</span>
        </div>
        <div class="mkt-tags">
          <span class="mkt-tag mkt-tag--pink">#Chatbot</span>
          <span class="mkt-tag mkt-tag--lavender">#Quiz</span>
          <span class="mkt-tag mkt-tag--lime">#Leads</span>
          <span class="mkt-tag mkt-tag--mint">#FAQ</span>
          <span class="mkt-tag mkt-tag--yellow">#Reviews</span>
        </div>
      </aside>
    </div>
  </section>

  <section class="mkt-section">
    <div class="mkt-section-head">
      <h2>Five tools, <em>one builder</em></h2>
      <p>Pick the widget that fits your business — each one is purpose-built, not a generic chat box.</p>
    </div>
    <div class="mkt-bento">
      ${bentoCard({ tone: 'mint', chip: 'Support', title: 'Business Chatbot', desc: 'Answers questions about hours, services, and policies in your brand voice.' })}
      ${bentoCard({ tone: 'lavender', chip: 'Sales', title: 'Product Quiz', desc: 'Asks a few questions, then recommends the right item from your catalog.' })}
      ${bentoCard({ tone: 'lime', chip: 'Pipeline', title: 'Lead Qualifier', desc: 'Scores visitors as hot or cold while keeping the conversation natural.' })}
      ${bentoCard({ tone: 'yellow', chip: 'Self-serve', title: 'FAQ Search', desc: 'Matches visitor questions to your FAQ list with warm, helpful replies.' })}
      ${bentoCard({ tone: 'pink', chip: 'Social proof', title: 'Review Summarizer', wide: true, desc: 'Turns customer reviews into sentiment and themes on a clean static card.' })}
    </div>
  </section>

  <section class="mkt-section">
    <div class="mkt-section-head">
      <h2>From sign-in to <em>live</em></h2>
      <p>Most owners ship their first widget in under ten minutes.</p>
    </div>
    <div class="mkt-process">
      <div class="mkt-process-step"><span class="mkt-process-num">1</span><strong>Sign in</strong><p>Free with Google — no credit card.</p></div>
      <div class="mkt-process-step"><span class="mkt-process-num">2</span><strong>Configure</strong><p>Choose a type and fill in your business details.</p></div>
      <div class="mkt-process-step"><span class="mkt-process-num">3</span><strong>Test</strong><p>Preview exactly what customers will see.</p></div>
      <div class="mkt-process-step"><span class="mkt-process-num">4</span><strong>Share</strong><p>Embed on your site or send a hosted link.</p></div>
    </div>
  </section>

  <section class="mkt-section">
    <div class="mkt-section-head">
      <h2>Questions we <em>get</em></h2>
    </div>
    <div class="mkt-faq">
      <article class="mkt-faq-item"><h3>Do I need to code?</h3><p>No. Fill a form, test, copy the snippet or share link. WordPress Custom HTML works too.</p></article>
      <article class="mkt-faq-item"><h3>Is visitor data private?</h3><p>Yes. Messages are anonymous — we do not log IPs or personal IDs from your customers.</p></article>
      <article class="mkt-faq-item"><h3>What runs the AI?</h3><p>Groq with Llama 3.3 70B. Keys stay on our server, never in the browser.</p></article>
    </div>
  </section>

  <section class="mkt-section">
    <div class="mkt-cta">
      <div>
        <h2>Put your site to work <em>tonight</em></h2>
        <p>Join shop owners, salons, and studios who answer customers while they sleep.</p>
      </div>
      <a href="/auth/google" class="mkt-btn mkt-btn--light mkt-btn--lg">Get started with Google</a>
    </div>
  </section>`;
}

module.exports = {
  siteNav,
  appNav,
  siteFooter,
  homePageBody,
  STAR_SVG,
};
