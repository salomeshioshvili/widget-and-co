const express = require('express');
const getSupabase = require('../lib/supabase');
const { getProductType } = require('../productTypes');
const { renderHostedPage } = require('../lib/seo');

const router = express.Router();

router.get('/w/:botId', async (req, res) => {
  try {
    const { data: bot, error } = await getSupabase()
      .from('bots')
      .select('id, name, product_type, config')
      .eq('id', req.params.botId)
      .single();

    if (error || !bot) {
      return res.status(404).type('html').send('<h1>Widget not found</h1>');
    }

    const productType = getProductType(bot.product_type);
    if (!productType) {
      return res.status(404).type('html').send('<h1>Widget not found</h1>');
    }

    res.type('html').send(renderHostedPage(bot, productType));
  } catch (err) {
    console.error('GET /w/:botId:', err.message);
    res.status(500).send('Error loading widget');
  }
});

module.exports = router;
