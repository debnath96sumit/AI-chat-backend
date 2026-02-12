import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InferenceClient } from '@huggingface/inference';
import { Observable } from 'rxjs';
@Injectable()
export class ChatbotService {
  private readonly client: InferenceClient;

  constructor(private readonly config: ConfigService) {
    const hfToken = this.config.getOrThrow<string>('HF_TOKEN');
    this.client = new InferenceClient(hfToken);
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

  // streamAiMessage(message: string): Observable<MessageEvent> {
  //   console.log('Streaming AI response for message:', message);

  //   return new Observable<MessageEvent>((subscriber) => {
  //     void (async () => {
  //       try {
  //         // Dummy AI response (from file/string)
  //         const data =
  //           'This is a sample response that simulates an AI-generated text stream. ' +
  //           'It contains multiple paragraphs of text that can be used for testing the streaming functionality. ' +
  //           'The text is long enough to properly test the UI updates smoothly as new content arrives. This is a sample response that simulates an AI-generated text stream. ' +
  //           'It contains multiple paragraphs of text that can be used for testing the streaming functionality. ' +
  //           'The text is long enough to properly test the UI updates smoothly as new content arrives. This is a sample response that simulates an AI-generated text stream. ' +
  //           'It contains multiple paragraphs of text that can be used for testing the streaming functionality. ' +
  //           'The text is long enough to properly test the UI updates smoothly as new content arrives. This is a sample response that simulates an AI-generated text stream. ' +
  //           'It contains multiple paragraphs of text that can be used for testing the streaming functionality. ' +
  //           'The text is long enough to properly test the UI updates smoothly as new content arrives. This is a sample response that simulates an AI-generated text stream. ' +
  //           'It contains multiple paragraphs of text that can be used for testing the streaming functionality. ' +
  //           'The text is long enough to properly test the UI updates smoothly as new content arrives. This is a sample response that simulates an AI-generated text stream. ' +
  //           'It contains multiple paragraphs of text that can be used for testing the streaming functionality. ' +
  //           'The text is long enough to properly test the UI updates smoothly as new content arrives. This is a sample response that simulates an AI-generated text stream. ' +
  //           'It contains multiple paragraphs of text that can be used for testing the streaming functionality. ' +
  //           'The text is long enough to properly test the UI updates smoothly as new content arrives.';

  //         // Split response into small chunks (like tokens)
  //         const chunks = data.match(/.{1,8}/g) || []; // 8 chars per chunk

  //         for (const chunk of chunks) {
  //           subscriber.next({ data: chunk } as MessageEvent);
  //           await new Promise((resolve) => setTimeout(resolve, 50)); // delay 50ms per chunk
  //         }

  //         // End of stream
  //         subscriber.next({ data: '__END__' } as MessageEvent);
  //         subscriber.complete();
  //       } catch (err) {
  //         subscriber.error(err);
  //       }
  //     })();

  //     // Cleanup if stream is closed
  //     return () => {
  //       console.log('SSE stream closed by client.');
  //     };
  //   });
  // }
}
