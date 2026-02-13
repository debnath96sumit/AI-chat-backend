import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import { BaseRepository } from "src/common/bases/base.repository";
import { User, UserDocument } from "../schema/user.schema";

@Injectable()
export class UserRepository extends BaseRepository<UserDocument> {
    constructor(@InjectModel(User.name) private UserModel: Model<UserDocument>) {
        super(UserModel);
    }


    async getUserDetailsJwtAuth(
        id: Types.ObjectId | string,
    ): Promise<UserDocument | null> {
        let user = await this.UserModel.aggregate([
            {
                $match: {
                    _id: new Types.ObjectId(id),
                    isDeleted: false,
                    status: "Active",
                },
            },
            {
                $lookup: {
                    from: "roles",
                    let: { role: "$role" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ["$_id", "$$role"] }],
                                },
                            },
                        },
                        {
                            $project: {
                                _id: "$_id",
                                role: "$role",
                                roleDisplayName: "$roleDisplayName",
                            },
                        },
                    ],
                    as: "role",
                },
            },
            { $unwind: "$role" },
            {
                $project: {
                    uid: "$uid",
                    firstName: "$firstName",
                    lastName: "$lastName",
                    fullName: "$fullName",
                    phone: "$phone",
                    profileImage: "$profileImage",
                    role: "$role",
                    email: "$email",
                    status: "$status",
                    user_devices: "$user_devices",
                },
            },
        ]);

        if (!user?.length) return null;
        return user[0];
    }

    async getUserDetails(
        params: FilterQuery<UserDocument>,
    ): Promise<UserDocument | null> {
        let aggregate = await this.UserModel.aggregate([
            { $match: params },
            {
                $lookup: {
                    from: "roles",
                    let: { role: "$role" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ["$_id", "$$role"] }],
                                },
                            },
                        },
                        {
                            $project: {
                                _id: "$_id",
                                role: "$role",
                                roleDisplayName: "$roleDisplayName",
                            },
                        },
                    ],
                    as: "role",
                },
            },
            { $unwind: "$role" },
            {
                $project: {
                    isDeleted: 0,
                    updatedAt: 0,
                    password: 0,
                },
            },
        ]);
        if (!aggregate?.length) return null;
        return aggregate[0];
    }
}