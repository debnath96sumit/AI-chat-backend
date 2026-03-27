import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

export type UsageRecordDocument = mongoose.HydratedDocument<UsageRecord>;

@Schema({ timestamps: true, versionKey: false, collection: 'usageRecords' })
export class UsageRecord {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ required: true })
  date: string;

  @Prop({ default: 0 })
  fileUploadsCount: number;

  @Prop({ default: 0 })
  tokenUsage: number;
}

export const UsageRecordSchema = SchemaFactory.createForClass(UsageRecord);

UsageRecordSchema.index({ userId: 1, date: 1 }, { unique: true });
