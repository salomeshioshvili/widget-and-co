const chatbot = require('./chatbot');
const quiz = require('./quiz');
const leadQualifier = require('./lead_qualifier');
const faqSearch = require('./faq_search');
const reviewSummarizer = require('./review_summarizer');

const types = {
  chatbot,
  quiz,
  lead_qualifier: leadQualifier,
  faq_search: faqSearch,
  review_summarizer: reviewSummarizer,
};

function getProductType(id) {
  return types[id] || null;
}

function listProductTypes() {
  return Object.values(types).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    isChatStyle: t.isChatStyle,
    isStaticWidget: t.isStaticWidget,
    configSchema: t.configSchema,
  }));
}

module.exports = { getProductType, listProductTypes, types };
