import { Global, Module } from "@nestjs/common";
import { MediaRepository } from "./media.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { Media, MediaSchema } from "../schemas/media.schema";

@Global()
@Module({
  exports: [MediaRepository],
  providers: [MediaRepository],
  imports: [
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
  ],
})
export class MediaRepositoryModule {}
