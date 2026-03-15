import { BadRequestException, Injectable } from '@nestjs/common';
import { GroqProvider } from './providers/groq.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { HuggingFaceProvider } from './providers/huggingFace.provider';
import { ChatMessage, ILLMProvider } from './interfaces/llm-provider.interface';
import { getDefaultModel, isValidModel, LLMProviderKey } from './constants/models.constant';


@Injectable()
export class LLMService {
    constructor(
        private readonly groq: GroqProvider,
        private readonly gemini: GeminiProvider,
        private readonly huggingface: HuggingFaceProvider,
    ) { }

    private getProvider(key: LLMProviderKey): ILLMProvider {
        const map: Record<LLMProviderKey, ILLMProvider> = {
            groq: this.groq,
            gemini: this.gemini,
            huggingface: this.huggingface,
        };
        return map[key];
    }

    /**
     * Resolve and validate provider + model.
     * Falls back to defaults if not provided.
     */
    resolve(
        providerKey?: LLMProviderKey,
        modelId?: string,
    ): { provider: LLMProviderKey; model: string } {
        const provider: LLMProviderKey = providerKey ?? 'groq';
        const model = modelId ?? getDefaultModel(provider);

        if (modelId && !isValidModel(provider, modelId)) {
            throw new BadRequestException(
                `Model "${modelId}" is not valid for provider "${provider}"`,
            );
        }

        return { provider, model };
    }

    /**
     * Stream tokens from chosen provider+model.
     */
    stream(
        providerKey: LLMProviderKey,
        model: string,
        messages: ChatMessage[],
    ): AsyncIterable<string> {
        return this.getProvider(providerKey).stream(messages, model);
    }

    /**
     * Single-shot completion (title generation, summaries, etc.)
     */
    async complete(
        providerKey: LLMProviderKey,
        model: string,
        messages: ChatMessage[],
    ): Promise<string> {
        return this.getProvider(providerKey).complete(messages, model);
    }
}