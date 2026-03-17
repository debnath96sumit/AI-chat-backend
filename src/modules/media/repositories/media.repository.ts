import { Media, MediaDocument } from "../schemas/media.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";

import { BaseRepository } from "src/common/bases/base.repository";

@Injectable()
export class MediaRepository extends BaseRepository<MediaDocument> {
  constructor(@InjectModel(Media.name) MediaModel: Model<MediaDocument>) {
    super(MediaModel);
  }
}
