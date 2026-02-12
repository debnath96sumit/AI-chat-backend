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

@Module({
  imports: [
    ApiConfigModule,
    HelpersModule,
    ChatbotModule,
    AuthModule,
    UserModule,
    UserRepositoryModule,
    UserDeviceRepositoryModule,
    RoleModule,
    RoleRepositoryModule,
    RefreshTokenModule
  ],
  providers: [],
})
export class AppModule { }
