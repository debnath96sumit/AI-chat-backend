import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { ChatMessage, ILLMProvider } from '../interfaces/llm-provider.interface';

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

    async *stream(messages: ChatMessage[], model: string): AsyncIterable<string> {
        const stream = await this.client.chat.completions.create({
            model,
            messages,
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) yield content;
        }
    }

    async complete(messages: ChatMessage[], model: string): Promise<string> {
        const response = await this.client.chat.completions.create({
            model,
            messages,
            stream: false,
        });

        return response.choices?.[0]?.message?.content?.trim() ?? '';
    }
}