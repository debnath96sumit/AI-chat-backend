import { BadRequestException, ForbiddenException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiResponse } from '@common/types/api-response.type';
import { ChatRepository } from './repositories/chat.repository';
import { MessageRepository } from './repositories/message.repository';
import { AuthenticatedUser } from '@auth/types/authenticated-user.type';
import { RenameChatDto, SendMessageDto } from './dto/create-message.dto';
import { MessageDocument, MessageRole } from './schemas/message.schema';
import { LLMService } from '@modules/llm/llm.service';
import * as modelsConstant from '@modules/llm/constants/models.constant';
import { MediaRepository } from '@modules/media/repositories';
import { FileExtractionService } from './file-extraction.service';
import { Types } from 'mongoose';
import { UsageService } from '@modules/usage/usage.service';
import { SubscriptionService } from '@modules/subscription/subscription.service';
@Injectable()
export class ChatbotService {

  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly llmService: LLMService,
    private readonly fileExtractionService: FileExtractionService,
    private readonly usageService: UsageService,
    private readonly subscriptionService: SubscriptionService,
  ) { }

  async createUserMessage(
    user: AuthenticatedUser,
    dto: SendMessageDto,
  ): Promise<ApiResponse> {
    const tier = await this.subscriptionService.getUserTier(user._id.toString());
    const FREE_PROVIDER = "groq";
    if (tier === "free" && dto.provider !== FREE_PROVIDER) {
      throw new ForbiddenException("Upgrade to Pro to access all models.");
    }

    const { provider, model } = this.llmService.resolve(dto.provider, dto.modelId);

    let extractedContent: string | undefined;
    let attachments: Array<{ mediaId: Types.ObjectId; url: string; originalName: string; mimetype: string }> = [];
    if (dto.attachment) {
      const media = await this.mediaRepository.getById(
        new Types.ObjectId(dto.attachment.mediaId),
      );

      if (!media || media.isDeleted) {
        throw new BadRequestException('Attached file not found. Please re-upload.');
      }

      const supported = ['application/pdf', 'text/plain'];
      if (!supported.includes(media.mimetype)) {
        throw new BadRequestException(
          `Unsupported file type: ${media.mimetype}. Please upload a PDF or TXT file.`,
        );
      }

      extractedContent = await this.fileExtractionService.extractText(
        media.path,
        media.mimetype,
      );

      attachments = [{
        mediaId: media._id,
        url: media.url,
        originalName: media.originalName,
        mimetype: media.mimetype,
      }];
    }

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
      attachments,
      ...(extractedContent && { extractedContent }),
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
        let finalUsage: any = null;

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
          const formattedHistory = this.buildHistory(history);

          for await (const chunk of this.llmService.stream(provider, modelId, formattedHistory)) {
            if (chunk.content) {
              fullAssistantResponse += chunk.content;
              subscriber.next({ data: chunk.content } as MessageEvent);
            }
            if (chunk.usage) {
              finalUsage = chunk.usage;
            }
          }

          const msg = await this.messageRepository.save({
            chatId: chat._id,
            userId: user._id,
            role: MessageRole.ASSISTANT,
            content: fullAssistantResponse,
            tokenUsage: finalUsage,
          });
          await this.usageService.incrementTokenUsage(user._id, msg.tokenUsage?.totalTokens || 0);
          subscriber.next({ data: '__END__' } as MessageEvent);
          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      })();
    });
  }

  private buildHistory(
    history: MessageDocument[],
  ): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    const result: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    for (const msg of history) {
      // If this user message has extracted file content, prepend a system message
      if (
        msg.role === MessageRole.USER &&
        msg.extractedContent?.trim()
      ) {
        const fileName = msg.attachments?.[0]?.originalName ?? 'uploaded file';
        result.push({
          role: 'system',
          content:
            `The user has uploaded a file named "${fileName}". ` +
            `Use the following content to answer their question:\n\n` +
            `---\n${msg.extractedContent}\n---`,
        });
      }

      result.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }

    return result;
  }
  async getUserChats(
    user: AuthenticatedUser,
    page: number,
    limit: number,
  ): Promise<ApiResponse> {
    const userId = user._id;
    if (!userId) throw new BadRequestException('Invalid user details.');
    const tier = await this.subscriptionService.getUserTier(user._id.toString());
    const chats = await this.chatRepository.getAllPaginate({
      filter: { userId },
      page,
      limit: tier === "free" ? 10 : limit,
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
      const response = await this.llmService.complete(provider, model, [
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
      return response.content;
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
