import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

export type MediaDocument = mongoose.HydratedDocument<Media>;

@Schema({ timestamps: true, versionKey: false })
export class Media {
  @Prop({ type: String, required: true })
  originalName: string;

  @Prop({ type: String, required: true })
  fileName: string;

  @Prop({ type: String, default: "" })
  folder: string;

  @Prop({ type: String, required: true })
  mimetype: string;

  @Prop({ type: String, default: "" })
  encoding: string;

  @Prop({ type: Number, required: true })
  size: number;

  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: String, required: true })
  path: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
