require('dotenv').config();

const requiredEnv = [
  'GROQ_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SESSION_SECRET',
  'BASE_URL',
];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('Copy .env.example to .env and fill in your keys.');
  process.exit(1);
}

const express = require('express');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const { configurePassport, getOAuthCallbackUrl } = require('./lib/auth');
const { sitemapXml, renderBuilderPage, renderDashboardPage, renderAdminPage } = require('./lib/seo');
const { isAdmin } = require('./middleware/requireAdmin');

const authRouter = require('./routes/auth');
const botsRouter = require('./routes/bots');
const chatRouter = require('./routes/chat');
const buildRouter = require('./routes/build');
const pagesRouter = require('./routes/pages');
const adminRouter = require('./routes/admin');
const myRouter = require('./routes/my');
const hostedRouter = require('./routes/hosted');

configurePassport();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction =
  process.env.NODE_ENV === 'production' || (process.env.BASE_URL || '').startsWith('https://');

app.set('trust proxy', 1);

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRouter);
app.use('/api', botsRouter);
app.use('/api', chatRouter);
app.use('/api', buildRouter);
app.use('/api/admin', adminRouter);
app.use('/api', myRouter);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/sitemap.xml', async (_req, res) => {
  try {
    const xml = await sitemapXml();
    res.type('application/xml').send(xml);
  } catch {
    res.status(500).send('Sitemap error');
  }
});

app.get('/admin', (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.redirect('/auth/google');
  }
  if (!isAdmin(req)) {
    return res.status(403).send('Admin access required. Set ADMIN_EMAILS in .env to your Google email.');
  }
  const body = fs.readFileSync(path.join(__dirname, 'public', 'admin-content.html'), 'utf8');
  res.type('html').send(renderAdminPage(body));
});

app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.redirect('/');
  }
  const body = fs.readFileSync(path.join(__dirname, 'public', 'dashboard-content.html'), 'utf8');
  res.type('html').send(renderDashboardPage(body));
});

app.get('/builder', (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.redirect('/');
  }
  const body = fs.readFileSync(path.join(__dirname, 'public', 'builder-content.html'), 'utf8');
  res.type('html').send(renderBuilderPage(body));
});

app.get('/login', (_req, res) => {
  res.redirect('/');
});

app.use(hostedRouter);
app.use(pagesRouter);
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.listen(PORT, () => {
  console.log(`AI Widget Builder running at ${process.env.BASE_URL}`);
  console.log(`Google OAuth callback: ${getOAuthCallbackUrl()}`);
});
