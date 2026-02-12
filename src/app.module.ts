import { Module } from '@nestjs/common';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ApiConfigModule } from './config.module';

@Module({
  imports: [ApiConfigModule, ChatbotModule],
  providers: [],
})
export class AppModule { }
