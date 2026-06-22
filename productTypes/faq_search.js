function findBestFaq(userMessage, faqs) {
  const query = userMessage.toLowerCase();
  let best = faqs[0];
  let bestScore = -1;

  for (const faq of faqs) {
    const words = faq.question.toLowerCase().split(/\W+/).filter(Boolean);
    const score = words.reduce((sum, word) => (query.includes(word) ? sum + 1 : sum), 0);
    if (score > bestScore) {
      bestScore = score;
      best = faq;
    }
  }

  return best;
}

module.exports = {
  id: 'faq_search',
  name: 'FAQ Search',
  description: 'Matches visitor questions to your FAQs and answers in a friendly tone.',
  isChatStyle: true,
  isStaticWidget: false,
  configSchema: [
    {
      key: 'faqs',
      label: 'FAQs',
      type: 'array',
      required: true,
      minItems: 1,
      itemSchema: [
        { key: 'question', label: 'Question', type: 'text', required: true },
        { key: 'answer', label: 'Answer', type: 'textarea', required: true },
      ],
    },
  ],
  findBestFaq,
  buildSystemPrompt(config, matchedFaq) {
    return `You are a friendly FAQ assistant. A visitor asked a question that best matches this FAQ:

Question: ${matchedFaq.question}
Official answer: ${matchedFaq.answer}

Rephrase the official answer in a warm, conversational tone. Keep the same factual content — do not add information not in the official answer. Be concise (2-4 sentences).`;
  },
  buildUserMessageForFaq(userMessage, matchedFaq) {
    return `Visitor asked: "${userMessage}"\n\nPlease rephrase the answer for FAQ: "${matchedFaq.question}"`;
  },
};
