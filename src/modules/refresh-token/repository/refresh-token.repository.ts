import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";
import {
  RefreshToken,
  RefreshTokenDocument,
} from "../schemas/refresh-token.schema";
import { BaseRepository } from "src/common/bases/base.repository";

@Injectable()
export class RefreshTokenRepository extends BaseRepository<RefreshTokenDocument> {
  constructor(
    @InjectModel(RefreshToken.name)
    RefreshTokenModel: Model<RefreshTokenDocument>,
  ) {
    super(RefreshTokenModel);
  }
}
