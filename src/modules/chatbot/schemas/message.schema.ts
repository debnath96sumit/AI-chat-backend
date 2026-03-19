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
        type: Array,
        default: [],
    })
    attachments: Array<{ mediaId: Types.ObjectId; url: string; originalName: string; mimetype: string }>;

    @Prop({
        type: String,
        required: false,
    })
    extractedContent: string;
    @Prop({
        type: {
            promptTokens: Number,
            completionTokens: Number,
            totalTokens: Number,
        }, default: null
    })
    tokenUsage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    }
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ chatId: 1, createdAt: 1 });