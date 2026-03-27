import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { BaseRepository } from "@common/bases/base.repository";
import { Subscription, SubscriptionDocument } from "../schemas/subscription.schema";

@Injectable()
export class SubscriptionRepository extends BaseRepository<SubscriptionDocument> {
    constructor(
        @InjectModel(Subscription.name)
        private readonly subscriptionModel: Model<SubscriptionDocument>,
    ) {
        super(subscriptionModel);
    }

    async getAllSubscriptions(userId: Types.ObjectId) {
        try {
            let aggregate = await this.subscriptionModel.aggregate([
                {
                    $match: {
                        userId: new Types.ObjectId(userId)
                    },
                },
                {
                    $lookup: {
                        from: "subscriptionPlans",
                        let: { subscriptionPlanId: "$subscriptionPlanId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [{ $eq: ["$_id", "$$subscriptionPlanId"] }],
                                    },
                                },
                            },
                            {
                                $project: {
                                    updatedAt: 0,
                                    isDeleted: 0,
                                },
                            },
                        ],
                        as: "plan_details",
                    },
                },
                {
                    $unwind: "$plan_details",
                }
            ]);

            return aggregate;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    async findActiveSubscription(userId: string): Promise<Subscription | null> {
        try {
            const currentDate = new Date();
            const subscription = await this.getByField({
                userId: new Types.ObjectId(userId),
                status: { $in: ["active", "trialing", "past_due"] },
                currentPeriodEnd: { $gte: currentDate },
            });

            return subscription;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    async hasActiveSubscription(userId: string): Promise<boolean> {
        return !!(await this.findActiveSubscription(userId));
    }
}