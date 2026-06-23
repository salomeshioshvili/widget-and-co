const fs = require('fs');
const path = require('path');
const getSupabase = require('./supabase');
const { siteNav, siteFooter, appNav } = require('./marketing');

const BRAND_FONTS =
  'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500&display=swap';

function getBaseUrl() {
  return (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function renderPage(filename) {
  const filePath = path.join(__dirname, '..', 'public', filename);
  const html = fs.readFileSync(filePath, 'utf8');
  return html.replaceAll('{{BASE_URL}}', getBaseUrl());
}

async function sitemapXml() {
  const base = getBaseUrl();
  const staticPages = [
    { loc: `${base}/`, priority: '1.0' },
    { loc: `${base}/about`, priority: '0.8' },
    { loc: `${base}/pricing`, priority: '0.8' },
    { loc: `${base}/blog`, priority: '0.9' },
    { loc: `${base}/contact`, priority: '0.6' },
    { loc: `${base}/privacy`, priority: '0.4' },
    { loc: `${base}/llms.txt`, priority: '0.3' },
  ];

  let blogUrls = [];
  try {
    const { data } = await getSupabase()
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('published', true)
      .order('published_at', { ascending: false });
    blogUrls = (data || []).map((p) => ({
      loc: `${base}/blog/${p.slug}`,
      priority: '0.7',
      lastmod: p.updated_at?.split('T')[0],
    }));
  } catch {
    /* blog table may not exist yet */
  }

  const urls = [...staticPages, ...blogUrls];
  const body = urls
    .map((u) => {
      const lastmod = u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : '';
      return `  <url>
    <loc>${u.loc}</loc>${lastmod}
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatContent(html) {
  return html.replace(/\n/g, '<br>');
}

function renderSitePage({ title, description, canonical, body, jsonLd, navActive = '' }) {
  const base = getBaseUrl();
  const ld = jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${escapeHtml(canonical || base + '/')}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(canonical || base + '/')}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:site_name" content="Widget &amp; Co">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${BRAND_FONTS}" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css">
  <link rel="stylesheet" href="/css/marketing.css">
  ${ld}
</head>
<body class="site-shell">
  ${siteNav(navActive)}
  <main class="site-main"><div class="site-page">${body}</div></main>
  ${siteFooter()}
  <script src="/js/site.js"></script>
</body>
</html>`;
}

function renderHostedPage(bot, productType) {
  const title = escapeHtml(bot.name || 'Chat');
  const subtitle = bot.config?.businessName
    ? escapeHtml(bot.config.businessName)
    : escapeHtml(productType.name);
  const isStatic = productType.isStaticWidget;

  const chatArea = isStatic
    ? `<div id="hosted-static" class="hosted-static"><p class="hosted-loading">Loading…</p></div>`
    : `<div id="hosted-messages" class="hosted-messages"></div>
       <form id="hosted-form" class="hosted-form">
         <input id="hosted-input" type="text" placeholder="Type a message…" autocomplete="off" required>
         <button type="submit" class="btn btn-primary">Send</button>
       </form>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>${title} — Widget &amp; Co</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css">
</head>
<body class="hosted-page" data-bot-id="${escapeHtml(bot.id)}" data-static="${isStatic}">
  <div class="hosted-shell">
    <header class="hosted-header">
      <div class="hosted-brand">
        <span class="site-logo-icon">✦</span>
        <div>
          <h1>${title}</h1>
          <p>${subtitle}</p>
        </div>
      </div>
    </header>
    <main class="hosted-main">${chatArea}</main>
    <footer class="hosted-footer">
      <a href="/" target="_blank" rel="noopener">Powered by Widget &amp; Co</a>
    </footer>
  </div>
  <script src="/js/hosted.js"></script>
</body>
</html>`;
}

function renderAppShell({ title, active, bodyHtml, scripts = [] }) {
  const scriptTags = ['site.js', ...scripts].map((s) => `<script src="/js/${s}"></script>`).join('\n  ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${BRAND_FONTS}" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css">
  <link rel="stylesheet" href="/css/marketing.css">
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body class="app-shell app-shell--${active}">
  ${appNav(active)}
  <main class="app-main"><div class="app-page">${bodyHtml}</div></main>
  ${scriptTags}
</body>
</html>`;
}

function renderBuilderPage(bodyHtml) {
  return renderAppShell({ title: 'Builder — Widget & Co', active: 'builder', bodyHtml, scripts: ['builder.js'] });
}

function renderDashboardPage(bodyHtml) {
  return renderAppShell({ title: 'Dashboard — Widget & Co', active: 'dashboard', bodyHtml, scripts: ['dashboard.js'] });
}

function renderAdminPage(bodyHtml) {
  return renderAppShell({ title: 'Admin — Widget & Co', active: 'admin', bodyHtml, scripts: ['admin.js'] });
}

module.exports = {
  getBaseUrl,
  renderPage,
  sitemapXml,
  renderSitePage,
  renderBuilderPage,
  renderDashboardPage,
  renderHostedPage,
  renderAdminPage,
  appNav,
  siteNav,
  siteFooter,
  escapeHtml,
  formatContent,
};
