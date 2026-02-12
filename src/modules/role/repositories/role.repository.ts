import { InjectModel } from "@nestjs/mongoose";
import { Role, RoleDocument } from "../schemas/role.schema";

import { Injectable } from "@nestjs/common";

import { Model } from "mongoose";

import { BaseRepository } from "@common/bases/base.repository";

@Injectable()
export class RoleRepository extends BaseRepository<RoleDocument> {
  constructor(@InjectModel(Role.name) private RoleModel: Model<RoleDocument>) {
    super(RoleModel);
  }
}
