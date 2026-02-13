import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InferenceClient } from '@huggingface/inference';
import { Observable } from 'rxjs';
import { ApiResponse } from '@common/types/api-response.type';
import { ChatRepository } from './repositories/chat.repository';
import { MessageRepository } from './repositories/message.repository';
import { AuthenticatedUser } from '@auth/types/authenticated-user.type';
import { RenameChatDto, SendMessageDto } from './dto/create-message.dto';
import { MessageDocument, MessageRole } from './schemas/message.schema';
@Injectable()
export class ChatbotService {
  private readonly client: InferenceClient;

  constructor(
    private readonly config: ConfigService,
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository,
  ) {
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

  async handleMessage(
    user: AuthenticatedUser,
    dto: SendMessageDto,
  ): Promise<Observable<MessageEvent>> {

    return new Observable<MessageEvent>((subscriber) => {
      void (async () => {
        let chat;
        let fullAssistantResponse = '';

        try {
          if (!dto.chatId) {
            chat = await this.chatRepository.save({
              userId: user.id,
            });
          } else {
            chat = await this.chatRepository.getByField({
              _id: dto.chatId,
              userId: user.id,
              isDeleted: false,
            });

            if (!chat) {
              throw new NotFoundException('Chat not found');
            }
          }

          await this.messageRepository.save({
            chatId: chat._id,
            userId: user.id,
            role: MessageRole.USER,
            content: dto.message,
          });

          /**
           * LLMs do NOT remember anything.
           * They are stateless.
           * Every request must include the entire conversation history.
           * So instead of sending only the last message, we send the entire history.
           */

          const history = await this.messageRepository.getMessageHistory(chat._id);

          const formattedHistory = history.map((msg: MessageDocument) => ({
            role: msg.role,
            content: msg.content,
          }));

          /**
           * 4️⃣ Stream AI response
           */
          const stream = this.client.chatCompletionStream({
            model: 'meta-llama/Llama-3.1-8B-Instruct',
            messages: formattedHistory,
          });

          for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              fullAssistantResponse += content;
              subscriber.next({ data: content } as MessageEvent);
            }
          }

          await this.messageRepository.save({
            chatId: chat._id,
            userId: user.id,
            role: MessageRole.ASSISTANT,
            content: fullAssistantResponse,
          });

          const messages = await this.messageRepository.getAllByField({
            chatId: chat._id,
          });

          const isFirstMessage = messages.length === 2;

          if (isFirstMessage) {
            this.generateTitle(dto.message)
              .then((title) => {
                if (title) {
                  return this.chatRepository.updateById({
                    title: this.cleanTitle(title),
                  }, chat._id);
                }
              })
              .catch((error) => {
                console.log(error);
              });
          }

          subscriber.next({
            data: JSON.stringify({
              type: 'meta',
              chatId: chat._id,
            }),
          } as MessageEvent);

          subscriber.next({ data: '__END__' } as MessageEvent);
          subscriber.complete();

        } catch (error) {
          subscriber.error(error);
        }
      })();
    });
  }

  async getUserChats(
    user: AuthenticatedUser,
    page: number,
    limit: number,
  ): Promise<ApiResponse> {
    const userId = user._id;
    if (!userId) throw new BadRequestException('Invalid user details.');
    const chats = await this.chatRepository.getAllPaginate({
      filter: { userId },
      page,
      limit,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Chats fetched successfully',
      data: chats,
    };
  }

  async getChatDetails(
    user: AuthenticatedUser,
    chatId: string,
    page: number,
    limit: number
  ): Promise<ApiResponse> {
    const chat = await this.chatRepository.getByField({
      _id: chatId,
      userId: user.id,
      isDeleted: false,
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const messages = await this.messageRepository.getAllPaginate({
      filter: { chatId },
      page,
      limit,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Chat details fetched successfully',
      data: {
        chat,
        messages,
      },
    };
  }

  async renameChat(
    user: AuthenticatedUser,
    chatId: string,
    dto: RenameChatDto
  ): Promise<ApiResponse> {
    const chat = await this.chatRepository.getByField({
      _id: chatId,
      userId: user.id,
      isDeleted: false,
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    const updated = await this.chatRepository.updateById({
      title: dto.title
    }, chat._id);

    return {
      statusCode: updated ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR,
      message: updated ? 'Chat renamed successfully' : 'Failed to rename chat',
    };
  }

  async deleteChat(user: AuthenticatedUser, chatId: string): Promise<ApiResponse> {
    const chat = await this.chatRepository.getByField({
      _id: chatId,
      userId: user.id,
      isDeleted: false,
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const updated = await this.chatRepository.updateById({
      isDeleted: true,
    }, chat._id);

    return {
      statusCode: updated ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR,
      message: updated ? 'Chat deleted successfully' : 'Failed to delete chat',
    };
  }

  private async generateTitle(userMessage: string): Promise<string | undefined> {
    const completion = await this.client.chatCompletion({
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      messages: [
        {
          role: 'system',
          content:
            'Generate a short chat title. Max 5 words. No punctuation. No quotes.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.3,
      max_tokens: 20,
    });

    return completion.choices?.[0]?.message?.content?.trim();
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/["']/g, '')
      .replace(/\.$/, '')
      .trim()
      .slice(0, 60);
  }
}
