const express = require('express');
const getSupabase = require('../lib/supabase');
const corsPublic = require('../middleware/corsPublic');
const { chatCompletion } = require('../lib/groq');
const { getProductType } = require('../productTypes');

const router = express.Router();

router.options('/chat', corsPublic);
router.post('/chat', corsPublic, async (req, res) => {
  try {
    const { botId, message, conversationId } = req.body;

    if (!botId || !message) {
      return res.status(400).json({ error: 'botId and message are required' });
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
    if (!productType || productType.isStaticWidget) {
      return res.status(400).json({ error: 'This bot does not support chat' });
    }

    let convId = conversationId;
    if (!convId) {
      const { data: conv, error: convError } = await getSupabase()
        .from('conversations')
        .insert({ bot_id: botId })
        .select('id')
        .single();
      if (convError) throw convError;
      convId = conv.id;
    }

    await getSupabase().from('messages').insert({
      bot_id: botId,
      conversation_id: convId,
      role: 'user',
      content: message,
    });

    const { data: history } = await getSupabase()
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    let reply;
    let isHotLead = null;

    if (bot.product_type === 'faq_search') {
      const matchedFaq = productType.findBestFaq(message, bot.config.faqs || []);
      const systemPrompt = productType.buildSystemPrompt(bot.config, matchedFaq);
      const userMsg = productType.buildUserMessageForFaq(message, matchedFaq);

      reply = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMsg },
      ]);
    } else {
      const systemPrompt = productType.buildSystemPrompt(bot.config);
      const groqMessages = [
        { role: 'system', content: systemPrompt },
        ...(history || []).map((m) => ({ role: m.role, content: m.content })),
      ];

      reply = await chatCompletion(groqMessages);

      if (bot.product_type === 'lead_qualifier' && productType.parseLeadStatus) {
        const parsed = productType.parseLeadStatus(reply);
        reply = parsed.cleanReply;
        if (parsed.isHotLead !== null) {
          isHotLead = parsed.isHotLead;
          await getSupabase()
            .from('conversations')
            .update({ is_hot_lead: isHotLead })
            .eq('id', convId);
        }
      }
    }

    await getSupabase().from('messages').insert({
      bot_id: botId,
      conversation_id: convId,
      role: 'assistant',
      content: reply,
    });

    const response = { reply, conversationId: convId };
    if (bot.product_type === 'lead_qualifier') {
      response.isHotLead = isHotLead;
    }

    res.json(response);
  } catch (err) {
    console.error('POST /api/chat:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
