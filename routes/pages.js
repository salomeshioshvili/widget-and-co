const express = require('express');
const getSupabase = require('../lib/supabase');
const {
  getBaseUrl,
  renderSitePage,
  escapeHtml,
  formatContent,
} = require('../lib/seo');
const { homePageBody } = require('../lib/marketing');

const router = express.Router();

function mdToHtml(text) {
  return formatContent(
    escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
  );
}

router.get('/', async (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/builder');
  }
  const base = getBaseUrl();
  const body = homePageBody();

  res.type('html').send(
    renderSitePage({
      title: 'Widget & Co — Build AI Chatbots & Widgets for Your Website',
      description:
        'Create embeddable AI chatbots, product quizzes, lead qualifiers, FAQ search, and review summaries. No code required.',
      canonical: `${base}/`,
      navActive: 'home',
      body,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Widget & Co',
        url: `${base}/`,
        applicationCategory: 'BusinessApplication',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    })
  );
});

router.get('/about', (_req, res) => {
  const base = getBaseUrl();
  res.type('html').send(
    renderSitePage({
      title: 'About — Widget & Co',
      description:
        'Widget & Co helps small businesses add AI chatbots and widgets to their websites without coding.',
      canonical: `${base}/about`,
      navActive: 'about',
      body: `
        <section class="mkt-page-head"><h1>About <em>us</em></h1>
        <p>Every small business deserves a smarter website — without hiring a developer.</p></section>
        <section class="mkt-panel mkt-prose">
          <p>Widget &amp; Co is a no-code widget builder. Pick a product type, fill in your business details, test live, and embed on any website or WordPress with a single script tag.</p>
          <p>We built it for flower shops, cafés, salons, agencies, and local studios that want to answer questions, qualify leads, and serve customers around the clock.</p>
          <h2>What makes us different</h2>
          <ul>
            <li><strong>Five purpose-built widget types</strong> — not a generic chatbot builder</li>
            <li><strong>Privacy-first</strong> — visitor messages are anonymous, no IP logging</li>
            <li><strong>Secure by design</strong> — API keys stay on our server, never in the browser</li>
            <li><strong>Fast setup</strong> — most widgets are live in under 10 minutes</li>
          </ul>
        </section>`,
    })
  );
});

router.get('/pricing', (_req, res) => {
  const base = getBaseUrl();
  res.type('html').send(
    renderSitePage({
      title: 'Pricing — Widget & Co',
      description: 'Simple, free pricing for AI widgets. Build and embed chatbots, quizzes, and more at no cost.',
      canonical: `${base}/pricing`,
      navActive: 'pricing',
      body: `
        <section class="mkt-page-head"><h1>Simple <em>pricing</em></h1>
        <p>Start free. No credit card. No surprises.</p></section>
        <section class="mkt-pricing">
          <article class="mkt-price-card">
            <h3>Free</h3>
            <div class="mkt-price">$0<span>/mo</span></div>
            <ul>
              <li>All 5 widget types</li>
              <li>Unlimited widgets</li>
              <li>Embed on any website</li>
              <li>Visitor message inbox</li>
              <li>Google sign-in</li>
            </ul>
            <a href="/auth/google" class="mkt-btn mkt-btn--dark">Get started</a>
          </article>
          <article class="mkt-price-card mkt-price-card--featured">
            <span class="mkt-price-badge">Coming soon</span>
            <h3>Pro</h3>
            <div class="mkt-price">$19<span>/mo</span></div>
            <ul>
              <li>Everything in Free</li>
              <li>Custom branding</li>
              <li>Analytics dashboard</li>
              <li>Priority support</li>
              <li>Remove powered-by badge</li>
            </ul>
            <a href="/contact" class="mkt-btn mkt-btn--light">Join waitlist</a>
          </article>
        </section>`,
    })
  );
});

