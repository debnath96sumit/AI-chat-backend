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
import { LLMService } from '@modules/llm/llm.service';
import * as modelsConstant from '@modules/llm/constants/models.constant';
@Injectable()
export class ChatbotService {
  private readonly client: InferenceClient;

  constructor(
    private readonly config: ConfigService,
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository,
    private readonly llmService: LLMService,
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

  async createUserMessage(
    user: AuthenticatedUser,
    dto: SendMessageDto,
  ): Promise<ApiResponse> {
    const { provider, model } = this.llmService.resolve(dto.provider, dto.modelId);

    let chat;

    if (!dto.chatId) {
      let title = await this.generateTitle(dto.message, provider, model);
      if (!title) title = 'New Chat';

      chat = await this.chatRepository.save({
        userId: user._id,
        title: this.cleanTitle(title),
        provider,
        modelId: model,
      });
    } else {
      chat = await this.chatRepository.getByField({
        _id: dto.chatId,
        userId: user._id,
        isDeleted: false,
      });

      if (!chat) throw new NotFoundException('Chat not found');

      const providerChanged = chat.provider !== provider;
      const modelChanged = chat.modelId !== model;

      if (providerChanged || modelChanged) {
        chat = await this.chatRepository.updateById({ provider, modelId: model }, chat._id);
      }
    }

    await this.messageRepository.save({
      chatId: chat._id,
      userId: user._id,
      role: MessageRole.USER,
      content: dto.message,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Message sent successfully',
      data: { chat },
    };
  }

  async streamAssistantResponse(
    user: AuthenticatedUser,
    chatId: string,
  ): Promise<Observable<MessageEvent>> {
    return new Observable<MessageEvent>((subscriber) => {
      void (async () => {
        let fullAssistantResponse = '';

        try {
          const chat = await this.chatRepository.getByField({
            _id: chatId,
            userId: user._id,
            isDeleted: false,
          });

          if (!chat) throw new NotFoundException('Chat not found');

          const provider = (chat.provider ?? 'groq') as modelsConstant.LLMProviderKey;
          const modelId = chat.modelId ?? modelsConstant.getDefaultModel(provider);

          const history = await this.messageRepository.getMessageHistory(chat._id);

          const formattedHistory = history.map((msg: MessageDocument) => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          }));

          for await (const chunk of this.llmService.stream(provider, modelId, formattedHistory)) {
            fullAssistantResponse += chunk;
            subscriber.next({ data: chunk } as MessageEvent);
          }

          // Persist full assistant response
          await this.messageRepository.save({
            chatId: chat._id,
            userId: user._id,
            role: MessageRole.ASSISTANT,
            content: fullAssistantResponse,
          });

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
      userId: user._id,
      isDeleted: false,
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const messages = await this.messageRepository.getAllPaginate({
      filter: { chatId: chat._id },
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
      userId: user._id,
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
      userId: user._id,
      isDeleted: false,
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    await this.messageRepository.bulkDelete({
      chatId: chat._id,
    });
    const updated = await this.chatRepository.delete(chat._id);

    return {
      statusCode: updated ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR,
      message: updated ? 'Chat deleted successfully' : 'Failed to delete chat',
    };
  }

  async getAvailableModels(): Promise<ApiResponse> {
    return {
      statusCode: HttpStatus.OK,
      message: 'Available models fetched successfully',
      data: modelsConstant.LLM_PROVIDERS,
    };
  }

  private async generateTitle(
    userMessage: string,
    provider: modelsConstant.LLMProviderKey,
    model: string,
  ): Promise<string | undefined> {
    try {
      return await this.llmService.complete(provider, model, [
        {
          role: 'system',
          content:
            'Generate a short chat title from the given user message. Max 5 words. Do not use punctuation. Do not use quotes.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ]);
    } catch {
      return undefined;
    }
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/["']/g, '')
      .replace(/\.$/, '')
      .trim()
      .slice(0, 60);
  }
}
