export type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export type TokenUsage = {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
};

export type StreamResponse = {
    content?: string;
    usage?: TokenUsage;
};

export type CompletionResponse = {
    content: string;
    usage?: TokenUsage;
};

export interface ILLMProvider {
    /**
     * Stream a response token by token.
     * Yields chunk with optional usage at the end.
     */
    stream(messages: ChatMessage[], modelId: string): AsyncIterable<StreamResponse>;

    /**
     * Single-shot completion (used for title generation etc.)
     */
    complete(messages: ChatMessage[], modelId: string): Promise<CompletionResponse>;
}