router.get('/contact', (_req, res) => {
  const base = getBaseUrl();
  res.type('html').send(
    renderSitePage({
      title: 'Contact — Widget & Co',
      description: 'Get in touch with the Widget & Co team for support, partnerships, or questions.',
      canonical: `${base}/contact`,
      navActive: 'contact',
      body: `
        <section class="mkt-page-head"><h1>Get in <em>touch</em></h1>
        <p>Questions, feedback, or partnership ideas — we read every note.</p></section>
        <section class="mkt-panel mkt-prose">
          <p><strong>Support:</strong> Sign in and use the builder. Most answers live in our <a href="/blog">blog</a>.</p>
          <p><strong>Business inquiries:</strong> Reach out from the email on your Google account after signing in.</p>
          <p><strong>Bug reports:</strong> Include your widget ID and what happened — screenshots help.</p>
          <p style="margin-top:1.5rem"><a href="/auth/google" class="mkt-btn mkt-btn--dark">Sign in to get started</a></p>
        </section>`,
    })
  );
});

router.get('/privacy', (_req, res) => {
  const base = getBaseUrl();
  res.type('html').send(
    renderSitePage({
      title: 'Privacy Policy — Widget & Co',
      description: 'How Widget & Co handles data, visitor privacy, and Google authentication.',
      canonical: `${base}/privacy`,
      navActive: '',
      body: `
        <section class="mkt-page-head"><h1>Privacy <em>policy</em></h1><p>Last updated: ${new Date().toISOString().split('T')[0]}</p></section>
        <section class="mkt-panel mkt-prose">
          <h2>What we collect</h2>
          <p><strong>Business owners:</strong> When you sign in with Google, we store your Google ID, email, name, and profile picture to manage your account and widgets.</p>
          <p><strong>Website visitors:</strong> Messages sent through embedded widgets are stored anonymously. We do not log IP addresses or other identifying visitor information.</p>
          <h2>How we use data</h2>
          <p>Widget configurations and messages are stored to operate the service. AI responses are generated via Groq. We do not sell your data.</p>
          <h2>Cookies</h2>
          <p>We use session cookies for Google authentication. Embedded widgets do not require visitor cookies.</p>
        </section>`,
    })
  );
});

router.get('/blog', async (_req, res) => {
  try {
    const base = getBaseUrl();
    const { data: posts, error } = await getSupabase()
      .from('blog_posts')
      .select('slug, title, excerpt, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false });
    if (error) throw error;

    const cards = (posts || [])
      .map(
        (p) => `
      <article class="mkt-blog-card">
        <time datetime="${p.published_at}">${new Date(p.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
        <h2><a href="/blog/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a></h2>
        <p>${escapeHtml(p.excerpt || '')}</p>
        <a href="/blog/${escapeHtml(p.slug)}" class="mkt-read-more">Read article</a>
      </article>`
      )
      .join('');

    res.type('html').send(
      renderSitePage({
        title: 'Blog — Widget & Co | AI Widgets & Small Business Tips',
        description:
          'Tips on AI chatbots, lead qualification, WordPress embeds, and growing your small business with Widget & Co.',
        canonical: `${base}/blog`,
        navActive: 'blog',
        body: `
          <section class="mkt-page-head"><h1><em>Blog</em></h1>
          <p>Guides for adding useful widgets to your business site.</p></section>
          <section class="mkt-blog-grid">${cards || '<p class="mkt-empty">No posts yet.</p>'}</section>`,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Widget & Co Blog',
          url: `${base}/blog`,
        },
      })
    );
  } catch (err) {
    res.status(500).send('Could not load blog');
  }
});

router.get('/blog/:slug', async (req, res) => {
  try {
    const base = getBaseUrl();
    const { data: post, error } = await getSupabase()
      .from('blog_posts')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('published', true)
      .single();
    if (error || !post) return res.status(404).send('Post not found');

    res.type('html').send(
      renderSitePage({
        title: `${post.title} — Widget & Co Blog`,
        description: post.excerpt || post.title,
        canonical: `${base}/blog/${post.slug}`,
        navActive: 'blog',
        body: `
          <article class="mkt-article">
            <a href="/blog" class="mkt-back">Back to blog</a>
            <time datetime="${post.published_at}">${new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
            <h1>${escapeHtml(post.title)}</h1>
            <div class="mkt-prose">${mdToHtml(post.content)}</div>
          </article>`,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          datePublished: post.published_at,
          dateModified: post.updated_at,
          url: `${base}/blog/${post.slug}`,
          author: { '@type': 'Organization', name: 'Widget & Co' },
        },
      })
    );
  } catch (err) {
    res.status(500).send('Could not load post');
  }
});

module.exports = router;
