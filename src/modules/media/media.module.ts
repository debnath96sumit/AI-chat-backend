import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { UsageModule } from '@modules/usage/usage.module';
import { SubscriptionModule } from '@modules/subscription/subscription.module';

@Module({
  imports: [UsageModule, SubscriptionModule],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
