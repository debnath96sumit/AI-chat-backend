import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { ChatMessage, CompletionResponse, ILLMProvider, StreamResponse } from '../interfaces/llm-provider.interface';

@Injectable()
export class GroqProvider implements ILLMProvider, OnModuleInit {
    private client: Groq;
    private readonly logger = new Logger(GroqProvider.name);

    constructor(private readonly config: ConfigService) { }

    onModuleInit() {
        const apiKey = this.config.getOrThrow<string>('GROQ_API_KEY');
        this.client = new Groq({ apiKey });
        this.logger.log('✅ Groq provider initialized');
    }

    async *stream(messages: ChatMessage[], model: string): AsyncIterable<StreamResponse> {
        const stream = (await this.client.chat.completions.create({
            model,
            messages,
            stream: true,
            stream_options: { include_usage: true },
        } as any)) as unknown as AsyncIterable<any>;

        for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            const usage = (chunk as any).usage;

            if (content) yield { content };
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
        const response = await this.client.chat.completions.create({
            model,
            messages,
            stream: false,
        });

        const content = response.choices?.[0]?.message?.content?.trim() ?? '';
        const usage = response.usage;

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