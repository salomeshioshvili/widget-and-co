# AI Widget Builder

A multi-product AI widget builder. Business owners pick a product type, configure it, test it, and get an embed snippet for their website.

## Product Types

| Type | Description |
|------|-------------|
| **Chatbot** | Answers questions about your business |
| **Product Quiz** | Asks 2–3 questions, recommends a product |
| **Lead Qualifier** | Chats naturally, scores hot/cold leads |
| **FAQ Search** | Matches questions to FAQs, friendly answers |
| **Review Summarizer** | One-time sentiment + themes summary (static widget) |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A free [Groq API key](https://console.groq.com/)
- A free [Supabase](https://supabase.com/) project
- A [Google Cloud OAuth client](https://console.cloud.google.com/apis/credentials) (for builder sign-in)

## 1. Get a Groq API Key

1. Sign up at [console.groq.com](https://console.groq.com/)
2. Go to **API Keys** → **Create API Key**
3. Copy the key — you'll add it to `.env`

Groq's free tier includes generous limits for `llama-3.3-70b-versatile`.

## 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com/)
2. Go to **SQL Editor** and run:

```sql
create table bots (
  id uuid primary key default gen_random_uuid(),
  name text,
  product_type text,
  config jsonb,
  created_at timestamptz default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references bots(id),
  is_hot_lead boolean default false,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references bots(id),
  conversation_id uuid references conversations(id),
  role text,
  content text,
  created_at timestamptz default now()
);

-- Recommended indexes
create index idx_messages_bot_id on messages(bot_id);
create index idx_messages_conversation_id on messages(conversation_id);
create index idx_conversations_bot_id on conversations(bot_id);
```

3. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL` (base URL only, e.g. `https://abc123.supabase.co` — no `/rest/v1`)
   - **service_role** key → `SUPABASE_KEY` (starts with `eyJ...`)

> **Important:** Use the `service_role` key, not the `anon` / publishable key. The browser never talks to Supabase directly — only your Node server does. Never expose `service_role` in frontend code.

If you see `row-level security policy` errors, either switch to the `service_role` key **or** run this in the SQL Editor:

```sql
alter table bots disable row level security;
alter table conversations disable row level security;
alter table messages disable row level security;
```

alter table messages disable row level security;
```

## 3. Set Up Google Sign-In

The builder requires Google sign-in. Embedded widgets on customer sites stay public (no login for visitors).

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create a project (or pick an existing one)
3. **Create Credentials → OAuth client ID → Web application**
4. **Authorized redirect URIs:** `http://localhost:3000/auth/google/callback`
   - For production, also add `https://your-domain.com/auth/google/callback`
5. Copy **Client ID** → `GOOGLE_CLIENT_ID` and **Client secret** → `GOOGLE_CLIENT_SECRET`
6. Add to `.env`:
   - `SESSION_SECRET` — any long random string (e.g. `openssl rand -hex 32`)
   - `BASE_URL` — `http://localhost:3000` locally (no trailing slash)
   - `ADMIN_EMAILS` — your Google email (for `/admin` dashboard access)

Run `sql/migration-blog-admin.sql` in Supabase to create the blog and users tables (includes 3 seed posts).

## 4. Run Locally

```bash
cp .env.example .env
# Edit .env with all keys (Groq, Supabase, Google, SESSION_SECRET, BASE_URL)

npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) — public landing page with sign-in. After Google auth you'll reach the builder at `/builder`.

### Test with curl

Builder APIs require a logged-in session (use the browser for normal use). Widget APIs stay public:

```bash
# Chat (replace BOT_ID) — works without auth (for embedded widgets)
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"botId":"BOT_ID","message":"What are your hours?"}'
```

## 5. Embed on Any Website

After building a widget in the UI, copy the embed snippet:

```html
<script src="https://your-domain.com/widget.js" data-bot-id="YOUR-BOT-UUID"></script>
```

Paste before `</body>` or into a WordPress **Custom HTML** block. The widget talks only to your server's `/api/chat` endpoint — API keys stay server-side.

## 6. Deploy for Free

### Render

1. Push this repo to GitHub
2. [render.com](https://render.com/) → **New Web Service** → connect repo
3. **Build command:** `npm install`
4. **Start command:** `npm start`
5. Add environment variables: `GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `BASE_URL` (your Render URL)
6. Add the production callback URL in Google Cloud: `https://your-app.onrender.com/auth/google/callback`
7. Deploy — use the Render URL in your embed snippet

### Railway

1. Push to GitHub
2. [railway.app](https://railway.app/) → **New Project** → **Deploy from GitHub**
3. Add the same env vars under **Variables**
4. Railway auto-detects `npm start`
5. Generate a public domain under **Settings → Networking**

Both platforms offer free tiers suitable for demos and low-traffic sites.

## Project Structure

```
├── server.js              # Express entry point
├── package.json
├── .env.example
├── lib/
│   ├── supabase.js        # Supabase client
│   ├── groq.js            # Groq API helper
│   └── auth.js            # Google OAuth (Passport)
├── middleware/
│   └── requireAuth.js     # Protects builder API routes
├── routes/
│   ├── auth.js            # Google sign-in / logout
│   ├── bots.js            # POST/GET bots, messages
│   ├── chat.js            # POST /api/chat
│   └── build.js           # POST /api/build (static widgets)
└── public/
    ├── index.html         # Builder UI (requires sign-in)
    ├── login.html         # Google sign-in page
    ├── css/styles.css
    ├── js/builder.js
    └── widget.js          # Embeddable widget (standalone)
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | Public landing page (SEO) |
| GET | `/builder` | required | Widget builder UI |
| GET | `/sitemap.xml` | — | XML sitemap |
| GET | `/llms.txt` | — | AI crawler info (GEO) |
| GET | `/login` | — | Redirects to `/` |
| GET | `/auth/google` | — | Start Google OAuth |
| GET | `/auth/me` | session | Current user |
| POST | `/auth/logout` | session | Sign out |
| GET | `/api/product-types` | required | List product types + config schemas |
| POST | `/api/bots` | required | Create a bot → `{ botId }` |
| GET | `/api/bots/:id` | public | Fetch bot config (for embed widget) |
| GET | `/api/bots/:id/messages` | required | Visitor messages (owner only) |
| POST | `/api/chat` | public | Send message (embed widget) |
| POST | `/api/build` | public | Build static widget summary |

## Privacy

No IP logging or visitor identifying information. Messages are stored anonymously linked only to `conversation_id` and `bot_id`.

## Adding a 6th Product Type

Drop a new file in `productTypes/` exporting `id`, `name`, `description`, `configSchema`, `buildSystemPrompt(config)`, and `isChatStyle` / `isStaticWidget`. Register it in `productTypes/index.js`.
