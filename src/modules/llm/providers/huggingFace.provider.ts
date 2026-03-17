import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InferenceClient } from '@huggingface/inference';
import { ChatMessage, CompletionResponse, ILLMProvider, StreamResponse } from '../interfaces/llm-provider.interface';

@Injectable()
export class HuggingFaceProvider implements ILLMProvider, OnModuleInit {
    private client: InferenceClient;
    private readonly logger = new Logger(HuggingFaceProvider.name);

    constructor(private readonly config: ConfigService) { }

    onModuleInit() {
        const apiKey = this.config.getOrThrow<string>('HF_TOKEN');
        this.client = new InferenceClient(apiKey);
        this.logger.log('✅ HuggingFace provider initialized');
    }

    async *stream(messages: ChatMessage[], model: string): AsyncIterable<StreamResponse> {
        const stream = this.client.chatCompletionStream({
            model,
            messages,
        });

        for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) yield { content };

            // HF might provide usage in the last chunk or metadata (check if available)
            const usage = (chunk as any).usage;
            if (usage) {
                yield {
                    usage: {
                        promptTokens: usage.prompt_tokens,
                        completionTokens: usage.completion_tokens,
                        totalTokens: usage.total_tokens,
                    },
                };
            }
        }
    }

    async complete(messages: ChatMessage[], model: string): Promise<CompletionResponse> {
        const response = await this.client.chatCompletion({
            model,
            messages,
            temperature: 0.3,
            max_tokens: 20,
        });

        const content = response.choices?.[0]?.message?.content?.trim() ?? '';
        const usage = (response as any).usage;

        return {
            content,
            usage: usage ? {
                promptTokens: usage.prompt_tokens,
                completionTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
            } : undefined,
        };
    }
}