import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage, ILLMProvider } from '../interfaces/llm-provider.interface';

@Injectable()
export class GeminiProvider implements ILLMProvider, OnModuleInit {
    private client: GoogleGenAI;
    private readonly logger = new Logger(GeminiProvider.name);

    constructor(private readonly config: ConfigService) { }

    onModuleInit() {
        const apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY');
        this.client = new GoogleGenAI({ apiKey });
        this.logger.log('✅ Gemini provider initialized');
    }

    async *stream(messages: ChatMessage[], model: string): AsyncIterable<string> {
        // Gemini separates system prompt from the conversation history
        const systemMessage = messages.find((m) => m.role === 'system');
        const conversationMessages = messages.filter((m) => m.role !== 'system');

        // Gemini uses 'model' instead of 'assistant' for role
        const contents = conversationMessages.map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        const response = await this.client.models.generateContentStream({
            model,
            contents,
            config: {
                ...(systemMessage && { systemInstruction: systemMessage.content }),
            },
        });

        for await (const chunk of response) {
            const text = chunk.text;
            if (text) yield text;
        }
    }

    async complete(messages: ChatMessage[], model: string): Promise<string> {
        const systemMessage = messages.find((m) => m.role === 'system');
        const conversationMessages = messages.filter((m) => m.role !== 'system');

        const contents = conversationMessages.map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        const response = await this.client.models.generateContent({
            model,
            contents,
            config: {
                ...(systemMessage && { systemInstruction: systemMessage.content }),
                maxOutputTokens: 50,
                temperature: 0.3,
            },
        });

        return response.text?.trim() ?? '';
    }
}