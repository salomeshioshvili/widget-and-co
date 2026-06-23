const express = require('express');
const getSupabase = require('../lib/supabase');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = express.Router();

router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const db = getSupabase();
    const [bots, users, messages, posts, conversations] = await Promise.all([
      db.from('bots').select('id', { count: 'exact', head: true }),
      db.from('users').select('id', { count: 'exact', head: true }),
      db.from('messages').select('id', { count: 'exact', head: true }),
      db.from('blog_posts').select('id', { count: 'exact', head: true }),
      db.from('conversations').select('id', { count: 'exact', head: true }),
    ]);

    res.json({
      bots: bots.count || 0,
      users: users.count || 0,
      messages: messages.count || 0,
      blogPosts: posts.count || 0,
      conversations: conversations.count || 0,
    });
  } catch (err) {
    console.error('GET /api/admin/stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/bots', requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('bots')
      .select('id, name, product_type, owner_id, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/bots/:id', requireAdmin, async (req, res) => {
  try {
    const botId = req.params.id;
    await getSupabase().from('messages').delete().eq('bot_id', botId);
    await getSupabase().from('conversations').delete().eq('bot_id', botId);
    const { error } = await getSupabase().from('bots').delete().eq('id', botId);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('users')
      .select('id, email, name, picture, created_at, last_login_at')
      .order('last_login_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/posts', requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/posts', requireAdmin, async (req, res) => {
  try {
    const { slug, title, excerpt, content, published } = req.body;
    if (!slug || !title || !content) {
      return res.status(400).json({ error: 'slug, title, and content are required' });
    }
    const row = {
      slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
      title,
      excerpt: excerpt || '',
      content,
      published: !!published,
      published_at: published ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await getSupabase().from('blog_posts').insert(row).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/posts/:id', requireAdmin, async (req, res) => {
  try {
    const { title, excerpt, content, published, slug } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (content !== undefined) updates.content = content;
    if (slug !== undefined) updates.slug = slug;
    if (published !== undefined) {
      updates.published = !!published;
      if (published) updates.published_at = new Date().toISOString();
    }
    const { data, error } = await getSupabase()
      .from('blog_posts')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/posts/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await getSupabase().from('blog_posts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
