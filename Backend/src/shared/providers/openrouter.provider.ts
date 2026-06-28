import { config } from '../../config/index.js';
import { logger } from '../logs/logger.js';

// Prioritized list of 11 OpenRouter free models for robust failover
const OPENROUTER_MODELS = [
  'google/gemini-2.5-flash:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'nvidia/llama-3.1-nemotron-70b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'microsoft/phi-3-medium-128k-instruct:free',
  'microsoft/phi-3-mini-128k-instruct:free',
  'openchat/openchat-7b:free',
  'qwen/qwen-2-7b-instruct:free',
  'gryphe/mythomax-l2-13b:free',
  'cognitivecomputations/dolphin-mixtral-8x7b:free'
];

export interface CompletionOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
}

export const completeWithFallback = async (options: CompletionOptions): Promise<string> => {
  const apiKey = config.OPENROUTER_API_KEY;

  // If no API key is set, fallback immediately to local mock clinician guidelines
  if (!apiKey) {
    logger.warn('OpenRouter API key is missing. Falling back to default clinical mock responses.');
    return getDefaultFallbackResponse(options.prompt);
  }

  const system = options.systemPrompt || 'You are a helpful clinical hospital assistant.';
  const temp = options.temperature ?? 0.3;

  // Try each model sequentially
  for (let i = 0; i < OPENROUTER_MODELS.length; i++) {
    const modelName = OPENROUTER_MODELS[i];
    logger.info(`Attempting completion using model ${i + 1}/${OPENROUTER_MODELS.length}: ${modelName}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout per model

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:4000',
          'X-Title': 'Astra AI Hospital Agent System'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: options.prompt }
          ],
          temperature: temp
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter HTTP ${response.status}: ${errorText}`);
      }

      const json = await response.json() as any;
      const text = json?.choices?.[0]?.message?.content?.trim();

      if (text) {
        logger.info(`Successfully retrieved completion from model: ${modelName}`);
        return text;
      }
      throw new Error('Received empty response choices');
    } catch (err: any) {
      clearTimeout(timeoutId);
      logger.warn(`Model ${modelName} failed or timed out: ${err.message}. Swapping to backup model...`);
    }
  }

  logger.error('All 11 OpenRouter models failed to respond. Triggering emergency fail-safe mock response.');
  return getDefaultFallbackResponse(options.prompt);
};

// Fail-safe clinician recommendations if API keys or network requests fail
const getDefaultFallbackResponse = (prompt: string): string => {
  const lower = prompt.toLowerCase();
  
  if (lower.includes('cholesterol') || lower.includes('blood') || lower.includes('sugar')) {
    return 'Doctor recommendation: Maintain a balanced low-sodium diet, drink 3L of water daily, and track cholesterol levels weekly.';
  }
  
  return 'Astra System Notice: Your request was logged, but the AI service is currently operating in offline backup mode. Please verify the credentials or contact support if this error persists.';
};
