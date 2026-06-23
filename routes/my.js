const express = require('express');
const getSupabase = require('../lib/supabase');
const requireAuth = require('../middleware/requireAuth');
const { getProductType } = require('../productTypes');
const { getBaseUrl } = require('../lib/seo');

const router = express.Router();

async function statsForBot(botId) {
  const db = getSupabase();
  const [msgs, convs, hot] = await Promise.all([
    db.from('messages').select('id', { count: 'exact', head: true }).eq('bot_id', botId).eq('role', 'user'),
    db.from('conversations').select('id', { count: 'exact', head: true }).eq('bot_id', botId),
    db.from('conversations').select('id', { count: 'exact', head: true }).eq('bot_id', botId).eq('is_hot_lead', true),
  ]);
  return {
    visitorMessages: msgs.count || 0,
    conversations: convs.count || 0,
    hotLeads: hot.count || 0,
  };
}

router.get('/my/bots', requireAuth, async (req, res) => {
  try {
    const { data: bots, error } = await getSupabase()
      .from('bots')
      .select('id, name, product_type, config, created_at')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const base = getBaseUrl();
    const withStats = await Promise.all(
      (bots || []).map(async (bot) => {
        const stats = await statsForBot(bot.id);
        const pt = getProductType(bot.product_type);
        return {
          ...bot,
          ...stats,
          shareUrl: `${base}/w/${bot.id}`,
          isChatStyle: pt?.isChatStyle ?? true,
        };
      })
    );

    res.json(withStats);
  } catch (err) {
    console.error('GET /api/my/bots:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/my/bots/:id', requireAuth, async (req, res) => {
  try {
    const { data: bot, error } = await getSupabase()
      .from('bots')
      .select('id, name, product_type, config, created_at, owner_id')
      .eq('id', req.params.id)
      .single();

    if (error || !bot) return res.status(404).json({ error: 'Bot not found' });
    if (bot.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const stats = await statsForBot(bot.id);
    const { data: messages } = await getSupabase()
      .from('messages')
      .select('id, role, content, conversation_id, created_at')
      .eq('bot_id', bot.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const base = getBaseUrl();
    res.json({
      ...bot,
      ...stats,
      shareUrl: `${base}/w/${bot.id}`,
      embedSnippet: `<script src="${base}/widget.js" data-bot-id="${bot.id}"></script>`,
      messages: messages || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
