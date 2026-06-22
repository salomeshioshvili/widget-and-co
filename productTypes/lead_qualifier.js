const LEAD_STATUS_MARKER = /LEAD_STATUS:\s*(hot|cold)\s*$/im;

module.exports = {
  id: 'lead_qualifier',
  name: 'Lead Qualifier',
  description: 'Chats naturally while scoring visitors as hot or cold leads.',
  isChatStyle: true,
  isStaticWidget: false,
  configSchema: [
    {
      key: 'qualifyingQuestions',
      label: 'Qualifying Questions',
      type: 'stringArray',
      required: true,
      minItems: 1,
      placeholder: 'What is your budget range?',
    },
  ],
  buildSystemPrompt(config) {
    const questions = config.qualifyingQuestions
      .map((q, i) => `${i + 1}. ${q}`)
      .join('\n');

    return `You are a lead qualification assistant. Have a natural, friendly conversation to qualify potential customers.

Qualifying criteria (work these into the conversation naturally — don't read them as a list):
${questions}

Guidelines:
- Chat naturally; weave qualifying questions into the conversation.
- Gather enough info to assess if this is a hot lead (genuine interest, budget, timeline, decision authority) or a cold lead (browsing, no budget, not ready).
- After each reply, on its own final line, append exactly one of:
  LEAD_STATUS: hot
  LEAD_STATUS: cold
- Do not mention the LEAD_STATUS line to the visitor.`;
  },
  parseLeadStatus(reply) {
    const match = reply.match(LEAD_STATUS_MARKER);
    if (!match) return { cleanReply: reply.trim(), isHotLead: null };
    const isHotLead = match[1].toLowerCase() === 'hot';
    const cleanReply = reply.replace(LEAD_STATUS_MARKER, '').trim();
    return { cleanReply, isHotLead };
  },
};
