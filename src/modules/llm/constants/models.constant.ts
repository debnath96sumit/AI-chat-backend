import { SubscriptionTier } from '@common/enum/subscription-tier.enum';

export type LLMProviderKey = 'groq' | 'gemini' | 'huggingface';

export interface ModelOption {
  id: string; // the actual model string sent to the API
  label: string; // human-readable name for the frontend
  contextWindow: number;
}

export interface ProviderConfig {
  label: string;
  models: ModelOption[];
  defaultModel: string;
  tier: SubscriptionTier;
}

export const LLM_PROVIDERS: Record<LLMProviderKey, ProviderConfig> = {
  groq: {
    label: 'Groq',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        label: 'Llama 3.3 70B',
        contextWindow: 128000,
      },
      {
        id: 'llama-3.1-8b-instant',
        label: 'Llama 3.1 8B (Fast)',
        contextWindow: 128000,
      },
    ],
    tier: SubscriptionTier.FREE,
  },

  gemini: {
    label: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    models: [
      {
        id: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash',
        contextWindow: 1000000,
      },
      {
        id: 'gemini-2.5-pro',
        label: 'Gemini 2.5 Pro',
        contextWindow: 2000000,
      },
      {
        id: 'gemini-2.5-flash-thinking-exp',
        label: 'Gemini 2.5 Flash Thinking',
        contextWindow: 1000000,
      },
    ],
    tier: SubscriptionTier.PRO,
  },

  huggingface: {
    label: 'Hugging Face',
    defaultModel: 'meta-llama/Llama-3.1-8B-Instruct',
    models: [
      {
        id: 'meta-llama/Llama-3.1-8B-Instruct',
        label: 'Llama 3.1 8B',
        contextWindow: 4096,
      },
    ],
    tier: SubscriptionTier.PRO,
  },
};

// Helper: validate that a model belongs to a provider
export function isValidModel(
  provider: LLMProviderKey,
  modelId: string,
): boolean {
  return LLM_PROVIDERS[provider]?.models.some((m) => m.id === modelId) ?? false;
}

// Helper: get default model for a provider
export function getDefaultModel(provider: LLMProviderKey): string {
  return LLM_PROVIDERS[provider]?.defaultModel;
}

// Helper: check if a llm provider is accessible for a given subscription tier
export function isProviderAccessible(
  provider: LLMProviderKey,
  tier: SubscriptionTier,
): boolean {
  return LLM_PROVIDERS[provider]?.tier === tier;
}
