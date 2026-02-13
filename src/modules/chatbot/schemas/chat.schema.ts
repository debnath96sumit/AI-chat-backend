import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatDocument = HydratedDocument<Chat>;

@Schema({ timestamps: true, versionKey: false, collection: 'chats' })
export class Chat {
    @Prop({
        type: Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    })
    userId: Types.ObjectId;

    @Prop({
        type: String,
        required: true,
        default: 'New Chat',
        trim: true,
    })
    title: string;

    @Prop({
        type: Boolean,
        default: false,
    })
    isDeleted: boolean;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

ChatSchema.index({ userId: 1, createdAt: -1 });