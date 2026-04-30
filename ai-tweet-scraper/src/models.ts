export interface AiModel {
  slug: string;
  displayName: string;
  color: string;
  // Twitter advanced-search query for this model. The scraper appends
  // date and quality filters on top of this.
  searchQuery: string;
}

export const AI_MODELS: AiModel[] = [
  {
    slug: 'openai',
    displayName: 'OpenAI / GPT',
    color: '#05C770',
    searchQuery: '"OpenAI" OR "GPT-4" OR "GPT-3" OR "ChatGPT"',
  },
  {
    slug: 'anthropic',
    displayName: 'Anthropic / Claude',
    color: '#AA99FF',
    searchQuery: '"Anthropic" OR "Claude AI" OR "Claude 3" OR "claude.ai"',
  },
  {
    slug: 'google',
    displayName: 'Google / Gemini',
    color: '#4285F4',
    searchQuery: '"Google Bard" OR "Bard AI" OR "Gemini AI" OR "Google Gemini"',
  },
  {
    slug: 'meta',
    displayName: 'Meta / Llama',
    color: '#3B82F6',
    searchQuery: '"Meta AI" OR "Llama 2" OR "Llama 3" OR "LLaMA model"',
  },
  {
    slug: 'mistral',
    displayName: 'Mistral AI',
    color: '#FABD83',
    searchQuery: '"Mistral AI" OR "mistral-7b" OR "Mixtral"',
  },
  {
    slug: 'grok',
    displayName: 'xAI / Grok',
    color: '#FCF283',
    searchQuery: '"Grok AI" OR "xAI Grok" OR "@grok"',
  },
  {
    slug: 'deepseek',
    displayName: 'DeepSeek',
    color: '#F87171',
    searchQuery: '"DeepSeek" OR "DeepSeek-R1" OR "deepseek.com" OR "DeepSeek-V3"',
  },
  {
    slug: 'kimi',
    displayName: 'Kimi / Moonshot',
    color: '#34D399',
    searchQuery: '"Kimi AI" OR "Moonshot AI" OR "kimi.ai" OR "MoonshotAI"',
  },
];
