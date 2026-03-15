export type ChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export interface ILLMProvider {
    /**
     * Stream a response token by token.
     * Yields raw string chunks as they arrive.
     */
    stream(messages: ChatMessage[], modelId: string): AsyncIterable<string>;

    /**
     * Single-shot completion (used for title generation etc.)
     */
    complete(messages: ChatMessage[], modelId: string): Promise<string>;
}