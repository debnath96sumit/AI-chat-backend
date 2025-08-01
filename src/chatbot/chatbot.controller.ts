import { Controller, Get, Post, Body, Sse, Param } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Observable } from 'rxjs';
@Controller('chat')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get()
  getResponse(): string {
    return this.chatbotService.getWelcome();
  }

  @Post('message')
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<string> {
    return await this.chatbotService.handleAIResponseAtOnce(
      createMessageDto.message,
    );
  }

  @Sse('stream/:message')
  streamMessage(@Param('message') message: string): Observable<MessageEvent> {
    return this.chatbotService.streamAiMessage(message);
  }
}
