-- Run this if you already created the tables before Google auth was added
alter table bots add column if not exists owner_id text;
create index if not exists idx_bots_owner_id on bots(owner_id);
