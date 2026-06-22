module.exports = {
  id: 'chatbot',
  name: 'Chatbot',
  description: 'A friendly AI assistant that answers questions about your business.',
  isChatStyle: true,
  isStaticWidget: false,
  configSchema: [
    { key: 'businessName', label: 'Business Name', type: 'text', required: true, placeholder: 'Acme Coffee Co.' },
    { key: 'businessInfo', label: 'Business Info', type: 'textarea', required: true, placeholder: 'Hours, location, services, policies...' },
    {
      key: 'tone',
      label: 'Tone',
      type: 'select',
      required: true,
      options: [
        { value: 'friendly', label: 'Friendly' },
        { value: 'professional', label: 'Professional' },
        { value: 'casual', label: 'Casual' },
      ],
      default: 'friendly',
    },
  ],
  buildSystemPrompt(config) {
    return `You are a helpful chatbot for ${config.businessName}.

Business information:
${config.businessInfo}

Tone: ${config.tone}. Stay in character and keep replies concise (2-4 sentences unless more detail is needed).

Answer visitor questions using only the business information provided. If you don't know something, say so politely and suggest they contact the business directly.`;
  },
};
