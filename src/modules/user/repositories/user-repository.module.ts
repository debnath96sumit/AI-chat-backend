import { Global, Module } from "@nestjs/common";
import { UserRepository } from "./user.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../schema/user.schema";

@Global()
@Module({
    exports: [UserRepository],
    providers: [UserRepository],
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
})
export class UserRepositoryModule { }
