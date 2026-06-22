const express = require('express');
const getSupabase = require('../lib/supabase');
const { chatCompletion } = require('../lib/groq');
const { getProductType } = require('../productTypes');

const router = express.Router();

router.post('/build', async (req, res) => {
  try {
    const { botId } = req.body;

    if (!botId) {
      return res.status(400).json({ error: 'botId is required' });
    }

    const { data: bot, error: botError } = await getSupabase()
      .from('bots')
      .select('id, product_type, config')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const productType = getProductType(bot.product_type);
    if (!productType || !productType.isStaticWidget) {
      return res.status(400).json({ error: 'This bot does not support static build' });
    }

    const prompt = productType.buildSummaryPrompt(bot.config);
    const raw = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, maxTokens: 512 }
    );

    const summary = productType.parseSummary(raw);
    const updatedConfig = { ...bot.config, summary };

    const { error: updateError } = await getSupabase()
      .from('bots')
      .update({ config: updatedConfig })
      .eq('id', botId);

    if (updateError) throw updateError;

    res.json({ summary, botId });
  } catch (err) {
    console.error('POST /api/build:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
