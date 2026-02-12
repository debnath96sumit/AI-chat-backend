import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserDevice, UserDeviceDocument } from "../schemas/user-device.schema";
import { Model } from "mongoose";
import { BaseRepository } from "src/common/bases/base.repository";

@Injectable()
export class UserDeviceRepository extends BaseRepository<UserDeviceDocument> {
  constructor(
    @InjectModel(UserDevice.name)
    private readonly userDeviceModel: Model<UserDeviceDocument>,
  ) {
    super(userDeviceModel);
  }
}
