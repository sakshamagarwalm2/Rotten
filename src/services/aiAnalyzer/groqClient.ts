import Groq from 'groq-sdk';
import { logger } from '../../utils/logger';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

let groqInstance: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqInstance) {
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    groqInstance = new Groq({ apiKey: GROQ_API_KEY });
    logger.info('[groqClient] Groq client initialized');
  }
  return groqInstance;
}

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function groqChatCompletion(
  messages: GroqChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  },
): Promise<string | null> {
  const model = options?.model ?? 'llama-3.3-70b-versatile';
  const temperature = options?.temperature ?? 0.1;
  const maxTokens = options?.maxTokens ?? 4096;

  logger.section('Groq API Call');
  logger.info(`[groqClient] model: ${model}`);
  logger.info(`[groqClient] temperature: ${temperature}`);
  logger.info(`[groqClient] maxTokens: ${maxTokens}`);
  logger.info(`[groqClient] messages count: ${messages.length}`);
  logger.debug('[groqClient] system message:', messages.find(m => m.role === 'system')?.content.substring(0, 200));
  logger.debug('[groqClient] user message:', messages.find(m => m.role === 'user')?.content.substring(0, 200));

  try {
    const client = getGroqClient();
    const startTime = Date.now();

    const completion = await client.chat.completions.create({
      messages: messages as any,
      model,
      temperature,
      max_tokens: maxTokens,
    });

    const elapsed = Date.now() - startTime;
    logger.info(`[groqClient] Response received in ${elapsed}ms`);

    const content = completion.choices[0]?.message?.content || null;
    logger.info(`[groqClient] Response length: ${content?.length ?? 0} chars`);
    logger.debug('[groqClient] Response preview:', content?.substring(0, 300));

    if (completion.usage) {
      logger.info(`[groqClient] Usage - prompt: ${completion.usage.prompt_tokens}, completion: ${completion.usage.completion_tokens}, total: ${completion.usage.total_tokens}`);
    }

    return content;
  } catch (error: any) {
    logger.error('[groqClient] API call failed:', error.message);
    if (error.status) logger.error('[groqClient] Status:', error.status);
    if (error.code) logger.error('[groqClient] Code:', error.code);
    return null;
  }
}
