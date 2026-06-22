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
