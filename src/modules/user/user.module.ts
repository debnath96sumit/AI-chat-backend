import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SubscriptionModule } from '@modules/subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
