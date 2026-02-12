import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Role, RoleSchema } from "../schemas/role.schema";
import { RoleRepository } from "./role.repository";

@Global()
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Role.name,
        useFactory: () => {
          const schema = RoleSchema;
          return schema;
        },
      },
    ]),
  ],
  controllers: [],
  providers: [RoleRepository],
  exports: [RoleRepository],
})
export class RoleRepositoryModule {}
