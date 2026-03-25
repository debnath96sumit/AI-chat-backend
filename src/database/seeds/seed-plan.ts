import { NestFactory } from "@nestjs/core";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AppModule } from "src/app.module";
import { SubscriptionPlan } from "@modules/subscription/schemas/subscription-plan.schema";

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const planModel = app.get<Model<SubscriptionPlan>>(getModelToken(SubscriptionPlan.name));

    await planModel.findOneAndUpdate(
        { tier: "pro" },
        {
            name: "Pro Plan",
            tier: "pro",
            stripeProductId: "prod_xxxx",
            stripePriceId: "price_xxxx",
            billingCycle: "monthly",
            price: 10,
            currency: "usd",
            features: [
                "5 file uploads per day",
                "All models accessible",
                "Unlimited chat history",
            ],
            isActive: true,
        },
        { upsert: true, new: true }
    );

    console.log("Pro plan seeded");
    await app.close();
}

seed();