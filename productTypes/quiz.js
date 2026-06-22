module.exports = {
  id: 'quiz',
  name: 'Product Quiz',
  description: 'Asks 2-3 questions, then recommends the best product from your list.',
  isChatStyle: true,
  isStaticWidget: false,
  configSchema: [
    {
      key: 'products',
      label: 'Products',
      type: 'array',
      required: true,
      minItems: 2,
      itemSchema: [
        { key: 'name', label: 'Product Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', required: true },
      ],
    },
    {
      key: 'goal',
      label: 'Quiz Goal',
      type: 'text',
      required: true,
      placeholder: 'Help customers find the right skincare product',
    },
  ],
  buildSystemPrompt(config) {
    const productList = config.products
      .map((p, i) => `${i + 1}. ${p.name}: ${p.description}`)
      .join('\n');

    return `You are a product recommendation quiz assistant. Goal: ${config.goal}

Available products:
${productList}

Instructions:
- Ask exactly 2-3 short questions (one at a time) to understand the visitor's needs.
- Track how many questions you've asked in the conversation.
- After receiving answers to 2-3 questions, recommend ONE product from the list above.
- Explain briefly why it fits their answers.
- Be conversational and friendly. Keep each message concise.`;
  },
};
