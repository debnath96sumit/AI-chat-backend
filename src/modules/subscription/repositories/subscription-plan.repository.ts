import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseRepository } from "@common/bases/base.repository";
import { SubscriptionPlan, SubscriptionPlanDocument } from "../schemas/subscription-plan.schema";

@Injectable()
export class SubscriptionPlanRepository extends BaseRepository<SubscriptionPlanDocument> {
    constructor(
        @InjectModel(SubscriptionPlan.name)
        subscriptionPlanModel: Model<SubscriptionPlanDocument>,
    ) {
        super(subscriptionPlanModel);
    }
}