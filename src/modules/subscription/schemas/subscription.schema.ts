import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";

export type SubscriptionDocument = mongoose.HydratedDocument<Subscription>;

@Schema({ timestamps: true, versionKey: false })
export class Subscription {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true })
    subscriptionPlanId: Types.ObjectId;

    @Prop({ required: true })
    stripeCustomerId: string;

    @Prop({ required: true })
    stripeSubscriptionId: string;

    @Prop({
        enum: ["active", "canceled", "past_due", "incomplete", "incomplete_expired", "trialing"],
        default: "incomplete",
        index: true,
    })
    status: string;

    @Prop({ default: null })
    currentPeriodEnd: Date;

    @Prop({ default: false })
    cancelAtPeriodEnd: boolean;

    @Prop({ default: null })
    canceledBy: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index(
    { userId: 1 },
    { unique: true, partialFilterExpression: { status: { $in: ["active", "trialing", "past_due"] } } }
);

SubscriptionSchema.virtual("plan_details", {
    ref: "SubscriptionPlan",
    localField: "subscriptionPlanId",
    foreignField: "_id",
    justOne: true,
});

SubscriptionSchema.set("toJSON", { virtuals: true });