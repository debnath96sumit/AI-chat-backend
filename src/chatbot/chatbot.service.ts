import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InferenceClient } from '@huggingface/inference';
import { Observable } from 'rxjs';
@Injectable()
export class ChatbotService {
  private readonly client: InferenceClient;

  constructor(private readonly config: ConfigService) {
    const hfToken = this.config.get<string>('HF_TOKEN') ?? '';
    this.client = new InferenceClient(hfToken);
  }

  getWelcome(): string {
    return 'Welcome to the AI Chatbot!';
  }

  async handleAIResponseAtOnce(message: string): Promise<string> {
    try {
      const response = await this.client.chatCompletion({
        model: 'meta-llama/Llama-3.1-8B-Instruct',
        messages: [{ role: 'user', content: message }],
        max_tokens: 100,
      });

      const reply = response.choices[0].message.content;

      return `AI: ${reply}`;
    } catch (err) {
      console.error('Error handling message:', err);
      throw new Error('Failed to process the message');
    }
  }

  streamAiMessage(message: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      void (async () => {
        try {
          const stream = this.client.chatCompletionStream({
            model: 'meta-llama/Llama-3.1-8B-Instruct',
            messages: [{ role: 'user', content: message }],
          });

          for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              subscriber.next({ data: content } as MessageEvent);
            }
          }

          subscriber.next({ data: '__END__' } as MessageEvent);

          await new Promise((resolve) => setTimeout(resolve, 100));

          subscriber.complete();
        } catch (err) {
          subscriber.error(err);
        }
      })();

      return () => {
        console.log('SSE stream closed by client.');
      };
    });
  }
}
