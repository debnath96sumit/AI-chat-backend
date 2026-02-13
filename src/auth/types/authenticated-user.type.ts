import { RoleDocument } from "@modules/role/schemas/role.schema";
import { UserDocument } from "@modules/user/schema/user.schema";

export type AuthenticatedUser = Omit<UserDocument, "role"> & {
    role?: RoleDocument;
};
