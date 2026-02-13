import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Exclude } from "class-transformer";
import { HydratedDocument } from "mongoose";

@Schema({ timestamps: true, versionKey: false })
export class Role {
  @Prop({ type: String, required: true })
  role: string;

  @Prop({ type: String, required: true })
  roleDisplayName: string;

  @Prop({ type: String, default: "Active", enum: ["Active", "Inactive"] })
  status: string;

  @Exclude()
  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export type RoleDocument = HydratedDocument<Role>;
export const RoleSchema = SchemaFactory.createForClass(Role);

// # Index Configurations
RoleSchema.index({ role: 1, isDeleted: 1 });
