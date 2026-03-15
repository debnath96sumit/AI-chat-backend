import { Controller, Post, Body, Sse, Param, UseGuards, Get, Patch, Query, Delete } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { RenameChatDto, SendMessageDto } from './dto/create-message.dto';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LoginUser } from '@common/decorator/login-user.decorator';
import type { AuthenticatedUser } from '@auth/types/authenticated-user.type';
import { SseAuthGuard } from '@auth/guards/sse-auth.guard';

@ApiTags('Chats')
@ApiBearerAuth()
@Controller({ path: 'chat', version: '1' })
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) { }

  @Sse('stream/:chatId')
  @UseGuards(SseAuthGuard)
  @ApiOperation({ summary: 'Stream assistant response' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'JWT authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  streamChat(
    @LoginUser() user: AuthenticatedUser,
    @Param('chatId') chatId: string,
  ) {
    return this.chatbotService.streamAssistantResponse(user, chatId);
  }

  @Post('send-message')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Send user message' })
  @ApiConsumes('application/json')
  async sendMessage(
    @LoginUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatbotService.createUserMessage(user, dto);
  }

  @Get('llm-models')
  @ApiOperation({ summary: 'Get available models' })
  getAvailableModels() {
    return this.chatbotService.getAvailableModels();
  }

  @Get('get-all')
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete chat' })
  deleteChat(
    @LoginUser() user: AuthenticatedUser,
    @Param('chatId') chatId: string,
  ) {
    return this.chatbotService.deleteChat(user, chatId);
  }
}
