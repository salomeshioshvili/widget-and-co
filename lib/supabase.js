const { createClient } = require('@supabase/supabase-js');

let client = null;

function normalizeSupabaseUrl(url) {
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

function getSupabase() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
    }
    client = createClient(normalizeSupabaseUrl(url), key);
  }
  return client;
}

module.exports = getSupabase;
