import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type SubscriptionPlanDocument =
  mongoose.HydratedDocument<SubscriptionPlan>;

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'subscriptionPlans',
})
export class SubscriptionPlan {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['free', 'pro'] })
  tier: string;

  @Prop({ required: true })
  stripeProductId: string;

  @Prop({ required: true })
  stripePriceId: string;

  @Prop({ enum: ['monthly', 'yearly'], default: 'monthly' })
  billingCycle: string;

  @Prop({ required: true })
  price: number;

  @Prop({ enum: ['usd', 'inr', 'eur'], default: 'usd' })
  currency: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const SubscriptionPlanSchema =
  SchemaFactory.createForClass(SubscriptionPlan);
