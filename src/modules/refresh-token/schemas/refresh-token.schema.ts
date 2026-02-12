import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongoSchema, HydratedDocument, Types } from "mongoose";

@Schema({
  timestamps: { createdAt: "createdAt" },
  collection: "refreshTokens",
  versionKey: false,
})
export class RefreshToken {
  @Prop({ type: String, required: true, index: true })
  hash: string;

  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  })
  userId: string | Types.ObjectId;

  @Prop({ type: Date, default: Date.now, index: true })
  createdAt: Date;
}

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;
export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
