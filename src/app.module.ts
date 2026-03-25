import { Module } from '@nestjs/common';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { ApiConfigModule } from './config.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { UserRepositoryModule } from '@modules/user/repositories/user-repository.module';
import { UserDeviceRepositoryModule } from '@modules/user-devices/repository/user-device-repository.module';
import { RoleModule } from '@modules/role/role.module';
import { RoleRepositoryModule } from '@modules/role/repositories/role.repository.module';
import { RefreshTokenModule } from '@modules/refresh-token/refresh-token.module';
import { HelpersModule } from '@helpers/helpers.module';
import { RedisModule } from '@common/redis/redis.module';
import { LLMModule } from '@modules/llm/llm.module';
import { MediaModule } from '@modules/media/media.module';
import { MediaRepositoryModule } from '@modules/media/repositories/media.repository.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SubscriptionModule } from './modules/subscription/subscription.module';

@Module({
  imports: [
    ApiConfigModule,
    HelpersModule,
    RedisModule,
    AuthModule,
    UserModule,
    UserRepositoryModule,
    UserDeviceRepositoryModule,
    RoleModule,
    RoleRepositoryModule,
    RefreshTokenModule,
    ChatbotModule,
    LLMModule,
    MediaModule,
    MediaRepositoryModule,
    SubscriptionModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
