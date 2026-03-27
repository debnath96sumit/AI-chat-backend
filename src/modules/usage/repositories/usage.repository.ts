import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@common/bases/base.repository';
import {
  UsageRecord,
  UsageRecordDocument,
} from '../schemas/usage-record.schema';

@Injectable()
export class UsageRepository extends BaseRepository<UsageRecordDocument> {
  constructor(
    @InjectModel(UsageRecord.name)
    usageRecordModel: Model<UsageRecordDocument>,
  ) {
    super(usageRecordModel);
  }
}
