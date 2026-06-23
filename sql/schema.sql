-- AI Widget Builder schema
-- Run this in the Supabase SQL Editor

create table bots (
  id uuid primary key default gen_random_uuid(),
  name text,
  product_type text,  -- 'chatbot' | 'quiz' | 'lead_qualifier' | 'faq_search' | 'review_summarizer'
  config jsonb,
  owner_id text,      -- Google user id (set when bot is created by authenticated user)
  created_at timestamptz default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references bots(id),
  is_hot_lead boolean default false,  -- only meaningful for lead_qualifier
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references bots(id),
  conversation_id uuid references conversations(id),
  role text,        -- 'user' or 'assistant'
  content text,
  created_at timestamptz default now()
);

-- Recommended indexes (optional but useful at scale)
create index idx_messages_bot_id on messages(bot_id);
create index idx_messages_conversation_id on messages(conversation_id);
create index idx_messages_created_at on messages(created_at desc);
create index idx_conversations_bot_id on conversations(bot_id);
create index idx_bots_owner_id on bots(owner_id);

-- This app talks to Supabase only from the Node server (never the browser).
-- Disable RLS so the server API key can read/write. Use the service_role key in .env.
alter table bots disable row level security;
alter table conversations disable row level security;
alter table messages disable row level security;

-- Users (saved on Google sign-in)
create table if not exists users (
  id text primary key,
  email text,
  name text,
  picture text,
  created_at timestamptz default now(),
  last_login_at timestamptz default now()
);

-- Blog posts (SEO / GEO content)
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
create index if not exists idx_bots_owner_id on bots(owner_id);

alter table users disable row level security;
alter table blog_posts disable row level security;
