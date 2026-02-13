import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './schemas/chat.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { ChatRepository } from './repositories/chat.repository';
import { MessageRepository } from './repositories/message.repository';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, ChatRepository, MessageRepository],
})
export class ChatbotModule { }
