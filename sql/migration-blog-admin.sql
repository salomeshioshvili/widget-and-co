-- Users + blog + admin support
-- Run in Supabase SQL Editor

create table if not exists users (
  id text primary key,
  email text,
  name text,
  picture text,
  created_at timestamptz default now(),
  last_login_at timestamptz default now()
);

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null,
  published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_blog_posts_published on blog_posts(published, published_at desc);
create index if not exists idx_blog_posts_slug on blog_posts(slug);

alter table users disable row level security;
alter table blog_posts disable row level security;

-- Seed blog posts (SEO / GEO content)
insert into blog_posts (slug, title, excerpt, content, published, published_at) values
(
  'why-small-businesses-need-ai-chatbots',
  'Why Small Businesses Need AI Chatbots in 2025',
  'Learn how an embeddable AI chatbot helps small businesses answer questions 24/7 without hiring extra staff.',
  'Small business owners wear many hats. An AI chatbot on your website can answer common questions about hours, pricing, and services while you focus on running the business.

**Key benefits:**
- Available 24/7, even when you are closed
- Handles repetitive questions so you do not have to
- Easy to embed with a single script tag — no developer needed
- Visitors get instant answers instead of waiting for email replies

With Widget & Co, you configure your business info once, test the chatbot, and paste the embed code on any website or WordPress site. The AI stays on brand using the tone you choose — friendly, professional, or casual.

If you run a flower shop, café, salon, or any local business, a chatbot turns your website from a brochure into an interactive assistant that builds trust and saves time.',
  true,
  now() - interval '5 days'
),
(
  'how-to-embed-ai-widget-wordpress',
  'How to Embed an AI Widget on WordPress (Step by Step)',
  'A simple guide to adding your Widget & Co AI chatbot or quiz to any WordPress site using a Custom HTML block.',
  'You do not need a WordPress plugin to add an AI widget. Widget & Co gives you a single line of code that works anywhere.

**Steps:**
1. Sign in to Widget & Co and build your widget (chatbot, quiz, lead qualifier, etc.)
2. Test it in the preview panel
3. Copy the embed snippet from step 4
4. In WordPress, edit the page where you want the widget
5. Add a **Custom HTML** block
6. Paste the script tag before the closing content
7. Publish — the widget appears as a chat bubble in the corner

The widget talks to our secure API. Your Groq and database keys never appear in the browser. Visitors chat anonymously with no sign-in required.

Works with Elementor, Gutenberg, and classic editors. For site-wide widgets, add the snippet to your theme footer or use a header/footer plugin.',
  true,
  now() - interval '3 days'
),
(
  'lead-qualifier-vs-contact-form',
  'Lead Qualifier vs Contact Form: Which Converts Better?',
  'Compare static contact forms with conversational AI lead qualifiers that score hot and cold leads automatically.',
  'Contact forms are familiar but often feel like homework. Visitors leave fields blank or abandon halfway. A lead qualifier widget chats naturally, asks your qualifying questions in conversation, and scores each visitor as a hot or cold lead.

**Contact form limitations:**
- High abandonment on long forms
- No context until you read the submission
- Every lead looks the same until you follow up

**Lead qualifier advantages:**
- Feels like talking to a person, not filling a survey
- Adapts follow-up questions based on answers
- Flags hot leads (budget, timeline, genuine interest) automatically
- You review visitor messages in your Widget & Co dashboard

Configure your qualifying questions — budget range, timeline, project scope — and let the AI weave them into a natural chat. Perfect for agencies, consultants, and B2B services where not every visitor is equally valuable.',
  true,
  now() - interval '1 day'
)
on conflict (slug) do nothing;
