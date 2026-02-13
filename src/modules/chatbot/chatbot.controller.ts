import { Controller, Post, Body, Sse, Param, Version, UseGuards, Get, Patch, Query, Delete } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { CreateMessageDto, RenameChatDto, SendMessageDto } from './dto/create-message.dto';
import { Observable } from 'rxjs';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LoginUser } from '@common/decorator/login-user.decorator';
import type { AuthenticatedUser } from '@auth/types/authenticated-user.type';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('Chats')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'chat', version: '1' })
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) { }

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

  @Post('send-message')
  @ApiOperation({ summary: 'Send message to AI' })
  @ApiConsumes("application/json")
  sendMessage(
    @LoginUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatbotService.handleMessage(
      user,
      dto
    );
  }

  @Get('get-all')
  @ApiOperation({ summary: 'Get user chats' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getChats(
    @LoginUser() user: AuthenticatedUser,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.chatbotService.getUserChats(
      user,
      Number(page),
      Number(limit),
    );
  }

  @Get(':chatId')
  @ApiOperation({ summary: 'Get chat details with messages' })
  @ApiParam({ name: 'chatId' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getChatDetails(
    @LoginUser() user: AuthenticatedUser,
    @Param('chatId') chatId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.chatbotService.getChatDetails(
      user,
      chatId,
      Number(page),
      Number(limit),
    );
  }

  @Patch('rename/:chatId')
  @ApiOperation({ summary: 'Rename chat' })
  renameChat(
    @LoginUser() user: AuthenticatedUser,
    @Param('chatId') chatId: string,
    @Body() dto: RenameChatDto,
  ) {
    return this.chatbotService.renameChat(
      user,
      chatId,
      dto,
    );
  }

  @Delete('delete/:chatId')
  @ApiOperation({ summary: 'Delete chat' })
  deleteChat(
    @LoginUser() user: AuthenticatedUser,
    @Param('chatId') chatId: string,
  ) {
    return this.chatbotService.deleteChat(user, chatId);
  }
}
