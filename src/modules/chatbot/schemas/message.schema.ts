import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

export enum MessageRole {
    USER = 'user',
    ASSISTANT = 'assistant',
    SYSTEM = 'system',
}

@Schema({ timestamps: true, versionKey: false, collection: "messages" })
export class Message {
    @Prop({
        type: Types.ObjectId,
        required: true,
        ref: 'Chat',
        index: true,
    })
    chatId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    })
    userId: Types.ObjectId;

    @Prop({
        type: String,
        enum: MessageRole,
        required: true,
    })
    role: MessageRole;

    @Prop({
        type: String,
        required: true,
    })
    content: string;

    @Prop({
        type: Number,
        default: 0,
    })
    tokensUsed?: number;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ chatId: 1, createdAt: 1 });