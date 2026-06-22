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
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const { configurePassport } = require('./lib/auth');

const authRouter = require('./routes/auth');
const botsRouter = require('./routes/bots');
const chatRouter = require('./routes/chat');
const buildRouter = require('./routes/build');

configurePassport();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.listen(PORT, () => {
  console.log(`AI Widget Builder running at ${process.env.BASE_URL}`);
});
