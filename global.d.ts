// global.d.ts
/**
 * Cloudflare AI “hubAI” helper (injected at runtime when `hub.ai: true`)
 */
declare function hubAI(): {
  /**
   * Run an OpenAI or llama model by its CF module name
   * @param model e.g. "@cf/openai/whisper" or "@cf/meta/llama-3.1-8b-instruct"
   * @param params any JSON-serializable payload
   */
  run: (model: string, params: any) => Promise<{ text?: string; response?: string }>;
};
