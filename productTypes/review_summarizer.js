module.exports = {
  id: 'review_summarizer',
  name: 'Review Summarizer',
  description: 'Summarizes customer reviews into sentiment and key themes — no chat needed.',
  isChatStyle: false,
  isStaticWidget: true,
  configSchema: [
    {
      key: 'reviews',
      label: 'Customer Reviews',
      type: 'stringArray',
      required: true,
      minItems: 1,
      placeholder: 'Paste a customer review...',
    },
  ],
  buildSummaryPrompt(config) {
    const reviewList = config.reviews.map((r, i) => `Review ${i + 1}: ${r}`).join('\n\n');

    return `Analyze these customer reviews and produce a concise summary.

${reviewList}

Respond in this exact format:
SENTIMENT: [one word: positive, mixed, or negative]
SUMMARY: [2-3 sentence overview]
THEMES:
- [theme 1]
- [theme 2]
- [theme 3]
(3-5 bullet themes total)`;
  },
  parseSummary(raw) {
    const sentimentMatch = raw.match(/SENTIMENT:\s*(.+)/i);
    const summaryMatch = raw.match(/SUMMARY:\s*(.+?)(?=\nTHEMES:|\n-|$)/is);
    const themesSection = raw.split(/THEMES:\s*/i)[1] || '';
    const themes = themesSection
      .split('\n')
      .map((line) => line.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);

    return {
      sentiment: sentimentMatch ? sentimentMatch[1].trim() : 'mixed',
      summary: summaryMatch ? summaryMatch[1].trim() : raw.trim(),
      themes,
      raw,
    };
  },
};
