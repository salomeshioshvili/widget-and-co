const express = require('express');
const getSupabase = require('../lib/supabase');
const requireAuth = require('../middleware/requireAuth');
const { getProductType, listProductTypes } = require('../productTypes');

const router = express.Router();

router.get('/product-types', requireAuth, (_req, res) => {
  res.json(listProductTypes());
});

router.post('/bots', requireAuth, async (req, res) => {
  try {
    const { name, product_type, config } = req.body;

    if (!product_type || !getProductType(product_type)) {
      return res.status(400).json({ error: 'Invalid product_type' });
    }

    const { data, error } = await getSupabase()
      .from('bots')
      .insert({
        name: name || 'Untitled Bot',
        product_type,
        config: config || {},
        owner_id: req.user.id,
      })
      .select('id')
      .single();

    if (error) throw error;
    res.status(201).json({ botId: data.id });
  } catch (err) {
    console.error('POST /api/bots:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/bots/:id', async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('bots')
      .select('id, name, product_type, config, created_at')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Bot not found' });
    res.json(data);
  } catch (err) {
    console.error('GET /api/bots/:id:', err.message);
    res.status(err.code === 'PGRST116' ? 404 : 500).json({ error: err.message });
  }
});

router.get('/bots/:id/messages', requireAuth, async (req, res) => {
  try {
    const { data: bot, error: botError } = await getSupabase()
      .from('bots')
      .select('owner_id')
      .eq('id', req.params.id)
      .single();

    if (botError || !bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    if (bot.owner_id && bot.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await getSupabase()
      .from('messages')
      .select('id, role, content, conversation_id, created_at')
      .eq('bot_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('GET /api/bots/:id/messages:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
