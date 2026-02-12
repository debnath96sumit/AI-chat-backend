import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  RefreshToken,
  RefreshTokenSchema,
} from "./schemas/refresh-token.schema";
import { RefreshTokenRepository } from "./repository/refresh-token.repository";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
  ],
  providers: [RefreshTokenRepository],
  exports: [RefreshTokenRepository],
})
export class RefreshTokenModule {}
