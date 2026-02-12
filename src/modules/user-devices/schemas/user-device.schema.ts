import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongoSchema, Types } from "mongoose";
import { UserRole } from "src/common/enum/user-role.enum";

@Schema({ timestamps: false, versionKey: false })
class AdditionalDetails {
  @Prop({ type: String, default: "" })
  name: string;
  @Prop({ type: String, default: "" })
  version: string;
}

@Schema({ timestamps: false, versionKey: false })
class BrowserInfo extends AdditionalDetails { }

@Schema({ timestamps: false, versionKey: false })
class OperatingSystemInfo extends AdditionalDetails { }

@Schema({ timestamps: false, versionKey: false })
class DeviceInfo {
  @Prop({ type: String, default: "" })
  vendor: string;
  @Prop({ type: String, default: "" })
  model: string;
  @Prop({ type: String, default: "" })
  type: string;
}

@Schema({ versionKey: false, timestamps: true, collection: "user_devices" })
export class UserDevice {
  @Prop({ type: MongoSchema.Types.ObjectId, ref: "User", index: true })
  user_id: string | Types.ObjectId;

  @Prop({ type: String, default: "", index: true })
  deviceToken: string;

  @Prop({
    type: String,
    default: "Web",
    enum: ["Web", "Android", "iOS"],
    index: true,
  })
  deviceType: string;

  @Prop({ type: String, default: "", index: true })
  ip: string;

  @Prop({ type: String, default: "" })
  ip_lat: string;

  @Prop({ type: String, default: "" })
  ip_long: string;

  @Prop({ type: BrowserInfo })
  browserInfo: { name: string; version: string };

  @Prop({ type: DeviceInfo })
  deviceInfo: { vendor: string; model: string; type: string };

  @Prop({ type: OperatingSystemInfo })
  operatingSystem: { name: string; version: string };

  @Prop({ type: Date, default: null, index: true })
  last_active: any;

  @Prop({ type: String, default: "" })
  state: string;

  @Prop({ type: String, default: "" })
  country: string;

  @Prop({ type: String, default: "" })
  city: string;

  @Prop({ type: String, default: "" })
  timezone: string;

  @Prop({ type: String, default: "", index: true, unique: true })
  accessToken: string;

  @Prop({ type: Boolean, default: false, index: true })
  expired: boolean;

  @Prop({ type: String, enum: UserRole, index: true })
  role: string;

  @Prop({ type: Boolean, default: false, index: true })
  isLoggedOut: boolean;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted: boolean;
}

export type UserDeviceDocument = HydratedDocument<UserDevice>;
export const UserDeviceSchema = SchemaFactory.createForClass(UserDevice);
