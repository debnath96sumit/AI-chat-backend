import { Module } from '@nestjs/common';
import { UsageService } from './usage.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsageRecord, UsageRecordSchema } from './schemas/usage-record.schema';
import { UsageRepository } from './repositories/usage.repository';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsageRecord.name, schema: UsageRecordSchema },
    ]),
    SubscriptionModule,
  ],
  providers: [UsageService, UsageRepository],
  exports: [UsageService],
})
export class UsageModule {}
